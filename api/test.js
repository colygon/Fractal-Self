// Simple test serverless function
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ 
    message: 'Test function works',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    env_test: process.env.AUTUMN_SECRET_KEY ? 'AUTUMN_SECRET_KEY is available' : 'AUTUMN_SECRET_KEY is missing'
  });
}