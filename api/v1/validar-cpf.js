import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyADlv7CYo5TTRA99PzRmB2jmk0i6Q2X2K4",
    authDomain: "gssmax-projet.firebaseapp.com",
    projectId: "gssmax-projet",
    storageBucket: "gssmax-projet.firebasestorage.app",
    messagingSenderId: "317306173103",
    appId: "1:317306173103:web:c5d9506a2dce30d6d6865a",
    measurementId: "G-MZ4KCWKZKV"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

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
        const keyRef = doc(db, "chaves_clientes", apiKey);
        const keyDoc = await getDoc(keyRef);

        if (!keyDoc.exists() || !keyDoc.data().ativo) {
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
