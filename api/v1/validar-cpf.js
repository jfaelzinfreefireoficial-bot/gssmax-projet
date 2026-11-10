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
        // Consulta direta e segura no Firestore via API REST do Firebase (Zero dependências complexas)
        const projectId = "gssmax-projet";
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/chaves_clientes/${apiKey}`;

        const respostaFirebase = await fetch(firestoreUrl);

        if (!respostaFirebase.ok) {
            return res.status(403).json({ valido: false, mensagem: 'Chave de acesso inválida ou expirada.' });
        }

        const dadosChave = await respostaFirebase.json();
        
        // Verifica se o campo 'ativo' é verdadeiro no documento
        const ativo = dadosChave.fields && dadosChave.fields.ativo && dadosChave.fields.ativo.booleanValue;

        if (!ativo) {
            return res.status(403).json({ valido: false, mensagem: 'Chave bloqueada ou inativa.' });
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
        return res.status(500).json({ valido: false, mensagem: 'Erro interno no servidor.' 
                                    });
    }
                                         }
