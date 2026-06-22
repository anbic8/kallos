import { useEffect, useState, FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchVereine, createMannschaftskampf } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import type { Verein } from '../../api/types'

export default function MannschaftskampfFormPage() {
  const { veranstaltungId } = useParams<{ veranstaltungId: string }>()
  const navigate = useNavigate()
  const { isTrainer } = useAuthStore()
  const [vereine, setVereine] = useState<Verein[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    verein_heim_id: '',
    verein_gast_id: '',
    siege_heim_direkt: '',
    siege_gast_direkt: '',
  })

  useEffect(() => {
    fetchVereine().then(setVereine).catch(() => {})
  }, [])

  const set = (field: string) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.verein_heim_id || !form.verein_gast_id) { setError('Beide Vereine wählen.'); return }
    if (form.verein_heim_id === form.verein_gast_id) { setError('Heim und Gast müssen verschieden sein.'); return }
    setSaving(true)
    try {
      const mk = await createMannschaftskampf({
        veranstaltung_id: Number(veranstaltungId),
        verein_heim_id: Number(form.verein_heim_id),
        verein_gast_id: Number(form.verein_gast_id),
        siege_heim_direkt: form.siege_heim_direkt !== '' ? Number(form.siege_heim_direkt) : null,
        siege_gast_direkt: form.siege_gast_direkt !== '' ? Number(form.siege_gast_direkt) : null,
      })
      navigate(`/mannschaftskaempfe/${mk.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  if (!isTrainer()) return <p className="text-center py-10 text-gray-400">Kein Zugriff</p>

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Mannschaftskampf erfassen</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">🏠 Heimverein *</label>
          <select className="input" value={form.verein_heim_id} onChange={set('verein_heim_id')} required>
            <option value="">-- wählen --</option>
            {vereine.map((v) => <option key={v.id} value={v.id}>{v.name}{v.ort ? ` (${v.ort})` : ''}</option>)}
          </select>
        </div>
        <div>
          <label className="label">✈️ Gastverein *</label>
          <select className="input" value={form.verein_gast_id} onChange={set('verein_gast_id')} required>
            <option value="">-- wählen --</option>
            {vereine.map((v) => <option key={v.id} value={v.id}>{v.name}{v.ort ? ` (${v.ort})` : ''}</option>)}
          </select>
        </div>

        <div className="border-t border-gray-100 pt-3">
          <p className="text-sm text-gray-500 mb-2">Direktes Ergebnis (optional — falls Einzelkämpfe nicht bekannt)</p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="label text-xs">Siege Heim</label>
              <input className="input text-center text-lg font-bold" type="number" min="0" max="20"
                placeholder="–" value={form.siege_heim_direkt} onChange={set('siege_heim_direkt')} />
            </div>
            <span className="text-gray-400 text-xl font-bold mt-5">:</span>
            <div className="flex-1">
              <label className="label text-xs">Siege Gast</label>
              <input className="input text-center text-lg font-bold" type="number" min="0" max="20"
                placeholder="–" value={form.siege_gast_direkt} onChange={set('siege_gast_direkt')} />
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-secondary flex-1" onClick={() => navigate(-1)}>Abbrechen</button>
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Speichern...' : 'Anlegen'}
          </button>
        </div>
      </form>
    </div>
  )
}
