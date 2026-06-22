import { useEffect, useState, FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fetchKaempferById, fetchLeistungstests, createLeistungstest, deleteLeistungstest } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import type { Kaempfer, Leistungstest } from '../../api/types'

export default function LeistungstestPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isTrainer } = useAuthStore()

  const [kaempfer, setKaempfer] = useState<Kaempfer | null>(null)
  const [tests, setTests] = useState<Leistungstest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterTyp, setFilterTyp] = useState('')
  const [form, setForm] = useState({
    datum: new Date().toISOString().split('T')[0],
    testtyp: '',
    messwert_zahl: '',
    messwert_text: '',
    einheit: '',
    notizen: '',
  })

  const reload = () => {
    if (!id) return
    fetchLeistungstests(Number(id)).then(setTests).catch(() => {})
  }

  useEffect(() => {
    if (!id) return
    Promise.all([fetchKaempferById(Number(id)), fetchLeistungstests(Number(id))])
      .then(([k, t]) => { setKaempfer(k); setTests(t) })
      .catch(() => navigate(-1))
      .finally(() => setLoading(false))
  }, [id])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!id || !form.testtyp) return
    setSaving(true)
    try {
      await createLeistungstest(Number(id), {
        datum: form.datum,
        testtyp: form.testtyp,
        messwert_zahl: form.messwert_zahl ? Number(form.messwert_zahl) : null,
        messwert_text: form.messwert_text || null,
        einheit: form.einheit || null,
        notizen: form.notizen || null,
      })
      setShowForm(false)
      setForm({ datum: new Date().toISOString().split('T')[0], testtyp: '', messwert_zahl: '', messwert_text: '', einheit: '', notizen: '' })
      reload()
    } catch (err: any) {
      alert(err.response?.data?.detail ?? 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (t: Leistungstest) => {
    if (!confirm('Test löschen?')) return
    await deleteLeistungstest(t.id)
    reload()
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Laden...</div>
  if (!kaempfer) return null

  const testtypen = [...new Set(tests.map((t) => t.testtyp))].sort()
  const gefiltert = filterTyp ? tests.filter((t) => t.testtyp === filterTyp) : tests

  // Verlauf pro Testtyp (nur numerische Werte, letzten 8)
  const verlaufTyp = filterTyp || (testtypen.length === 1 ? testtypen[0] : '')
  const verlauf = verlaufTyp
    ? tests.filter((t) => t.testtyp === verlaufTyp && t.messwert_zahl != null)
        .slice(0, 8).reverse()
    : []
  const maxWert = verlauf.length ? Math.max(...verlauf.map((t) => t.messwert_zahl!)) : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {kaempfer.foto_url
          ? <img src={kaempfer.foto_url} alt="" className="w-10 h-10 rounded-full object-cover" />
          : <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">🥋</div>
        }
        <div>
          <h1 className="text-xl font-bold">{kaempfer.vorname} {kaempfer.nachname} — Tests</h1>
          <Link to={`/kaempfer/${kaempfer.id}`} className="text-sm text-blue-600 hover:underline">← Profil</Link>
        </div>
        {isTrainer() && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary ml-auto text-sm">
            {showForm ? 'Abbrechen' : '+ Test'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-3">
          <h2 className="font-semibold">Neuer Leistungstest</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Datum *</label>
              <input className="input" type="date" value={form.datum} onChange={set('datum')} required />
            </div>
            <div>
              <label className="label">Testtyp *</label>
              <input className="input" list="testtypes" placeholder="z.B. Uchi-komi 30s" value={form.testtyp} onChange={set('testtyp')} required />
              <datalist id="testtypes">
                {testtypen.map((t) => <option key={t} value={t} />)}
              </datalist>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Messwert (Zahl)</label>
              <input className="input" type="number" step="any" placeholder="42" value={form.messwert_zahl} onChange={set('messwert_zahl')} />
            </div>
            <div>
              <label className="label">Einheit</label>
              <input className="input" placeholder="Wdh / kg / m" value={form.einheit} onChange={set('einheit')} />
            </div>
          </div>
          <div>
            <label className="label">Messwert (Text)</label>
            <input className="input" placeholder="sehr gut / bestanden" value={form.messwert_text} onChange={set('messwert_text')} />
          </div>
          <div>
            <label className="label">Notizen</label>
            <textarea className="input" rows={2} value={form.notizen} onChange={set('notizen')} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={saving}>{saving ? 'Speichern...' : 'Speichern'}</button>
        </form>
      )}

      {testtypen.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterTyp('')} className={`text-xs px-3 py-1 rounded-full border transition-colors ${!filterTyp ? 'bg-blue-700 text-white border-blue-700' : 'border-gray-300 text-gray-600'}`}>
            Alle
          </button>
          {testtypen.map((t) => (
            <button key={t} onClick={() => setFilterTyp(t)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${filterTyp === t ? 'bg-blue-700 text-white border-blue-700' : 'border-gray-300 text-gray-600'}`}>
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Verlaufsdiagramm */}
      {verlauf.length > 1 && (
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm">{verlaufTyp} — Verlauf</h2>
          <div className="flex items-end gap-2 h-20">
            {verlauf.map((t, i) => {
              const pct = maxWert > 0 ? (t.messwert_zahl! / maxWert) * 100 : 0
              const prev = i > 0 ? verlauf[i - 1].messwert_zahl! : null
              const trend = prev != null ? (t.messwert_zahl! > prev ? '↑' : t.messwert_zahl! < prev ? '↓' : '=') : ''
              return (
                <div key={t.id} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{trend}</span>
                  <div className="w-full bg-gray-100 rounded-t flex items-end" style={{ height: '48px' }}>
                    <div className="w-full bg-blue-500 rounded-t" style={{ height: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 font-mono">{t.messwert_zahl}{t.einheit ? ` ${t.einheit}` : ''}</span>
                  <span className="text-xs text-gray-400">{new Date(t.datum).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tests.length === 0 && !showForm && (
        <div className="card text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">📋</p>
          <p>Noch keine Leistungstests erfasst.</p>
        </div>
      )}

      <div className="space-y-2">
        {gefiltert.map((t) => (
          <div key={t.id} className="card flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{t.testtyp}</span>
                {t.messwert_zahl != null && (
                  <span className="font-bold text-blue-700">{t.messwert_zahl}{t.einheit ? ` ${t.einheit}` : ''}</span>
                )}
                {t.messwert_text && <span className="text-sm text-gray-600">{t.messwert_text}</span>}
              </div>
              <p className="text-xs text-gray-400">{new Date(t.datum).toLocaleDateString('de-DE')}</p>
              {t.notizen && <p className="text-xs text-gray-400 mt-0.5">{t.notizen}</p>}
            </div>
            {isTrainer() && (
              <button onClick={() => handleDelete(t)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
