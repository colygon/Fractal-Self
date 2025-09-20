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

const { DEFAULT_FREE_CREDITS = 50, DEFAULT_LOGGED_IN_CREDITS = 5000, PHOTO_COST = 5 } = CONFIG
const GUEST_STORAGE_KEY = 'guestCredits'

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage

const parseCredits = (value, isLoggedIn = false) => {
  const parsed = parseInt(value, 10)
  const defaultCredits = isLoggedIn ? DEFAULT_LOGGED_IN_CREDITS : DEFAULT_FREE_CREDITS
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : defaultCredits
}

const readCredits = (key, isLoggedIn = false) => {
  const defaultCredits = isLoggedIn ? DEFAULT_LOGGED_IN_CREDITS : DEFAULT_FREE_CREDITS
  if (!canUseStorage()) return defaultCredits
  const stored = window.localStorage.getItem(key)
  // If no stored value and user is logged in, give them the logged-in default
  if (!stored && isLoggedIn) {
    return DEFAULT_LOGGED_IN_CREDITS
  }
  return parseCredits(stored, isLoggedIn)
}

const writeCredits = (key, value) => {
  if (!canUseStorage()) return
  window.localStorage.setItem(key, value.toString())
}

const clearCredits = (key) => {
  if (!canUseStorage()) return
  window.localStorage.removeItem(key)
}

export const useAuth = () => {
  const { hasActiveSubscription, identifyUser, logOut } = useRevenueCat()
  const { isSignedIn, isLoaded: isUserLoaded, user } = useClerkUser()
  const { isLoaded: isAuthLoaded, getToken, signOut } = useClerkAuth()

  const storageKey = useMemo(() => {
    if (isSignedIn && user?.id) {
      return `credits_${user.id}`
    }
    return GUEST_STORAGE_KEY
  }, [isSignedIn, user?.id])

  const [credits, setCredits] = useState(() => readCredits(storageKey, isSignedIn))

  // Keep local state in sync when the active user changes
  useEffect(() => {
    setCredits(readCredits(storageKey, isSignedIn))
  }, [storageKey, isSignedIn])

  // Coordinate RevenueCat identity with Clerk user state
  useEffect(() => {
    if (isSignedIn && user?.id) {
      identifyUser?.(user.id)
    } else {
      logOut?.()
    }
  }, [identifyUser, logOut, isSignedIn, user?.id])

  const subscriptionActive = hasActiveSubscription()

  const updateCredits = useCallback((updater) => {
    setCredits(prev => {
      const next = updater(prev)
      writeCredits(storageKey, next)
      return next
    })
  }, [storageKey])

  const deductCredits = useCallback((amount = PHOTO_COST) => {
    if (subscriptionActive) return
    updateCredits(prev => Math.max(0, prev - amount))
  }, [subscriptionActive, updateCredits])

  const refundCredits = useCallback((amount = PHOTO_COST) => {
    if (subscriptionActive) return
    updateCredits(prev => prev + amount)
  }, [subscriptionActive, updateCredits])

  const resetCredits = useCallback(() => {
    clearCredits(storageKey)
    setCredits(DEFAULT_FREE_CREDITS)
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
    credits,
    hasActiveSubscription: subscriptionActive,
    deductCredits,
    refundCredits,
    resetCredits,
    getToken,
    signOut
  }
}

export const SignedIn = ClerkSignedIn
export const SignedOut = ClerkSignedOut
export const SignInButton = ClerkSignInButton
export const SignUpButton = ClerkSignUpButton
export const UserButton = ClerkUserButton
