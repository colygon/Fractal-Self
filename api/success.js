export default async function handler(req, res) {
  const { session_id } = req.query;
  
  let sessionDetails = null;
  
  // Try to get session details from Stripe if session_id is provided
  if (session_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const { default: Stripe } = await import('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      sessionDetails = await stripe.checkout.sessions.retrieve(session_id);
    } catch (error) {
      console.error('Error retrieving Stripe session:', error);
    }
  }
  
  const credits = sessionDetails?.metadata?.credits || 'your';
  const productName = sessionDetails?.metadata?.product_id || 'credit package';
  
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Successful - Fractal Self</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }
        
        .container {
            background: white;
            border-radius: 16px;
            padding: 3rem;
            max-width: 500px;
            width: 90%;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        .checkmark {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: #4CAF50;
            margin: 0 auto 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: bounce 0.6s ease-out;
        }
        
        .checkmark::after {
            content: '✓';
            color: white;
            font-size: 40px;
            font-weight: bold;
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
                transform: translateY(0);
            }
            40% {
                transform: translateY(-10px);
            }
            60% {
                transform: translateY(-5px);
            }
        }
        
        h1 {
            font-size: 2rem;
            margin-bottom: 1rem;
            color: #2c3e50;
        }
        
        p {
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 1.5rem;
            color: #666;
        }
        
        .credits-info {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 1.5rem;
            margin: 2rem 0;
        }
        
        .credits-number {
            font-size: 2.5rem;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 0.5rem;
        }
        
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: transform 0.2s ease;
            margin: 0.5rem;
        }
        
        .button:hover {
            transform: translateY(-2px);
        }
        
        .session-info {
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid #eee;
            font-size: 0.9rem;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="checkmark"></div>
        
        <h1>Payment Successful!</h1>
        
        <p>Thank you for your purchase! Your payment has been processed successfully.</p>
        
        <div class="credits-info">
            <div class="credits-number">${credits}</div>
            <div>Photo Credits Added</div>
        </div>
        
        <p>Your credits have been added to your account and are ready to use. Start creating amazing AI-transformed photos with Fractal Self!</p>
        
        <a href="/" class="button">Start Creating Photos</a>
        
        ${sessionDetails ? `
        <div class="session-info">
            <p><strong>Order Details:</strong></p>
            <p>Session ID: ${session_id}</p>
            <p>Amount: $${(sessionDetails.amount_total / 100).toFixed(2)}</p>
            <p>Credits: ${credits}</p>
        </div>
        ` : ''}
    </div>
</body>
</html>
  `);
}