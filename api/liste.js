export default async function handler(req, res) {
  const SOURCE_URL = "https://boru-pc-tv.vercel.app/";

  // --- BÖLÜM 1: CANLI YAYIN TÜNELİ (PROXY) ---
  if (req.query.url) {
    const targetUrl = decodeURIComponent(req.query.url);
    try {
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Referer": "https://boru-pc-tv.vercel.app/",
          "Origin": "https://boru-pc-tv.vercel.app/"
        }
      });

      // Yayını ham veri (stream) olarak kullanıcıya aktar
      res.setHeader("Content-Type", response.headers.get("content-type") || "video/mp2t");
      res.setHeader("Access-Control-Allow-Origin", "*");
      return response.body.pipe(res);
    } catch (e) {
      return res.status(500).send("Yayin sunucusu hatasi.");
    }
  }

  // --- BÖLÜM 2: LİSTE HAZIRLAMA ---
  try {
    const response = await fetch(SOURCE_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    const text = await response.text();
    const match = text.match(/const\s+channelsData\s*=\s*(\{[\s\S]*?\});/);
    
    if (!match) return res.status(500).send("Kanal listesi çekilemedi.");
    const data = JSON.parse(match[1]);

    let m3u = "#EXTM3U\n";
    const host = req.headers.host;

    for (const group in data) {
      if (group.toLowerCase() === "bilgilendirme") continue;
      
      data[group].forEach(ch => {
        // KANALLARI VERCEL ÜZERİNDEN GEÇİRİYORUZ
        const proxyUrl = `https://${host}/api/liste?url=${encodeURIComponent(ch.url)}`;
        
        m3u += `#EXTINF:-1 tvg-logo="${ch.logo}" group-title="${group.toUpperCase()}",${ch.name}\n`;
        m3u += `${proxyUrl}\n`;
      });
    }

    res.setHeader('Content-Type', 'application/x-mpegurl');
    res.status(200).send(m3u);

  } catch (error) {
    res.status(500).send("Sistem hatasi.");
  }
}
