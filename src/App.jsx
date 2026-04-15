import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { Sidebar } from './components/admin/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { ContentPage } from './pages/ContentPage'
import { ScreensPage } from './pages/ScreensPage'
import { ProgramarPage } from './pages/ProgramarPage'
import { AnnouncementsPage, SchedulesPage } from './pages/AnnSchedulePages'
import { PreferencesPage } from './pages/PreferencesPage'
import { PlayerScreen } from './components/player/PlayerScreen'
import { ToastContainer } from './components/shared/Toast'
import './index.css'

// Layout del panel admin
function AdminLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}

// El componente ProgramarPage se encuentra ahora en su propio archivo ./pages/ProgramarPage.jsx

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Panel Admin */}
          <Route path="/admin" element={<AdminLayout><Dashboard /></AdminLayout>} />
          <Route path="/admin/contenido" element={<AdminLayout><ContentPage /></AdminLayout>} />
          <Route path="/admin/pantallas" element={<AdminLayout><ScreensPage /></AdminLayout>} />
          <Route path="/admin/programar" element={<AdminLayout><ProgramarPage /></AdminLayout>} />
          <Route path="/admin/anuncios" element={<AdminLayout><AnnouncementsPage /></AdminLayout>} />
          <Route path="/admin/horarios" element={<AdminLayout><SchedulesPage /></AdminLayout>} />
          <Route path="/admin/preferencias" element={<AdminLayout><PreferencesPage /></AdminLayout>} />

          {/* Reproductores de pantalla */}
          <Route path="/pantalla1" element={<PlayerScreen screenIndex={0} />} />
          <Route path="/pantalla2" element={<PlayerScreen screenIndex={1} />} />

          {/* Redirect */}
          <Route path="/" element={<Navigate to="/admin" />} />
          <Route path="*" element={<Navigate to="/admin" />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </AppProvider>
  )
}
