import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './i18n/LanguageContext'
import { AgendaProvider } from './context/AgendaContext'
import { MeetingsProvider } from './context/MeetingsContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <MeetingsProvider>
          <AgendaProvider>
            <App />
          </AgendaProvider>
        </MeetingsProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
