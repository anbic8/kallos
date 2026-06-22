import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/kaempfer', label: 'Kämpfer', icon: '🥋' },
  { to: '/veranstaltungen', label: 'Turniere', icon: '🏆' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top-Navbar */}
      <header className="bg-blue-800 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">
          <span className="font-bold text-lg tracking-wide flex-shrink-0">JudoApp</span>

          {/* Desktop-Nav */}
          <nav className="hidden sm:flex items-center gap-1 flex-1">
            {NAV.map(({ to, label, icon }) => {
              const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  <span>{icon}</span>
                  {label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-blue-200 hidden sm:block">{user?.email}</span>
            <button onClick={handleLogout} className="text-sm text-blue-200 hover:text-white transition-colors">
              Abmelden
            </button>
          </div>
        </div>
      </header>

      {/* Inhalt */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Bottom-Nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex sm:hidden z-10">
        {NAV.map(({ to, label, icon }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                active ? 'text-blue-700 font-semibold' : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Desktop-Sidebar-Platzhalter (Abstand für Bottom-Nav auf Mobile) */}
      <div className="h-16 sm:hidden" />
    </div>
  )
}
