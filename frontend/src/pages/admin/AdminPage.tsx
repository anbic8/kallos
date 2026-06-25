import { useEffect, useRef, useState, FormEvent } from 'react'
import { fetchUsers, createUser, updateUser, fetchKaempfer, updateKaempfer } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import type { User, Kaempfer, UserRolle } from '../../api/types'

const ROLLE_BADGE: Record<UserRolle, string> = {
  admin: 'bg-red-100 text-red-700',
  trainer: 'bg-blue-100 text-blue-700',
  athlet: 'bg-gray-100 text-gray-600',
}

export default function AdminPage() {
  const { isAdmin } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [kaempfer, setKaempfer] = useState<Kaempfer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '', rolle: 'athlet' as UserRolle })

  const reload = () => {
    Promise.all([fetchUsers(), fetchKaempfer()])
      .then(([u, k]) => { setUsers(u); setKaempfer(k as Kaempfer[]) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [])

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((v) => ({ ...v, [f]: e.target.value }))

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await createUser(form)
      setShowForm(false)
      setForm({ email: '', password: '', rolle: 'athlet' })
      reload()
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Fehler')
    } finally { setSaving(false) }
  }

  const handleRolle = async (user: User, rolle: UserRolle) => {
    await updateUser(user.id, { rolle })
    reload()
  }

  const handleLink = async (userId: number, kaempferId: string) => {
    if (!kaempferId) return
    await updateKaempfer(Number(kaempferId), { user_id: userId })
    reload()
  }

  const linkedKaempferIds = new Set(kaempfer.filter((k) => k.user_id).map((k) => k.user_id))

  if (!isAdmin()) return <p className="text-center py-10 text-gray-400">Nur für Admins</p>
  if (loading) return <div className="text-center py-20 text-gray-400">Laden...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin-Panel</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          {showForm ? 'Abbrechen' : '+ Benutzer anlegen'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-3">
          <h2 className="font-semibold">Neuer Benutzer</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">E-Mail *</label>
              <input className="input" type="email" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label">Passwort *</label>
              <input className="input" type="password" value={form.password} onChange={set('password')} required />
            </div>
          </div>
          <div>
            <label className="label">Rolle</label>
            <select className="input" value={form.rolle} onChange={set('rolle')}>
              <option value="athlet">Athlet</option>
              <option value="trainer">Trainer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Speichern...' : 'Anlegen'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {users.map((u) => {
          const linkedKaempfer = kaempfer.find((k) => k.user_id === u.id)
          const freieKaempfer = kaempfer.filter((k) => !k.user_id || k.user_id === u.id)
          return (
            <div key={u.id} className="card space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{u.email}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(u.created_at).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <select
                  value={u.rolle}
                  onChange={(e) => handleRolle(u, e.target.value as UserRolle)}
                  className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${ROLLE_BADGE[u.rolle]}`}
                >
                  <option value="athlet">Athlet</option>
                  <option value="trainer">Trainer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Kämpfer-Verknüpfung */}
              <div className="flex items-center gap-2 text-sm border-t border-gray-100 pt-2">
                <span className="text-gray-500 text-xs flex-shrink-0">Kämpfer:</span>
                {linkedKaempfer ? (
                  <span className="text-green-700 font-medium flex-1">
                    ✓ {linkedKaempfer.vorname} {linkedKaempfer.nachname}
                  </span>
                ) : (
                  <select
                    className="input flex-1 text-xs py-1"
                    defaultValue=""
                    onChange={(e) => handleLink(u.id, e.target.value)}
                  >
                    <option value="">-- Kämpfer verknüpfen --</option>
                    {freieKaempfer.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.vorname} {k.nachname}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
