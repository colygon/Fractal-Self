import crypto from 'crypto';

const REVENUECAT_API_KEY = process.env.REVENUECAT_API_KEY;

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
  const result = await response.json();

  if (!response.ok) {
    throw new Error(`RevenueCat API error: ${response.status} ${result.message || 'Unknown error'}`);
  }

  return result;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

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
}