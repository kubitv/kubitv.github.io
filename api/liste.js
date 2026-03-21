export default async function handler(req, res) {
  const SOURCE_URL = "https://boru-pc-tv.vercel.app/";

  // Eğer kullanıcı bir kanala tıklayıp gelmişse (Yayın tünelleme)
  if (req.query.stream) {
    const streamUrl = decodeURIComponent(req.query.stream);
    const streamRes = await fetch(streamUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": "https://boru-pc-tv.vercel.app/"
      }
    });
    // Yayını paketler halinde kullanıcıya aktar (Proxy)
    return streamRes.body.pipe(res);
  }

  // Eğer kullanıcı sadece listeyi istiyorsa (M3U Oluşturma)
  try {
    const response = await fetch(SOURCE_URL);
    const text = await response.text();
    const match = text.match(/const\s+channelsData\s*=\s*(\{[\s\S]*?\});/);
    if (!match) return res.status(500).send("Veri bulunamadı.");
    
    const data = JSON.parse(match[1]);
    let m3u = "#EXTM3U\n";

    for (const group in data) {
      if (group.toLowerCase() === "bilgilendirme") continue;
      data[group].forEach(ch => {
        // BURASI ÇOK KRİTİK: Kanal linkini doğrudan vermiyoruz, 
        // linki kendi Vercel API'mize yönlendiriyoruz (Tünel kuruyoruz).
        const proxyUrl = `https://${req.headers.host}/api/liste?stream=${encodeURIComponent(ch.url)}`;
        
        m3u += `#EXTINF:-1 tvg-logo="${ch.logo}" group-title="${group.toUpperCase()}",${ch.name}\n`;
        m3u += `${proxyUrl}\n`;
      });
    }

    res.setHeader('Content-Type', 'application/x-mpegurl');
    res.status(200).send(m3u);
  } catch (e) {
    res.status(500).send("Hata: " + e.message);
  }
}
