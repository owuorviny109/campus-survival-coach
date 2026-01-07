import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ProfileProvider } from './features/user-profile/ProfileContext'
import { ErrorBoundary } from './components/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <ProfileProvider>
                <App />
            </ProfileProvider>
        </ErrorBoundary>
    </React.StrictMode>,
)
