export default async function handler(req, res) {
  const SOURCE_URL = "https://boru-pc-tv.vercel.app/";

  try {
    const response = await fetch(SOURCE_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    const text = await response.text();
    const match = text.match(/const\s+channelsData\s*=\s*(\{[\s\S]*?\});/);
    
    if (!match) return res.status(500).send("Kanal verisi çekilemedi.");

    const data = JSON.parse(match[1]);
    let m3u = "#EXTM3U\n";

    for (const group in data) {
      if (group.toLowerCase() === "bilgilendirme") continue;
      
      data[group].forEach(ch => {
        m3u += `#EXTINF:-1 tvg-logo="${ch.logo}" group-title="${group.toUpperCase()}",${ch.name}\n`;
        
        // KRİTİK AYARLAR: Kablo TV/Boru TV korumasını aşmak için oynatıcıya talimat veriyoruz
        m3u += `#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)\n`;
        m3u += `#EXTVLCOPT:http-referrer=https://boru-pc-tv.vercel.app/\n`;
        
        // Eğer linkte özel bir token gerekmiyorsa doğrudan linki veriyoruz
        m3u += `${ch.url}\n`;
      });
    }

    res.setHeader('Content-Type', 'application/x-mpegurl');
    res.status(200).send(m3u);

  } catch (error) {
    res.status(500).send("Hata: " + error.message);
  }
}
