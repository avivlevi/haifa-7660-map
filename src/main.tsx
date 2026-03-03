import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import posthog from 'posthog-js'
import './index.css'
import App from './App'

posthog.init(import.meta.env.VITE_POSTHOG_KEY as string, {
  api_host: '/ingest',
  ui_host: 'https://us.posthog.com',
  capture_pageview: true,
  capture_pageleave: true,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
