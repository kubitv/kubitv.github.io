export default async function handler(req, res) {
  const SOURCE_URL = "https://boru-pc-tv.vercel.app/";

  try {
    const response = await fetch(SOURCE_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    
    const text = await response.text();
    
    // Senin kodundaki 'const channelsData =' kısmını yakalıyoruz
    const match = text.match(/const\s+channelsData\s*=\s*([\s\S]*?);/);
    
    if (!match) {
      return res.status(500).send("HATA: Boru TV sitesinden kanal verileri cekilemedi. Siteyi kontrol et.");
    }

    const json = JSON.parse(match[1]);
    let m3u = "#EXTM3U\n";

    // Grupları senin sitendeki mantıkla dönüyoruz
    Object.keys(json).forEach(groupName => {
      // 'bilgilendirme' grubunu atlıyoruz
      if (groupName.toLowerCase() === "bilgilendirme") return;

      const channels = json[groupName];
      channels.forEach(ch => {
        // M3U Formatı oluşturma
        m3u += `#EXTINF:-1 tvg-logo="${ch.logo || ''}" group-title="${groupName.toUpperCase()}",${ch.name}\n`;
        
        // BAYPAS KRİTİK: Her kanalın altına bu iki satırı ekliyoruz ki IP kilidi takılmasın
        m3u += `#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)\n`;
        m3u += `#EXTVLCOPT:http-referrer=https://boru-pc-tv.vercel.app/\n`;
        
        m3u += `${ch.url}\n`;
      });
    });

    // Sonucu M3U olarak basıyoruz
    res.setHeader('Content-Type', 'application/x-mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(m3u);

  } catch (error) {
    res.status(500).send("Sistem Hatası: " + error.message);
  }
}
