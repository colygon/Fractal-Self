import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import crypto from 'crypto';

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
// app.use(clerkMiddleware()); // Temporarily disabled for testing

// RevenueCat API helper functions
const REVENUECAT_WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET;
const REVENUECAT_API_KEY = process.env.REVENUECAT_API_KEY;

function verifyWebhookSignature(payload, signature) {
  if (!REVENUECAT_WEBHOOK_SECRET) {
    console.warn('REVENUECAT_WEBHOOK_SECRET not configured - skipping signature verification');
    return true; // Allow in development
  }

  const expectedSignature = crypto
    .createHmac('sha256', REVENUECAT_WEBHOOK_SECRET)
    .update(payload, 'utf8')
    .digest('hex');

  return signature === expectedSignature;
}

async function callRevenueCatAPI(endpoint, method = 'POST', data = null) {
  const url = `https://api.revenuecat.com/v1${endpoint}`;

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${REVENUECAT_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Platform': 'web',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  return response.json();
}

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

// RevenueCat webhook endpoint
app.post('/api/webhooks/revenuecat', async (req, res) => {
  try {
    const payload = JSON.stringify(req.body);
    const signature = req.headers['x-revenuecat-signature'];

    // Verify webhook signature in production
    if (!verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    console.log('RevenueCat webhook event received:', event.event_type || event.type);

    switch (event.event_type || event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
        console.log('Processing purchase/renewal event');

        const { app_user_id, product_id, currency, price } = event;

        // Map product IDs to banana amounts
        const bananaRewards = {
          'credits_400': 400,
          'credits_1700': 1700,
          'credits_5000': 5000
        };

        const bananasToAdd = bananaRewards[product_id];
        if (!bananasToAdd) {
          console.warn(`Unknown product ID: ${product_id}`);
          break;
        }

        console.log(`Crediting ${bananasToAdd} bananas to user ${app_user_id} for product ${product_id}`);

        // Grant virtual currency via RevenueCat Developer API
        try {
          const result = await callRevenueCatAPI('/virtual-currency/grant', 'POST', {
            app_user_id,
            currency: 'bananas',
            amount: bananasToAdd,
            reason: `Purchase of ${product_id}`,
            metadata: {
              event_type: event.event_type || event.type,
              product_id,
              transaction_id: event.transaction_id,
              revenuecat_event_id: event.id
            }
          });

          console.log('Successfully granted virtual currency:', result);
        } catch (error) {
          console.error('Failed to grant virtual currency:', error);
          return res.status(500).json({ error: 'Failed to grant virtual currency' });
        }

        break;

      case 'CANCEL':
        console.log('Processing cancellation event');
        break;

      case 'UNCANCEL':
        console.log('Processing uncancellation event');
        break;

      default:
        console.log('Unhandled event type:', event.event_type || event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing RevenueCat webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Spend bananas endpoint
app.post('/api/spend-bananas', async (req, res) => {
  try {
    const { app_user_id, amount, currency = 'bananas', reason = 'Photo transformation' } = req.body;

    if (!app_user_id || !amount || amount <= 0) {
      return res.status(400).json({
        error: 'Missing required fields: app_user_id and positive amount'
      });
    }

    console.log(`Processing virtual currency spend: ${amount} ${currency} for user ${app_user_id}`);

    // First, check current balance to ensure sufficient funds
    try {
      const balanceResponse = await callRevenueCatAPI(`/subscribers/${app_user_id}/virtual-currency`, 'GET');

      const currentBalance = balanceResponse.currencies?.[currency]?.balance || 0;
      console.log(`Current ${currency} balance: ${currentBalance}`);

      if (currentBalance < amount) {
        return res.status(400).json({
          error: 'Insufficient virtual currency balance',
          currentBalance,
          requestedAmount: amount
        });
      }
    } catch (balanceError) {
      console.error('Failed to check balance:', balanceError);
      // Continue with spend attempt - RevenueCat will validate server-side
    }

    // Spend virtual currency via RevenueCat Developer API
    const spendResult = await callRevenueCatAPI('/virtual-currency/spend', 'POST', {
      app_user_id,
      currency,
      amount,
      reason,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'fractal-self-app'
      }
    });

    console.log('Successfully spent virtual currency:', spendResult);

    res.json({
      success: true,
      newBalance: spendResult.new_balance,
      transactionId: spendResult.transaction_id,
      spent: amount,
      currency
    });

  } catch (error) {
    console.error('Error spending virtual currency:', error);

    // Handle specific RevenueCat errors
    if (error.message.includes('Insufficient balance')) {
      return res.status(400).json({
        error: 'Insufficient virtual currency balance',
        code: 'INSUFFICIENT_BALANCE'
      });
    }

    if (error.message.includes('User not found')) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.status(500).json({
      error: 'Failed to spend virtual currency',
      details: error.message
    });
  }
});

// Get balance endpoint
app.use('/api/get-balance', async (req, res) => {
  const method = req.method;
  const app_user_id = method === 'POST'
    ? req.body.app_user_id
    : req.query.app_user_id;

  if (!app_user_id) {
    return res.status(400).json({
      error: 'Missing required field: app_user_id'
    });
  }

  try {
    const projectId = process.env.REVENUECAT_PROJECT_ID;
    const secretKey = process.env.REVENUECAT_API_KEY;

    if (!projectId || !secretKey) {
      console.error('Missing RevenueCat configuration');
      return res.status(500).json({
        error: 'Server configuration error'
      });
    }

    // Fetch virtual currency balance from RevenueCat API
    const response = await fetch(
      `https://api.revenuecat.com/v2/projects/${projectId}/subscribers/${encodeURIComponent(app_user_id)}/virtual_currencies`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('RevenueCat API error:', result);
      return res.status(response.status).json({
        error: result.message || 'Failed to fetch balance'
      });
    }

    console.log(`✅ Fetched virtual currency balance for user ${app_user_id}:`, result);

    // Return the balance
    const bananaBalance = result.virtual_currencies?.bananas?.balance || 0;

    res.status(200).json({
      success: true,
      balance: bananaBalance,
      currencies: result.virtual_currencies
    });

  } catch (error) {
    console.error('Balance API error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🍌 Banana Cam server running on port ${PORT}`);
});
