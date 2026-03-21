export default async function handler(req, res) {
  // Senin kanal verilerinin olduğu ham URL (Kendi Vercel linkini buraya yaz)
  const SOURCE_URL = "https://boru-pc-tv.vercel.app/"; 

  try {
    const response = await fetch(SOURCE_URL, {
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html"
      }
    });
    const text = await response.text();

    // 1. Regex'i biraz daha esnek yapalım (Boşlukları ve farklı yazımları kapsasın)
    const match = text.match(/const\s+channelsData\s*=\s*([\s\S]*?);/);
    
    if (!match) {
        // Eğer hala bulamazsa hata mesajını daha detaylı verelim
        return res.status(500).send("HATA: Kanal verisi HTML içinde bulunamadı. Lütfen ana sayfa kodunda 'const channelsData =' kısmının doğru olduğundan emin olun.");
    }

    let data;
    try {
        data = JSON.parse(match[1].trim());
    } catch (e) {
        return res.status(500).send("HATA: Kanal verisi JSON formatına çevrilemedi.");
    }

    let m3u = "#EXTM3U\n";

    for (const group in data) {
      if (group.toLowerCase() === "bilgilendirme") continue;
      
      data[group].forEach(ch => {
        // Tivimate için her kanalın başına gerekli kandırmaları ekliyoruz
        m3u += `#EXTINF:-1 tvg-logo="${ch.logo || ''}" group-title="${group.toUpperCase()}",${ch.name}\n`;
        // Kritik: Yayını açmak için gereken kimlik bilgileri
        m3u += `#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)\n`;
        m3u += `#EXTVLCOPT:http-referrer=https://boru-pc-tv.vercel.app/\n`;
        m3u += `${ch.url}\n`;
      });
    }

    res.setHeader('Content-Type', 'application/x-mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).send(m3u);

  } catch (error) {
    res.status(500).send("Sistem Hatası: " + error.message);
  }
}
