/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react'
import { useRevenueCat } from '../hooks/useRevenueCat.jsx'
import { useAuth } from '../hooks/useAuth.jsx'

export default function RevenueCatBilling({ onClose }) {
  const {
    isLoaded,
    isLoading,
    customerInfo,
    offerings,
    identifyUser,
    purchasePackage,
    hasActiveSubscription,
    refreshCustomerInfo,
    virtualCurrencyBalance
  } = useRevenueCat()
  const { isSignedIn, user, bananas } = useAuth()
  
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [purchasing, setPurchasing] = useState(false)

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 100000,
  }

  const baseModalStyle = {
    background: '#ffffff',
    color: '#111111',
    borderRadius: '16px',
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.45)',
    width: '100%',
  }

  const loadingModalStyle = {
    ...baseModalStyle,
    padding: '32px',
    maxWidth: '360px',
    textAlign: 'center'
  }

  const fullModalStyle = {
    ...baseModalStyle,
    maxWidth: '960px',
    maxHeight: '90vh',
    overflowY: 'auto'
  }

  const subtleTextStyle = {
    fontSize: '14px',
    color: '#4b5563'
  }

  const gridStyle = {
    display: 'grid',
    gap: '24px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))'
  }

  const primaryButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 16px',
    borderRadius: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    width: '100%'
  }

  useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn && user?.id) {
      // App-level auth hook synchronizes RevenueCat for signed-in users
      return
    }

    // Guest fallback: maintain a stable anonymous RevenueCat identifier
    const anonymousUserId = localStorage.getItem('anonymous_user_id') || 
      `guest_${Math.random().toString(36).substring(2, 11)}`
    localStorage.setItem('anonymous_user_id', anonymousUserId)
    identifyUser(anonymousUserId).catch(console.error)
  }, [identifyUser, isLoaded, isSignedIn, user?.id])

  const handlePurchase = async (pkg) => {
    if (!pkg || purchasing) return
    
    setPurchasing(true)
    try {
      await purchasePackage(pkg)
      // Purchase successful, you might want to update UI or close modal
      console.log('Purchase successful!')
      onClose()
    } catch (error) {
      console.error('Purchase failed:', error)
      // Handle purchase error (show user-friendly message)
      alert('Purchase failed. Please try again.')
    } finally {
      setPurchasing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0" style={overlayStyle}>
        <div className="bg-white rounded-lg" style={loadingModalStyle}>
          <div className="text-center">
            <div className="mb-4">Loading billing options...</div>
            <div style={subtleTextStyle}>
              Initializing RevenueCat SDK...
            </div>
          </div>
        </div>
      </div>
    )
  }

  const resolveOffering = (offerings) => {
    if (!offerings) return null

    // Prefer the current offering when it has purchasable packages
    if (offerings.current?.availablePackages?.length) {
      return offerings.current
    }

    // Fall back to the first offering that has available packages
    const offeringList = Object.values(offerings.all || {})
    return offeringList.find(offering => offering?.availablePackages?.length)
      || offeringList[0]
      || null
  }

  const currentOffering = resolveOffering(offerings)
  const packages = currentOffering?.availablePackages || []

  if (!offerings || !currentOffering || packages.length === 0) {
    return (
      <div className="fixed inset-0" style={overlayStyle}>
        <div className="bg-white rounded-lg" style={{
          ...loadingModalStyle,
          maxWidth: '420px'
        }}>
          <div className="text-center">
            <p className="mb-4">RevenueCat Configuration Issue</p>
            <div style={{ ...subtleTextStyle, marginBottom: '16px' }}>
              <p>The billing system is not properly configured.</p>
              <p className="mt-2">Possible issues:</p>
              <ul className="text-left mt-2 space-y-1">
                <li>• Invalid API key</li>
                <li>• No products/offerings configured</li>
                <li>• RevenueCat project not set up</li>
                <li>• No packages assigned to the current offering</li>
              </ul>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => window.open('https://app.revenuecat.com', '_blank')}
                className="w-full"
                style={{
                  ...primaryButtonStyle,
                  background: 'linear-gradient(135deg, #2563eb, #4338ca)',
                  color: '#fff',
                  marginBottom: '12px'
                }}
              >
                Open RevenueCat Dashboard
              </button>
              <button 
                onClick={onClose}
                className="w-full"
                style={{
                  ...primaryButtonStyle,
                  background: '#6b7280',
                  color: '#fff'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0" style={overlayStyle}>
      <div className="bg-white rounded-lg" style={fullModalStyle}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
        }}>
          <h2 className="text-2xl font-bold" style={{ fontSize: '24px', fontWeight: 700 }}>Choose Your Plan</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            style={{
              fontSize: '28px',
              lineHeight: 1,
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        {/* Packages */}
        <div className="p-6" style={{ padding: '24px' }}>
          <div className="grid md:grid-cols-3 gap-6" style={gridStyle}>
            {packages.map((pkg) => {
              const isActive = false // No subscription model for credit packages
              const isHighlighted = pkg.identifier.includes('credits_1700') // Highlight the Gold tier
              const isSelected = selectedPackage?.identifier === pkg.identifier
              const cardStyle = {
                position: 'relative',
                borderRadius: '16px',
                padding: '24px',
                cursor: 'pointer',
                border: `2px solid ${isHighlighted ? '#6366f1' : '#e5e7eb'}`,
                boxShadow: isHighlighted
                  ? '0 20px 45px rgba(99, 102, 241, 0.25)'
                  : '0 14px 35px rgba(15, 23, 42, 0.12)',
                transform: isHighlighted ? 'scale(1.02)' : 'scale(1)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                background: '#fff',
                outline: isSelected ? '3px solid rgba(99, 102, 241, 0.45)' : 'none'
              }
              
              return (
                <div
                  key={pkg.identifier}
                  className="relative border-2 rounded-lg p-6 cursor-pointer transition-all"
                  style={cardStyle}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  {isHighlighted && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2" style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}>
                      <span className="bg-blue-500 text-white px-3 py-1 text-sm rounded-full" style={{
                        background: '#6366f1',
                        color: '#fff',
                        padding: '6px 12px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}>
                        Best Value
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center" style={{ textAlign: 'center' }}>
                    <h3 className="text-xl font-bold mb-2" style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      marginBottom: '12px'
                    }}>{pkg.product.title}</h3>
                    
                    <div className="mb-4" style={{ marginBottom: '16px' }}>
                      <span className="text-3xl font-bold" style={{ fontSize: '34px', fontWeight: 700 }}>{pkg.product.priceString}</span>
                      <span className="text-gray-600 text-base" style={{ fontSize: '16px', color: '#4b5563' }}>/month</span>
                      <div className="text-gray-600 text-sm" style={{ color: '#4b5563', fontSize: '14px', marginTop: '4px' }}>
                        {pkg.product.credits?.toLocaleString()} 🍌 bananas per month
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-6 min-h-[3rem]" style={{
                      color: '#4b5563',
                      marginBottom: '24px',
                      minHeight: '48px'
                    }}>
                      {pkg.product.description}
                    </p>

                    {/* Purchase Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePurchase(pkg)
                      }}
                      disabled={purchasing || isActive}
                      className="w-full font-bold py-3 px-4 rounded-lg transition-colors"
                      style={{
                        ...primaryButtonStyle,
                        background: isActive
                          ? '#22c55e'
                          : purchasing
                            ? '#9ca3af'
                            : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                        color: '#ffffff'
                      }}
                    >
                      {purchasing
                        ? 'Processing...'
                        : `Buy ${pkg.product.credits?.toLocaleString()} 🍌 Bananas`
                      }
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Current Balance & Purchase Info */}
          <div className="mt-8 space-y-4">
            {/* Current Balance Display */}
            <div className="p-4 bg-green-50 rounded-lg text-center border border-green-200">
              <h3 className="font-bold mb-2">Current Balance</h3>
              <p className="text-2xl font-bold text-green-700">{bananas || 0} 🍌 bananas</p>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 text-center text-sm text-gray-600" style={{
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          padding: '20px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#4b5563'
        }}>
          <p>✓ Monthly subscription • ✓ Cancel anytime • ✓ Secure payment processing • ✓ Powered by RevenueCat</p>
        </div>
      </div>
    </div>
  )
}
