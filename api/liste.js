export default async function handler(req, res) {
  // Kendi ana sitendeki (verilerin olduğu yer) URL'yi kullanıyoruz
  const SOURCE_URL = "https://kubitv.github.io/index.html"; 

  try {
    const response = await fetch(SOURCE_URL);
    if (!response.ok) throw new Error("Siteye ulaşılamadı");
    
    const text = await response.text();

    // JavaScript içindeki 'const channelsData =' kısmını daha geniş bir açıyla arıyoruz
    const regex = /const\s+channelsData\s*=\s*(\{[\s\S]*?\});/;
    const match = text.match(regex);
    
    if (!match) {
      // Eğer index.html'de bulamazsa hata mesajı ver
      return res.status(500).send("HATA: Kaynak kodda 'const channelsData' bulunamadı. Lütfen dosya adını kontrol edin.");
    }

    const json = JSON.parse(match[1]);
    let m3u = "#EXTM3U\n";

    Object.keys(json).forEach(groupName => {
      if (groupName.toLowerCase() === "bilgilendirme") return;

      json[groupName].forEach(ch => {
        m3u += `#EXTINF:-1 tvg-logo="${ch.logo || ''}" group-title="${groupName.toUpperCase()}",${ch.name}\n`;
        // Tivimate Baypas Ayarları
        m3u += `#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)\n`;
        m3u += `#EXTVLCOPT:http-referrer=https://boru-pc-tv.vercel.app/\n`;
        m3u += `${ch.url}\n`;
      });
    });

    res.setHeader('Content-Type', 'application/x-mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(m3u);

  } catch (error) {
    res.status(500).send("Hata oluştu: " + error.message);
  }
}
