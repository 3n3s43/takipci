const axios = require('axios');
const EventSource = require('eventsource');
const express = require('express'); // Express eklendi
const app = express();

const API_BASE_URL = 'https://testroichueserverpriv.roicmedya.com';
const API_KEY = process.env.API_KEY || '595aac92490bbc94911acx00000000'; // Güvenlik için Environment Variable
const PORT = process.env.PORT || 3000;

class SocialMediaAPI {
  constructor(apiKey, baseUrl = API_BASE_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async placeOrder(url, amount, platform, isStream = false) {
    try {
      const payload = {
        apiKey: this.apiKey,
        postUrl: url,
        amount: amount,
        platform: platform,
        stream: isStream 
      };

      const response = await axios.post(`${this.baseUrl}/api/order`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      return response.data;
    } catch (error) {
      const msg = error.response ? error.response.data.error : error.message;
      throw new Error(msg);
    }
  }

  // Stream bağlantısı logları konsola basmaya devam eder
  async connectToStream(orderId) {
    const streamUrl = `${API_BASE_URL}/api/stream/${orderId}`;
    const eventSource = new EventSource(streamUrl);
    console.log(`📡 Stream bağlandı: ${orderId}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Stream Data:', data);
      if (data.type === 'completed' || data.type === 'error') eventSource.close();
    };
  }
}

const api = new SocialMediaAPI(API_KEY);

// --- WEB ROTASI (Sipariş Tetikleyici) ---
// Örnek kullanım: domain.com/order?platform=instagram_followers&url=TEST_URL&amount=100
app.get('/order', async (req, res) => {
  const { platform, url, amount, stream } = req.query;

  if (!platform || !url || !amount) {
    return res.status(400).json({ error: "Eksik parametre: platform, url ve amount gerekli." });
  }

  try {
    const isStream = stream === 'true';
    const order = await api.placeOrder(url, parseInt(amount), platform, isStream);
    
    if (order.success && isStream && order.orderId) {
      api.connectToStream(order.orderId);
    }

    res.json({ status: "Sipariş işleme alındı", details: order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => res.send('Sosyal Medya API Servisi Çalışıyor 🚀'));

app.listen(PORT, () => {
  console.log(`✅ Sunucu http://localhost:${PORT} üzerinde hazır!`);
});
