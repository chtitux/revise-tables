import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Register service worker with auto-update
registerSW({
  onNeedRefresh() {
    // Auto-update is enabled, so this won't be called
    // The app will update automatically on next visit
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
  immediate: true
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
