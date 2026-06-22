import { useEffect, useRef, useState, FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  fetchKaempferById, fetchErfolge, fetchVeranstaltungen, fetchGewichtsklassen,
  createErfolg, deleteErfolg, uploadErfolgFoto,
} from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import type { Kaempfer, Erfolg, Veranstaltung, Gewichtsklasse, ErfolgKategorie } from '../../api/types'

const PLATZ_BADGE: Record<number, string> = {
  1: 'bg-yellow-400 text-yellow-900',
  2: 'bg-gray-300 text-gray-800',
  3: 'bg-amber-600 text-white',
}
const PLATZ_ICON: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function ErfolgePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isTrainer } = useAuthStore()

  const [kaempfer, setKaempfer] = useState<Kaempfer | null>(null)
  const [erfolge, setErfolge] = useState<Erfolg[]>([])
  const [veranstaltungen, setVeranstaltungen] = useState<Veranstaltung[]>([])
  const [gewichtsklassen, setGewichtsklassen] = useState<Gewichtsklasse[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    platz: '1',
    veranstaltung_id: '',
    gewichtsklasse_id: '',
    kategorie: 'einzel' as ErfolgKategorie,
    notizen: '',
  })
  const fotoRefs = useRef<Record<number, HTMLInputElement>>({})

  const reload = () => {
    if (!id) return
    fetchErfolge(Number(id)).then(setErfolge).catch(() => {})
  }

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetchKaempferById(Number(id)),
      fetchErfolge(Number(id)),
      fetchVeranstaltungen(),
      fetchGewichtsklassen(),
    ])
      .then(([k, e, v, g]) => { setKaempfer(k); setErfolge(e); setVeranstaltungen(v); setGewichtsklassen(g) })
      .catch(() => navigate(-1))
      .finally(() => setLoading(false))
  }, [id])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.veranstaltung_id) return
    setSaving(true)
    try {
      await createErfolg({
        kaempfer_id: Number(id),
        veranstaltung_id: Number(form.veranstaltung_id),
        gewichtsklasse_id: form.gewichtsklasse_id ? Number(form.gewichtsklasse_id) : null,
        platz: Number(form.platz),
        kategorie: form.kategorie,
        notizen: form.notizen || null,
      })
      setShowForm(false)
      setForm({ platz: '1', veranstaltung_id: '', gewichtsklasse_id: '', kategorie: 'einzel', notizen: '' })
      reload()
    } catch (err: any) {
      alert(err.response?.data?.detail ?? 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (e: Erfolg) => {
    if (!confirm('Diesen Erfolg wirklich löschen?')) return
    await deleteErfolg(e.id)
    reload()
  }

  const handleFotoChange = async (erfolg: Erfolg, file: File) => {
    const updated = await uploadErfolgFoto(erfolg.id, file)
    setErfolge((prev) => prev.map((e) => e.id === updated.id ? updated : e))
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Laden...</div>
  if (!kaempfer) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {kaempfer.foto_url
          ? <img src={kaempfer.foto_url} alt="" className="w-12 h-12 rounded-full object-cover" />
          : <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">🥋</div>
        }
        <div>
          <h1 className="text-xl font-bold">{kaempfer.vorname} {kaempfer.nachname}</h1>
          <Link to={`/kaempfer/${kaempfer.id}`} className="text-sm text-blue-600 hover:underline">← Profil</Link>
        </div>
        {isTrainer() && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary ml-auto text-sm">
            {showForm ? 'Abbrechen' : '+ Erfolg'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-3">
          <h2 className="font-semibold">Neuer Erfolg</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Platz *</label>
              <input className="input" type="number" min="1" value={form.platz} onChange={set('platz')} required />
            </div>
            <div>
              <label className="label">Kategorie</label>
              <select className="input" value={form.kategorie} onChange={set('kategorie')}>
                <option value="einzel">Einzel</option>
                <option value="mannschaft">Mannschaft</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Veranstaltung *</label>
            <select className="input" value={form.veranstaltung_id} onChange={set('veranstaltung_id')} required>
              <option value="">-- wählen --</option>
              {veranstaltungen.map((v) => (
                <option key={v.id} value={v.id}>{v.name}{v.datum ? ` (${new Date(v.datum).toLocaleDateString('de-DE')})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Gewichtsklasse</label>
            <select className="input" value={form.gewichtsklasse_id} onChange={set('gewichtsklasse_id')}>
              <option value="">--</option>
              {gewichtsklassen.map((g) => (
                <option key={g.id} value={g.id}>{g.bezeichnung}{g.altersklasse ? ` ${g.altersklasse}` : ''}{g.geschlecht ? ` ${g.geschlecht === 'm' ? 'H' : 'D'}` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Notizen</label>
            <textarea className="input" rows={2} value={form.notizen} onChange={set('notizen')} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </form>
      )}

      {erfolge.length === 0 && !showForm && (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">🏆</p>
          <p>Noch keine Erfolge eingetragen.</p>
        </div>
      )}

      <div className="space-y-3">
        {erfolge.map((e) => (
          <div key={e.id} className="card flex gap-4">
            {/* Foto */}
            <div
              className="relative w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden cursor-pointer"
              onClick={() => isTrainer() && fotoRefs.current[e.id]?.click()}
              title={isTrainer() ? 'Siegerehrungsfoto ändern' : ''}
            >
              {e.foto_url
                ? <img src={e.foto_url} alt="" className="w-full h-full object-cover" />
                : <span className="absolute inset-0 flex items-center justify-center text-3xl">{PLATZ_ICON[e.platz] ?? '🏅'}</span>
              }
              {isTrainer() && (
                <div className="absolute bottom-0 right-0 bg-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs">📷</div>
              )}
              <input
                ref={(el) => { if (el) fotoRefs.current[e.id] = el }}
                type="file" accept="image/*" className="hidden"
                onChange={(ev) => { const f = ev.target.files?.[0]; if (f) handleFotoChange(e, f) }}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${PLATZ_BADGE[e.platz] ?? 'bg-blue-100 text-blue-700'}`}>
                  {e.platz}. Platz
                </span>
                <span className="text-xs text-gray-500">{e.kategorie === 'mannschaft' ? 'Mannschaft' : 'Einzel'}</span>
              </div>
              <p className="font-semibold mt-1 truncate">
                {e.veranstaltung?.name ?? `Veranstaltung #${e.veranstaltung_id}`}
              </p>
              <p className="text-sm text-gray-500">
                {e.veranstaltung?.datum ? new Date(e.veranstaltung.datum).toLocaleDateString('de-DE') : ''}
                {e.gewichtsklasse ? ` · ${e.gewichtsklasse.bezeichnung}` : ''}
              </p>
              {e.notizen && <p className="text-xs text-gray-400 mt-1">{e.notizen}</p>}
            </div>

            {isTrainer() && (
              <button onClick={() => handleDelete(e)} className="text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
