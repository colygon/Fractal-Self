/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Pricing plans configuration for the camera app
export const pricingPlans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: null,
    features: [
      '10 photos per month (50 cents)',
      'Basic AI styles',
      'Standard quality',
      'Watermarked exports'
    ],
    limits: {
      monthlyCents: 50,
      styles: 'basic',
      quality: 'standard',
      watermark: true
    },
    stripePriceId: null,
    popular: false
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 3.99,
    interval: 'month',
    features: [
      '80 photos per month (400 cents)',
      'All AI styles & locations',
      'Standard quality',
      'Watermarked exports'
    ],
    limits: {
      monthlyCents: 400,
      styles: 'all',
      quality: 'standard',
      watermark: true
    },
    stripePriceId: import.meta.env.VITE_STRIPE_STARTER_MONTHLY_PRICE_ID,
    popular: false
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 39.99,
    interval: 'month',
    features: [
      '800 photos per month (4,000 cents)',
      'All AI styles & locations',
      'High quality exports',
      'No watermarks',
      'GIF creation',
      'Priority processing'
    ],
    limits: {
      monthlyCents: 4000,
      styles: 'all',
      quality: 'high',
      watermark: false
    },
    stripePriceId: import.meta.env.VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    popular: true
  },
  {
    id: 'gold',
    name: 'Gold',
    price: 399.99,
    interval: 'month',
    features: [
      '8,000 photos per month (40,000 cents)',
      'All AI styles & locations',
      'Ultra-high quality exports',
      'No watermarks',
      'GIF creation',
      'Custom AI prompts',
      'Batch processing',
      'API access',
      'Priority support'
    ],
    limits: {
      monthlyCents: 40000,
      styles: 'all',
      quality: 'ultra',
      watermark: false,
      customPrompts: true,
      apiAccess: true
    },
    stripePriceId: import.meta.env.VITE_STRIPE_GOLD_MONTHLY_PRICE_ID,
    popular: false
  }
]

// Get current user's plan limits
export function getPlanLimits(subscription = null) {
  if (!subscription || subscription.status !== 'active') {
    return pricingPlans[0].limits // Free plan
  }
  
  const plan = pricingPlans.find(p => p.stripePriceId === subscription.stripePriceId)
  return plan ? plan.limits : pricingPlans[0].limits
}

// Check if user can take a photo based on their plan
export function canTakePhoto(subscription, monthlyCentsUsed) {
  const limits = getPlanLimits(subscription)
  
  if (limits.monthlyCents === 'unlimited') {
    return true
  }
  
  return monthlyCentsUsed < limits.monthlyCents
}

// Check if user can access a specific style
export function canUseStyle(subscription, styleCategory) {
  const limits = getPlanLimits(subscription)
  
  if (limits.styles === 'all') {
    return true
  }
  
  // Basic styles include: location, artistic (but limited set)
  const basicStyles = ['location', 'artistic']
  return basicStyles.includes(styleCategory)
}

// Get usage stats display
export function getUsageDisplay(subscription, monthlyCentsUsed) {
  const limits = getPlanLimits(subscription)
  
  if (limits.monthlyCents === 'unlimited') {
    return `Unlimited cents`
  }
  
  const remaining = Math.max(0, limits.monthlyCents - monthlyCentsUsed)
  return `${remaining} cents left`
}

// Get remaining cents count
export function getRemainingCents(subscription, monthlyCentsUsed) {
  const limits = getPlanLimits(subscription)
  
  if (limits.monthlyCents === 'unlimited') {
    return 'unlimited'
  }
  
  return Math.max(0, limits.monthlyCents - monthlyCentsUsed)
}