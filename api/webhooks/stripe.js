import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

async function callAutumnAPI(endpoint, method = 'GET', data = null) {
  const url = `https://api.useautumn.com/v1${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${process.env.AUTUMN_SECRET_KEY}`,
      'Content-Type': 'application/json',
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

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // For webhook signature verification, we need the raw body
    const body = req.body;
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  console.log('Stripe webhook event received:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Processing successful checkout:', session.id);
        
        // Extract credit information from metadata
        const credits = parseInt(session.metadata?.credits || '0');
        const productId = session.metadata?.product_id;
        
        if (!credits || !productId) {
          console.error('Missing credits or product_id in session metadata');
          break;
        }
        
        // Get customer ID from session
        const customerId = session.client_reference_id || session.customer_email || `stripe-${session.customer}`;
        
        console.log('Adding credits to customer:', { customerId, credits, productId });
        
        // Add credits to customer account via Autumn API
        try {
          const result = await callAutumnAPI('/track', 'POST', {
            customer_id: customerId,
            feature_id: 'credit-purchase',
            usage: -credits, // Negative usage adds credits
            metadata: {
              stripe_session_id: session.id,
              product_id: productId,
              amount_paid: session.amount_total
            }
          });
          
          console.log('Successfully added credits:', result);
        } catch (autumnError) {
          console.error('Failed to add credits via Autumn API:', autumnError);
          // Continue processing - we don't want to fail the webhook
        }
        
        break;
        
      case 'payment_intent.succeeded':
        console.log('PaymentIntent was successful:', event.data.object.id);
        break;
        
      case 'payment_intent.payment_failed':
        console.log('PaymentIntent failed:', event.data.object.id);
        break;
        
      default:
        console.log('Unhandled event type:', event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}