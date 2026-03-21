export default async function handler(req, res) {
  // 1. Senin kodundaki sabit kanallar (Buraya istediğin kadar ekleyebilirsin)
  const defaultChannels = [
    { g: "spor", name: "beIN SPORTS 1", url: "https://api.codetabs.com/v1/proxy/?quest=https://andro.2385437.xyz/checklist/receptestt.m3u8", logo: "https://images.seeklogo.com/logo-png/48/2/bein-sports-1-logo-png_seeklogo-481583.png" }
  ];

  const EXTERNAL_SOURCE = "https://boru-pc-tv.vercel.app/";

  try {
    // 2. Dış kaynaktan (Boru TV) verileri çekiyoruz
    const response = await fetch(EXTERNAL_SOURCE, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    });
    const text = await response.text();
    
    // HTML içinden 'const channelsData =' kısmını ayıklıyoruz
    const match = text.match(/const\s+channelsData\s*=\s*([\s\S]*?);/);
    
    let combinedData = {};

    // 3. Eğer dış kaynak bulunursa verileri işle
    if (match) {
      const json = JSON.parse(match[1]);
      Object.keys(json).forEach(g => {
        if (g.toLowerCase() !== "bilgilendirme") {
          combinedData[g.toLowerCase()] = json[g];
        }
      });
    }

    // 4. Senin kodundaki 'defaultChannels' listesini de ekliyoruz
    defaultChannels.forEach(c => {
      const g = c.g.toLowerCase() || "genel";
      if (!combinedData[g]) combinedData[g] = [];
      // Aynı URL varsa mükerrer ekleme yapma
      if (!combinedData[g].some(x => x.url === c.url)) {
        combinedData[g].push(c);
      }
    });

    // 5. M3U dosyasını oluştur
    let m3u = "#EXTM3U\n";
    for (const group in combinedData) {
      combinedData[group].forEach(ch => {
        m3u += `#EXTINF:-1 tvg-logo="${ch.logo || ''}" group-title="${group.toUpperCase()}",${ch.name}\n`;
        // Baypas için gereken User-Agent ve Referrer (Tivimate için kritik)
        m3u += `#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)\n`;
        m3u += `#EXTVLCOPT:http-referrer=https://boru-pc-tv.vercel.app/\n`;
        m3u += `${ch.url}\n`;
      });
    }

    // 6. Sonucu gönder
    res.setHeader('Content-Type', 'application/x-mpegurl');
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).send(m3u);

  } catch (error) {
    res.status(500).send("Hata: " + error.message);
  }
}
