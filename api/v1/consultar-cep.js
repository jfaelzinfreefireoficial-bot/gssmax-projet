export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ valido: false, mensagem: 'Método não permitido.' });
    }

    const apiKey = req.headers['x-api-key'];
    const { cep } = req.body;

    if (!apiKey) {
        return res.status(401).json({ valido: false, mensagem: 'Chave de acesso ausente.' });
    }

    try {
        const projectId = "gssmax-projet";
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/chaves_clientes/${apiKey}`;

        // 1. Busca os dados da chave no Firebase
        const respostaFirebase = await fetch(firestoreUrl);

        if (!respostaFirebase.ok) {
            return res.status(403).json({ 
                valido: false, 
                mensagem: 'API não existe ou foi deletado do sistema. Entre em contato com administrador' 
            });
        }

        const dadosChave = await respostaFirebase.json();
        const campos = dadosChave.fields || {};
        
        // 2. Verifica se a chave está ativa
        const ativo = campos.ativo ? campos.ativo.booleanValue : true;
        if (!ativo) {
            return res.status(403).json({ 
                valido: false, 
                mensagem: 'entre em contato com administrador . API bloqueado automaticamente pelo sistema SaaS' 
            });
        }

        // 3. Verifica se o plano expirou baseado na data de vencimento
        if (campos.vencimento && campos.vencimento.stringValue) {
            const dataVencimento = new Date(campos.vencimento.stringValue);
            const dataAtual = new Date();

            if (dataAtual > dataVencimento) {
                return res.status(403).json({ 
                    valido: false, 
                    mensagem: 'Plano expirado automaticamente. Renove o seu plano através de nosso site ou entre em contato com administrador!' 
                });
            }
        }

        // 4. Limpeza e Validação do CEP (Deve conter exatamente 8 dígitos)
        const cepLimpo = cep ? cep.replace(/\D/g, '') : '';

        if (cepLimpo.length !== 8) {
            return res.status(400).json({ 
                valido: false, 
                mensagem: 'CEP inválido. O CEP deve conter exatamente 8 números.' 
            });
        }

        // 5. Consulta na base pública de CEP (ViaCEP)
        const respostaCep = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const dadosCep = await respostaCep.json();

        if (dadosCep.erro) {
            return res.status(404).json({ 
                valido: false, 
                mensagem: 'CEP não encontrado na base de dados.' 
            });
        }

        // 6. Atualiza o contador de consultas no Firebase de forma isolada
        const consultasAtuais = campos.consultas && campos.consultas.integerValue ? parseInt(campos.consultas.integerValue) : 0;
        const novasConsultas = consultasAtuais + 1;

        const updateUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/chaves_clientes/${apiKey}?updateMask.fieldPaths=consultas`;
        
        await fetch(updateUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fields: {
                    consultas: { integerValue: String(novasConsultas) }
                }
            })
        }).catch(() => {});

        // 7. Retorna a resposta exatamente no formato solicitado
        return res.status(200).json({ 
            valido: true, 
            mensagem: 'API ativado com sucesso',
            endereco: {
                cep: dadosCep.cep,
                logradouro: dadosCep.logradouro || '',
                complemento: dadosCep.complemento || '',
                bairro: dadosCep.bairro || '',
                cidade: dadosCep.localidade || '',
                estado: dadosCep.uf || ''
            }
        });

    } catch (error) {
        console.error('Erro na API:', error);
        return res.status(500).json({ 
            valido: false, 
            mensagem: 'Erro interno ao processar a consulta de CEP.' 
  
                                     });
    }
      }
