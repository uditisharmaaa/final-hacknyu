import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BusinessProvider } from './lib/businessContext.jsx'

createRoot(document.getElementById('root')).render(
  <BusinessProvider>
    <App />
  </BusinessProvider>
)
