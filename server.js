const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Inicializa o Firebase apenas se já não estiver inicializado (evita erros na Vercel)
if (!getApps().length) {
    initializeApp({
        // Na Vercel, você colocará as credenciais do Firebase nas "Environment Variables" (Variáveis de Ambiente)
    });
}
const db = getFirestore();

export default async function handler(req, res) {
    // Configura os cabeçalhos de CORS para aceitar requisições de qualquer site
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
    const { cpf, nascimento } = req.body;

    // 1. Valida se mandou a chave
    if (!apiKey) {
        return res.status(401).json({ valido: false, mensagem: 'Chave de acesso ausente.' });
    }

    try {
        // 2. Consulta no Firebase se a chave existe e está ativa
        const keyRef = db.collection('chaves_clientes').doc(apiKey);
        const keyDoc = await keyRef.get();

        if (!keyDoc.exists || !keyDoc.data().ativo) {
            return res.status(403).json({ valido: false, mensagem: 'Chave de acesso inválida ou expirada.' });
        }

        // 3. Sua Lógica de Validação de CPF
        const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : '';
        if (cpfLimpo.length !== 11) {
            return res.json({ valido: false, mensagem: 'CPF inválido.' });
        }

        // Sucesso!
        return.status(200).json({ 
            valido: true, 
            mensagem: 'CPF e Data de Nascimento válidos com sucesso!',
            nascimento: nascimento 
        });

    } catch (error) {
        console.error('Erro ao validar chave:', error);
        return.status(500).json({ valido: false, mensagem: 'Erro interno no servidor.' });
    }
}