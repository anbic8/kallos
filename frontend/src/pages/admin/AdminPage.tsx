import { useEffect, useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { fetchUsers, createUser, updateUser, fetchKaempfer, updateKaempfer, fetchKaempfe } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import type { User, Kaempfer, UserRolle, Kampf } from '../../api/types'

const ROLLE_BADGE: Record<UserRolle, string> = {
  admin: 'bg-red-100 text-red-700',
  trainer: 'bg-blue-100 text-blue-700',
  athlet: 'bg-gray-100 text-gray-600',
}

export default function AdminPage() {
  const { isAdmin } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [kaempfer, setKaempfer] = useState<Kaempfer[]>([])
  const [kaempfeMitVideo, setKaempfeMitVideo] = useState<Kampf[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '', rolle: 'athlet' as UserRolle })
  const [editForm, setEditForm] = useState({ email: '', password: '', rolle: 'athlet' as UserRolle })
  const [tab, setTab] = useState<'users' | 'sync'>('users')

  const reload = () => {
    Promise.all([fetchUsers(), fetchKaempfer(), fetchKaempfe()])
      .then(([u, k, kf]) => {
        setUsers(u)
        setKaempfer(k as Kaempfer[])
        setKaempfeMitVideo((kf as Kampf[]).filter((k) =>
          k.medien?.some((m) => m.typ === 'video' && m.datei_pfad)
        ))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [])

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((v) => ({ ...v, [f]: e.target.value }))
  const setEF = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setEditForm((v) => ({ ...v, [f]: e.target.value }))

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await createUser(form)
      setShowForm(false); setForm({ email: '', password: '', rolle: 'athlet' }); reload()
    } catch (err: any) { setError(err.response?.data?.detail ?? 'Fehler') }
    finally { setSaving(false) }
  }

  const handleEditSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!editUser) return
    setSaving(true)
    try {
      const payload: Record<string, string> = { rolle: editForm.rolle }
      if (editForm.email !== editUser.email) payload.email = editForm.email
      if (editForm.password) payload.password = editForm.password
      await updateUser(editUser.id, payload)
      setEditUser(null); reload()
    } catch (err: any) { setError(err.response?.data?.detail ?? 'Fehler') }
    finally { setSaving(false) }
  }

  const handleLink = async (userId: number, kaempferId: string) => {
    if (!kaempferId) return
    await updateKaempfer(Number(kaempferId), { user_id: userId })
    reload()
  }

  if (!isAdmin()) return <p className="text-center py-10 text-gray-400">Nur für Admins</p>
  if (loading) return <div className="text-center py-20 text-gray-400">Laden...</div>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin-Panel</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { key: 'users', label: `Benutzer (${users.length})` },
          { key: 'sync', label: `Video-Sync (${kaempfeMitVideo.length} Kämpfe)` },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`btn text-sm ${tab === key ? 'btn-primary' : 'btn-secondary'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Benutzer-Tab */}
      {tab === 'users' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
              {showForm ? 'Abbrechen' : '+ Benutzer anlegen'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleCreate} className="card space-y-3">
              <h2 className="font-semibold">Neuer Benutzer</h2>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">E-Mail *</label>
                  <input className="input" type="email" value={form.email} onChange={set('email')} required /></div>
                <div><label className="label">Passwort *</label>
                  <input className="input" type="password" value={form.password} onChange={set('password')} required /></div>
              </div>
              <div><label className="label">Rolle</label>
                <select className="input" value={form.rolle} onChange={set('rolle')}>
                  <option value="athlet">Athlet</option>
                  <option value="trainer">Trainer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" className="btn-primary w-full" disabled={saving}>{saving ? 'Speichern...' : 'Anlegen'}</button>
            </form>
          )}

          {/* Edit-Formular */}
          {editUser && (
            <form onSubmit={handleEditSave} className="card space-y-3 border-blue-200 bg-blue-50">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Benutzer bearbeiten: {editUser.email}</h2>
                <button type="button" onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">E-Mail</label>
                  <input className="input" type="email" value={editForm.email} onChange={setEF('email')} /></div>
                <div><label className="label">Neues Passwort (leer = unverändert)</label>
                  <input className="input" type="password" placeholder="••••••••" value={editForm.password} onChange={setEF('password')} /></div>
              </div>
              <div><label className="label">Rolle</label>
                <select className="input" value={editForm.rolle} onChange={setEF('rolle')}>
                  <option value="athlet">Athlet</option>
                  <option value="trainer">Trainer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" className="btn-primary w-full" disabled={saving}>{saving ? 'Speichern...' : 'Änderungen speichern'}</button>
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
                      <p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString('de-DE')}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLLE_BADGE[u.rolle]}`}>{u.rolle}</span>
                    <button onClick={() => { setEditUser(u); setEditForm({ email: u.email, password: '', rolle: u.rolle }); setError('') }}
                      className="text-xs text-blue-600 hover:underline flex-shrink-0">Bearbeiten</button>
                  </div>
                  <div className="flex items-center gap-2 text-sm border-t border-gray-100 pt-2">
                    <span className="text-gray-500 text-xs flex-shrink-0">Kämpfer:</span>
                    {linkedKaempfer ? (
                      <span className="text-green-700 font-medium flex-1">✓ {linkedKaempfer.vorname} {linkedKaempfer.nachname}</span>
                    ) : (
                      <select className="input flex-1 text-xs py-1" defaultValue="" onChange={(e) => handleLink(u.id, e.target.value)}>
                        <option value="">-- Kämpfer verknüpfen --</option>
                        {freieKaempfer.map((k) => (
                          <option key={k.id} value={k.id}>{k.vorname} {k.nachname}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Video-Sync-Tab */}
      {tab === 'sync' && (
        <div className="space-y-3">
          <div className="card bg-orange-50 border-orange-200">
            <p className="text-sm text-orange-700">
              <strong>Video-Sync:</strong> Kampf öffnen → Video abspielen → beim richtigen Moment auf <strong>📍 Sync</strong> klicken.
              Der aktuelle Video-Zeitpunkt wird dem Timeline-Ereignis zugeordnet.
            </p>
          </div>
          {kaempfeMitVideo.length === 0 ? (
            <div className="card text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">🎬</p>
              <p>Keine Kämpfe mit hochgeladenen Videos.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {kaempfeMitVideo.map((k) => {
                const weiss = k.kaempfer_weiss
                const blau = k.kaempfer_blau
                const syncedCount = k.ereignisse.filter((e) => e.video_timestamp_sek != null).length
                return (
                  <Link key={k.id} to={`/kaempfe/${k.id}`}
                    className="card flex items-center gap-3 hover:border-orange-300 transition-colors block">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {weiss ? `${weiss.vorname} ${weiss.nachname}` : '?'} vs. {blau ? `${blau.vorname} ${blau.nachname}` : '?'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {k.ereignisse.length} Ereignisse · {syncedCount} synchronisiert
                        {k.veranstaltung && ` · ${k.veranstaltung.name}`}
                      </p>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                      syncedCount === k.ereignisse.length && k.ereignisse.length > 0
                        ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {syncedCount}/{k.ereignisse.length} ✓
                    </div>
                    <span className="text-gray-400">›</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
