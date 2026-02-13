import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initMockElectron } from './utils/mockElectron.js'

// Initialize mock Electron API for browser-based development testing
// This only runs when window.atlased is not available (i.e., outside Electron)
initMockElectron();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
