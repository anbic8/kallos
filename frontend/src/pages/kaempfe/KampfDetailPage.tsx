import { useEffect, useState, FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fetchKampfById, deleteKampf, createKampfEreignis, deleteKampfEreignis, fetchTechniken } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import type { Kampf, KampfEreignis, Technik, EreignisTyp, KaempferFarbe } from '../../api/types'
import { ABSCHLUSS_LABEL, KAMPFRUNDE_LABEL, EREIGNISTYP_LABEL, formatKampfzeit, formatZeitpunkt } from '../../api/types'

function SiegerBadge({ sieger }: { sieger: string }) {
  if (sieger === 'weiss') return <span className="px-3 py-1 rounded-full bg-gray-100 font-semibold text-sm">⬜ Sieg Weiss</span>
  if (sieger === 'blau') return <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">🟦 Sieg Blau</span>
  return <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold text-sm">🤝 Unentschieden</span>
}

const EREIGNIS_TYPEN: EreignisTyp[] = ['ippon', 'waza_ari', 'yuko', 'shido', 'hansoku_make', 'golden_score', 'medizin', 'sonstiges']

export default function KampfDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isTrainer } = useAuthStore()
  const [kampf, setKampf] = useState<Kampf | null>(null)
  const [techniken, setTechniken] = useState<Technik[]>([])
  const [loading, setLoading] = useState(true)
  const [showEreignisForm, setShowEreignisForm] = useState(false)
  const [savingEreignis, setSavingEreignis] = useState(false)
  const [ereignisForm, setEreignisForm] = useState({
    zeitpunkt_min: '',
    zeitpunkt_sek: '',
    typ: 'waza_ari' as EreignisTyp,
    farbe: 'weiss' as KaempferFarbe,
    technik_id: '',
    technik_frei: '',
    notiz: '',
  })

  const reload = () => {
    if (!id) return
    fetchKampfById(Number(id))
      .then(setKampf)
      .catch(() => navigate(-1))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
    fetchTechniken().then(setTechniken).catch(() => {})
  }, [id])

  const handleDeleteKampf = async () => {
    if (!kampf || !confirm('Diesen Kampf wirklich löschen?')) return
    await deleteKampf(kampf.id)
    navigate(-1)
  }

  const setEF = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setEreignisForm((f) => ({ ...f, [field]: e.target.value }))

  const handleAddEreignis = async (e: FormEvent) => {
    e.preventDefault()
    if (!kampf) return
    setSavingEreignis(true)
    const min = Number(ereignisForm.zeitpunkt_min || 0)
    const sek = Number(ereignisForm.zeitpunkt_sek || 0)
    const payload = {
      zeitpunkt_sek: (min || sek) ? min * 60 + sek : null,
      typ: ereignisForm.typ,
      farbe: ereignisForm.farbe,
      technik_id: ereignisForm.technik_id ? Number(ereignisForm.technik_id) : null,
      technik_frei: ereignisForm.technik_frei || null,
      notiz: ereignisForm.notiz || null,
    }
    try {
      await createKampfEreignis(kampf.id, payload)
      setShowEreignisForm(false)
      setEreignisForm({ zeitpunkt_min: '', zeitpunkt_sek: '', typ: 'waza_ari', farbe: 'weiss', technik_id: '', technik_frei: '', notiz: '' })
      reload()
    } finally {
      setSavingEreignis(false)
    }
  }

  const handleDeleteEreignis = async (e: KampfEreignis) => {
    if (!kampf) return
    await deleteKampfEreignis(kampf.id, e.id)
    reload()
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Laden...</div>
  if (!kampf) return null

  const weiss = kampf.kaempfer_weiss
  const blau = kampf.kaempfer_blau

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap text-lg font-bold">
              {weiss ? (
                <Link to={`/kaempfer/${weiss.id}`} className="hover:text-blue-700">
                  ⬜ {weiss.vorname} {weiss.nachname}
                </Link>
              ) : <span>⬜ Weiss</span>}
              <span className="text-gray-400 font-normal text-base">vs.</span>
              {blau ? (
                <Link to={`/kaempfer/${blau.id}`} className="hover:text-blue-700">
                  🟦 {blau.vorname} {blau.nachname}
                </Link>
              ) : <span>🟦 Blau</span>}
            </div>
            {kampf.veranstaltung && (
              <p className="text-sm text-gray-500">
                <Link to={`/veranstaltungen/${kampf.veranstaltung.id}`} className="hover:underline">
                  {kampf.veranstaltung.name}
                </Link>
                {kampf.veranstaltung.datum ? ` · ${new Date(kampf.veranstaltung.datum).toLocaleDateString('de-DE')}` : ''}
              </p>
            )}
          </div>
          {isTrainer() && (
            <Link to={`/veranstaltungen/${kampf.veranstaltung_id}/kaempfe/neu?edit=${kampf.id}`} className="btn-secondary text-sm flex-shrink-0">
              Bearbeiten
            </Link>
          )}
        </div>
      </div>

      {/* Ergebnis */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-700">Ergebnis</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <SiegerBadge sieger={kampf.sieger} />
          <span className="text-sm text-gray-700 font-medium">{ABSCHLUSS_LABEL[kampf.abschluss]}</span>
          {kampf.sieger_technik && <span className="text-sm text-gray-600">{kampf.sieger_technik.name}</span>}
          {kampf.sieger_technik_frei && <span className="text-sm text-gray-600">{kampf.sieger_technik_frei}</span>}
        </div>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {kampf.gewichtsklasse && <>
            <dt className="text-gray-500">Gewichtsklasse</dt>
            <dd className="font-medium">{kampf.gewichtsklasse.bezeichnung}</dd>
          </>}
          {kampf.runde && <>
            <dt className="text-gray-500">Runde</dt>
            <dd className="font-medium">{KAMPFRUNDE_LABEL[kampf.runde]}</dd>
          </>}
          {kampf.kampfzeit_sek != null && <>
            <dt className="text-gray-500">Kampfzeit</dt>
            <dd className="font-medium">{formatKampfzeit(kampf.kampfzeit_sek)}</dd>
          </>}
          {kampf.uhrzeit && <>
            <dt className="text-gray-500">Uhrzeit</dt>
            <dd className="font-medium">{kampf.uhrzeit.slice(0, 5)}</dd>
          </>}
          {kampf.is_scouting && <>
            <dt className="text-gray-500">Typ</dt>
            <dd className="font-medium">Scouting</dd>
          </>}
        </dl>
        {kampf.notizen && <p className="text-sm text-gray-600 whitespace-pre-wrap">{kampf.notizen}</p>}
      </div>

      {/* Timeline */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">Timeline ({kampf.ereignisse.length})</h2>
          {isTrainer() && (
            <button onClick={() => setShowEreignisForm(!showEreignisForm)} className="btn-secondary text-sm">
              {showEreignisForm ? 'Abbrechen' : '+ Ereignis'}
            </button>
          )}
        </div>

        {showEreignisForm && (
          <form onSubmit={handleAddEreignis} className="bg-gray-50 rounded-lg p-3 space-y-3 border border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Typ *</label>
                <select className="input" value={ereignisForm.typ} onChange={setEF('typ')}>
                  {EREIGNIS_TYPEN.map((t) => (
                    <option key={t} value={t}>{EREIGNISTYP_LABEL[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Kämpfer *</label>
                <div className="flex gap-1">
                  {(['weiss', 'blau'] as KaempferFarbe[]).map((f) => (
                    <label key={f} className={`flex-1 text-center p-1.5 rounded-lg border cursor-pointer text-sm transition-colors ${
                      ereignisForm.farbe === f ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'
                    }`}>
                      <input type="radio" name="farbe" value={f} checked={ereignisForm.farbe === f} onChange={setEF('farbe')} className="hidden" />
                      {f === 'weiss' ? '⬜' : '🟦'}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="label">Zeitpunkt</label>
              <div className="flex items-center gap-2">
                <input className="input w-16" type="number" min="0" placeholder="Min" value={ereignisForm.zeitpunkt_min} onChange={setEF('zeitpunkt_min')} />
                <span className="text-gray-400">:</span>
                <input className="input w-16" type="number" min="0" max="59" placeholder="Sek" value={ereignisForm.zeitpunkt_sek} onChange={setEF('zeitpunkt_sek')} />
              </div>
            </div>
            <div>
              <label className="label">Technik</label>
              <select className="input" value={ereignisForm.technik_id} onChange={setEF('technik_id')}>
                <option value="">-- keine --</option>
                {techniken.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={savingEreignis}>
              {savingEreignis ? 'Speichern...' : 'Ereignis hinzufügen'}
            </button>
          </form>
        )}

        {kampf.ereignisse.length === 0 && !showEreignisForm && (
          <p className="text-sm text-gray-400 text-center py-4">Keine Ereignisse erfasst.</p>
        )}

        <div className="space-y-1">
          {kampf.ereignisse.map((e) => (
            <div key={e.id} className="flex items-center gap-3 py-1.5 border-b border-gray-100 last:border-0">
              <span className="text-xs text-gray-400 w-10 flex-shrink-0 font-mono">
                {formatZeitpunkt(e.zeitpunkt_sek)}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${e.farbe === 'weiss' ? 'bg-gray-100' : 'bg-blue-100 text-blue-700'}`}>
                {e.farbe === 'weiss' ? '⬜' : '🟦'}
              </span>
              <span className="text-sm flex-1">
                <span className="font-medium">{EREIGNISTYP_LABEL[e.typ]}</span>
                {e.technik && <span className="text-gray-500"> · {e.technik.name}</span>}
                {e.technik_frei && <span className="text-gray-500"> · {e.technik_frei}</span>}
                {e.notiz && <span className="text-gray-400 text-xs"> ({e.notiz})</span>}
              </span>
              {isTrainer() && (
                <button onClick={() => handleDeleteEreignis(e)} className="text-red-400 hover:text-red-600 text-xs flex-shrink-0">✕</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {isTrainer() && (
        <button onClick={handleDeleteKampf} className="btn-danger w-full">
          Kampf löschen
        </button>
      )}
    </div>
  )
}
