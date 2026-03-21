export default async function handler(req, res) {
  // Sadece test amaçlı sabit bir liste
  const m3u = `#EXTM3U\n#EXTINF:-1,Test Kanali\nhttps://google.com`;
  
  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send(m3u);
}
