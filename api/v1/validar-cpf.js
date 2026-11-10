import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import admin from "firebase-admin";

if (!getApps().length) {
    initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: "gssmax-projet"
    });
}

const db = getFirestore();

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
        const keyRef = db.collection('chaves_clientes').doc(apiKey);
        const keyDoc = await keyRef.get();

        if (!keyDoc.exists || !keyDoc.data().ativo) {
            return res.status(403).json({ valido: false, mensagem: 'Chave de acesso inválida ou expirada.' });
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
