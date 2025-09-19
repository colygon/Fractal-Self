/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react'
import { useRevenueCat } from './useRevenueCat.jsx'

export const useAuth = () => {
  const { hasActiveSubscription } = useRevenueCat()
  const [guestCredits, setGuestCredits] = useState(() => {
    const saved = localStorage.getItem('guestCredits')
    return saved ? parseInt(saved) : 50
  })
  
  // Simple guest-only mode - no authentication
  const user = null
  const isLoaded = true
  const isSignedIn = false
  
  // Credits based on subscription status or guest credits
  const getCreditsBalance = () => {
    // Check if user has active subscription via RevenueCat
    if (hasActiveSubscription()) {
      // Premium users get unlimited credits
      return 999999
    }
    
    // Guest/free users use localStorage credits
    return guestCredits
  }
  
  return {
    user,
    isLoading: false,
    isSignedIn: false, // Always false since no auth
    credits: getCreditsBalance(),
    hasActiveSubscription: hasActiveSubscription(),
    deductCredits: (amount) => {
      if (!hasActiveSubscription()) {
        // Use localStorage for credits
        const newCredits = Math.max(0, guestCredits - amount)
        setGuestCredits(newCredits)
        localStorage.setItem('guestCredits', newCredits.toString())
      }
      // Don't deduct credits for premium users
    },
    refundCredits: (amount) => {
      if (!hasActiveSubscription()) {
        // Use localStorage for credits
        const newCredits = guestCredits + amount
        setGuestCredits(newCredits)
        localStorage.setItem('guestCredits', newCredits.toString())
      }
      // Don't need to refund credits for premium users
    }
  }
}

// Simple UI components for no-auth mode
export const SignedIn = ({ children }) => null // Never show signed-in content
export const SignedOut = ({ children }) => children // Always show signed-out content
export const SignInButton = ({ children, ...props }) => (
  <button {...props} onClick={() => alert('Authentication disabled - using guest mode with RevenueCat billing')}>
    {children || 'Sign In'}
  </button>
)
export const SignUpButton = ({ children, ...props }) => (
  <button {...props} onClick={() => alert('Authentication disabled - using guest mode with RevenueCat billing')}>
    {children || 'Sign Up'}
  </button>
)
export const UserButton = () => null // Don't show user button