import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { fetchMe } from './api/client'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import KaempferListePage from './pages/kaempfer/KaempferListePage'
import KaempferProfilPage from './pages/kaempfer/KaempferProfilPage'
import KaempferFormPage from './pages/kaempfer/KaempferFormPage'

export default function App() {
  const { token, setUser } = useAuthStore()

  useEffect(() => {
    if (token) {
      fetchMe().then(setUser).catch(() => {})
    }
  }, [token, setUser])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/kaempfer" element={<KaempferListePage />} />
                  <Route path="/kaempfer/neu" element={<KaempferFormPage />} />
                  <Route path="/kaempfer/:id" element={<KaempferProfilPage />} />
                  <Route path="/kaempfer/:id/bearbeiten" element={<KaempferFormPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
