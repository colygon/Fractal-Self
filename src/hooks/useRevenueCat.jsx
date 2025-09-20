/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from 'react'
import { Purchases } from '@revenuecat/purchases-js'

const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || 'your-public-api-key'
// Note: sk_ keys are secret keys for server-side use. For web SDK, we need rcb_ public keys
// Running in test mode if no key, default key, test key, or secret key (sk_) is provided
const USE_TEST_MODE = !REVENUECAT_API_KEY ||
  REVENUECAT_API_KEY === 'your-public-api-key' ||
  REVENUECAT_API_KEY.includes('test') ||
  REVENUECAT_API_KEY.startsWith('sk_')

export const useRevenueCat = () => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [customerInfo, setCustomerInfo] = useState(null)
  const [offerings, setOfferings] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeRevenueCat = async () => {
      console.log('Initializing RevenueCat with API key:', REVENUECAT_API_KEY ? `${REVENUECAT_API_KEY.substring(0, 8)}...` : 'Missing')
      console.log('Test mode:', USE_TEST_MODE)

      if (REVENUECAT_API_KEY && REVENUECAT_API_KEY.startsWith('sk_')) {
        console.warn('⚠️ RevenueCat: You provided a secret key (sk_) but the web SDK requires a public key (rcb_).')
        console.warn('Please get your public API key from: https://app.revenuecat.com/projects/[YOUR_PROJECT_ID]/api-keys')
        console.warn('Running in TEST MODE with mock data.')
      }

      if (!USE_TEST_MODE) {
        try {
          // Generate or retrieve anonymous user ID for initial configuration
          const anonymousUserId = localStorage.getItem('anonymous_user_id') ||
            `guest_${Math.random().toString(36).substring(2, 11)}`
          localStorage.setItem('anonymous_user_id', anonymousUserId)

          // Initialize RevenueCat with anonymous user ID
          await Purchases.configure({
            apiKey: REVENUECAT_API_KEY,
            appUserId: anonymousUserId
          })
          console.log('RevenueCat configured successfully with user ID:', anonymousUserId)

          // Get current customer info
          const customerInfo = await Purchases.getCustomerInfo()
          console.log('Customer info:', customerInfo)
          setCustomerInfo(customerInfo)

          // Get current offerings
          const offerings = await Purchases.getOfferings()
          console.log('Offerings:', offerings)
          setOfferings(offerings)

          setIsLoaded(true)
          setIsLoading(false)
          console.log('RevenueCat initialization complete')
          return // Exit early if successful
        } catch (error) {
          console.error('Failed to initialize RevenueCat:', error)
          console.log('Falling back to test mode with mock data')
        }
      } else {
        console.warn('RevenueCat running in TEST MODE - using mock data')
      }

      // Fallback to mock data if RevenueCat fails or in test mode
      console.log('Using mock data for RevenueCat')
      setOfferings({
        current: {
          identifier: 'default',
          availablePackages: [
            {
              identifier: 'credits_300',
              product: {
                identifier: 'credits_300',
                title: '300 Credits',
                description: '300 photo transformations - perfect for casual use',
                priceString: '$2.99',
                credits: 300
              }
            },
            {
              identifier: 'credits_3000',
              product: {
                identifier: 'credits_3000',
                title: '3,000 Credits',
                description: '3,000 photo transformations - great value for regular users',
                priceString: '$29.99',
                credits: 3000
              }
            },
            {
              identifier: 'credits_30000',
              product: {
                identifier: 'credits_30000',
                title: '30,000 Credits',
                description: '30,000 photo transformations - perfect for power users',
                priceString: '$299.99',
                credits: 30000
              }
            }
          ]
        }
      })

      // Check for stored mock subscription
      const storedMockSubscription = localStorage.getItem('mock_subscription')
      let activeEntitlements = {}

      if (storedMockSubscription) {
        try {
          const mockEntitlement = JSON.parse(storedMockSubscription)
          // Check if subscription is still valid
          if (new Date(mockEntitlement.expirationDate) > new Date()) {
            activeEntitlements = { premium: mockEntitlement }
            console.log('Restored mock subscription from localStorage')
          } else {
            // Expired - remove from storage
            localStorage.removeItem('mock_subscription')
            console.log('Mock subscription expired, removed from localStorage')
          }
        } catch (e) {
          console.error('Failed to parse mock subscription:', e)
        }
      }

      setCustomerInfo({
        entitlements: {
          active: activeEntitlements
        }
      })
      setIsLoaded(true)
      setIsLoading(false)
    }

    initializeRevenueCat()
  }, [])

  const identifyUser = async (userId) => {
    try {
      console.log('Setting user ID with RevenueCat:', userId)

      if (USE_TEST_MODE) {
        console.log('TEST MODE: Simulating user identification')
        return customerInfo
      }

      if (!isLoaded || !Purchases.logIn) {
        console.warn('RevenueCat not properly initialized, cannot identify user')
        return customerInfo
      }

      // For web SDK, we use logIn instead of identifyUser
      const { customerInfo: updatedCustomerInfo } = await Purchases.logIn(userId)
      setCustomerInfo(updatedCustomerInfo)
      return updatedCustomerInfo
    } catch (error) {
      console.error('Failed to set user ID:', error)
      // If login fails, try to continue anonymously
      return customerInfo
    }
  }

  const logOut = async () => {
    try {
      console.log('Logging out of RevenueCat')

      if (USE_TEST_MODE) {
        localStorage.removeItem('mock_subscription')
        setCustomerInfo({
          entitlements: {
            active: {}
          }
        })
        return
      }

      if (!isLoaded || !Purchases.logOut) {
        console.warn('RevenueCat not properly initialized, cannot log out')
        return customerInfo
      }

      await Purchases.logOut()
      const updatedCustomerInfo = await Purchases.getCustomerInfo()
      setCustomerInfo(updatedCustomerInfo)
      return updatedCustomerInfo
    } catch (error) {
      console.error('Failed to log out from RevenueCat:', error)
      return customerInfo
    }
  }

  const purchasePackage = async (packageToPurchase) => {
    try {
      console.log('Purchasing package:', packageToPurchase)

      if (!isLoaded) {
        throw new Error('RevenueCat not initialized')
      }

      if (USE_TEST_MODE) {
        // Simulate credit purchase in test mode
        console.log('TEST MODE: Simulating successful credit purchase')

        // Get the number of credits from the package
        const creditsToAdd = packageToPurchase.product.credits || 0
        console.log(`Adding ${creditsToAdd} credits to user account`)

        // Trigger a custom event to notify the credit system
        // We'll dispatch this event and let the useAuth hook handle it
        window.dispatchEvent(new CustomEvent('creditsPurchased', {
          detail: { credits: creditsToAdd, packageId: packageToPurchase.product.identifier }
        }))

        // For mock purposes, keep the customer info simple
        setCustomerInfo({
          entitlements: {
            active: {}
          }
        })

        return { success: true, creditsAdded: creditsToAdd }
      }

      // For production, use RevenueCat Web Purchase Links
      // Get the current user ID for the purchase link
      const userId = customerInfo?.originalAppUserId ||
        (typeof window !== 'undefined' && localStorage.getItem('anonymous_user_id')) ||
        `guest_${Math.random().toString(36).substring(2, 11)}`

      // RevenueCat Web Purchase Link template
      const webPurchaseUrl = `https://pay.rev.cat/agvuhpvjihtinpwc/${encodeURIComponent(userId)}`

      console.log('Redirecting to RevenueCat web purchase:', webPurchaseUrl)

      // Open RevenueCat purchase page in new window
      window.open(webPurchaseUrl, '_blank', 'width=600,height=800,scrollbars=yes,resizable=yes')

      // Note: The actual purchase will be handled by RevenueCat's web interface
      // The customer info will be updated when they return to the app or refresh
      return customerInfo
    } catch (error) {
      console.error('Purchase failed:', error)

      // Show a more user-friendly error message
      if (error.code === 'user_cancelled') {
        throw new Error('Purchase was cancelled')
      } else if (error.code === 'payment_pending') {
        throw new Error('Payment is pending. Please wait for confirmation.')
      } else {
        throw new Error('Purchase failed. Please try again.')
      }
    }
  }

  const restorePurchases = async () => {
    try {
      console.log('Restoring purchases with RevenueCat')

      if (USE_TEST_MODE) {
        console.log('TEST MODE: Cannot restore purchases in test mode')
        return customerInfo
      }

      if (!isLoaded || !Purchases.restorePurchases) {
        console.warn('RevenueCat not properly initialized, cannot restore purchases')
        return customerInfo
      }

      // For web SDK, restorePurchases returns an object with customerInfo
      const { customerInfo: restoredCustomerInfo } = await Purchases.restorePurchases()
      setCustomerInfo(restoredCustomerInfo)
      return restoredCustomerInfo
    } catch (error) {
      console.error('Failed to restore purchases:', error)
      return customerInfo
    }
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
    hasActiveSubscription,
    logOut
  }
}
