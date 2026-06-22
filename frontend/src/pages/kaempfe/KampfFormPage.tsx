import { useEffect, useState, FormEvent } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchKaempfer, fetchVeranstaltungen, fetchGewichtsklassen, fetchTechniken, createKampf, updateKampf, fetchKampfById } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import type { Kaempfer, Veranstaltung, Gewichtsklasse, Technik, KampfRunde, Sieger, Abschluss } from '../../api/types'
import { KAMPFRUNDE_LABEL, ABSCHLUSS_LABEL } from '../../api/types'

const RUNDEN: KampfRunde[] = ['vorrunde', 'gruppenphase', 'viertelfinale', 'halbfinale', 'finale', 'direktkampf', 'sonstiges']
const ABSCHLUESSE: Abschluss[] = ['ippon', 'waza_ari', 'yusei_gachi', 'shido', 'hansoku_make', 'aufgabe', 'sonstiges']

function kaempferName(k: Kaempfer) {
  return `${k.nachname}, ${k.vorname}${k.verein ? ` (${k.verein.name})` : ''}`
}

export default function KampfFormPage() {
  const { veranstaltungId } = useParams<{ veranstaltungId: string }>()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const isEdit = Boolean(editId)
  const navigate = useNavigate()
  const { isTrainer } = useAuthStore()

  const [kaempfer, setKaempfer] = useState<Kaempfer[]>([])
  const [veranstaltungen, setVeranstaltungen] = useState<Veranstaltung[]>([])
  const [gewichtsklassen, setGewichtsklassen] = useState<Gewichtsklasse[]>([])
  const [techniken, setTechniken] = useState<Technik[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [technikFreitext, setTechnikFreitext] = useState(false)

  const [form, setForm] = useState({
    veranstaltung_id: veranstaltungId ?? '',
    kaempfer_weiss_id: '',
    kaempfer_blau_id: '',
    gewichtsklasse_id: '',
    runde: '' as KampfRunde | '',
    uhrzeit: '',
    sieger: 'weiss' as Sieger,
    abschluss: 'ippon' as Abschluss,
    sieger_technik_id: '',
    sieger_technik_frei: '',
    kampfzeit_min: '',
    kampfzeit_sek: '',
    is_scouting: false,
    notizen: '',
  })

  useEffect(() => {
    Promise.all([
      fetchKaempfer(),
      fetchVeranstaltungen(),
      fetchGewichtsklassen(),
      fetchTechniken(),
    ]).then(([k, v, g, t]) => {
      setKaempfer(k)
      setVeranstaltungen(v)
      setGewichtsklassen(g)
      setTechniken(t)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (isEdit && editId && !loading) {
      fetchKampfById(Number(editId)).then((k) => {
        const totalSek = k.kampfzeit_sek ?? 0
        setTechnikFreitext(Boolean(k.sieger_technik_frei && !k.sieger_technik_id))
        setForm({
          veranstaltung_id: String(k.veranstaltung_id),
          kaempfer_weiss_id: String(k.kaempfer_weiss_id),
          kaempfer_blau_id: String(k.kaempfer_blau_id),
          gewichtsklasse_id: k.gewichtsklasse_id ? String(k.gewichtsklasse_id) : '',
          runde: k.runde ?? '',
          uhrzeit: k.uhrzeit ?? '',
          sieger: k.sieger,
          abschluss: k.abschluss,
          sieger_technik_id: k.sieger_technik_id ? String(k.sieger_technik_id) : '',
          sieger_technik_frei: k.sieger_technik_frei ?? '',
          kampfzeit_min: totalSek ? String(Math.floor(totalSek / 60)) : '',
          kampfzeit_sek: totalSek ? String(totalSek % 60) : '',
          is_scouting: k.is_scouting,
          notizen: k.notizen ?? '',
        })
      })
    }
  }, [isEdit, editId, loading])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const setCheck = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.checked }))

  const swap = () => setForm((f) => ({ ...f, kaempfer_weiss_id: f.kaempfer_blau_id, kaempfer_blau_id: f.kaempfer_weiss_id }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.kaempfer_weiss_id || !form.kaempfer_blau_id || !form.veranstaltung_id) {
      setError('Bitte Weiss, Blau und Veranstaltung auswählen.')
      return
    }
    setError('')
    setSaving(true)
    const min = Number(form.kampfzeit_min || 0)
    const sek = Number(form.kampfzeit_sek || 0)
    const payload: Record<string, unknown> = {
      veranstaltung_id: Number(form.veranstaltung_id),
      kaempfer_weiss_id: Number(form.kaempfer_weiss_id),
      kaempfer_blau_id: Number(form.kaempfer_blau_id),
      gewichtsklasse_id: form.gewichtsklasse_id ? Number(form.gewichtsklasse_id) : null,
      runde: form.runde || null,
      uhrzeit: form.uhrzeit || null,
      sieger: form.sieger,
      abschluss: form.abschluss,
      sieger_technik_id: (!technikFreitext && form.sieger_technik_id) ? Number(form.sieger_technik_id) : null,
      sieger_technik_frei: (technikFreitext && form.sieger_technik_frei) ? form.sieger_technik_frei : null,
      kampfzeit_sek: (min || sek) ? min * 60 + sek : null,
      is_scouting: form.is_scouting,
      notizen: form.notizen || null,
    }
    try {
      if (isEdit && editId) {
        await updateKampf(Number(editId), payload)
        navigate(`/kaempfe/${editId}`)
      } else {
        const k = await createKampf(payload)
        navigate(`/kaempfe/${k.id}`)
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
      <h1 className="text-2xl font-bold">{isEdit ? 'Kampf bearbeiten' : 'Kampf erfassen'}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Kämpfer */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-700">Kämpfer</h2>
          <div>
            <label className="label">⬜ Weiss (erstgenannt) *</label>
            <select className="input" value={form.kaempfer_weiss_id} onChange={set('kaempfer_weiss_id')} required>
              <option value="">-- wählen --</option>
              {kaempfer.map((k) => (
                <option key={k.id} value={k.id}>{kaempferName(k)}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-center">
            <button type="button" onClick={swap} className="btn-secondary text-xs px-3 py-1">
              ⇅ tauschen
            </button>
          </div>
          <div>
            <label className="label">🟦 Blau (zweitgenannt) *</label>
            <select className="input" value={form.kaempfer_blau_id} onChange={set('kaempfer_blau_id')} required>
              <option value="">-- wählen --</option>
              {kaempfer.map((k) => (
                <option key={k.id} value={k.id}>{kaempferName(k)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Veranstaltung & Kategorie */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-700">Veranstaltung</h2>
          <div>
            <label className="label">Veranstaltung *</label>
            <select className="input" value={form.veranstaltung_id} onChange={set('veranstaltung_id')} required>
              <option value="">-- wählen --</option>
              {veranstaltungen.map((v) => (
                <option key={v.id} value={v.id}>{v.name}{v.datum ? ` (${new Date(v.datum).toLocaleDateString('de-DE')})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
              <label className="label">Runde</label>
              <select className="input" value={form.runde} onChange={set('runde')}>
                <option value="">--</option>
                {RUNDEN.map((r) => (
                  <option key={r} value={r}>{KAMPFRUNDE_LABEL[r]}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Uhrzeit</label>
            <input className="input" type="time" value={form.uhrzeit} onChange={set('uhrzeit')} />
          </div>
        </div>

        {/* Ergebnis */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-700">Ergebnis</h2>
          <div>
            <label className="label">Sieger *</label>
            <div className="flex gap-2">
              {(['weiss', 'blau', 'unentschieden'] as Sieger[]).map((s) => (
                <label key={s} className={`flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
                  form.sieger === s ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input type="radio" name="sieger" value={s} checked={form.sieger === s} onChange={set('sieger')} className="hidden" />
                  {s === 'weiss' ? '⬜ Weiss' : s === 'blau' ? '🟦 Blau' : '🤝 Unentschieden'}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Abschluss *</label>
            <select className="input" value={form.abschluss} onChange={set('abschluss')}>
              {ABSCHLUESSE.map((a) => (
                <option key={a} value={a}>{ABSCHLUSS_LABEL[a]}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Technik des Siegers</label>
              <button type="button" onClick={() => setTechnikFreitext(!technikFreitext)} className="text-xs text-blue-600 hover:underline">
                {technikFreitext ? 'Aus Katalog wählen' : 'Freitext eingeben'}
              </button>
            </div>
            {technikFreitext ? (
              <input className="input" placeholder="Technik-Name" value={form.sieger_technik_frei} onChange={set('sieger_technik_frei')} />
            ) : (
              <select className="input" value={form.sieger_technik_id} onChange={set('sieger_technik_id')}>
                <option value="">-- keine / unbekannt --</option>
                {techniken.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="label">Kampfzeit</label>
            <div className="flex items-center gap-2">
              <input className="input w-20" type="number" min="0" max="15" placeholder="Min" value={form.kampfzeit_min} onChange={set('kampfzeit_min')} />
              <span className="text-gray-400">:</span>
              <input className="input w-20" type="number" min="0" max="59" placeholder="Sek" value={form.kampfzeit_sek} onChange={set('kampfzeit_sek')} />
            </div>
          </div>
        </div>

        {/* Zusatz */}
        <div className="card space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_scouting} onChange={setCheck('is_scouting')} className="rounded" />
            <span className="text-sm font-medium text-gray-700">Scouting-Kampf (kein eigener Athlet beteiligt)</span>
          </label>
          <div>
            <label className="label">Notizen</label>
            <textarea className="input" rows={2} value={form.notizen} onChange={set('notizen')} />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3">
          <button type="button" className="btn-secondary flex-1" onClick={() => navigate(-1)}>Abbrechen</button>
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </form>
    </div>
  )
}
