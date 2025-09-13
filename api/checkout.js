// Mock checkout page for testing credit purchases
export default function handler(req, res) {
  const { session_id, product_id, amount, credits } = req.query;
  
  // Product details for display
  const productNames = {
    'credits-50': 'Starter Pack',
    'credits-200': 'Gold Pack', 
    'credits-500': 'Premium Pack',
    'credits-1000': 'Diamond Pack'
  };
  
  const productName = productNames[product_id] || 'Unknown Pack';
  const priceDisplay = amount ? `$${(parseInt(amount) / 100).toFixed(2)}` : '$0.00';
  const creditsDisplay = credits || '0';
  
  // Extract session data from our mock session ID
  const sessionData = {
    session_id: session_id || 'cs_test_mock',
    product: productName,
    price: priceDisplay,
    credits: creditsDisplay,
    status: 'complete',
    payment_status: 'paid'
  };

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mock Checkout - Fractal Self</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 400px;
      width: 90%;
    }
    .success-icon {
      width: 64px;
      height: 64px;
      background: #10B981;
      border-radius: 50%;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
    }
    h1 {
      color: #1F2937;
      margin: 0 0 10px;
      font-size: 24px;
    }
    p {
      color: #6B7280;
      margin: 0 0 30px;
      line-height: 1.5;
    }
    .session-info {
      background: #F3F4F6;
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
      text-align: left;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 12px;
      color: #374151;
    }
    .btn {
      background: #3B82F6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      text-decoration: none;
      display: inline-block;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #2563EB;
    }
    .note {
      background: #FEF3C7;
      border: 1px solid #F59E0B;
      border-radius: 6px;
      padding: 12px;
      margin-top: 20px;
      font-size: 14px;
      color: #92400E;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="success-icon">✓</div>
    <h1>Payment Successful!</h1>
    <p>You have successfully purchased <strong>${sessionData.product}</strong> for <strong>${sessionData.price}</strong>!</p>
    <p>Your account has been credited with <strong>${sessionData.credits} photo credits</strong>.</p>
    
    <div class="session-info">
      <strong>Product:</strong> ${sessionData.product}<br>
      <strong>Credits:</strong> ${sessionData.credits}<br>
      <strong>Amount:</strong> ${sessionData.price}<br>
      <strong>Session ID:</strong> ${sessionData.session_id}<br>
      <strong>Status:</strong> ${sessionData.status}
    </div>
    
    <a href="/" class="btn">Return to App</a>
    
    <div class="note">
      <strong>Note:</strong> This is a mock checkout for testing purposes. No actual payment was processed.
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}