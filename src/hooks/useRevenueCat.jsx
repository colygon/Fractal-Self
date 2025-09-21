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
  const [virtualCurrencyBalance, setVirtualCurrencyBalance] = useState(50) // Default to 50 credits for new users
  const [revenueCatConfigured, setRevenueCatConfigured] = useState(false)
  const [revenueCatError, setRevenueCatError] = useState(null)

  useEffect(() => {
    const initializeRevenueCat = async () => {
      console.log('Initializing RevenueCat with API key:', REVENUECAT_API_KEY ? `${REVENUECAT_API_KEY.substring(0, 8)}...` : 'Missing')

      // Always try to initialize RevenueCat, but don't fail the whole app if it doesn't work
      let revenueCatInitialized = false

      if (!USE_TEST_MODE && REVENUECAT_API_KEY) {
        try {
          // Generate anonymous user ID
          const anonymousUserId = localStorage.getItem('anonymous_user_id') ||
            `guest_${Math.random().toString(36).substring(2, 11)}`
          localStorage.setItem('anonymous_user_id', anonymousUserId)

          console.log('Configuring RevenueCat with user ID:', anonymousUserId)

          // Configure RevenueCat
          await Purchases.configure({
            apiKey: REVENUECAT_API_KEY,
            appUserId: anonymousUserId
          })

          console.log('RevenueCat configured successfully')
          revenueCatInitialized = true
          setRevenueCatConfigured(true)

          // Get customer info
          const customerInfo = await Purchases.getSharedInstance().getCustomerInfo()
          console.log('Customer info:', customerInfo)
          setCustomerInfo(customerInfo)

          // Get offerings
          const offerings = await Purchases.getSharedInstance().getOfferings()
          console.log('Offerings:', offerings)
          setOfferings(offerings)

          setIsLoaded(true)
          setIsLoading(false)

        } catch (error) {
          console.error('Failed to initialize RevenueCat:', error)
          console.log('Continuing with server-side balance fetching only')
          revenueCatInitialized = false
          setRevenueCatError(error.message || 'Failed to initialize RevenueCat')
        }
      }

      // Try to fetch balance from server API on production only
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

      if (!isLocalhost) {
        try {
          const anonymousUserId = localStorage.getItem('anonymous_user_id') ||
            `guest_${Math.random().toString(36).substring(2, 11)}`
          localStorage.setItem('anonymous_user_id', anonymousUserId)

          console.log('Fetching virtual currency from server API for user:', anonymousUserId)
          const response = await fetch('/api/get-balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ app_user_id: anonymousUserId })
          })

          if (response.ok) {
            const data = await response.json()
            console.log('Server API returned balance:', data.balance)
            setVirtualCurrencyBalance(data.balance || 0)
          } else {
            const errorData = await response.json().catch(() => ({}))
            console.warn('Failed to fetch balance from server API:', response.status, errorData)
            // Use default balance on error
            setVirtualCurrencyBalance(50)
          }
        } catch (error) {
          console.warn('Error fetching balance from server:', error)
          // Use default balance on error
          setVirtualCurrencyBalance(50)
        }
      } else {
        console.log('Running on localhost, using default balance of 50')
        setVirtualCurrencyBalance(50)
      }

      // Set up mock data if RevenueCat failed
      if (!revenueCatInitialized) {
        setOfferings({
          current: {
            identifier: 'default',
            availablePackages: [
              {
                identifier: 'credits_400',
                product: {
                  identifier: 'credits_400',
                  title: 'Premium',
                  description: '80 photo transformations per month - perfect for casual use',
                  priceString: '$3.99',
                  credits: 400
                }
              },
              {
                identifier: 'credits_1700',
                product: {
                  identifier: 'credits_1700',
                  title: 'Gold',
                  description: '340 photo transformations per month - great value for regular users',
                  priceString: '$16.99',
                  credits: 1700
                }
              },
              {
                identifier: 'credits_5000',
                product: {
                  identifier: 'credits_5000',
                  title: 'Professional',
                  description: '1,000 photo transformations per month - perfect for power users',
                  priceString: '$49.99',
                  credits: 5000
                }
              }
            ]
          }
        })
        setCustomerInfo({
          entitlements: { active: {} },
          virtualCurrencyBalance: { bananas: 50 }
        })
        setIsLoaded(true)
        setIsLoading(false)
      }
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

      // Wait for RevenueCat to be loaded
      if (!isLoaded) {
        console.log('RevenueCat not yet loaded, waiting...')
        // Wait up to 5 seconds for initialization
        let attempts = 0
        while (!isLoaded && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100))
          attempts++
        }

        if (!isLoaded) {
          console.warn('RevenueCat failed to initialize, cannot identify user')
          return customerInfo
        }
      }

      // Check if Purchases is properly configured before trying to use it
      try {
        if (!revenueCatConfigured) {
          console.warn('RevenueCat not properly configured, cannot identify user')
          return customerInfo
        }

        const instance = Purchases.getSharedInstance()
        if (!instance || !instance.logIn) {
          console.warn('RevenueCat instance not available or missing logIn method')
          return customerInfo
        }

        // For web SDK, we use logIn instead of identifyUser
        const { customerInfo: updatedCustomerInfo } = await instance.logIn(userId)
        setCustomerInfo(updatedCustomerInfo)
        return updatedCustomerInfo
      } catch (instanceError) {
        console.warn('RevenueCat not properly configured, cannot identify user:', instanceError.message)
        return customerInfo
      }
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

      if (!isLoaded) {
        console.warn('RevenueCat not yet initialized, cannot log out')
        return customerInfo
      }

      // Check if Purchases is properly configured before trying to use it
      try {
        if (!revenueCatConfigured) {
          console.warn('RevenueCat not properly configured, cannot log out')
          return customerInfo
        }

        const instance = Purchases.getSharedInstance()
        if (!instance || !instance.logOut) {
          console.warn('RevenueCat instance not available or missing logOut method')
          return customerInfo
        }

        await instance.logOut()
        const updatedCustomerInfo = await instance.getCustomerInfo()
        setCustomerInfo(updatedCustomerInfo)
        return updatedCustomerInfo
      } catch (instanceError) {
        console.warn('RevenueCat not properly configured, cannot log out:', instanceError.message)
        return customerInfo
      }
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

      // Map package identifiers to their specific RevenueCat Web Purchase Links
      const purchaseLinks = {
        'credits_400': 'https://pay.rev.cat/agvuhpvjihtinpwc/',
        'credits_1700': 'https://pay.rev.cat/ttowpyvmudproaof/',
        'credits_5000': 'https://pay.rev.cat/ygwurdgtsjjcsinc/'
      }

      const directPurchaseUrl = purchaseLinks[packageToPurchase.product.identifier]

      if (USE_TEST_MODE && !directPurchaseUrl) {
        // Simulate credit purchase in test mode only if no direct links available
        console.log('TEST MODE: Simulating successful credit purchase')

        // Get the number of bananas from the package
        const creditsToAdd = packageToPurchase.product.credits || 0
        console.log(`Adding ${creditsToAdd} 🍌 bananas to user account`)

        // In test mode, directly update the balance
        setVirtualCurrencyBalance(prev => prev + creditsToAdd)

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

      if (directPurchaseUrl) {
        // Use direct RevenueCat Web Purchase Link
        const userId = customerInfo?.originalAppUserId ||
          (typeof window !== 'undefined' && localStorage.getItem('anonymous_user_id')) ||
          `guest_${Math.random().toString(36).substring(2, 11)}`

        const webPurchaseUrl = `${directPurchaseUrl}${encodeURIComponent(userId)}`
        console.log('Opening RevenueCat web purchase:', webPurchaseUrl)

        // Open RevenueCat purchase page in new window
        window.open(webPurchaseUrl, '_blank', 'width=600,height=800,scrollbars=yes,resizable=yes')

        // Note: Virtual currency will be automatically credited via webhook
        // No need to add bananas immediately - webhook handles this
        console.log(`Purchase initiated for ${packageToPurchase.product.identifier} - webhook will credit bananas`)

        return { success: true, method: 'direct_link', creditsAdded: 0 }
      }

      // Fallback: No direct purchase links available
      throw new Error(`No purchase method available for package: ${packageToPurchase.product.identifier}`)

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

      if (!revenueCatConfigured || !Purchases.getSharedInstance().restorePurchases) {
        console.warn('RevenueCat not properly initialized, cannot restore purchases')
        return customerInfo
      }

      // For web SDK, restorePurchases returns an object with customerInfo
      const { customerInfo: restoredCustomerInfo } = await Purchases.getSharedInstance().restorePurchases()
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

  const spendVirtualCurrency = async (amount, currencyType = 'bananas') => {
    try {
      // Use local mode temporarily to avoid server errors
      console.log(`🍌 Using local mode to spend ${amount} ${currencyType}`)

      // Check local balance
      if (virtualCurrencyBalance < amount) {
        return { success: false, error: 'Insufficient virtual currency balance', code: 'INSUFFICIENT_BALANCE' }
      }

      // Update local balance directly
      const newBalance = Math.max(0, virtualCurrencyBalance - amount)
      setVirtualCurrencyBalance(newBalance)

      // Update local storage for guests
      const userId = customerInfo?.originalAppUserId ||
        (typeof window !== 'undefined' && localStorage.getItem('anonymous_user_id')) ||
        `guest_${Math.random().toString(36).substring(2, 11)}`

      if (userId.startsWith('guest_')) {
        const authData = JSON.parse(localStorage.getItem('banana-cam-auth') || '{}')
        authData.bananas = newBalance
        localStorage.setItem('banana-cam-auth', JSON.stringify(authData))
      }

      console.log(`🍌 Successfully spent ${amount} ${currencyType} in local mode. New balance: ${newBalance}`)

      return { success: true, newBalance }
    } catch (error) {
      console.error('Failed to spend virtual currency:', error)
      return { success: false, error: error.message }
    }
  }

  const getVirtualCurrencyBalance = () => {
    return virtualCurrencyBalance
  }

  const getCachedVirtualCurrencies = () => {
    try {
      if (USE_TEST_MODE) {
        return { all: { bananas: { balance: virtualCurrencyBalance, code: 'bananas', name: 'Bananas' } } }
      }

      if (!revenueCatConfigured || !Purchases.getSharedInstance().cachedVirtualCurrencies) {
        return null
      }

      return Purchases.getSharedInstance().cachedVirtualCurrencies
    } catch (error) {
      console.warn('Failed to get cached virtual currencies:', error)
      return null
    }
  }

  const refreshCustomerInfo = async () => {
    try {
      console.log('🔄 Refreshing customer info and virtual currencies...')

      // Always try to refresh from server API first
      const userId = localStorage.getItem('anonymous_user_id')
      if (userId) {
        try {
          console.log('📞 Refreshing balance from server API for user:', userId)
          const response = await fetch('/api/get-balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ app_user_id: userId })
          })

          if (response.ok) {
            const data = await response.json()
            console.log('🔄 Server API refreshed balance:', data.balance)
            setVirtualCurrencyBalance(data.balance || 0)
          } else {
            console.warn('Failed to refresh balance from server API:', response.status)
            // Don't update balance on error
          }
        } catch (error) {
          console.warn('Error refreshing balance from server:', error)
        }
      }

      // Try RevenueCat refresh if available
      if (revenueCatConfigured) {
        try {
          // Refresh customer info
          const refreshedCustomerInfo = await Purchases.getSharedInstance().getCustomerInfo()
          setCustomerInfo(refreshedCustomerInfo)

          // Try to get virtual currency from customer info
          let foundBalance = false
          if (refreshedCustomerInfo?.virtualCurrencies?.bananas?.balance !== undefined) {
            const balance = refreshedCustomerInfo.virtualCurrencies.bananas.balance
            console.log('🔄 Found refreshed balance in virtualCurrencies:', balance)
            setVirtualCurrencyBalance(balance)
            foundBalance = true
          } else if (refreshedCustomerInfo?.virtualCurrencyBalance?.bananas !== undefined) {
            const balance = refreshedCustomerInfo.virtualCurrencyBalance.bananas
            console.log('🔄 Found refreshed balance in virtualCurrencyBalance:', balance)
            setVirtualCurrencyBalance(balance)
            foundBalance = true
          }

          // Invalidate and refresh virtual currencies cache
          if (Purchases.getSharedInstance().invalidateVirtualCurrenciesCache) {
            Purchases.getSharedInstance().invalidateVirtualCurrenciesCache()
          }

          try {
            let virtualCurrencies = null;
            const instance = Purchases.getSharedInstance()
            if (typeof instance.getVirtualCurrencies === 'function') {
              virtualCurrencies = await instance.getVirtualCurrencies()
            } else if (typeof instance.virtualCurrencies === 'function') {
              virtualCurrencies = await instance.virtualCurrencies()
            }

            if (virtualCurrencies) {
              const bananaBalance = virtualCurrencies.all?.bananas?.balance || 0
              setVirtualCurrencyBalance(bananaBalance)
              console.log('🍌 Updated banana balance from virtual currencies:', bananaBalance)
            }
          } catch (vcError) {
            console.warn('Failed to refresh virtual currencies:', vcError)
          }

          return refreshedCustomerInfo
        } catch (error) {
          console.warn('Failed to refresh RevenueCat customer info:', error)
          return customerInfo
        }
      }

      return customerInfo
    } catch (error) {
      console.error('Failed to refresh customer info:', error)
      return customerInfo
    }
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
    logOut,
    spendVirtualCurrency,
    getVirtualCurrencyBalance,
    getCachedVirtualCurrencies,
    virtualCurrencyBalance,
    refreshCustomerInfo,
    revenueCatConfigured,
    revenueCatError
  }
}
