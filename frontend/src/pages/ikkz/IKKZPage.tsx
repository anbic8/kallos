import { useEffect, useState, FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fetchKaempferById, fetchIKKZ, createIKKZ, deleteIKKZ, fetchTechniken, fetchKaempferStatistik } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import type { Kaempfer, IKKZEintrag, Technik, IKKZRichtung, IKKZSituation, KaempferStatistik } from '../../api/types'
import { IKKZ_RICHTUNG_LABEL, IKKZ_SITUATION_LABEL, IKKZ_PRIORITAET_LABEL } from '../../api/types'

const PRIORITAET_COLOR: Record<number, string> = {
  1: 'bg-red-100 text-red-700 border-red-200',
  2: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  3: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function IKKZPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isTrainer } = useAuthStore()

  const [kaempfer, setKaempfer] = useState<Kaempfer | null>(null)
  const [eintraege, setEintraege] = useState<IKKZEintrag[]>([])
  const [techniken, setTechniken] = useState<Technik[]>([])
  const [statistik, setStatistik] = useState<KaempferStatistik | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [technikFreitext, setTechnikFreitext] = useState(false)
  const [form, setForm] = useState({
    prioritaet: '1',
    richtung: 'rechts' as IKKZRichtung,
    situation: 'angriff' as IKKZSituation,
    technik_id: '',
    technik_frei: '',
    notizen: '',
  })

  const reload = () => {
    if (!id) return
    fetchIKKZ(Number(id)).then(setEintraege).catch(() => {})
  }

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetchKaempferById(Number(id)),
      fetchIKKZ(Number(id)),
      fetchTechniken(),
      fetchKaempferStatistik(Number(id)),
    ])
      .then(([k, e, t, s]) => { setKaempfer(k); setEintraege(e); setTechniken(t); setStatistik(s) })
      .catch(() => navigate(-1))
      .finally(() => setLoading(false))
  }, [id])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    try {
      await createIKKZ(Number(id), {
        prioritaet: Number(form.prioritaet),
        richtung: form.richtung,
        situation: form.situation,
        technik_id: (!technikFreitext && form.technik_id) ? Number(form.technik_id) : null,
        technik_frei: (technikFreitext && form.technik_frei) ? form.technik_frei : null,
        notizen: form.notizen || null,
      })
      setShowForm(false)
      setForm({ prioritaet: '1', richtung: 'rechts', situation: 'angriff', technik_id: '', technik_frei: '', notizen: '' })
      reload()
    } catch (err: any) {
      alert(err.response?.data?.detail ?? 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (e: IKKZEintrag) => {
    if (!confirm('Eintrag löschen?')) return
    await deleteIKKZ(e.id)
    reload()
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Laden...</div>
  if (!kaempfer) return null

  const topTechniken = statistik?.techniken.slice(0, 5) ?? []
  const grouped = [1, 2, 3].map((p) => ({
    prioritaet: p,
    eintraege: eintraege.filter((e) => e.prioritaet === p),
  }))

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        {kaempfer.foto_url
          ? <img src={kaempfer.foto_url} alt="" className="w-10 h-10 rounded-full object-cover" />
          : <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">🥋</div>
        }
        <div>
          <h1 className="text-xl font-bold">{kaempfer.vorname} {kaempfer.nachname} — IKKZ</h1>
          <Link to={`/kaempfer/${kaempfer.id}`} className="text-sm text-blue-600 hover:underline">← Profil</Link>
        </div>
        {isTrainer() && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary ml-auto text-sm">
            {showForm ? 'Abbrechen' : '+ Eintrag'}
          </button>
        )}
      </div>

      {/* Plan vs. Realität */}
      {topTechniken.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-2">Tatsächliche Siegtechniken</h2>
          <div className="space-y-1">
            {topTechniken.map((t, i) => (
              <div key={t.name} className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 w-4">{i + 1}.</span>
                <span className="flex-1">{t.name}</span>
                <span className="text-gray-500">{t.anzahl}×</span>
              </div>
            ))}
          </div>
          {eintraege.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">↑ Vergleich mit dem IKKZ-Plan unten</p>
          )}
        </div>
      )}

      {/* Formular */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-3">
          <h2 className="font-semibold">Neuer IKKZ-Eintrag</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Priorität</label>
              <select className="input" value={form.prioritaet} onChange={set('prioritaet')}>
                <option value="1">1 — Tokui-waza (Hauptwaffe)</option>
                <option value="2">2 — Kombinationspartner</option>
                <option value="3">3 — Variante</option>
              </select>
            </div>
            <div>
              <label className="label">Richtung</label>
              <select className="input" value={form.richtung} onChange={set('richtung')}>
                {(['rechts', 'links', 'beide'] as IKKZRichtung[]).map((r) => (
                  <option key={r} value={r}>{IKKZ_RICHTUNG_LABEL[r]}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Situation</label>
            <select className="input" value={form.situation} onChange={set('situation')}>
              {(['angriff', 'konter', 'aufsetzer', 'ne_waza_einstieg', 'sonstiges'] as IKKZSituation[]).map((s) => (
                <option key={s} value={s}>{IKKZ_SITUATION_LABEL[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Technik</label>
              <button type="button" onClick={() => setTechnikFreitext(!technikFreitext)} className="text-xs text-blue-600 hover:underline">
                {technikFreitext ? 'Aus Katalog' : 'Freitext'}
              </button>
            </div>
            {technikFreitext
              ? <input className="input" placeholder="Technikname" value={form.technik_frei} onChange={set('technik_frei')} />
              : <select className="input" value={form.technik_id} onChange={set('technik_id')}>
                  <option value="">-- keine spezifische Technik --</option>
                  {techniken.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            }
          </div>
          <div>
            <label className="label">Notizen</label>
            <textarea className="input" rows={2} value={form.notizen} onChange={set('notizen')} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Speichern...' : 'Hinzufügen'}
          </button>
        </form>
      )}

      {/* Einträge nach Priorität */}
      {eintraege.length === 0 && !showForm && (
        <div className="card text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">🎯</p>
          <p>Noch kein Kampfkonzept eingetragen.</p>
        </div>
      )}

      {grouped.map(({ prioritaet, eintraege: pEintraege }) => pEintraege.length > 0 && (
        <div key={prioritaet} className="card space-y-2">
          <h2 className={`text-sm font-semibold px-2 py-1 rounded-lg border inline-block ${PRIORITAET_COLOR[prioritaet]}`}>
            {IKKZ_PRIORITAET_LABEL[prioritaet]}
          </h2>
          <div className="space-y-2">
            {pEintraege.map((e) => (
              <div key={e.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {e.technik?.name ?? e.technik_frei ?? '—'}
                    </span>
                    <span className="text-xs text-gray-500">{IKKZ_RICHTUNG_LABEL[e.richtung]}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                      {IKKZ_SITUATION_LABEL[e.situation]}
                    </span>
                  </div>
                  {e.notizen && <p className="text-xs text-gray-400 mt-1">{e.notizen}</p>}
                </div>
                {isTrainer() && (
                  <button onClick={() => handleDelete(e)} className="text-red-400 hover:text-red-600 text-xs flex-shrink-0">✕</button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
