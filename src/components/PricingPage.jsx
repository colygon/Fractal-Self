/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react'
import { useCustomer } from "autumn-js/react"

export default function PricingPage({ onBack, onPlanSelect }) {
  const { customer, openCheckout } = useCustomer()

  // Updated plans with new pricing structure
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: null,
      photos: 0,
      description: 'Perfect for trying out the service',
      features: [
        'Pay per photo ($0.05 each)',
        'Basic AI styles',
        'Standard quality',
        'Watermarked exports',
        'Community support'
      ],
      popular: false,
      color: '#6B7280'
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 3.99,
      interval: 'month',
      photos: 80,
      description: 'Great for personal use and experimentation',
      features: [
        '80 photos per month included',
        '$0.05 per additional photo',
        'All AI styles & locations',
        'Standard quality', 
        'Watermarked exports',
        'Email support'
      ],
      popular: false,
      color: '#10B981'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 19.99,
      interval: 'month',
      photos: 400,
      description: 'Perfect for content creators and small businesses',
      features: [
        '400 photos per month included',
        '$0.05 per additional photo',
        'All AI styles & locations',
        'High quality exports',
        'No watermarks',
        'GIF creation',
        'Priority support'
      ],
      popular: true,
      color: '#8B5CF6'
    },
    {
      id: 'gold', 
      name: 'Gold',
      price: 49.99,
      interval: 'month',
      photos: 1000,
      description: 'Ideal for growing businesses and agencies',
      features: [
        '1,000 photos per month included',
        '$0.05 per additional photo',
        'All AI styles & locations', 
        'Ultra-high quality exports',
        'No watermarks',
        'GIF creation',
        'Batch processing',
        'Priority support'
      ],
      popular: false,
      color: '#F59E0B'
    },
    {
      id: 'diamond', 
      name: 'Diamond',
      price: 499.99,
      interval: 'month',
      photos: 10000,
      description: 'Enterprise-grade solution for large organizations',
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
        'Dedicated support'
      ],
      popular: false,
      color: '#EC4899'
    }
  ]

  const handleSelectPlan = async (plan) => {
    try {
      if (plan.id === 'free') {
        console.log('Switched to free plan')
        if (onPlanSelect) onPlanSelect(plan)
        return
      }

      // Use Autumn checkout for paid plans
      await openCheckout({
        product_id: plan.id,
        success_url: window.location.origin + '?checkout=success',
        cancel_url: window.location.origin + '?checkout=canceled'
      })
      
      if (onPlanSelect) onPlanSelect(plan)
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Error starting checkout. Please try again.')
    }
  }

  const currentCredits = customer?.usage?.credits || 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 overflow-y-auto">
      <div className="w-full max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <button 
            onClick={onBack}
            className="absolute top-6 left-6 text-white hover:text-gray-300 transition-colors"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '14px',
              backdropFilter: 'blur(10px)'
            }}
          >
            ← Back
          </button>
          
          <h1 
            style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '1rem',
              textAlign: 'center'
            }}
          >
            Choose Your Plan
          </h1>
          <p 
            style={{
              fontSize: '1.2rem',
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              maxWidth: '600px',
              margin: '0 auto'
            }}
          >
            Transform your photos with AI. All plans include overage billing at $0.05 per photo.
          </p>
          
          {/* Current credits display */}
          {currentCredits > 0 && (
            <div 
              style={{
                background: 'rgba(0, 255, 0, 0.1)',
                border: '1px solid rgba(0, 255, 0, 0.3)',
                borderRadius: '8px',
                padding: '12px 20px',
                margin: '20px auto',
                maxWidth: '300px',
                textAlign: 'center',
                color: '#10B981'
              }}
            >
              💎 You have {currentCredits} credits remaining
            </div>
          )}
        </div>

        {/* Plans grid */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            maxWidth: '1400px',
            margin: '0 auto'
          }}
        >
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: plan.popular 
                  ? `2px solid ${plan.color}` 
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '24px',
                position: 'relative',
                backdropFilter: 'blur(10px)',
                transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.2s ease'
              }}
            >
              {plan.popular && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: plan.color,
                    color: 'white',
                    padding: '4px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}
                >
                  Most Popular
                </div>
              )}

              {/* Plan header */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: plan.color,
                    marginBottom: '8px'
                  }}
                >
                  {plan.name}
                </h3>
                <p 
                  style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '14px',
                    marginBottom: '16px'
                  }}
                >
                  {plan.description}
                </p>
                
                {/* Price display */}
                <div style={{ marginBottom: '8px' }}>
                  {plan.price === 0 ? (
                    <span 
                      style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: '#10B981'
                      }}
                    >
                      Free
                    </span>
                  ) : (
                    <div>
                      <span 
                        style={{
                          fontSize: '2.5rem',
                          fontWeight: 'bold',
                          color: 'white'
                        }}
                      >
                        ${plan.price}
                      </span>
                      <span 
                        style={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: '1rem'
                        }}
                      >
                        /{plan.interval}
                      </span>
                    </div>
                  )}
                </div>
                
                <p 
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '14px'
                  }}
                >
                  {plan.photos === 0 ? 'Pay per photo' : `${plan.photos} photos included`}
                </p>
              </div>

              {/* Features list */}
              <ul style={{ marginBottom: '24px', listStyle: 'none', padding: 0 }}>
                {plan.features.map((feature, index) => (
                  <li 
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: '12px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '14px'
                    }}
                  >
                    <span 
                      style={{
                        color: plan.color,
                        marginRight: '8px',
                        fontSize: '16px'
                      }}
                    >
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Select button */}
              <button
                onClick={() => handleSelectPlan(plan)}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  background: plan.popular 
                    ? plan.color 
                    : 'rgba(255, 255, 255, 0.1)',
                  border: plan.popular 
                    ? 'none' 
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!plan.popular) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)'
                  } else {
                    e.target.style.opacity = '0.9'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!plan.popular) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                  } else {
                    e.target.style.opacity = '1'
                  }
                }}
              >
                {plan.price === 0 ? 'Use Free Plan' : `Get ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div 
          style={{
            textAlign: 'center',
            marginTop: '40px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '14px'
          }}
        >
          <p>All plans include secure payments via Stripe • Cancel anytime</p>
          <p style={{ marginTop: '8px' }}>
            Questions? Contact us at support@fractalself.com
          </p>
        </div>
      </div>
    </div>
  )
}