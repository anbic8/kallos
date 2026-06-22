import { useEffect, useState, FormEvent } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchVeranstaltungById, createVeranstaltung, updateVeranstaltung } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import type { VeranstaltungsTyp } from '../../api/types'
import { VERANSTALTUNGSTYP_LABEL } from '../../api/types'

const TYPEN: VeranstaltungsTyp[] = ['turnier', 'meisterschaft', 'pokal', 'liga', 'kampftag', 'sonstiges']

export default function VeranstaltungFormPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const ligaId = searchParams.get('liga_id')
  const typParam = searchParams.get('typ') as VeranstaltungsTyp | null
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { isTrainer } = useAuthStore()

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    typ: (typParam ?? 'turnier') as VeranstaltungsTyp,
    datum: '',
    ort: '',
    veranstalter: '',
    notizen: '',
  })

  useEffect(() => {
    if (isEdit && id) {
      fetchVeranstaltungById(Number(id))
        .then((v) => setForm({
          name: v.name,
          typ: v.typ,
          datum: v.datum ?? '',
          ort: v.ort ?? '',
          veranstalter: v.veranstalter ?? '',
          notizen: v.notizen ?? '',
        }))
        .catch(() => navigate('/veranstaltungen'))
        .finally(() => setLoading(false))
    }
  }, [id, isEdit, navigate])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    const payload = {
      name: form.name,
      typ: form.typ,
      datum: form.datum || undefined,
      ort: form.ort || undefined,
      veranstalter: form.veranstalter || undefined,
      notizen: form.notizen || undefined,
      parent_liga_id: ligaId ? Number(ligaId) : undefined,
    }
    try {
      if (isEdit && id) {
        await updateVeranstaltung(Number(id), payload)
        navigate(`/veranstaltungen/${id}`)
      } else {
        const v = await createVeranstaltung(payload as any)
        if (ligaId) navigate(`/veranstaltungen/${ligaId}`)
        else navigate(`/veranstaltungen/${v.id}`)
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
      <h1 className="text-2xl font-bold">{isEdit ? 'Veranstaltung bearbeiten' : 'Neue Veranstaltung'}</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Name *</label>
          <input className="input" value={form.name} onChange={set('name')} required placeholder="z.B. Bezirksmeisterschaft 2025" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Typ *</label>
            <select className="input" value={form.typ} onChange={set('typ')}>
              {TYPEN.map((t) => (
                <option key={t} value={t}>{VERANSTALTUNGSTYP_LABEL[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Datum</label>
            <input className="input" type="date" value={form.datum} onChange={set('datum')} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Ort</label>
            <input className="input" value={form.ort} onChange={set('ort')} placeholder="Stadt" />
          </div>
          <div>
            <label className="label">Veranstalter</label>
            <input className="input" value={form.veranstalter} onChange={set('veranstalter')} placeholder="Verband / Verein" />
          </div>
        </div>

        <div>
          <label className="label">Notizen</label>
          <textarea className="input" rows={3} value={form.notizen} onChange={set('notizen')} />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-secondary flex-1" onClick={() => navigate(-1)}>Abbrechen</button>
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </form>
    </div>
  )
}
