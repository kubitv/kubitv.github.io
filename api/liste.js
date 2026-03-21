export default async function handler(req, res) {
  const SOURCE_URL = "https://boru-pc-tv.vercel.app/";

  // 1. TÜNELLEME VE PARÇA YÖNETİMİ
  if (req.query.stream) {
    const streamUrl = decodeURIComponent(req.query.stream);
    try {
      const response = await fetch(streamUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Referer": "https://boru-pc-tv.vercel.app/"
        }
      });

      const contentType = response.headers.get("content-type");
      
      // Eğer bu bir m3u8 dosyasıysa (index dosyası), içindeki linkleri de tünelle
      if (contentType && (contentType.includes("mpegurl") || contentType.includes("apple-mpegurl"))) {
        let text = await response.text();
        const baseUrl = streamUrl.substring(0, streamUrl.lastIndexOf("/") + 1);
        
        // Linkleri Vercel üzerinden geçecek şekilde manipüle et
        const updatedText = text.replace(/^(?!#)(.*)$/mg, (line) => {
          if (line.trim() === "") return line;
          const absoluteUrl = line.startsWith("http") ? line : baseUrl + line;
          return `https://${req.headers.host}/api/liste?stream=${encodeURIComponent(absoluteUrl)}`;
        });

        res.setHeader("Content-Type", contentType);
        return res.send(updatedText);
      }

      // Eğer bu bir video parçasıysa (.ts), doğrudan aktar
      const arrayBuffer = await response.arrayBuffer();
      res.setHeader("Content-Type", contentType);
      return res.send(Buffer.from(arrayBuffer));

    } catch (e) {
      return res.status(500).send("Yayin hatasi");
    }
  }

  // 2. LİSTE OLUŞTURMA
  try {
    const response = await fetch(SOURCE_URL);
    const text = await response.text();
    const match = text.match(/const\s+channelsData\s*=\s*(\{[\s\S]*?\});/);
    if (!match) return res.status(500).send("Veri yok");

    const data = JSON.parse(match[1]);
    let m3u = "#EXTM3U\n";

    for (const group in data) {
      if (group.toLowerCase() === "bilgilendirme") continue;
      data[group].forEach(ch => {
        const proxyUrl = `https://${req.headers.host}/api/liste?stream=${encodeURIComponent(ch.url)}`;
        m3u += `#EXTINF:-1 tvg-logo="${ch.logo}" group-title="${group.toUpperCase()}",${ch.name}\n${proxyUrl}\n`;
      });
    }

    res.setHeader('Content-Type', 'application/x-mpegurl');
    res.status(200).send(m3u);
  } catch (e) {
    res.status(500).send("Hata");
  }
}
