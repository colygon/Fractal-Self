/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react'
import { useRevenueCat } from '../hooks/useRevenueCat.jsx'
import c from 'clsx'

export default function RevenueCatBilling({ onClose }) {
  const { 
    isLoaded, 
    isLoading, 
    customerInfo, 
    offerings, 
    identifyUser, 
    purchasePackage,
    hasActiveSubscription 
  } = useRevenueCat()
  
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    // Identify anonymous user with RevenueCat when component mounts
    if (isLoaded) {
      // Generate or get existing anonymous user ID
      const anonymousUserId = localStorage.getItem('anonymous_user_id') || 
        `guest_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('anonymous_user_id', anonymousUserId)
      identifyUser(anonymousUserId).catch(console.error)
    }
  }, [isLoaded])

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
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">Loading billing options...</div>
        </div>
      </div>
    )
  }

  if (!offerings || !offerings.current) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">
            <p>No billing options available.</p>
            <button 
              onClick={onClose}
              className="mt-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentOffering = offerings.current
  const packages = currentOffering.availablePackages || []

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Choose Your Plan</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Packages */}
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            {packages.map((pkg) => {
              const isActive = hasActiveSubscription() && 
                customerInfo?.entitlements.active[pkg.product.identifier]?.isActive
              
              return (
                <div
                  key={pkg.identifier}
                  className={c(
                    "relative border-2 rounded-lg p-6 cursor-pointer transition-all",
                    pkg.identifier.includes('premium') || pkg.identifier.includes('pro')
                      ? "border-blue-500 shadow-lg transform scale-105" 
                      : "border-gray-200 hover:border-gray-300",
                    selectedPackage?.identifier === pkg.identifier && "ring-2 ring-blue-500"
                  )}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  {(pkg.identifier.includes('premium') || pkg.identifier.includes('pro')) && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-3 py-1 text-sm rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">{pkg.product.title}</h3>
                    
                    <div className="mb-4">
                      <span className="text-3xl font-bold">{pkg.product.priceString}</span>
                      <span className="text-gray-600">/{pkg.product.subscriptionPeriod}</span>
                    </div>
                    
                    <p className="text-gray-600 mb-6 min-h-[3rem]">
                      {pkg.product.description}
                    </p>

                    {/* Purchase Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePurchase(pkg)
                      }}
                      disabled={purchasing || isActive}
                      className={c(
                        "w-full font-bold py-3 px-4 rounded-lg transition-colors",
                        isActive 
                          ? "bg-green-500 text-white cursor-not-allowed"
                          : purchasing
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      )}
                    >
                      {isActive 
                        ? 'Current Plan' 
                        : purchasing 
                        ? 'Processing...' 
                        : `Start ${pkg.product.title}`
                      }
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Current Subscription Status */}
          {hasActiveSubscription() && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold mb-2">Current Subscription</h3>
              <div>
                {Object.keys(customerInfo.entitlements.active).map(entitlementId => {
                  const entitlement = customerInfo.entitlements.active[entitlementId]
                  return (
                    <div key={entitlementId} className="mb-2">
                      <p>Status: <span className="capitalize text-green-600">Active</span></p>
                      <p>Product: {entitlement.productIdentifier}</p>
                      {entitlement.expirationDate && (
                        <p>Next billing: {new Date(entitlement.expirationDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 text-center text-sm text-gray-600">
          <p>✓ Cancel anytime • ✓ Secure payment processing • ✓ Powered by RevenueCat</p>
        </div>
      </div>
    </div>
  )
}