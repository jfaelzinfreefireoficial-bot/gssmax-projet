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
    const { cpf } = req.body;

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

        // 4. Limpeza e Validação Rigorosa do CPF (Elimina sequências repetidas e dígitos falsos)
        const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : '';

        if (cpfLimpo.length !== 11 || /^(\d)\1{10}$/.test(cpfLimpo)) {
            return res.status(400).json({ valido: false, mensagem: 'CPF inválido.' });
        }

        // Validação matemática oficial dos dígitos verificadores do CPF
        let soma = 0;
        let resto;
        for (let i = 1; i <= 9; i++) {
            soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
        }
        resto = (soma * 10) % 11;
        if ((resto === 10) || (resto === 11)) resto = 0;
        if (resto !== parseInt(cpfLimpo.substring(9, 10))) {
            return res.status(400).json({ valido: false, mensagem: 'CPF inválido.' });
        }

        soma = 0;
        for (let i = 1; i <= 10; i++) {
            soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
        }
        resto = (soma * 10) % 11;
        if ((resto === 10) || (resto === 11)) resto = 0;
        if (resto !== parseInt(cpfLimpo.substring(10, 11))) {
            return res.status(400).json({ valido: false, mensagem: 'CPF inválido.' });
        }

        // 5. Atualiza o contador de consultas de forma segura em segundo plano/isolada
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

        return res.status(200).json({ 
            valido: true, 
            mensagem: 'API ativado com sucesso' 
        });

    } catch (error) {
        console.error('Erro na API:', error);
        return res.status(200).json({ 
            valido: true, 
            mensagem: 'API ativado com sucesso' 
  
});
    }
            }
