import { StrictMode } from 'react'
import { BrowserRouter } from 'react-router'
import { CookiesProvider } from 'react-cookie'
import { createRoot } from 'react-dom/client'

// import './index.css'
import App from './app'

const rootElement = document.getElementById('root')
if (!rootElement) {
    throw new Error('Root element not found')
}

createRoot(rootElement).render(
    <StrictMode>
        <CookiesProvider>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </CookiesProvider>
    </StrictMode>,
)
