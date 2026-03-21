export default async function handler(req, res) {
  const SOURCE_URL = "https://boru-pc-tv.vercel.app/";

  // --- 1. YAYIN TÜNELLEME (STREAM PROXY) BÖLÜMÜ ---
  // Eğer linkte ?stream= varsa, yayını Vercel üzerinden geçirir
  if (req.query.stream) {
    const streamUrl = decodeURIComponent(req.query.stream);
    try {
      const streamRes = await fetch(streamUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Referer": "https://boru-pc-tv.vercel.app/"
        }
      });
      return streamRes.body.pipe(res);
    } catch (e) {
      return res.status(500).send("Yayin sunucusuna ulasilamadi.");
    }
  }

  // --- 2. M3U LİSTE OLUŞTURMA BÖLÜMÜ ---
  try {
    const response = await fetch(SOURCE_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    const text = await response.text();
    const match = text.match(/const\s+channelsData\s*=\s*(\{[\s\S]*?\});/);
    
    if (!match) return res.status(500).send("Kanal verisi bulunamadi.");

    const data = JSON.parse(match[1]);
    let m3u = "#EXTM3U\n";

    for (const group in data) {
      if (group.toLowerCase() === "bilgilendirme") continue;
      
      data[group].forEach(ch => {
        // Her kanalı kendi Vercel tüneline yönlendiriyoruz
        const proxyUrl = `https://${req.headers.host}/api/liste?stream=${encodeURIComponent(ch.url)}`;
        
        m3u += `#EXTINF:-1 tvg-logo="${ch.logo}" group-title="${group.toUpperCase()}",${ch.name}\n`;
        m3u += `${proxyUrl}\n`;
      });
    }

    res.setHeader('Content-Type', 'application/x-mpegurl');
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).send(m3u);

  } catch (error) {
    res.status(500).send("Hata: " + error.message);
  }
}
