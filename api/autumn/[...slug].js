// Custom Autumn API implementation to bypass autumn-js library bug
// This directly implements the necessary endpoints for credit system

function getCustomerId(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return 'anonymous-' + Date.now();
  }

  try {
    const token = authHeader.split(' ')[1];
    
    if (!token || token.split('.').length !== 3) {
      return 'anonymous-' + Date.now();
    }
    
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.sub || 'clerk-' + Date.now();
  } catch (error) {
    console.error('Error parsing auth token:', error);
    return 'anonymous-' + Date.now();
  }
}

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

// Vercel serverless function handler - catch all autumn routes
export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const rawPath = req.url.replace('/api/autumn/', '');
    const path = rawPath.split('?')[0]; // Remove query parameters
    const customerId = getCustomerId(req);
    
    console.log('Autumn API request:', { rawPath, path, method: req.method, customerId });

    // Handle different endpoints
    if (path === 'products' && req.method === 'GET') {
      // Return credit packages instead of subscriptions
      const products = [
        {
          id: 'credits-50',
          name: 'Starter Pack',
          description: '400 photo credits',
          price: 399, // $3.99 in cents
          credits: 400
        },
        {
          id: 'credits-200',
          name: 'Gold Pack', 
          description: '2000 photo credits',
          price: 1999, // $19.99 in cents
          credits: 2000
        },
        {
          id: 'credits-500',
          name: 'Premium Pack',
          description: '5000 photo credits',
          price: 4999, // $49.99 in cents
          credits: 5000
        },
        {
          id: 'credits-1000',
          name: 'Diamond Pack',
          description: '50000 photo credits',
          price: 49999, // $499.99 in cents
          credits: 50000
        }
      ];
      
      res.json(products);
      return;
    }
    
    if (path === 'customers' && req.method === 'POST') {
      // Create or get customer
      const customer = await callAutumnAPI('/customers', 'POST', {
        customer_id: customerId,
        customer_data: {
          name: 'User',
          email: 'user@example.com'
        }
      });
      
      res.json(customer);
      return;
    }
    
    if (path === 'customers' && req.method === 'GET') {
      // Get customer with credits
      try {
        const customer = await callAutumnAPI(`/customers/${customerId}`);
        res.json(customer);
      } catch (error) {
        // If customer doesn't exist, create them
        const newCustomer = await callAutumnAPI('/customers', 'POST', {
          customer_id: customerId,
          customer_data: {
            name: 'User',
            email: 'user@example.com'
          }
        });
        res.json(newCustomer);
      }
      return;
    }
    
    if (path.startsWith('checkout') && req.method === 'POST') {
      // Handle checkout for credit packages using real Stripe
      const body = req.body;
      const productId = body.product_id;
      
      // Get product details
      const products = {
        'credits-50': { credits: 400, price: 399, name: 'Starter Pack' },
        'credits-200': { credits: 2000, price: 1999, name: 'Gold Pack' },
        'credits-500': { credits: 5000, price: 4999, name: 'Premium Pack' },
        'credits-1000': { credits: 50000, price: 49999, name: 'Diamond Pack' }
      };
      
      const product = products[productId];
      if (!product) {
        res.status(400).json({ error: 'Invalid product' });
        return;
      }
      
      try {
        // Import Stripe dynamically to avoid issues with ES modules
        const { default: Stripe } = await import('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        
        // Create real Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card', 'apple_pay', 'google_pay'],
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: product.name,
                description: `${product.credits} photo credits for Fractal Self`,
              },
              unit_amount: product.price,
            },
            quantity: 1,
          }],
          mode: 'payment',
          success_url: body.success_url || `${req.headers.origin || 'https://fractal-self.vercel.app'}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: body.cancel_url || `${req.headers.origin || 'https://fractal-self.vercel.app'}/cancel`,
          metadata: {
            product_id: productId,
            credits: product.credits.toString(),
            customer_id: customerId
          },
          client_reference_id: customerId
        });
        
        const checkout = {
          checkout_url: session.url,
          session_id: session.id,
          product_id: productId,
          product_name: product.name,
          amount: product.price,
          credits: product.credits,
          customer_id: customerId,
          success_url: session.success_url,
          cancel_url: session.cancel_url
        };
        
        res.json(checkout);
        return;
      } catch (stripeError) {
        console.error('Stripe checkout error:', stripeError);
        res.status(500).json({ error: 'Failed to create checkout session', details: stripeError.message });
        return;
      }
    }
    
    if (path.startsWith('check') && req.method === 'POST') {
      // Check if user has credits for photo transformation
      const body = req.body;
      const requiredCredits = body.credits || 5; // 5 credits per photo
      
      try {
        const customer = await callAutumnAPI(`/customers/${customerId}`);
        const availableCredits = customer.usage?.credits || 0;
        
        res.json({
          allowed: availableCredits >= requiredCredits,
          credits_remaining: availableCredits,
          credits_required: requiredCredits
        });
      } catch (error) {
        // If customer doesn't exist, they have no credits
        res.json({
          allowed: false,
          credits_remaining: 0,
          credits_required: requiredCredits
        });
      }
      return;
    }
    
    if (path.startsWith('track') && req.method === 'POST') {
      // Track credit usage after photo transformation
      const body = req.body;
      const creditsUsed = body.credits || 5; // 5 credits per photo
      
      const usage = await callAutumnAPI('/track', 'POST', {
        customer_id: customerId,
        feature_id: 'photo-transformation',
        usage: creditsUsed
      });
      
      res.json(usage);
      return;
    }
    
    // Default fallback
    res.status(404).json({ error: 'Endpoint not found' });
    
  } catch (error) {
    console.error('Autumn API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};