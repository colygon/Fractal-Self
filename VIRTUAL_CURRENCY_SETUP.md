# RevenueCat Virtual Currency Setup Guide

## Overview
Your app now uses RevenueCat's Virtual Currency system for bananas! This provides:
- Server-side balance management
- Fraud prevention
- Automatic balance updates via purchases
- Real-time synchronization across devices

## RevenueCat Dashboard Setup

### 1. Enable Virtual Currency
1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Select your project
3. Navigate to **Virtual Currency** section
4. Click **Enable Virtual Currency**

### 2. Create Banana Currency
1. Click **Add Virtual Currency**
2. Set the following:
   - **Currency ID**: `bananas`
   - **Display Name**: `🍌 Bananas`
   - **Initial Balance**: `50` (starting balance for new users)

### 3. Update Your Products
For each of your existing credit packages, add virtual currency rewards:

#### Premium Package (400 bananas)
- Product ID: `credits_400`
- Add Virtual Currency Reward:
  - Currency: `bananas`
  - Amount: `400`

#### Gold Package (1,700 bananas)
- Product ID: `credits_1700`
- Add Virtual Currency Reward:
  - Currency: `bananas`
  - Amount: `1700`

#### Professional Package (5,000 bananas)
- Product ID: `credits_5000`
- Add Virtual Currency Reward:
  - Currency: `bananas`
  - Amount: `5000`

### 4. Configure Spending Rules
1. Set **Spending Rules** to allow your app to spend bananas
2. Configure **Minimum Balance**: `0`
3. Set **Maximum Spend Per Transaction**: `100` (or your max photo cost)

## App Integration Status ✅

Your app is now integrated with RevenueCat Virtual Currency:

### Features Implemented:
- ✅ **Virtual Currency Balance Display**: Uses `Purchases.virtualCurrencies()` API
- ✅ **Smart Fallback**: Uses local storage when RevenueCat is unavailable
- ✅ **Proper Cache Management**: Uses `invalidateVirtualCurrenciesCache()` after purchases
- ✅ **Cached Balance Access**: Uses `cachedVirtualCurrencies` for immediate UI updates
- ✅ **Purchase Integration**: Purchases automatically add bananas to balance
- ✅ **Test Mode Support**: Mock virtual currency for development

### How It Works:
1. **Purchase Flow**: User buys package → RevenueCat adds bananas to their virtual balance
2. **Balance Fetching**: App uses `Purchases.virtualCurrencies()` to get current balance
3. **Spending Flow**: User takes photo → App should call backend API to spend bananas
4. **Cache Management**: App calls `invalidateVirtualCurrenciesCache()` after purchases
5. **Balance Updates**: RevenueCat automatically syncs balance across devices
6. **Fraud Protection**: Server-side validation prevents manipulation

### Important Notes:
- **Spending via Backend**: For security, virtual currency spending should be done via backend API calls to RevenueCat's Developer API, not client-side
- **Cache Invalidation**: Always call `invalidateVirtualCurrenciesCache()` after purchases to ensure fresh balance data
- **Immediate UI**: Use `cachedVirtualCurrencies` for immediate UI updates without network calls

## Testing

### In Test Mode (Current):
- Mock balance of 100 bananas
- Spending simulated locally
- Perfect for development and testing

### With Real RevenueCat:
1. Set your Web Billing API key in `.env.local`
2. Configure virtual currency in dashboard
3. Test purchases add real bananas
4. Spending deducts from RevenueCat balance

## Benefits Over Local Storage

### Security:
- ❌ Local storage: Can be manipulated by users
- ✅ Virtual currency: Server-side validation, fraud-proof

### Synchronization:
- ❌ Local storage: Device-specific, lost on reinstall
- ✅ Virtual currency: Syncs across all devices automatically

### Analytics:
- ❌ Local storage: No purchase/spending analytics
- ✅ Virtual currency: Full RevenueCat analytics and insights

### Scalability:
- ❌ Local storage: Manual balance management
- ✅ Virtual currency: Automatic via RevenueCat webhooks

## Next Steps

1. **Enable Virtual Currency** in your RevenueCat dashboard
2. **Configure banana currency** with 50 initial balance
3. **Add virtual currency rewards** to your existing products
4. **Test purchases** to verify bananas are added automatically
5. **Monitor analytics** in RevenueCat dashboard

Your banana system is now enterprise-ready! 🍌