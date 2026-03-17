const axios = require('axios');
const express = require('express');
const app = express();

const API_URL = 'https://venro.ru/api/orders';
const API_KEY = process.env.API_KEY || 'c958ebc5108a2c9328a1b2fbbb21c385'; 
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Venro API Sipariş Fonksiyonu
async function placeOrder(typeId, url, count) {
    const params = new URLSearchParams();
    params.append('anahtar', API_KEY); // Görüntüdeki parametre adı
    params.append('aksiyon', 'eklemek'); // Görüntüdeki parametre adı
    params.append('tip', typeId);       // Hizmet Kimliği
    params.append('URL', url);          // Profil/Post Linki
    params.append('saymak', count);     // Miktar

    try {
        const response = await axios.post(API_URL, params);
        return response.data;
    } catch (error) {
        return { error: error.message };
    }
}

// Arayüz (Lion Panel)
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <style>
            body { background: #0b0b0b; color: #f1c40f; font-family: 'Arial', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .panel { background: #1a1a1a; padding: 40px; border-radius: 20px; border: 2px solid #f1c40f; width: 350px; text-align: center; box-shadow: 0 0 30px rgba(241, 196, 15, 0.2); }
            input, select, button { width: 100%; padding: 12px; margin: 10px 0; border-radius: 8px; border: 1px solid #333; background: #252525; color: white; }
            button { background: #f1c40f; color: black; font-weight: bold; cursor: pointer; border: none; font-size: 16px; }
            button:hover { background: #d4ac0d; }
            h1 { margin-bottom: 20px; letter-spacing: 2px; }
        </style>
    </head>
    <body>
        <div class="panel">
            <div style="font-size: 60px;">🦁</div>
            <h1>LION VENRO</h1>
            <input type="text" id="url" placeholder="Instagram/TikTok URL">
            <input type="number" id="type" placeholder="Hizmet ID (Örn: 1)">
            <input type="number" id="amount" placeholder="Miktar">
            <button onclick="siparisVer()">SİPARİŞİ BAŞLAT</button>
            <p id="sonuc"></p>
        </div>
        <script>
            async function siparisVer() {
                const sonuc = document.getElementById('sonuc');
                sonuc.innerText = "Gönderiliyor...";
                const url = document.getElementById('url').value;
                const type = document.getElementById('type').value;
                const amount = document.getElementById('amount').value;
                
                const response = await fetch(\`/order?type=\${type}&url=\${url}&amount=\${amount}\`);
                const data = await response.json();
                sonuc.innerText = JSON.stringify(data);
            }
        </script>
    </body>
    </html>
    `);
});

app.get('/order', async (req, res) => {
    const { type, url, amount } = req.query;
    const result = await placeOrder(type, url, amount);
    res.json(result);
});

app.listen(PORT, '0.0.0.0', () => console.log(\`Sistem \${PORT} üzerinde hazır!\`));
