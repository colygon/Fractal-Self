export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Cancelled - Fractal Self</title>
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
        
        .cancel-icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: #ff6b6b;
            margin: 0 auto 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: shake 0.6s ease-out;
        }
        
        .cancel-icon::after {
            content: '✕';
            color: white;
            font-size: 40px;
            font-weight: bold;
        }
        
        @keyframes shake {
            0%, 100% {
                transform: translateX(0);
            }
            25% {
                transform: translateX(-5px);
            }
            75% {
                transform: translateX(5px);
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
        
        .info-box {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 1.5rem;
            margin: 2rem 0;
            border-left: 4px solid #ff6b6b;
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
        
        .button.secondary {
            background: #6c757d;
        }
        
        .help-section {
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid #eee;
            font-size: 0.9rem;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="cancel-icon"></div>
        
        <h1>Payment Cancelled</h1>
        
        <p>Your payment was cancelled and no charges were made to your account.</p>
        
        <div class="info-box">
            <p><strong>What happened?</strong></p>
            <p>You chose to cancel the payment process. Your credit card was not charged and no credits were added to your account.</p>
        </div>
        
        <p>You can try again anytime or continue using Fractal Self with any existing credits you may have.</p>
        
        <a href="/" class="button">Return to App</a>
        <a href="/#credits" class="button secondary">Try Again</a>
        
        <div class="help-section">
            <p><strong>Need help?</strong></p>
            <p>If you're experiencing issues with payments or have questions about credits, please contact our support team.</p>
        </div>
    </div>
</body>
</html>
  `);
}