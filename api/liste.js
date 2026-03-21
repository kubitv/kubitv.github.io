export default async function handler(req, res) {
  const SOURCE_URL = "https://boru-pc-tv.vercel.app/";

  try {
    const response = await fetch(SOURCE_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    const text = await response.text();
    const match = text.match(/const\s+channelsData\s*=\s*(\{[\s\S]*?\});/);
    
    if (!match) return res.status(500).send("Kanal verisi bulunamadı.");

    const data = JSON.parse(match[1]);
    let m3u = "#EXTM3U\n";

    for (const group in data) {
      if (group.toLowerCase() === "bilgilendirme") continue;
      
      data[group].forEach(ch => {
        // TÜNELLEME YAPMIYORUZ: Doğrudan senin evindeki IP ile çalışacak linki veriyoruz
        m3u += `#EXTINF:-1 tvg-logo="${ch.logo}" group-title="${group.toUpperCase()}",${ch.name}\n`;
        
        // KRİTİK: Bazı oynatıcılar (Tivimate gibi) için gereken User-Agent ve Referrer bilgisini 
        // linkin içine "kandırarak" ekliyoruz.
        m3u += `#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)\n`;
        m3u += `#EXTVLCOPT:http-referrer=https://boru-pc-tv.vercel.app/\n`;
        m3u += `${ch.url}\n`;
      });
    }

    // Dosyayı indirilebilir bir M3U olarak gönderiyoruz
    res.setHeader('Content-Type', 'application/x-mpegurl');
    res.setHeader('Content-Disposition', 'attachment; filename="liste.m3u"');
    res.status(200).send(m3u);

  } catch (error) {
    res.status(500).send("Hata: " + error.message);
  }
}
