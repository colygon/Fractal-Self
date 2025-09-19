/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from 'react'

const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || 'your-public-api-key'

export const useRevenueCat = () => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [customerInfo, setCustomerInfo] = useState(null)
  const [offerings, setOfferings] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate RevenueCat initialization
    const timer = setTimeout(() => {
      console.log('RevenueCat API Key configured:', REVENUECAT_API_KEY ? 'Yes' : 'No')
      
      // Mock offerings structure
      setOfferings({
        current: {
          identifier: 'default',
          availablePackages: [
            {
              identifier: 'monthly_premium',
              product: {
                identifier: 'premium_monthly',
                title: 'Premium Monthly',
                description: 'Unlimited photos and premium features',
                priceString: '$9.99',
                subscriptionPeriod: 'month'
              }
            },
            {
              identifier: 'annual_premium',
              product: {
                identifier: 'premium_annual',
                title: 'Premium Annual',
                description: 'Unlimited photos and premium features - save 50%!',
                priceString: '$59.99',
                subscriptionPeriod: 'year'
              }
            }
          ]
        }
      })

      // Mock customer info
      setCustomerInfo({
        entitlements: {
          active: {} // No active subscriptions by default
        }
      })

      setIsLoaded(true)
      setIsLoading(false)
      console.log('RevenueCat mock integration ready')
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const identifyUser = async (userId) => {
    console.log('Would identify user with RevenueCat:', userId)
    return customerInfo
  }

  const purchasePackage = async (packageToPurchase) => {
    console.log('Would purchase package:', packageToPurchase)
    alert(`Mock purchase: ${packageToPurchase.product.title}\n\nIn production, this would redirect to RevenueCat's billing flow.`)
    
    // Mock successful purchase
    const updatedCustomerInfo = {
      entitlements: {
        active: {
          premium: {
            isActive: true,
            productIdentifier: packageToPurchase.product.identifier,
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      }
    }
    setCustomerInfo(updatedCustomerInfo)
    return updatedCustomerInfo
  }

  const restorePurchases = async () => {
    console.log('Would restore purchases with RevenueCat')
    return customerInfo
  }

  const getActiveSubscriptions = () => {
    if (!customerInfo) return []
    
    return Object.keys(customerInfo.entitlements.active).map(entitlementId => ({
      entitlementId,
      productId: customerInfo.entitlements.active[entitlementId].productIdentifier,
      expirationDate: customerInfo.entitlements.active[entitlementId].expirationDate,
      isActive: customerInfo.entitlements.active[entitlementId].isActive
    }))
  }

  const hasActiveSubscription = (entitlementId = null) => {
    if (!customerInfo) return false
    
    if (entitlementId) {
      return customerInfo.entitlements.active[entitlementId]?.isActive || false
    }
    
    return Object.keys(customerInfo.entitlements.active).length > 0
  }

  return {
    isLoaded,
    isLoading,
    customerInfo,
    offerings,
    identifyUser,
    purchasePackage,
    restorePurchases,
    getActiveSubscriptions,
    hasActiveSubscription
  }
}