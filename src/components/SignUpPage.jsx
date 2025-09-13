/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react'
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/clerk-react'

export default function SignUpPage({ onBack, onContinueToPricing }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto p-4">
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
            🚀 Start Your Free Trial
          </h1>
          <p 
            style={{
              fontSize: '1.4rem',
              color: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
              maxWidth: '700px',
              margin: '0 auto',
              lineHeight: '1.5',
              fontWeight: '500'
            }}
          >
            Transform your photos with <span style={{color: '#8B5CF6', fontWeight: '700'}}>100+ AI styles</span> and locations! 
            Join thousands creating <span style={{color: '#EC4899', fontWeight: '700'}}>mind-blowing</span> AI photos every day.
          </p>
        </div>

        {/* Benefits Section */}
        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '32px',
            backdropFilter: 'blur(10px)'
          }}
        >
          <h3 
            style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: 'white',
              marginBottom: '24px',
              textAlign: 'center'
            }}
          >
            What you get with your free account:
          </h3>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            {[
              { icon: '⚡', text: '50 FREE photo credits to get started (worth $2.50)' },
              { icon: '🎨', text: '100+ AI styles: Renaissance, Cyberpunk, Disney, Anime & more!' },
              { icon: '🌍', text: 'Transport yourself to Tokyo, Paris, Mars, or fantasy worlds' },
              { icon: '🎬', text: 'Create stunning animated GIFs that wow your friends' },
              { icon: '📱', text: 'Works perfectly on all devices - mobile & desktop' },
              { icon: '🔒', text: 'Secure cloud storage for all your AI masterpieces' }
            ].map((benefit, index) => (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '12px 0'
                }}
              >
                <span 
                  style={{
                    fontSize: '24px',
                    minWidth: '32px',
                    textAlign: 'center'
                  }}
                >
                  {benefit.icon}
                </span>
                <span 
                  style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '16px'
                  }}
                >
                  {benefit.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Auth Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <SignedOut>
            {/* Sign Up Button */}
            <SignUpButton 
              mode="modal" 
              redirectUrl={window.location.origin}
              afterSignUpUrl={window.location.origin}
            >
              <button
                onClick={() => console.log('SignUp button clicked')}
                style={{
                  width: '300px',
                  padding: '16px 32px',
                  background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 12px 40px rgba(139, 92, 246, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 8px 32px rgba(139, 92, 246, 0.3)'
                }}
              >
                🚀 Start Free Trial - Get 50 Credits!
              </button>
            </SignUpButton>

            <div 
              style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px',
                margin: '8px 0'
              }}
            >
              or
            </div>

            {/* Sign In Button */}
            <SignInButton 
              mode="modal" 
              redirectUrl={window.location.origin}
              afterSignInUrl={window.location.origin}
            >
              <button
                onClick={() => console.log('SignIn button clicked')}
                style={{
                  width: '300px',
                  padding: '14px 32px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)'
                  e.target.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                  e.target.style.transform = 'translateY(0)'
                }}
              >
                Already have an account? Sign In
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            {/* Continue to pricing for signed in users */}
            <button
              onClick={() => {
                console.log('Continue to Pricing button clicked')
                onContinueToPricing()
              }}
              style={{
                width: '300px',
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.3)'
              }}
            >
              ✅ Continue to Choose Your Plan
            </button>
          </SignedIn>
        </div>

        {/* Trust signals */}
        <div 
          style={{
            textAlign: 'center',
            marginTop: '32px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '14px',
            lineHeight: '1.6'
          }}
        >
          <p>🔒 Your privacy is protected • No spam, ever • Cancel anytime</p>
          <p style={{ marginTop: '8px' }}>
            Join thousands of happy users creating amazing AI photos daily
          </p>
        </div>
      </div>
    </div>
  )
}