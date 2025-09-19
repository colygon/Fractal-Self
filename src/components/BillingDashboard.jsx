/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react'
import { useAuth } from '../hooks/useAuth.jsx'

export default function BillingDashboard({ onBack, onUpgrade }) {
  const { user, credits, hasActiveSubscription } = useAuth()

  const creditsRemaining = credits
  const currentPlan = hasActiveSubscription ? 'premium' : 'free'
  
  // Plan details based on current subscription
  const planDetails = {
    free: { name: 'Free', photos: 0, price: 0 },
    starter: { name: 'Starter', photos: 80, price: 3.99 },
    premium: { name: 'Premium', photos: 400, price: 19.99 },
    gold: { name: 'Gold', photos: 1000, price: 49.99 },
    diamond: { name: 'Diamond', photos: 10000, price: 499.99 }
  }

  const plan = planDetails[currentPlan] || planDetails.free

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto p-4">
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
            Account Dashboard
          </h1>
          <p 
            style={{
              fontSize: '1.2rem',
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center'
            }}
          >
            Manage your subscription and view usage
          </p>
        </div>

        {/* Current Plan Card */}
        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
                Current Plan: {plan.name}
              </h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                {plan.price === 0 ? 'Pay per photo at $0.05 each' : `$${plan.price}/month with ${plan.photos} photos included`}
              </p>
            </div>
            {currentPlan !== 'diamond' && (
              <button
                onClick={onUpgrade}
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => e.target.style.opacity = '0.9'}
                onMouseLeave={e => e.target.style.opacity = '1'}
              >
                Upgrade Plan
              </button>
            )}
          </div>

          {/* Credits Display */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div 
              style={{
                background: 'rgba(0, 255, 0, 0.1)',
                border: '1px solid rgba(0, 255, 0, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981', marginBottom: '8px' }}>
                ⚡ {creditsRemaining}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                Credits Remaining
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px', marginTop: '4px' }}>
                1 credit = $0.01
              </div>
            </div>

            {plan.photos > 0 && (
              <div 
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3B82F6', marginBottom: '8px' }}>
                  📸 {plan.photos}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                  Monthly Photos
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px', marginTop: '4px' }}>
                  Resets monthly
                </div>
              </div>
            )}

            <div 
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#F59E0B', marginBottom: '8px' }}>
                💳 $0.05
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                Per Extra Photo
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px', marginTop: '4px' }}>
                After monthly limit
              </div>
            </div>
          </div>
        </div>

        {/* Usage History */}
        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            backdropFilter: 'blur(10px)'
          }}
        >
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>
            Account Features
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ color: '#10B981', marginRight: '12px', fontSize: '18px' }}>✓</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                All AI styles & locations
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ color: '#10B981', marginRight: '12px', fontSize: '18px' }}>✓</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                {plan.price > 0 ? 'High quality exports' : 'Standard quality'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ color: plan.price >= 19.99 ? '#10B981' : '#6B7280', marginRight: '12px', fontSize: '18px' }}>
                {plan.price >= 19.99 ? '✓' : '✗'}
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                No watermarks
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ color: plan.price >= 19.99 ? '#10B981' : '#6B7280', marginRight: '12px', fontSize: '18px' }}>
                {plan.price >= 19.99 ? '✓' : '✗'}
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                GIF creation
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ color: plan.price >= 49.99 ? '#10B981' : '#6B7280', marginRight: '12px', fontSize: '18px' }}>
                {plan.price >= 49.99 ? '✓' : '✗'}
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                Batch processing
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ color: plan.price >= 499.99 ? '#10B981' : '#6B7280', marginRight: '12px', fontSize: '18px' }}>
                {plan.price >= 499.99 ? '✓' : '✗'}
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                API access & Custom prompts
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {creditsRemaining < 25 && (
            <button
              onClick={onUpgrade}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#EF4444',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => e.target.style.background = 'rgba(239, 68, 68, 0.2)'}
              onMouseLeave={e => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
            >
              ⚡ Low Credits - Add More
            </button>
          )}
          
          <button
            onClick={onUpgrade}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'white',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            View All Plans
          </button>
        </div>

        {/* Footer */}
        <div 
          style={{
            textAlign: 'center',
            marginTop: '40px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '14px'
          }}
        >
          <p>Need help? Contact us at support@fractalself.com</p>
        </div>
      </div>
    </div>
  )
}