import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, fetchMe } from '../api/client'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setToken, setUser } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { access_token } = await login(email, password)
      setToken(access_token)
      const user = await fetchMe()
      setUser(user)
      navigate('/')
    } catch {
      setError('E-Mail oder Passwort falsch')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="bg-white rounded-2xl px-6 py-4 inline-flex items-center justify-center mb-2">
            <img src="/logo.png" alt="Logo" className="h-16 w-auto" />
          </div>
          <p className="text-gray-400 mt-3">Kampfstatistiken & Coaching</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 shadow-2xl">
          <div>
            <label className="label">E-Mail</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Passwort</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-red-400 bg-red-950 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? 'Anmelden...' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  )
}
