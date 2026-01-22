import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Chat from './page.jsx'

import { PeerProvider } from './peer.jsx'

createRoot(document.getElementById('root')).render(
 // <StrictMode>
    <BrowserRouter>
    <PeerProvider>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
      </PeerProvider>
    </BrowserRouter>
 // </StrictMode>,
)
