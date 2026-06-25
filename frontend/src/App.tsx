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
import VeranstaltungenListePage from './pages/veranstaltungen/VeranstaltungenListePage'
import VeranstaltungFormPage from './pages/veranstaltungen/VeranstaltungFormPage'
import VeranstaltungDetailPage from './pages/veranstaltungen/VeranstaltungDetailPage'
import KampfFormPage from './pages/kaempfe/KampfFormPage'
import KampfDetailPage from './pages/kaempfe/KampfDetailPage'
import StatistikPage from './pages/statistik/StatistikPage'
import ErfolgePage from './pages/erfolge/ErfolgePage'
import MannschaftskampfDetailPage from './pages/mannschaft/MannschaftskampfDetailPage'
import MannschaftskampfFormPage from './pages/mannschaft/MannschaftskampfFormPage'
import IKKZPage from './pages/ikkz/IKKZPage'
import LeistungstestPage from './pages/leistungstests/LeistungstestPage'
import VergleichPage from './pages/vergleich/VergleichPage'
import ScoutingPage from './pages/scouting/ScoutingPage'
import RanglistePage from './pages/rangliste/RanglistePage'
import GuertelPage from './pages/rangliste/GuertelPage'
import AdminPage from './pages/admin/AdminPage'
import DruckansichtPage from './pages/druck/DruckansichtPage'
import GruppenPage from './pages/gruppen/GruppenPage'

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
                  <Route path="/kaempfer/:id/statistik" element={<StatistikPage />} />
                  <Route path="/kaempfer/:id/erfolge" element={<ErfolgePage />} />
                  <Route path="/veranstaltungen" element={<VeranstaltungenListePage />} />
                  <Route path="/veranstaltungen/neu" element={<VeranstaltungFormPage />} />
                  <Route path="/veranstaltungen/:id" element={<VeranstaltungDetailPage />} />
                  <Route path="/veranstaltungen/:id/bearbeiten" element={<VeranstaltungFormPage />} />
                  <Route path="/veranstaltungen/:veranstaltungId/kaempfe/neu" element={<KampfFormPage />} />
                  <Route path="/kaempfe/:id" element={<KampfDetailPage />} />
                  <Route path="/veranstaltungen/:veranstaltungId/mannschaft/neu" element={<MannschaftskampfFormPage />} />
                  <Route path="/mannschaftskaempfe/:id" element={<MannschaftskampfDetailPage />} />
                  <Route path="/kaempfer/:id/ikkz" element={<IKKZPage />} />
                  <Route path="/kaempfer/:id/leistungstests" element={<LeistungstestPage />} />
                  <Route path="/vergleich" element={<VergleichPage />} />
                  <Route path="/scouting" element={<ScoutingPage />} />
                  <Route path="/rangliste" element={<RanglistePage />} />
                  <Route path="/guertel" element={<GuertelPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/kaempfer/:id/druck" element={<DruckansichtPage />} />
                  <Route path="/gruppen" element={<GruppenPage />} />
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
