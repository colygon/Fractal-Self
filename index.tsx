/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { StrictMode } from 'react'
import {createRoot} from 'react-dom/client'
import App from './src/components/App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
