import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// If a dynamic import fails because this tab is running an older build than what's now
// deployed (hashed chunk filenames change on every build), reload once to pick up the
// current build instead of leaving the user with a dead "failed to fetch module" error.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  const reloadKey = 'manifest-chunk-reload-attempted'
  if (!sessionStorage.getItem(reloadKey)) {
    sessionStorage.setItem(reloadKey, '1')
    window.location.reload()
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)

// The app rendered successfully on this load, so any earlier reload-guard no longer applies —
// clear it so a *future* redeploy can still trigger one more auto-recovery reload.
window.setTimeout(() => sessionStorage.removeItem('manifest-chunk-reload-attempted'), 3000)
