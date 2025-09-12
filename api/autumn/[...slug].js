import { autumnHandler } from 'autumn-js/express';

// Create the Autumn handler
const autumnMiddleware = autumnHandler({
  secretKey: process.env.AUTUMN_SECRET_KEY,
  identify: async (request) => {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header found, using anonymous user');
      return {
        customerId: 'anonymous-' + Date.now(),
        customerData: {
          name: 'Anonymous User',
          email: 'anonymous@example.com',
        },
      };
    }

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
      
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      
      return {
        customerId: payload.sub || 'clerk-' + Date.now(),
        customerData: {
          name: payload.name || 'Clerk User',
          email: payload.email || 'user@clerk.dev',
        },
      };
    } catch (error) {
      console.error('Error parsing auth token:', error);
      return {
        customerId: 'anonymous-' + Date.now(),
        customerData: {
          name: 'Anonymous User',
          email: 'anonymous@example.com',
        },
      };
    }
  },
});

// Vercel serverless function handler - catch all autumn routes
export default function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Use the Autumn middleware
  return autumnMiddleware(req, res);
}