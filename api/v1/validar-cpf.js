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

    // Pega a URL de onde a requisição está vindo (Origem)
    const originHeader = req.headers['origin'] || req.headers['referer'] || '';

    if (!apiKey) {
        return res.status(401).json({ valido: false, mensagem: 'Chave de acesso ausente.' });
    }

    try {
        const projectId = "gssmax-projet";
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/chaves_clientes/${apiKey}`;

        const respostaFirebase = await fetch(firestoreUrl);

        if (!respostaFirebase.ok) {
            return res.status(403).json({ valido: false, mensagem: 'Chave de acesso inválida ou expirada.' });
        }

        const dadosChave = await respostaFirebase.json();
        
        const ativo = dadosChave.fields && dadosChave.fields.ativo && dadosChave.fields.ativo.booleanValue;
        const dominioCadastrado = dadosChave.fields && dadosChave.fields.dominio && dadosChave.fields.dominio.stringValue;

        if (!ativo) {
            return res.status(403).json({ valido: false, mensagem: 'Chave bloqueada ou inativa.' });
        }

        // TRAVA DE SEGURANÇA POR DOMÍNIO:
        // Se o cliente cadastrou um domínio e a requisição não veio dele (e não for localhost/ambiente de teste autorizado)
        if (dominioCadastrado) {
            const origemLimpa = originHeader.toLowerCase().replace(/https?:\/\//g, '').split('/')[0];
            const dominioLimpo = dominioCadastrado.toLowerCase().replace(/https?:\/\//g, '').split('/')[0];

            // Permite testes locais caso você precise testar no seu PC/celular
            const ehLocalhost = origemLimpa.includes('localhost') || origemLimpa.includes('127.0.0.1') || origemLimpa.includes('netlify.app');

            if (!ehLocalhost && !origemLimpa.includes(dominioLimpo)) {
                return res.status(403).json({ 
                    valido: false, 
                    mensagem: `Acesso negado: Esta chave está vinculada exclusivamente ao domínio ${dominioCadastrado}.` 
                });
            }
        }

        const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : '';
        if (cpfLimpo.length !== 11) {
            return res.status(400).json({ valido: false, mensagem: 'CPF inválido.' });
        }

        return res.status(200).json({ 
            valido: true, 
            mensagem: 'CPF validado com sucesso!' 
        });

    } catch (error) {
        console.error('Erro na API:', error);
        return res.status(500).json({ valido: false, mensagem: 'Erro interno no servido
                r.' });
    }
            }
