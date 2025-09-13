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
module.exports = async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const path = req.url.replace('/api/autumn/', '');
    const customerId = getCustomerId(req);
    
    console.log('Autumn API request:', { path, method: req.method, customerId });

    // Handle different endpoints
    if (path === 'products' && req.method === 'GET') {
      // Return credit packages instead of subscriptions
      const products = [
        {
          id: 'credits-50',
          name: 'Starter Pack',
          description: '50 photo credits',
          price: 500, // $5.00 in cents
          credits: 50
        },
        {
          id: 'credits-200',
          name: 'Gold Pack', 
          description: '200 photo credits',
          price: 1500, // $15.00 in cents
          credits: 200
        },
        {
          id: 'credits-500',
          name: 'Premium Pack',
          description: '500 photo credits',
          price: 3000, // $30.00 in cents
          credits: 500
        },
        {
          id: 'credits-1000',
          name: 'Diamond Pack',
          description: '1000 photo credits',
          price: 5000, // $50.00 in cents
          credits: 1000
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
      // Handle checkout for credit packages
      const body = req.body;
      const productId = body.product_id;
      
      // Get product details
      const products = {
        'credits-50': { credits: 50, price: 500 },
        'credits-200': { credits: 200, price: 1500 },
        'credits-500': { credits: 500, price: 3000 },
        'credits-1000': { credits: 1000, price: 5000 }
      };
      
      const product = products[productId];
      if (!product) {
        res.status(400).json({ error: 'Invalid product' });
        return;
      }
      
      // Create checkout session
      const checkout = await callAutumnAPI('/checkout', 'POST', {
        customer_id: customerId,
        product_id: productId,
        success_url: body.success_url,
        cancel_url: body.cancel_url,
        credits: product.credits
      });
      
      res.json(checkout);
      return;
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