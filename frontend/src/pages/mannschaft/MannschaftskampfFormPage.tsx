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
  const [form, setForm] = useState({ verein_heim_id: '', verein_gast_id: '' })

  useEffect(() => {
    fetchVereine().then(setVereine).catch(() => {})
  }, [])

  const set = (field: string) => (e: React.ChangeEvent<HTMLSelectElement>) =>
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
