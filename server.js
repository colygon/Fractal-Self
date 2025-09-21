import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { clerkMiddleware, requireAuth } from '@clerk/express';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

if (!process.env.CLERK_SECRET_KEY) {
  console.warn('⚠️  Missing CLERK_SECRET_KEY environment variable. Protected routes will reject requests.')
}

// Enable CORS for your Vite frontend
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://clerk.banana.cam'
  ],
  credentials: true
}));

app.use(express.json());
app.use(clerkMiddleware());

// Simple authenticated endpoint example
app.get('/api/me', requireAuth(), (req, res) => {
  res.json({
    userId: req.auth.userId,
    sessionId: req.auth.sessionId
  });
});

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
