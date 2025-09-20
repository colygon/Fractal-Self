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

  const addBananas = useCallback((amount) => {
    // Add bananas when user purchases them
    // Note: RevenueCat virtual currency is managed server-side via purchases
    // This is only for local fallback mode
    if (!revenueCatLoaded) {
      updateLocalBananas(prev => prev + amount)
    }
    console.log(`🍌 Added ${amount} bananas (RevenueCat managed: ${revenueCatLoaded})`)
  }, [updateLocalBananas, revenueCatLoaded])

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
      // Fallback to local storage
      updateLocalBananas(prev => Math.max(0, prev - amount))
      console.log(`🍌 Spent ${amount} bananas via local storage`)
      return true
    }
  }, [revenueCatLoaded, spendVirtualCurrency, updateLocalBananas])

  const refundBananas = useCallback((amount = PHOTO_COST) => {
    // Always refund bananas when needed (e.g., on error)
    // Note: RevenueCat doesn't have a built-in refund for virtual currency
    // This is handled via local state for now
    if (!revenueCatLoaded) {
      updateLocalBananas(prev => prev + amount)
    }
    console.log(`🍌 Refunded ${amount} bananas (local only - RevenueCat refunds handled server-side)`)
  }, [revenueCatLoaded, updateLocalBananas])

  const resetBananas = useCallback(() => {
    // Only reset local bananas - RevenueCat virtual currency is managed server-side
    clearBananas(storageKey)
    setLocalBananas(DEFAULT_FREE_BANANAS)
    console.log('🍌 Reset local bananas only - RevenueCat balance unchanged')
  }, [storageKey])

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
    getToken,
    signOut
  }
}

export const SignedIn = ClerkSignedIn
export const SignedOut = ClerkSignedOut
export const SignInButton = ClerkSignInButton
export const SignUpButton = ClerkSignUpButton
export const UserButton = ClerkUserButton
