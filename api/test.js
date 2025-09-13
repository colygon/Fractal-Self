export default function handler(req, res) {
  res.json({ message: 'API is working', method: req.method, url: req.url });
}