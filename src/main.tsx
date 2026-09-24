import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonts are bundled (OFL licence) so the app looks the same offline.
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/space-mono/400.css'
import '@fontsource/space-mono/700.css'
import './index.css'
import App from './App.tsx'
import { watchForUpdates } from './lib/update'

watchForUpdates()
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
