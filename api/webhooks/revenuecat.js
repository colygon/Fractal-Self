import crypto from 'crypto';

const REVENUECAT_WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET;

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
      'Authorization': `Bearer ${process.env.REVENUECAT_API_KEY}`,
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

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
        // Handle subscription cancellations if needed
        break;

      case 'UNCANCEL':
        console.log('Processing uncancellation event');
        // Handle subscription reactivations if needed
        break;

      default:
        console.log('Unhandled event type:', event.event_type || event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing RevenueCat webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}