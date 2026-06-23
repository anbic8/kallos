import { useEffect, useState, FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fetchKaempferById, fetchIKKZ, createIKKZ, deleteIKKZ, fetchTechniken, fetchKaempferStatistik } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import type { Kaempfer, IKKZEintrag, Technik, IKKZRichtung, IKKZSituation, KaempferStatistik } from '../../api/types'
import { IKKZ_RICHTUNG_LABEL, IKKZ_SITUATION_LABEL, IKKZ_PRIORITAET_LABEL } from '../../api/types'

const PRIO_STYLE: Record<number, { border: string; badge: string; icon: string }> = {
  1: { border: 'border-l-4 border-red-400', badge: 'bg-red-100 text-red-700', icon: '🎯' },
  2: { border: 'border-l-4 border-yellow-400', badge: 'bg-yellow-100 text-yellow-700', icon: '🔗' },
  3: { border: 'border-l-4 border-gray-300', badge: 'bg-gray-100 text-gray-600', icon: '🔄' },
}

const RICHTUNG_BADGE: Record<IKKZRichtung, string> = {
  rechts: 'bg-blue-100 text-blue-700',
  links: 'bg-purple-100 text-purple-700',
  beide: 'bg-green-100 text-green-700',
}

const SITUATION_BADGE: Record<IKKZSituation, string> = {
  angriff: 'bg-orange-100 text-orange-700',
  konter: 'bg-red-100 text-red-700',
  aufsetzer: 'bg-teal-100 text-teal-700',
  ne_waza_einstieg: 'bg-indigo-100 text-indigo-700',
  sonstiges: 'bg-gray-100 text-gray-600',
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
      fetchKaempferStatistik(Number(id)).catch(() => null),
    ])
      .then(([k, e, t, s]) => { setKaempfer(k as Kaempfer); setEintraege(e as IKKZEintrag[]); setTechniken(t as Technik[]); setStatistik(s as KaempferStatistik | null) })
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
        <div className="card bg-blue-50 border-blue-200">
          <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Tatsächliche Siegtechniken (Realität)</p>
          <div className="flex flex-wrap gap-2">
            {topTechniken.map((t, i) => (
              <span key={t.name} className="text-sm bg-white border border-blue-200 rounded-full px-3 py-0.5">
                <span className="text-blue-400 text-xs mr-1">{i + 1}.</span>
                {t.name}
                <span className="text-blue-600 font-bold ml-1">{t.anzahl}×</span>
              </span>
            ))}
          </div>
          {eintraege.length > 0 && (
            <p className="text-xs text-blue-500 mt-2">↕ Vergleich mit dem Kampfkonzept (Plan) unten</p>
          )}
        </div>
      )}

      {/* Formular */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-3">
          <h2 className="font-semibold">Neuer IKKZ-Eintrag</h2>
          <div>
            <label className="label">Priorität</label>
            <div className="grid grid-cols-3 gap-2">
              {([1, 2, 3] as const).map((p) => (
                <label key={p} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                  form.prioritaet === String(p) ? `${PRIO_STYLE[p].badge} border-transparent` : 'border-gray-200'
                }`}>
                  <input type="radio" name="prioritaet" value={p} checked={form.prioritaet === String(p)} onChange={set('prioritaet')} className="hidden" />
                  <span>{PRIO_STYLE[p].icon}</span>
                  <span className="leading-tight text-xs">{p === 1 ? 'Tokui-waza' : p === 2 ? 'Kombination' : 'Variante'}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Richtung</label>
              <select className="input" value={form.richtung} onChange={set('richtung')}>
                {(['rechts', 'links', 'beide'] as IKKZRichtung[]).map((r) => (
                  <option key={r} value={r}>{IKKZ_RICHTUNG_LABEL[r]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Situation</label>
              <select className="input" value={form.situation} onChange={set('situation')}>
                {(['angriff', 'konter', 'aufsetzer', 'ne_waza_einstieg', 'sonstiges'] as IKKZSituation[]).map((s) => (
                  <option key={s} value={s}>{IKKZ_SITUATION_LABEL[s]}</option>
                ))}
              </select>
            </div>
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

      {eintraege.length === 0 && !showForm && (
        <div className="card text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">🎯</p>
          <p>Noch kein Kampfkonzept eingetragen.</p>
        </div>
      )}

      {/* Einträge nach Priorität */}
      {([1, 2, 3] as const).map((prio) => {
        const gruppe = eintraege.filter((e) => e.prioritaet === prio)
        if (gruppe.length === 0) return null
        const style = PRIO_STYLE[prio]
        return (
          <div key={prio} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{style.icon}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                {IKKZ_PRIORITAET_LABEL[prio]}
              </span>
            </div>
            {gruppe.map((e) => (
              <div key={e.id} className={`bg-white rounded-xl shadow-sm border border-gray-200 p-3 pl-4 ${style.border}`}>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base">
                      {e.technik?.name ?? e.technik_frei ?? <span className="text-gray-400 italic">Keine Technik</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RICHTUNG_BADGE[e.richtung]}`}>
                        {IKKZ_RICHTUNG_LABEL[e.richtung]}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SITUATION_BADGE[e.situation]}`}>
                        {IKKZ_SITUATION_LABEL[e.situation]}
                      </span>
                    </div>
                    {e.notizen && <p className="text-xs text-gray-500 mt-1.5 italic">{e.notizen}</p>}
                  </div>
                  {isTrainer() && (
                    <button onClick={() => handleDelete(e)} className="text-red-300 hover:text-red-500 text-sm flex-shrink-0">✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
