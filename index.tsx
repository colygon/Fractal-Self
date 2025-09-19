/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './src/components/App.jsx'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

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
