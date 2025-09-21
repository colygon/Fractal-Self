/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  useAuth as useClerkAuth,
  useUser as useClerkUser,
  SignedIn as ClerkSignedIn,
  SignedOut as ClerkSignedOut,
  SignInButton as ClerkSignInButton,
  SignUpButton as ClerkSignUpButton,
  UserButton as ClerkUserButton
} from '@clerk/clerk-react'
import { useRevenueCat } from './useRevenueCat.jsx'
import { CONFIG } from '../lib/constants.js'

const { DEFAULT_FREE_BANANAS = 50, DEFAULT_LOGGED_IN_BANANAS = 5000, PHOTO_COST = 5 } = CONFIG
const GUEST_STORAGE_KEY = 'guestBananas'

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage

const parseBananas = (value, isLoggedIn = false) => {
  const parsed = parseInt(value, 10)
  const defaultBananas = isLoggedIn ? DEFAULT_LOGGED_IN_BANANAS : DEFAULT_FREE_BANANAS
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : defaultBananas
}

const readBananas = (key, isLoggedIn = false) => {
  const defaultBananas = isLoggedIn ? DEFAULT_LOGGED_IN_BANANAS : DEFAULT_FREE_BANANAS
  if (!canUseStorage()) return defaultBananas
  const stored = window.localStorage.getItem(key)
  // If no stored value and user is logged in, give them the logged-in default
  if (!stored && isLoggedIn) {
    return DEFAULT_LOGGED_IN_BANANAS
  }
  return parseBananas(stored, isLoggedIn)
}

const writeBananas = (key, value) => {
  if (!canUseStorage()) return
  window.localStorage.setItem(key, value.toString())
}

const clearBananas = (key) => {
  if (!canUseStorage()) return
  window.localStorage.removeItem(key)
}

