const express = require('express');
const { MercadoPagoConfig, Payment } = require('mercadopago');

const app = express();

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN 
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota principal: Exibe o produto e o botão para gerar o Pix
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GssMax Store - Pagamento Pix</title>
        <style>
            body { font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: #1e293b; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); text-align: center; width: 340px; }
            h1 { font-size: 22px; color: #38bdf8; margin-bottom: 10px; }
            p { color: #94a3b8; font-size: 14px; margin-bottom: 20px; }
            .price { font-size: 24px; font-weight: bold; color: #4ade80; margin-bottom: 20px; }
            button { background: #009ee3; color: white; border: none; padding: 12px 20px; font-size: 16px; border-radius: 8px; cursor: pointer; width: 100%; font-weight: bold; transition: 0.2s; }
            button:hover { background: #0082be; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>Painel / Produto Digital</h1>
            <p>Acesso completo ao sistema e atualizações automáticas.</p>
            <div class="price">R$ 49,90</div>
            <form action="/gerar-pix" method="POST">
                <button type="submit">Gerar QR Code Pix</button>
            </form>
        </div>
    </body>
    </html>
  `);
});

// Rota que cria o Pix e exibe o QR Code Base64 e o Copia e Cola
app.post('/gerar-pix', async (req, res) => {
  try {
    const payment = new Payment(client);
    
    const body = {
      transaction_amount: 49.90,
      description: 'Produto Digital / Script GssMax',
      payment_method_id: 'pix',
      payer: {
        email: 'cliente@gmail.com',
        first_name: 'Cliente',
        last_name: 'GssMax',
        identification: {
          type: 'CPF',
          number: '12345678909'
        }
      }
    };

    const response = await payment.create({ body });

    // Captura os dados do Pix gerados pela API
    const qrCodeBase64 = response.point_of_interaction.transaction_data.qr_code_base64;
    const qrCodeCopyPaste = response.point_of_interaction.transaction_data.qr_code;

    res.send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pagamento Pix - GssMax Store</title>
          <style>
              body { font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
              .card { background: #1e293b; padding: 25px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); text-align: center; width: 340px; }
              h2 { font-size: 20px; color: #38bdf8; margin-top: 0; }
              p { color: #94a3b8; font-size: 13px; }
              img { width: 200px; height: 200px; background: white; padding: 10px; border-radius: 8px; margin: 15px 0; }
              textarea { width: 100%; height: 70px; background: #0f172a; color: #38bdf8; border: 1px solid #334155; border-radius: 6px; padding: 8px; font-size: 11px; resize: none; margin-bottom: 10px; box-sizing: border-box; }
              button { background: #22c55e; color: white; border: none; padding: 10px; font-size: 14px; border-radius: 6px; cursor: pointer; width: 100%; font-weight: bold; }
              button:hover { background: #16a34a; }
          </style>
      </head>
      <body>
          <div class="card">
              <h2>Escaneie o QR Code</h2>
              <p>Abra o aplicativo do seu banco e pague via Pix</p>
              
              <!-- Exibe a imagem do QR Code em Base64 -->
              <img src="data:image/jpeg;base64,${qrCodeBase64}" alt="QR Code Pix">
              
              <p>Ou copie o código Pix Copia e Cola:</p>
              <textarea id="copiaCola" readonly>${qrCodeCopyPaste}</textarea>
              <button onclick="copiarTexto()">Copiar Código Pix</button>
          </div>

          <script>
              function copiarTexto() {
                  const texto = document.getElementById('copiaCola');
                  texto.select();
                  document.execCommand('copy');
                  alert('Código Pix copiado com sucesso!');
              }
          </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Erro ao gerar Pix:', error);
    res.status(500).send('Erro interno ao processar o pagamento Pix.');
  }
});

module.exports = app;