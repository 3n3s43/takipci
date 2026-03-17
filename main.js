const axios = require('axios');
const EventSource = require('eventsource');
const express = require('express');
const path = require('path');
const app = express();

const API_BASE_URL = 'https://testroichueserverpriv.roicmedya.com';
const API_KEY = process.env.API_KEY || '595aac92490bbc94911acx00000000';
const PORT = process.env.PORT || 3000;

// Statik dosyalar ve JSON desteği
app.use(express.json());

class SocialMediaAPI {
  constructor(apiKey, baseUrl = API_BASE_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async placeOrder(url, amount, platform, isStream = false) {
    try {
      const payload = { apiKey: this.apiKey, postUrl: url, amount: amount, platform: platform, stream: isStream };
      const response = await axios.post(`${this.baseUrl}/api/order`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      const msg = error.response ? error.response.data.error : error.message;
      throw new Error(msg);
    }
  }

  async connectToStream(orderId) {
    const streamUrl = `${API_BASE_URL}/api/stream/${orderId}`;
    const eventSource = new EventSource(streamUrl);
    console.log(`📡 Stream bağlandı: ${orderId}`);
    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'completed' || data.type === 'error') eventSource.close();
    };
  }
}

const api = new SocialMediaAPI(API_KEY);

// --- ANA SAYFA (ASLAN TEMALI ARAYÜZ) ---
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <title>Lion Panel - Sosyal Medya</title>
        <style>
            body { background: #0f0f0f; color: #eec131; font-family: 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: #1a1a1a; padding: 30px; border-radius: 15px; border: 2px solid #eec131; box-shadow: 0 0 20px rgba(238, 193, 49, 0.2); width: 350px; text-align: center; }
            h1 { font-size: 24px; margin-bottom: 20px; }
            input, select, button { width: 100%; padding: 12px; margin: 10px 0; border-radius: 8px; border: 1px solid #444; background: #222; color: white; box-sizing: border-box; }
            button { background: #eec131; color: #000; font-weight: bold; border: none; cursor: pointer; transition: 0.3s; }
            button:hover { background: #d4ac2b; transform: scale(1.02); }
            .lion-icon { font-size: 50px; margin-bottom: 10px; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="lion-icon">🦁</div>
            <h1>LION PANEL</h1>
            <input type="text" id="url" placeholder="Link (URL) Yapıştırın">
            <select id="platform">
                <option value="instagram_views">Instagram İzlenme</option>
                <option value="instagram_followers">Instagram Takipçi</option>
                <option value="tiktok_views">TikTok İzlenme</option>
            </select>
            <input type="number" id="amount" placeholder="Miktar">
            <button onclick="order()">Siparişi Başlat</button>
            <p id="status"></p>
        </div>
        <script>
            async function order() {
                const status = document.getElementById('status');
                status.innerText = "İşlem yapılıyor...";
                const url = document.getElementById('url').value;
                const platform = document.getElementById('platform').value;
                const amount = document.getElementById('amount').value;
                
                try {
                    const res = await fetch(\`/order?url=\${url}&platform=\${platform}&amount=\${amount}\`);
                    const data = await res.json();
                    status.innerText = data.status || data.error;
                } catch (e) { status.innerText = "Hata oluştu!"; }
            }
        </script>
    </body>
    </html>
  `);
});

app.get('/order', async (req, res) => {
  const { platform, url, amount } = req.query;
  try {
    const order = await api.placeOrder(url, parseInt(amount), platform, false);
    res.json({ status: "Başarılı!", details: order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Sunucu ${PORT} portunda hazır!`);
});
