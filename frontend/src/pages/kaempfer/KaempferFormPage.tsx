import { useEffect, useState, FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchKaempferById, createKaempfer, updateKaempfer, fetchVereine } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import type { Kaempfer, Verein, Guertel, Geschlecht } from '../../api/types'
import { GUERTEL_LABEL } from '../../api/types'

const GUERTEL_OPTIONS: Guertel[] = ['weiss', 'gelb', 'orange', 'gruen', 'blau', 'braun', 'schwarz', 'dan2', 'dan3', 'dan4', 'dan5']

export default function KaempferFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { isTrainer } = useAuthStore()

  const [vereine, setVereine] = useState<Verein[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    vorname: '',
    nachname: '',
    verein_id: '' as string | number,
    geburtsjahr: '' as string | number,
    geschlecht: '' as Geschlecht | '',
    aktueller_guertel: '' as Guertel | '',
    notizen: '',
  })

  useEffect(() => {
    fetchVereine().then(setVereine).catch(() => {})
    if (isEdit && id) {
      fetchKaempferById(Number(id))
        .then((k: Kaempfer) => {
          setForm({
            vorname: k.vorname,
            nachname: k.nachname,
            verein_id: k.verein_id ?? '',
            geburtsjahr: k.geburtsjahr ?? '',
            geschlecht: k.geschlecht ?? '',
            aktueller_guertel: k.aktueller_guertel ?? '',
            notizen: k.notizen ?? '',
          })
        })
        .catch(() => navigate('/kaempfer'))
        .finally(() => setLoading(false))
    }
  }, [id, isEdit, navigate])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    const payload: Partial<Kaempfer> = {
      vorname: form.vorname,
      nachname: form.nachname,
      verein_id: form.verein_id !== '' ? Number(form.verein_id) : undefined,
      geburtsjahr: form.geburtsjahr !== '' ? Number(form.geburtsjahr) : undefined,
      geschlecht: (form.geschlecht || undefined) as Geschlecht | undefined,
      aktueller_guertel: (form.aktueller_guertel || undefined) as Guertel | undefined,
      notizen: form.notizen || undefined,
    }
    try {
      if (isEdit && id) {
        await updateKaempfer(Number(id), payload)
        navigate(`/kaempfer/${id}`)
      } else {
        const k = await createKaempfer(payload)
        navigate(`/kaempfer/${k.id}`)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  if (!isTrainer()) return <p className="text-center py-10 text-gray-400">Kein Zugriff</p>
  if (loading) return <div className="text-center py-20 text-gray-400">Laden...</div>

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{isEdit ? 'Kämpfer bearbeiten' : 'Neuer Kämpfer'}</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Vorname *</label>
            <input className="input" value={form.vorname} onChange={set('vorname')} required />
          </div>
          <div>
            <label className="label">Nachname *</label>
            <input className="input" value={form.nachname} onChange={set('nachname')} required />
          </div>
        </div>

        <div>
          <label className="label">Verein</label>
          <select className="input" value={form.verein_id} onChange={set('verein_id')}>
            <option value="">-- Kein Verein (extern) --</option>
            {vereine.map((v) => (
              <option key={v.id} value={v.id}>{v.name}{v.ort ? ` (${v.ort})` : ''}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Jahrgang</label>
            <input className="input" type="number" min="1950" max="2020" value={form.geburtsjahr} onChange={set('geburtsjahr')} />
          </div>
          <div>
            <label className="label">Geschlecht</label>
            <select className="input" value={form.geschlecht} onChange={set('geschlecht')}>
              <option value="">--</option>
              <option value="m">Männlich</option>
              <option value="w">Weiblich</option>
              <option value="d">Divers</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Aktueller Gürtel</label>
          <select className="input" value={form.aktueller_guertel} onChange={set('aktueller_guertel')}>
            <option value="">--</option>
            {GUERTEL_OPTIONS.map((g) => (
              <option key={g} value={g}>{GUERTEL_LABEL[g]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Notizen</label>
          <textarea className="input" rows={3} value={form.notizen} onChange={set('notizen')} />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-secondary flex-1" onClick={() => navigate(-1)}>
            Abbrechen
          </button>
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </form>
    </div>
  )
}
