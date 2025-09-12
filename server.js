import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { autumnHandler } from 'autumn-js/express';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.AUTUMN_PORT || 3001;

// Enable CORS for your Vite frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'], // Allow both dev ports
  credentials: true
}));

app.use(express.json());

// Autumn billing handler
app.use('/api/autumn', autumnHandler({
  secretKey: process.env.AUTUMN_SECRET_KEY,
  identify: async (request) => {
    // Extract user info from Clerk auth token
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header found, using anonymous user');
      // Return a basic anonymous user for testing
      return {
        customerId: 'anonymous-' + Date.now(),
        customerData: {
          name: 'Anonymous User',
          email: 'anonymous@example.com',
        },
      };
    }

    // In a real app, you'd verify the Clerk JWT here
    // For now, we'll extract user info from the token payload
    try {
      const token = authHeader.split(' ')[1];
      
      if (!token || token.split('.').length !== 3) {
        console.log('Invalid token format, using anonymous user');
        return {
          customerId: 'anonymous-' + Date.now(),
          customerData: {
            name: 'Anonymous User',
            email: 'anonymous@example.com',
          },
        };
      }
      
      // This is a simplified version - in production you'd verify the JWT
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      
      return {
        customerId: payload.sub || 'clerk-' + Date.now(), // Clerk user ID
        customerData: {
          name: payload.name || 'Clerk User',
          email: payload.email || 'user@clerk.dev',
        },
      };
    } catch (error) {
      console.error('Error parsing auth token:', error);
      // Return anonymous user on error
      return {
        customerId: 'anonymous-' + Date.now(),
        customerData: {
          name: 'Anonymous User',
          email: 'anonymous@example.com',
        },
      };
    }
  },
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'autumn-billing' });
});

app.listen(PORT, () => {
  console.log(`🍂 Autumn billing server running on port ${PORT}`);
});