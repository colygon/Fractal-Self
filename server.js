import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for your Vite frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'], // Allow both dev ports
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'banana-cam-server' });
});

// RevenueCat webhook endpoint (for future use)
app.post('/api/revenuecat/webhook', (req, res) => {
  console.log('RevenueCat webhook received:', req.body);
  res.json({ received: true });
});

app.listen(PORT, () => {
  console.log(`🍌 Banana Cam server running on port ${PORT}`);
});