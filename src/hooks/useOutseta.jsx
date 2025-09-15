/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react'

export const useOutseta = () => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [credits, setCredits] = useState(0)

  useEffect(() => {
    const initOutseta = async () => {
      try {
        // Wait for Outseta to load
        if (typeof window.Outseta === 'undefined') {
          // Poll for Outseta to be available
          const checkOutseta = () => {
            if (typeof window.Outseta !== 'undefined') {
              loadUserData()
            } else {
              setTimeout(checkOutseta, 100)
            }
          }
          checkOutseta()
        } else {
          loadUserData()
        }
      } catch (error) {
        console.error('Error initializing Outseta:', error)
        setIsLoading(false)
      }
    }

    const loadUserData = async () => {
      try {
        // Get current user
        const currentUser = await window.Outseta.getUser()
        
        if (currentUser && currentUser.Email) {
          setUser(currentUser)
          setIsSignedIn(true)
          // Load user credits
          await loadCredits()
        } else {
          setUser(null)
          setIsSignedIn(false)
          setCredits(0)
        }
      } catch (error) {
        console.log('No user signed in or error getting user:', error)
        setUser(null)
        setIsSignedIn(false)
        setCredits(0)
      } finally {
        setIsLoading(false)
      }
    }

    const loadCredits = async () => {
      try {
        // For now, we'll use localStorage to track credits
        // In a real implementation, this would come from Outseta's API
        const savedCredits = localStorage.getItem('userCredits')
        if (savedCredits) {
          setCredits(parseInt(savedCredits))
        } else {
          // Default credits for new users
          setCredits(500)
          localStorage.setItem('userCredits', '500')
        }
      } catch (error) {
        console.error('Error loading credits:', error)
        setCredits(0)
      }
    }

    // Listen for Outseta authentication events
    const handleAuthEvents = () => {
      if (typeof window.Outseta !== 'undefined') {
        // Listen for login/logout events
        window.Outseta.on('accessToken.set', () => {
          console.log('Outseta: User logged in')
          loadUserData()
        })

        window.Outseta.on('user.logout', () => {
          console.log('Outseta: User logged out')
          setUser(null)
          setIsSignedIn(false)
        })
      }
    }

    initOutseta()
    handleAuthEvents()
  }, [])

  const openSignUp = () => {
    if (typeof window.Outseta !== 'undefined') {
      window.Outseta.auth.open({
        widgetMode: 'register',
        redirectUrl: window.location.origin
      })
    }
  }

  const openSignIn = () => {
    if (typeof window.Outseta !== 'undefined') {
      window.Outseta.auth.open({
        widgetMode: 'login',
        redirectUrl: window.location.origin
      })
    }
  }

  const openProfile = () => {
    if (typeof window.Outseta !== 'undefined') {
      window.Outseta.profile.open()
    }
  }

  const openBilling = () => {
    if (typeof window.Outseta !== 'undefined') {
      window.Outseta.profile.open({
        tab: 'billing'
      })
    }
  }

  const signOut = () => {
    if (typeof window.Outseta !== 'undefined') {
      window.Outseta.auth.logout()
    }
  }

  const deductCredits = (amount) => {
    const newCredits = Math.max(0, credits - amount)
    setCredits(newCredits)
    localStorage.setItem('userCredits', newCredits.toString())
  }

  return {
    user,
    isLoading,
    isSignedIn,
    credits,
    deductCredits,
    openSignUp,
    openSignIn,
    openProfile,
    openBilling,
    signOut
  }
}

// Helper components for easier migration from Clerk
export const SignedIn = ({ children }) => {
  const { isSignedIn, isLoading } = useOutseta()
  
  if (isLoading) return null
  return isSignedIn ? children : null
}

export const SignedOut = ({ children }) => {
  const { isSignedIn, isLoading } = useOutseta()
  
  if (isLoading) return children
  return !isSignedIn ? children : null
}

export const SignInButton = ({ children, className, style, onClick }) => {
  const { openSignIn } = useOutseta()
  
  const handleClick = (e) => {
    e.preventDefault()
    openSignIn()
    if (onClick) onClick(e)
  }

  if (children && typeof children === 'function') {
    return children({ onClick: handleClick })
  }

  return (
    <button
      onClick={handleClick}
      className={className}
      style={style}
    >
      {children || 'Sign In'}
    </button>
  )
}

export const SignUpButton = ({ children, className, style, onClick }) => {
  const { openSignUp } = useOutseta()
  
  const handleClick = (e) => {
    e.preventDefault()
    openSignUp()
    if (onClick) onClick(e)
  }

  if (children && typeof children === 'function') {
    return children({ onClick: handleClick })
  }

  return (
    <button
      onClick={handleClick}
      className={className}
      style={style}
    >
      {children || 'Sign Up'}
    </button>
  )
}

export const UserButton = ({ afterSignOutUrl, appearance }) => {
  const { user, openProfile, signOut } = useOutseta()
  
  if (!user) return null

  const handleProfileClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    openProfile()
  }

  // Simple implementation - you can enhance this with a dropdown menu
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleProfileClick}
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: '2px solid rgba(255, 255, 255, 0.15)',
          background: 'linear-gradient(45deg, #8B5CF6, #EC4899)',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          ...appearance?.elements?.avatarBox
        }}
      >
        {user.FirstName ? user.FirstName[0].toUpperCase() : user.Email[0].toUpperCase()}
      </button>
    </div>
  )
}