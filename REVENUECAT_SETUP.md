# RevenueCat Web Billing Setup Guide

## Current Status
- ✅ **App is functional** with mock credit system
- ❌ **RevenueCat integration** needs proper Web Billing setup
- ✅ **Code is ready** for real billing when configured

## Issue Diagnosis
The current API keys appear to be for mobile apps (iOS/Android) rather than Web Billing. You need to create a **Web Billing app** in your RevenueCat project.

## Step-by-Step Setup

### 1. Create Web Billing App
1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Select your project
3. Go to **Apps** → **Add New App**
4. Select **Web Billing** as the platform
5. Name it something like "Fractal Self Web"

### 2. Configure Products
Create these products for your credit packages:

| Product ID | Display Name | Type | Price | Credits |
|------------|--------------|------|-------|---------|
| `credits_300` | 300 Credits | One-time | $2.99 | 300 |
| `credits_3000` | 3,000 Credits | One-time | $29.99 | 3,000 |
| `credits_30000` | 30,000 Credits | One-time | $299.99 | 30,000 |

### 3. Create Offering
1. Go to **Offerings** → **Create New Offering**
2. Name: "Credit Packages"
3. Identifier: `default`
4. Add all three credit products as packages

### 4. Get Web Billing API Key
1. Go to **Settings** → **API Keys**
2. Find your **Web Billing app**
3. Copy the **Public API Key** (starts with `rcb_`)
4. This is different from mobile app keys!

### 5. Update Environment
Replace your current key with the Web Billing public key:

```bash
# In .env.local
VITE_REVENUECAT_API_KEY=rcb_your_web_billing_key_here
```

### 6. Deploy
```bash
# Update production environment
vercel env add VITE_REVENUECAT_API_KEY rcb_your_web_billing_key_here production

# Deploy
git push
```

## Testing
1. Open the app and click on credits to open billing modal
2. Select a credit package
3. In test mode: Credits should be added immediately
4. With real RevenueCat: Will open payment flow

## Troubleshooting

### "Invalid API key" Error
- Ensure you're using the **Web Billing** public key, not mobile app key
- Key should start with `rcb_`
- Verify Web Billing is enabled for your project

### "No offerings found" Error
- Check that products are created and published
- Verify offering is set as current/default
- Ensure packages are properly attached to offering

### Payment Issues
- Verify Stripe is connected for Web Billing
- Check product pricing is set correctly
- Test with RevenueCat's test credit cards

## Mock Mode
The app currently works perfectly in mock mode:
- All credit purchase flows work
- Credits are added/deducted properly
- UI shows correct pricing ($2.99, $29.99, $299.99)
- No real payments processed

This lets you test the full user experience while setting up real billing.