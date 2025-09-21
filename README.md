<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Iu0sCyYPSYnrvde7Ygi5N3bTcl5tH0hv

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## RevenueCat Virtual Currency Setup

This app uses RevenueCat for virtual currency (bananas) management. Follow these steps to set up billing:

### 1. Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Client-side (Web Billing public key)
VITE_REVENUECAT_API_KEY=rcb_your_web_billing_key_here

# Server-side (Secret key for API calls and webhooks)
REVENUECAT_API_KEY=sk_your_secret_key_here
REVENUECAT_WEBHOOK_SECRET=your_webhook_secret_here
```

### 2. RevenueCat Dashboard Setup

1. **Enable Virtual Currency:**
   - Go to [RevenueCat Dashboard](https://app.revenuecat.com)
   - Navigate to Virtual Currency section
   - Create currency: `bananas` with display name `🍌 Bananas`

2. **Configure Products:**
   - Create products with these IDs and virtual currency rewards:
     - `credits_400`: 400 bananas
     - `credits_1700`: 1,700 bananas
     - `credits_5000`: 5,000 bananas

3. **Set Up Webhooks:**
   - Go to Project Settings → Webhooks
   - Add webhook URL: `https://yourdomain.com/api/webhooks/revenuecat`
   - Select events: `INITIAL_PURCHASE`, `RENEWAL`

### 3. Test the Integration

Run the test script to verify webhook and API endpoints:

```bash
node api/test-revenuecat.js
```

### 4. Deploy

When deploying, make sure to:

1. Set all environment variables in your hosting platform
2. Update webhook URL to your production domain
3. Test purchases with RevenueCat's sandbox mode first
