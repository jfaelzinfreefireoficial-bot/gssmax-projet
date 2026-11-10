export default function handler(req, res) {
    // Configuração de CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ valido: false, mensagem: 'Método não permitido.' });
    }

    // Validação da API Key
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== 'FAEL-E7JAJP-5444') {
        return res.status(401).json({ valido: false, mensagem: 'Chave de API inválida.' });
    }

    const { senha } = req.body;

    if (!senha || typeof senha !== 'string') {
        return res.status(400).json({ valido: false, mensagem: 'Nenhuma senha foi fornecida.' });
    }

    // Critérios de validação
    const temTamanhoMinimo = senha.length >= 8;
    const temMaiuscula = /[A-Z]/.test(senha);
    const temMinuscula = /[a-z]/.test(senha);
    const temNumero = /[0-9]/.test(senha);
    const temEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(senha);

    const senhaForte = temTamanhoMinimo && temMaiuscula && temMinuscula && temNumero && temEspecial;

    if (senhaForte) {
        return res.status(200).json({
            valido: true,
            mensagem: 'Senha forte aprovada com sucesso!',
            dados: {
                forca: 'Alta',
                caracteres: senha.length
            }
        });
    } else {
        // Monta uma mensagem detalhada do que falta
        let falhas = [];
        if (!temTamanhoMinimo) falhas.push('mínimo de 8 caracteres');
        if (!temMaiuscula) falhas.push('letra maiúscula');
        if (!temMinuscula) falhas.push('letra minúscula');
        if (!temNumero) falhas.push('número');
        if (!temEspecial) falhas.push('caractere especial');

        return res.status(200).json({
            valido: false,
            mensagem: `Senha fraca. Faltando: ${falhas.join(', ')}.`,
            requisitos: {
                tamanhoMinimo: temTamanhoMinimo,
                maiuscula: temMaiuscula,
                minuscula: temMinuscula,
                numero: temNumero,
                especial: temEspecial
            }
        });
    }
                 
                                    }
