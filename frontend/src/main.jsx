import { StrictMode } from 'react'
import { BrowserRouter } from 'react-router'
import { CookiesProvider } from 'react-cookie'
import { createRoot } from 'react-dom/client'

// import './index.css'
import App from './app'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CookiesProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </CookiesProvider>
  </StrictMode>,
)