export const useAuth = () => {
  const {
    hasActiveSubscription,
    identifyUser,
    logOut,
    spendVirtualCurrency,
    getVirtualCurrencyBalance,
    virtualCurrencyBalance,
    refreshCustomerInfo,
    isLoaded: revenueCatLoaded
  } = useRevenueCat()
  const { isSignedIn, isLoaded: isUserLoaded, user } = useClerkUser()
  const { isLoaded: isAuthLoaded, getToken, signOut } = useClerkAuth()

  const storageKey = useMemo(() => {
    if (isSignedIn && user?.id) {
      return `bananas_${user.id}`
    }
    return GUEST_STORAGE_KEY
  }, [isSignedIn, user?.id])

  // Use RevenueCat virtual currency balance instead of local storage
  const [localBananas, setLocalBananas] = useState(() => readBananas(storageKey, isSignedIn))

  // Prefer RevenueCat virtual currency when available, fallback to local storage
  const bananas = revenueCatLoaded ? virtualCurrencyBalance : localBananas

  // Sync local storage with RevenueCat balance when available
  useEffect(() => {
    if (revenueCatLoaded && virtualCurrencyBalance !== undefined) {
      // Keep local storage in sync with RevenueCat for offline scenarios
      writeBananas(storageKey, virtualCurrencyBalance)
      setLocalBananas(virtualCurrencyBalance)
      console.log(`🔄 Synced local storage with RevenueCat balance: ${virtualCurrencyBalance}`)
    }
  }, [revenueCatLoaded, virtualCurrencyBalance, storageKey])

  // Keep local state in sync when the active user changes (fallback only)
  useEffect(() => {
    if (!revenueCatLoaded) {
      setLocalBananas(readBananas(storageKey, isSignedIn))
    }
  }, [storageKey, isSignedIn, revenueCatLoaded])

  // Coordinate RevenueCat identity with Clerk user state
  useEffect(() => {
    if (isSignedIn && user?.id) {
      identifyUser?.(user.id)
    } else {
      logOut?.()
    }
  }, [identifyUser, logOut, isSignedIn, user?.id])

  const updateLocalBananas = useCallback((updater) => {
    setLocalBananas(prev => {
      const next = updater(prev)
      writeBananas(storageKey, next)
      return next
    })
  }, [storageKey])

  const addBananas = useCallback(async (amount) => {
    // Add bananas when user purchases them
    if (revenueCatLoaded && refreshCustomerInfo) {
      // For RevenueCat: refresh balance to get updated virtual currency
      console.log(`🍌 Refreshing RevenueCat balance after adding ${amount} bananas`)
      await refreshCustomerInfo()
    } else {
      // Fallback: add to local storage
      updateLocalBananas(prev => prev + amount)
      console.log(`🍌 Added ${amount} bananas to local storage`)
    }
  }, [updateLocalBananas, revenueCatLoaded, refreshCustomerInfo])

  // Listen for banana purchases
  useEffect(() => {
    const handleBananasPurchased = (event) => {
      const { credits } = event.detail
      console.log(`🍌 Bananas purchased: ${credits}`)
      addBananas(credits)
    }

    window.addEventListener('creditsPurchased', handleBananasPurchased)
    return () => window.removeEventListener('creditsPurchased', handleBananasPurchased)
  }, [addBananas])

  // Periodically refresh RevenueCat balance to stay in sync
  useEffect(() => {
    if (!revenueCatLoaded || !refreshCustomerInfo) return

    // Refresh balance every 30 seconds to catch webhook updates
    const interval = setInterval(async () => {
      try {
        await refreshCustomerInfo()
        console.log('🔄 Periodic RevenueCat balance refresh completed')
      } catch (error) {
        console.warn('Failed to refresh RevenueCat balance:', error)
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [revenueCatLoaded, refreshCustomerInfo])

  const subscriptionActive = hasActiveSubscription()

  const deductBananas = useCallback(async (amount = PHOTO_COST) => {
    // Always deduct bananas for all users - no unlimited usage
    if (revenueCatLoaded && spendVirtualCurrency) {
      // Use RevenueCat virtual currency
      const result = await spendVirtualCurrency(amount, 'bananas')
      if (!result.success) {
        console.error('Failed to spend bananas:', result.error)
        return false
      }
      console.log(`🍌 Spent ${amount} bananas via RevenueCat. New balance: ${result.newBalance}`)
      return true
    } else {
      // No fallback - RevenueCat must be working
      console.error('Cannot spend bananas: RevenueCat not available')
      return false
    }
  }, [revenueCatLoaded, spendVirtualCurrency])

  const refundBananas = useCallback(async (amount = PHOTO_COST) => {
    // Refund bananas when needed (e.g., on photo generation error)
    if (revenueCatLoaded) {
      // For RevenueCat: call server-side refund API
      try {
        const response = await fetch('/api/refund-bananas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            app_user_id: user?.id || localStorage.getItem('anonymous_user_id'),
            amount,
            reason: 'Photo generation failed'
          })
        })

        if (response.ok) {
          await refreshCustomerInfo() // Refresh to get updated balance
          console.log(`🍌 Refunded ${amount} bananas via RevenueCat`)
        } else {
          console.error('Failed to refund bananas via RevenueCat')
          // Fallback to local refund
          updateLocalBananas(prev => prev + amount)
        }
      } catch (error) {
        console.error('Refund API error:', error)
        // Fallback to local refund
        updateLocalBananas(prev => prev + amount)
      }
    } else {
      // Fallback: refund to local storage
      updateLocalBananas(prev => prev + amount)
      console.log(`🍌 Refunded ${amount} bananas to local storage`)
    }
  }, [revenueCatLoaded, updateLocalBananas, refreshCustomerInfo, user?.id])

  const resetBananas = useCallback(() => {
    // Only reset local bananas - RevenueCat virtual currency is managed server-side
    clearBananas(storageKey)
    setLocalBananas(DEFAULT_FREE_BANANAS)
    console.log('🍌 Reset local bananas only - RevenueCat balance unchanged')
  }, [storageKey])

  const refreshBalance = useCallback(async () => {
    // Manual balance refresh function
    if (revenueCatLoaded && refreshCustomerInfo) {
      try {
        await refreshCustomerInfo()
        console.log('🔄 Manual balance refresh completed')
        return true
      } catch (error) {
        console.error('Failed to refresh balance:', error)
        return false
      }
    }
    return false
  }, [revenueCatLoaded, refreshCustomerInfo])

  return {
    user: user ? {
      id: user.id,
      primaryEmailAddress: user.primaryEmailAddress?.emailAddress || null,
      fullName: user.fullName,
      imageUrl: user.imageUrl
    } : null,
    isLoading: !isUserLoaded || !isAuthLoaded,
    isSignedIn: Boolean(isSignedIn),
    bananas,
    hasActiveSubscription: subscriptionActive,
    deductBananas,
    refundBananas,
    addBananas,
    resetBananas,
    refreshBalance,
    revenueCatLoaded, // Expose RevenueCat status
    getToken,
    signOut
  }
}

export const SignedIn = ClerkSignedIn
export const SignedOut = ClerkSignedOut
export const SignInButton = ClerkSignInButton
export const SignUpButton = ClerkSignUpButton
export const UserButton = ClerkUserButton
