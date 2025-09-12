import { feature, product, featureItem, priceItem } from "atmn";

// Define the credits feature that users consume when taking photos
export const credits = feature({
  id: "credits",
  name: "Photo Credits",
  type: "single_use", // Credits are consumed per use
});

// Free plan - no monthly photos, pay per photo
export const free = product({
  id: "free",
  name: "Free",
  items: [
    featureItem({
      feature_id: credits.id,
      included_usage: 0, // No included photos, pay $0.05 per photo
      interval: "month",
      overage_rate: 5, // 5 cents per photo after plan limit
    }),
  ],
});

// Starter plan - 80 photos ($3.99/month) + $0.05 per additional photo
export const starter = product({
  id: "starter", 
  name: "Starter",
  items: [
    featureItem({
      feature_id: credits.id,
      included_usage: 400, // 80 photos × 5 credits = 400 credits
      interval: "month",
      overage_rate: 5, // 5 cents per photo after plan limit
    }),
    priceItem({
      price_amount: 399, // $3.99
      price_currency: "usd",
      price_recurring_interval: "month",
    }),
  ],
});

// Premium plan - 400 photos ($19.99/month) + $0.05 per additional photo
export const premium = product({
  id: "premium",
  name: "Premium", 
  items: [
    featureItem({
      feature_id: credits.id,
      included_usage: 2000, // 400 photos × 5 credits = 2000 credits
      interval: "month",
      overage_rate: 5, // 5 cents per photo after plan limit
    }),
    priceItem({
      price_amount: 1999, // $19.99
      price_currency: "usd", 
      price_recurring_interval: "month",
    }),
  ],
});

// Gold plan - 1,000 photos ($49.99/month) + $0.05 per additional photo
export const gold = product({
  id: "gold",
  name: "Gold",
  items: [
    featureItem({
      feature_id: credits.id,
      included_usage: 5000, // 1000 photos × 5 credits = 5000 credits
      interval: "month",
      overage_rate: 5, // 5 cents per photo after plan limit
    }),
    priceItem({
      price_amount: 4999, // $49.99
      price_currency: "usd",
      price_recurring_interval: "month", 
    }),
  ],
});

// Diamond plan - 10,000 photos ($499.99/month) + $0.05 per additional photo
export const diamond = product({
  id: "diamond",
  name: "Diamond",
  items: [
    featureItem({
      feature_id: credits.id,
      included_usage: 50000, // 10000 photos × 5 credits = 50000 credits
      interval: "month",
      overage_rate: 5, // 5 cents per photo after plan limit
    }),
    priceItem({
      price_amount: 49999, // $499.99
      price_currency: "usd",
      price_recurring_interval: "month", 
    }),
  ],
});

// Custom Photo Booth plan - 25,000 photos ($699.99/month) + $0.05 per additional photo
export const custom_booth = product({
  id: "custom_booth",
  name: "Custom Photo Booth",
  items: [
    featureItem({
      feature_id: credits.id,
      included_usage: 125000, // 25000 photos × 5 credits = 125000 credits
      interval: "month",
      overage_rate: 5, // 5 cents per photo after plan limit
    }),
    priceItem({
      price_amount: 69999, // $699.99
      price_currency: "usd",
      price_recurring_interval: "month", 
    }),
  ],
});