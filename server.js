import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { autumnHandler } from 'autumn-js/express';

dotenv.config();

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
  identify: async (request) => {
    // Extract user info from Clerk auth token
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null; // No auth token
    }

    // In a real app, you'd verify the Clerk JWT here
    // For now, we'll extract user info from the token payload
    try {
      const token = authHeader.split(' ')[1];
      // This is a simplified version - in production you'd verify the JWT
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      
      return {
        customerId: payload.sub, // Clerk user ID
        customerData: {
          name: payload.name,
          email: payload.email,
        },
      };
    } catch (error) {
      console.error('Error parsing auth token:', error);
      return null;
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