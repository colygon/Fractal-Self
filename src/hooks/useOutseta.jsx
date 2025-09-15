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
        // Check for access token in URL parameters (in case of redirect)
        const urlParams = new URLSearchParams(window.location.search)
        const accessToken = urlParams.get('access_token')
        
        if (accessToken) {
          console.log('Found access token in URL, setting in Outseta...')
          // Clean the URL
          window.history.replaceState({}, document.title, window.location.pathname)
          
          // Wait for Outseta to load, then set the token
          const setTokenWhenReady = () => {
            if (typeof window.Outseta !== 'undefined') {
              try {
                window.Outseta.setAccessToken(accessToken)
                console.log('Access token set from URL parameter')
                loadUserData()
                setupAuthEvents()
              } catch (error) {
                console.error('Error setting access token:', error)
                fallbackToNormalInit()
              }
            } else {
              setTimeout(setTokenWhenReady, 100)
            }
          }
          setTokenWhenReady()
          return
        }

        // Normal initialization
        const fallbackToNormalInit = () => {
          if (typeof window.Outseta === 'undefined') {
            // Poll for Outseta to be available
            const checkOutseta = () => {
              if (typeof window.Outseta !== 'undefined') {
                console.log('Outseta loaded, initializing user data...')
                loadUserData()
                setupAuthEvents()
              } else {
                setTimeout(checkOutseta, 100)
              }
            }
            checkOutseta()
          } else {
            console.log('Outseta already loaded, initializing user data...')
            loadUserData()
            setupAuthEvents()
          }
        }
        
        fallbackToNormalInit()
      } catch (error) {
        console.error('Error initializing Outseta:', error)
        setIsLoading(false)
      }
    }

    const loadUserData = async () => {
      try {
        console.log('Loading user data from Outseta...')
        console.log('Outseta object available:', typeof window.Outseta)
        
        if (typeof window.Outseta === 'undefined') {
          console.error('Outseta not loaded yet')
          setIsLoading(false)
          return
        }

        // Check if Outseta has access token
        const accessToken = window.Outseta.getAccessToken?.()
        console.log('Access token present:', !!accessToken)
        
        // Get current user
        const currentUser = await window.Outseta.getUser()
        console.log('Outseta user result:', currentUser)
        console.log('User properties:', currentUser ? Object.keys(currentUser) : 'No user')
        
        if (currentUser && (currentUser.Email || currentUser.email)) {
          const email = currentUser.Email || currentUser.email
          console.log('User found:', email)
          setUser(currentUser)
          setIsSignedIn(true)
          // Load user credits
          await loadCredits()
        } else {
          console.log('No user found or missing email')
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

    // Setup authentication event listeners
    const setupAuthEvents = () => {
      if (typeof window.Outseta !== 'undefined') {
        console.log('Setting up Outseta auth event listeners...')
        
        // Listen for login/logout events
        window.Outseta.on('accessToken.set', () => {
          console.log('Outseta: User logged in, reloading user data...')
          setTimeout(() => loadUserData(), 500) // Small delay to ensure token is set
        })

        window.Outseta.on('user.logout', () => {
          console.log('Outseta: User logged out')
          setUser(null)
          setIsSignedIn(false)
          setCredits(0)
        })

        // Also listen for modal close events in case user logs in
        window.Outseta.on('modal.close', () => {
          console.log('Outseta: Modal closed, checking auth status...')
          setTimeout(() => loadUserData(), 1000) // Delay to allow for redirect processing
        })
      }
    }

    // Listen for window focus to check auth status when user returns
    const handleWindowFocus = () => {
      if (typeof window.Outseta !== 'undefined') {
        console.log('Window focused, checking auth status...')
        loadUserData()
      }
    }

    window.addEventListener('focus', handleWindowFocus)

    // Set up periodic auth check (every 30 seconds) to catch missed events
    const authCheckInterval = setInterval(() => {
      if (typeof window.Outseta !== 'undefined' && !isLoading) {
        console.log('Periodic auth check...')
        loadUserData()
      }
    }, 30000)

    // Cleanup event listeners and interval
    return () => {
      window.removeEventListener('focus', handleWindowFocus)
      clearInterval(authCheckInterval)
    }

    initOutseta()
  }, [])

  const openSignUp = () => {
    if (typeof window.Outseta !== 'undefined') {
      console.log('Opening Outseta sign-up...')
      // Try both modal and direct redirect approaches
      try {
        window.Outseta.auth.open({
          widgetMode: 'register'
        })
      } catch (error) {
        console.log('Modal failed, trying redirect...')
        window.location.href = 'https://bananacam.outseta.com/auth?widgetMode=register&redirectUrl=' + encodeURIComponent(window.location.href)
      }
    }
  }

  const openSignIn = () => {
    if (typeof window.Outseta !== 'undefined') {
      console.log('Opening Outseta sign-in...')
      // Try both modal and direct redirect approaches
      try {
        window.Outseta.auth.open({
          widgetMode: 'login'
        })
      } catch (error) {
        console.log('Modal failed, trying redirect...')
        window.location.href = 'https://bananacam.outseta.com/auth?widgetMode=login&redirectUrl=' + encodeURIComponent(window.location.href)
      }
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

  const refundCredits = (amount) => {
    const newCredits = credits + amount
    setCredits(newCredits)
    localStorage.setItem('userCredits', newCredits.toString())
  }

  return {
    user,
    isLoading,
    isSignedIn,
    credits,
    deductCredits,
    refundCredits,
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

  // Always use render prop pattern to avoid button nesting
  if (children) {
    return React.cloneElement(children, {
      onClick: (e) => {
        handleClick(e)
        if (children.props.onClick) children.props.onClick(e)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      className={className}
      style={style}
    >
      Sign In
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

  // Always use render prop pattern to avoid button nesting
  if (children) {
    return React.cloneElement(children, {
      onClick: (e) => {
        handleClick(e)
        if (children.props.onClick) children.props.onClick(e)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      className={className}
      style={style}
    >
      Sign Up
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