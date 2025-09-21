/**
 * Test script for RevenueCat virtual currency integration
 * Run with: node api/test-revenuecat.js
 */

const testWebhook = async () => {
  console.log('🧪 Testing RevenueCat webhook...');

  // Mock webhook payload for INITIAL_PURCHASE
  const mockWebhookPayload = {
    event_type: 'INITIAL_PURCHASE',
    app_user_id: 'test_user_123',
    product_id: 'credits_400',
    currency: 'USD',
    price: 2.99,
    transaction_id: 'test_transaction_123',
    id: 'test_event_123'
  };

  try {
    const response = await fetch('http://localhost:3001/api/webhooks/revenuecat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, you'd need to generate the proper signature
        // 'x-revenuecat-signature': 'signature_here'
      },
      body: JSON.stringify(mockWebhookPayload)
    });

    const result = await response.json();
    console.log('✅ Webhook test result:', result);
  } catch (error) {
    console.error('❌ Webhook test failed:', error.message);
  }
};

const testSpendAPI = async () => {
  console.log('🧪 Testing spend bananas API...');

  try {
    const response = await fetch('http://localhost:3001/api/spend-bananas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_user_id: 'test_user_123',
        amount: 5,
        currency: 'bananas',
        reason: 'Test photo transformation'
      })
    });

    const result = await response.json();
    console.log('✅ Spend API test result:', result);
  } catch (error) {
    console.error('❌ Spend API test failed:', error.message);
  }
};

const runTests = async () => {
  console.log('🚀 Starting RevenueCat integration tests...\n');

  await testWebhook();
  console.log('');
  await testSpendAPI();

  console.log('\n✨ Tests completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Set up your RevenueCat webhook URL: https://yourdomain.com/api/webhooks/revenuecat');
  console.log('2. Configure REVENUECAT_WEBHOOK_SECRET in your environment');
  console.log('3. Set up REVENUECAT_API_KEY (secret key, not public key) for server-side calls');
  console.log('4. Test with real purchases in your RevenueCat dashboard');
};

// Run tests if this file is executed directly
runTests();