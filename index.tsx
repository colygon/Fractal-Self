/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { StrictMode } from 'react'
import {createRoot} from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { AutumnProvider } from "autumn-js/react"
import App from './src/components/App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_live_Y2xlcmsuYmFuYW5hLmNhbSQ'
console.log('Clerk publishable key:', PUBLISHABLE_KEY)

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key")
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      appearance={{
        elements: {
          formButtonPrimary: {
            fontSize: '14px',
            textTransform: 'none',
            backgroundColor: '#007AFF',
            '&:hover': {
              backgroundColor: '#0056CC'
            }
          }
        }
      }}
    >
      <AutumnProvider 
        backendUrl={import.meta.env.PROD ? `${window.location.origin}/api` : "http://localhost:3001"}
        getBearerToken={async () => {
          // Get Clerk session token to authenticate with Autumn backend
          if (window.Clerk?.session) {
            return await window.Clerk.session.getToken()
          }
          return null
        }}
      >
        <App />
      </AutumnProvider>
    </ClerkProvider>
  </StrictMode>
)
