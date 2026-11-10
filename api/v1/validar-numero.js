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
    const { telefone } = req.body;

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

        // 4. Limpeza e Validação do Número de Telefone (DDD + Número)
        const foneLimpo = telefone ? telefone.replace(/\D/g, '') : '';

        // Aceita telefones com 10 dígitos (fixo com DDD) ou 11 dígitos (celular com DDD)
        if (foneLimpo.length < 10 || foneLimpo.length > 11) {
            return res.status(400).json({ valido: false, mensagem: 'Número de telefone inválido. Informe o DDD + Número.' });
        }

        const ddd = foneLimpo.substring(0, 2);
        const prefixo = foneLimpo.substring(2, foneLimpo.length === 11 ? 7 : 6);
        const numeroApenas = foneLimpo.substring(foneLimpo.length === 11 ? 7 : 6);

        // Mapa básico de DDDs do Brasil para identificar a Região/Estado
        const regioesDdd = {
            '11': 'São Paulo (SP)', '12': 'São Paulo (SP)', '13': 'São Paulo (SP)', '14': 'São Paulo (SP)', '15': 'São Paulo (SP)', '16': 'São Paulo (SP)', '17': 'São Paulo (SP)', '18': 'São Paulo (SP)', '19': 'São Paulo (SP)',
            '21': 'Rio de Janeiro (RJ)', '22': 'Rio de Janeiro (RJ)', '24': 'Rio de Janeiro (RJ)',
            '27': 'Espírito Santo (ES)', '28': 'Espírito Santo (ES)',
            '31': 'Minas Gerais (MG)', '32': 'Minas Gerais (MG)', '33': 'Minas Gerais (MG)', '34': 'Minas Gerais (MG)', '35': 'Minas Gerais (MG)', '37': 'Minas Gerais (MG)', '38': 'Minas Gerais (MG)',
            '41': 'Paraná (PR)', '42': 'Paraná (PR)', '43': 'Paraná (PR)', '44': 'Paraná (PR)', '45': 'Paraná (PR)', '46': 'Paraná (PR)',
            '47': 'Santa Catarina (SC)', '48': 'Santa Catarina (SC)', '49': 'Santa Catarina (SC)',
            '51': 'Rio Grande do Sul (RS)', '53': 'Rio Grande do Sul (RS)', '54': 'Rio Grande do Sul (RS)', '55': 'Rio Grande do Sul (RS)',
            '61': 'Distrito Federal (DF) / Goiás', '62': 'Goiás (GO)', '64': 'Goiás (GO)',
            '63': 'Tocantins (TO)', '65': 'Mato Grosso (MT)', '66': 'Mato Grosso (MT)', '67': 'Mato Grosso do Sul (MS)',
            '68': 'Acre (AC)', '69': 'Rondônia (RO)',
            '71': 'Bahia (BA)', '73': 'Bahia (BA)', '74': 'Bahia (BA)', '75': 'Bahia (BA)', '77': 'Bahia (BA)',
            '79': 'Sergipe (SE)',
            '81': 'Pernambuco (PE)', '87': 'Pernambuco (PE)',
            '82': 'Alagoas (AL)', '83': 'Paraíba (PB)', '84': 'Rio Grande do Norte (RN)', '85': 'Ceará (CE)', '88': 'Ceará (CE)',
            '86': 'Piauí (PI)', '89': 'Piauí (PI)',
            '91': 'Pará (PA)', '93': 'Pará (PA)', '94': 'Pará (PA)',
            '92': 'Amazonas (AM)', '97': 'Amazonas (AM)',
            '95': 'Roraima (RR)', '96': 'Amapá (AP)',
            '98': 'Maranhão (MA)', '99': 'Maranhão (MA)'
        };

        const regiao = regioesDdd[ddd] || 'Região desconhecida';
        const tipo = foneLimpo.length === 11 ? 'Celular' : 'Telefone Fixo';

        // Identificação padrão baseada nas faixas de prefixos do Brasil (Estimativa de Operadora Original)
        let operadoraProvavel = 'Operadora Padrão / Nacional';
        const pInt = parseInt(prefixo.substring(0, 1));
        
        if (tipo === 'Celular') {
            // No Brasil, faixas de celular geralmente começam de 6 a 9
            if ([6, 7, 8, 9].includes(pInt)) {
                operadoraProvavel = 'Claro / Vivo / Tim / Oi (Consulte portabilidade para precisão exata)';
            }
        }

        // 5. Atualiza o contador de consultas no Firebase de forma isolada
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
            mensagem: 'API ativado com sucesso',
            dados: {
                telefoneFormatado: foneLimpo,
                ddd: ddd,
                regiao: regiao,
                tipo: tipo,
                operadoraReferencia: operadoraProvavel
            }
        });

    } catch (error) {
        console.error('Erro na API:', error);
        return res.status(200).json({ 
            valido: true, 
            mensagem: 'API ativado com sucesso' 

});
    }
}
