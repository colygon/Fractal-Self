/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { pricingPlans } from '../lib/billing'
import c from 'clsx'

export default function Billing({ onClose }) {
  const { user } = useUser()
  const [selectedPlan, setSelectedPlan] = useState('pro')

  const handleSubscribe = (plan) => {
    // For now, we'll just simulate a subscription by updating user metadata
    // In production, you would integrate with Stripe directly or use Clerk's billing
    alert(`Subscribing to ${plan.name} plan - would redirect to Stripe checkout`)
    
    // Simulate updating user metadata (in production, this would be done server-side)
    if (user) {
      // Get the current credits balance or start fresh
      const currentBalance = user.publicMetadata?.creditsBalance || 0
      
      // Add the plan's monthly credits to their balance
      const newBalance = currentBalance + plan.limits.monthlyCents
      
      user.update({
        publicMetadata: {
          ...user.publicMetadata,
          subscription: {
            status: 'active',
            stripePriceId: plan.stripePriceId,
            planId: plan.id,
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          },
          creditsBalance: newBalance // Add the full plan credits immediately
        }
      }).then(() => {
        console.log(`✅ Upgraded to ${plan.name}! Added ${plan.limits.monthlyCents} credits. New balance: ${newBalance}`)
      }).catch(console.error)
    }
    
    onClose()
  }

  const currentSubscription = user?.publicMetadata?.subscription

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

        {/* Pricing Cards */}
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={c(
                  "relative border-2 rounded-lg p-6 cursor-pointer transition-all",
                  plan.popular 
                    ? "border-blue-500 shadow-lg transform scale-105" 
                    : "border-gray-200 hover:border-gray-300",
                  selectedPlan === plan.id && "ring-2 ring-blue-500"
                )}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 text-sm rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  
                  {plan.price === 0 ? (
                    <div className="text-3xl font-bold mb-4">Free</div>
                  ) : (
                    <div className="mb-4">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-gray-600">/{plan.interval}</span>
                    </div>
                  )}
                  
                  <ul className="text-left space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Subscribe Button */}
                  {plan.id !== 'free' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSubscribe(plan)
                      }}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                      {currentSubscription?.planId === plan.id ? 'Current Plan' : `Start ${plan.name} Plan`}
                    </button>
                  )}
                  
                  {plan.id === 'free' && (
                    <button
                      onClick={onClose}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                      Continue with Free Plan
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Current Subscription Status */}
          {currentSubscription && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold mb-2">Current Subscription</h3>
              <div>
                <p>Status: <span className="capitalize">{currentSubscription.status}</span></p>
                <p>Plan: {pricingPlans.find(p => p.id === currentSubscription.planId)?.name || 'Unknown'}</p>
                {currentSubscription.currentPeriodEnd && (
                  <p>Next billing: {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}</p>
                )}
                <div className="mt-3 space-x-2">
                  <button 
                    onClick={() => alert('Would redirect to customer portal')}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                  >
                    Manage Subscription
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel your subscription?')) {
                        user?.update({
                          publicMetadata: {
                            ...user.publicMetadata,
                            subscription: null
                          }
                        }).catch(console.error)
                        onClose()
                      }
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                  >
                    Cancel Subscription
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 text-center text-sm text-gray-600">
          <p>✓ Cancel anytime • ✓ Secure payment with Stripe • ✓ 30-day money back guarantee</p>
        </div>
      </div>
    </div>
  )
}