/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react'
import { useCustomer, CheckoutDialog } from "autumn-js/react"

export default function AutumnBilling({ onClose }) {
  const { customer, openCheckout } = useCustomer()

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: null,
      photos: 0,
      features: [
        'Pay per photo ($0.05 each)',
        'Basic AI styles',
        'Standard quality',
        'Watermarked exports'
      ],
      popular: false
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 3.99,
      interval: 'month',
      photos: 80,
      features: [
        '80 photos per month included',
        '$0.05 per additional photo',
        'All AI styles & locations',
        'Standard quality', 
        'Watermarked exports'
      ],
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 19.99,
      interval: 'month',
      photos: 400,
      features: [
        '400 photos per month included',
        '$0.05 per additional photo',
        'All AI styles & locations',
        'High quality exports',
        'No watermarks',
        'GIF creation'
      ],
      popular: true
    },
    {
      id: 'gold', 
      name: 'Gold',
      price: 49.99,
      interval: 'month',
      photos: 1000,
      features: [
        '1,000 photos per month included',
        '$0.05 per additional photo',
        'All AI styles & locations', 
        'Ultra-high quality exports',
        'No watermarks',
        'GIF creation',
        'Priority processing'
      ],
      popular: false
    },
    {
      id: 'diamond', 
      name: 'Diamond',
      price: 499.99,
      interval: 'month',
      photos: 10000,
      features: [
        '10,000 photos per month included',
        '$0.05 per additional photo',
        'All AI styles & locations', 
        'Ultra-high quality exports',
        'No watermarks',
        'GIF creation',
        'Custom AI prompts',
        'Batch processing',
        'API access',
        'Priority support'
      ],
      popular: false
    }
  ]

  const handleSubscribe = async (plan) => {
    try {
      if (plan.id === 'free') {
        // Free plan - no checkout needed
        console.log('Already on free plan')
        onClose()
        return
      }

      // Use Autumn checkout for paid plans
      await openCheckout({
        product_id: plan.id,
        success_url: window.location.origin + '?checkout=success',
        cancel_url: window.location.origin + '?checkout=canceled'
      })
      
      onClose()
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Error starting checkout. Please try again.')
    }
  }

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

        {/* Current plan info */}
        {customer && (
          <div className="p-6 bg-blue-50 border-b">
            <h3 className="text-lg font-semibold text-blue-900">Current Status</h3>
            <p className="text-blue-700">
              Credits remaining: {customer.usage?.credits || 0}
            </p>
          </div>
        )}

        {/* Plans grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`border rounded-lg p-6 relative ${
                plan.popular ? 'border-blue-500 shadow-lg transform scale-105' : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-2">
                  {plan.price === 0 ? (
                    <span className="text-2xl font-bold text-green-600">Free</span>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-500">/{plan.interval}</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {plan.photos === 0 ? 'Pay per photo' : `${plan.photos} photos included`}
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg 
                      className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  plan.popular
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {plan.price === 0 ? 'Current Plan' : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Autumn checkout dialog */}
      <CheckoutDialog />
    </div>
  )
}