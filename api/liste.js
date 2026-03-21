export default async function handler(req, res) {
  // BURASI KRİTİK: Senin tüm kanalların burada duracak. 
  // İstediğin kadar grubu ve kanalı buraya ekleyebilirsin.
  const allChannels = {
    "Spor": [
      { name: "beIN SPORTS 1", url: "https://api.codetabs.com/v1/proxy/?quest=https://andro.2385437.xyz/checklist/receptestt.m3u8", logo: "https://images.seeklogo.com/logo-png/48/2/bein-sports-1-logo-png_seeklogo-481583.png" },
      // Buraya diğer beIN kanallarını ekleyebilirsin
    ],
    "Ulusal": [
      { name: "TRT 1", url: "Kanal_Linki_Buraya", logo: "Logo_Linki_Buraya" },
      { name: "ATV", url: "Kanal_Linki_Buraya", logo: "Logo_Linki_Buraya" }
    ]
  };

  try {
    let m3u = "#EXTM3U\n";

    Object.keys(allChannels).forEach(group => {
      allChannels[group].forEach(ch => {
        m3u += `#EXTINF:-1 tvg-logo="${ch.logo}" group-title="${group.toUpperCase()}",${ch.name}\n`;
        // IP Engeli Baypas Parametreleri (Tivimate için)
        m3u += `#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)\n`;
        m3u += `#EXTVLCOPT:http-referrer=https://boru-pc-tv.vercel.app/\n`;
        m3u += `${ch.url}\n`;
      });
    });

    res.setHeader('Content-Type', 'application/x-mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).send(m3u);

  } catch (error) {
    res.status(500).send("Bir hata oluştu.");
  }
}
