/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './src/components/App.jsx'

// Use development key for localhost, production key for production
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const clerkPublishableKey = isLocalhost
  ? (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_DEV || import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)
  : import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

console.log('Clerk environment:', { isLocalhost, keyType: clerkPublishableKey?.substring(0, 7) })

if (!clerkPublishableKey) {
  console.error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable for Clerk.')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      navigate={to => window.location.assign(to)}
    >
      <App />
    </ClerkProvider>
  </StrictMode>
)
