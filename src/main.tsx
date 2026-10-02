import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AppRouter from './router/AppRouter'
import { ToastProvider } from './components/common/Toast'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { AuthProvider } from './contexts/AuthContext'
import { OnboardingStatusProvider } from './contexts/OnboardingStatusContext'
import { captureImportFromLocation } from './utils/importHandoff'

// Capture retailer import hash before auth redirects can strip it
captureImportFromLocation()

// A service worker from a prior production build/preview on this origin can
// linger registered in the browser and intercept dev-server navigations,
// whose asset hashes it doesn't recognize — causing "no-response" errors and
// reload loops. The dev server never registers its own SW, so safe to clear
// both the registration and its precache here; unregistering alone doesn't
// stop an already-controlling worker from intercepting the current page.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister())
  })
  if ('caches' in window) {
    caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)))
  }
}

import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <OnboardingStatusProvider>
              <AppRouter />
            </OnboardingStatusProvider>
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
)
