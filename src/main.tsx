import 'material-symbols/outlined.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './i18n/LanguageContext'
import { AgendaProvider } from './context/AgendaContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AgendaProvider>
          <App />
        </AgendaProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
