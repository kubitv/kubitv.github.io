export default async function handler(req, res) {
  const SOURCE_URL = "https://boru-pc-tv.vercel.app/";

  // --- 1. TÜNEL (BURADA HATA ALIYORDUN, DÜZELTİLDİ) ---
  if (req.query.url) {
    const targetUrl = decodeURIComponent(req.query.url);
    try {
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://boru-pc-tv.vercel.app/",
          "Accept": "*/*",
          "Connection": "keep-alive"
        }
      });

      if (!response.ok) {
        return res.status(response.status).send(`Sunucu Yanit Vermedi: ${response.status}`);
      }

      // Yayını Vercel üzerinden kullanıcıya akıt (Pipe)
      res.setHeader("Content-Type", response.headers.get("content-type") || "application/x-mpegURL");
      res.setHeader("Access-Control-Allow-Origin", "*");
      
      const reader = response.body.getReader();
      return new ReadableStream({
        start(controller) {
          function push() {
            reader.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }
              controller.enqueue(value);
              push();
            });
          }
          push();
        }
      }).pipeTo(new WritableStream({
        write(chunk) {
          res.write(chunk);
        },
        close() {
          res.end();
        }
      }));

    } catch (e) {
      return res.status(500).send("Proxy Hatasi: " + e.message);
    }
  }

  // --- 2. LİSTE OLUŞTURUCU ---
  try {
    const response = await fetch(SOURCE_URL);
    const text = await response.text();
    const match = text.match(/const\s+channelsData\s*=\s*(\{[\s\S]*?\});/);
    if (!match) return res.status(500).send("Veri bulunamadi.");

    const data = JSON.parse(match[1]);
    let m3u = "#EXTM3U\n";

    for (const group in data) {
      if (group.toLowerCase() === "bilgilendirme") continue;
      data[group].forEach(ch => {
        const proxyUrl = `https://${req.headers.host}/api/liste?url=${encodeURIComponent(ch.url)}`;
        m3u += `#EXTINF:-1 tvg-logo="${ch.logo}" group-title="${group.toUpperCase()}",${ch.name}\n${proxyUrl}\n`;
      });
    }
    res.setHeader('Content-Type', 'application/x-mpegurl');
    res.status(200).send(m3u);
  } catch (e) {
    res.status(500).send("Liste Hatasi");
  }
}
