import { useEffect, useRef, useState, FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fetchKampfById, deleteKampf, createKampfEreignis, updateKampfEreignis, deleteKampfEreignis, fetchTechniken, addKampfMedien, deleteKampfMedien } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import type { Kampf, KampfEreignis, KampfMedien, Technik, EreignisTyp, KaempferFarbe, MedienTyp } from '../../api/types'
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
  const [editEreignis, setEditEreignis] = useState<KampfEreignis | null>(null)
  const [showMedienForm, setShowMedienForm] = useState(false)
  const [savingMedien, setSavingMedien] = useState(false)
  const [medienModus, setMedienModus] = useState<'upload' | 'url'>('upload')
  const [medienForm, setMedienForm] = useState({ typ: 'foto' as MedienTyp, externe_url: '', timestamp_sek: '', beschriftung: '' })
  const medienFileRef = useRef<HTMLInputElement>(null)
  const [syncModus, setSyncModus] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const videoRefs = useRef<Record<number, HTMLVideoElement>>({})

  const seekVideo = (medienId: number, sek: number) => {
    const v = videoRefs.current[medienId]
    if (!v) return
    v.currentTime = sek
    v.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const isYoutube = (url: string) => url.includes('youtube.com') || url.includes('youtu.be')
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
      if (editEreignis) {
        await updateKampfEreignis(kampf.id, editEreignis.id, payload)
        setEditEreignis(null)
      } else {
        await createKampfEreignis(kampf.id, payload)
      }
      setShowEreignisForm(false)
      setEreignisForm({ zeitpunkt_min: '', zeitpunkt_sek: '', typ: 'waza_ari', farbe: 'weiss', technik_id: '', technik_frei: '', notiz: '' })
      reload()
    } finally {
      setSavingEreignis(false)
    }
  }

  const syncEreignisVideo = async (e: KampfEreignis) => {
    if (!kampf) return
    const videoId = kampf.medien.find((m) => m.typ === 'video' && m.datei_pfad)?.id
    if (!videoId) return
    const v = videoRefs.current[videoId]
    if (!v) return
    const sek = Math.floor(v.currentTime)
    await updateKampfEreignis(kampf.id, e.id, {
      zeitpunkt_sek: e.zeitpunkt_sek ?? null,
      typ: e.typ, farbe: e.farbe,
      technik_id: e.technik_id ?? null,
      technik_frei: e.technik_frei ?? null,
      notiz: e.notiz ?? null,
      video_timestamp_sek: sek,
    })
    reload()
  }

  const seekEreignisVideo = (sek: number) => {
    const videoId = kampf?.medien.find((m) => m.typ === 'video' && m.datei_pfad)?.id
    if (!videoId) return
    seekVideo(videoId, sek)
  }

  const handleDeleteEreignis = async (e: KampfEreignis) => {
    if (!kampf) return
    await deleteKampfEreignis(kampf.id, e.id)
    reload()
  }

  const handleEditEreignis = (e: KampfEreignis) => {
    const min = e.zeitpunkt_sek != null ? String(Math.floor(e.zeitpunkt_sek / 60)) : ''
    const sek = e.zeitpunkt_sek != null ? String(e.zeitpunkt_sek % 60) : ''
    setEreignisForm({
      zeitpunkt_min: min,
      zeitpunkt_sek: sek,
      typ: e.typ,
      farbe: e.farbe,
      technik_id: e.technik_id ? String(e.technik_id) : '',
      technik_frei: e.technik_frei ?? '',
      notiz: e.notiz ?? '',
    })
    setEditEreignis(e)
    setShowEreignisForm(true)
  }

  const handleAddMedien = async (e: FormEvent) => {
    e.preventDefault()
    if (!kampf) return
    setSavingMedien(true)
    try {
      const fd = new FormData()
      fd.append('typ', medienForm.typ)
      if (medienForm.beschriftung) fd.append('beschriftung', medienForm.beschriftung)
      if (medienForm.timestamp_sek) fd.append('timestamp_sek', medienForm.timestamp_sek)
      if (medienModus === 'url') {
        fd.append('externe_url', medienForm.externe_url)
      } else {
        const file = medienFileRef.current?.files?.[0]
        if (!file) { setSavingMedien(false); return }
        fd.append('datei', file)
      }
      await addKampfMedien(kampf.id, fd)
      setShowMedienForm(false)
      setMedienForm({ typ: 'foto', externe_url: '', timestamp_sek: '', beschriftung: '' })
      if (medienFileRef.current) medienFileRef.current.value = ''
      reload()
    } catch (err: any) {
      alert(err.response?.data?.detail ?? 'Fehler beim Hinzufügen')
    } finally {
      setSavingMedien(false)
    }
  }

  const handleDeleteMedien = async (m: KampfMedien) => {
    if (!kampf || !confirm('Dieses Medium wirklich löschen?')) return
    await deleteKampfMedien(kampf.id, m.id)
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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-semibold text-gray-700">Timeline ({kampf.ereignisse.length})</h2>
          <div className="flex gap-2">
            {isTrainer() && kampf.medien.some((m) => m.typ === 'video' && m.datei_pfad) && (
              <button onClick={() => setSyncModus(!syncModus)}
                className={`text-sm px-3 py-1 rounded-lg border transition-colors ${syncModus ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-300 text-gray-600'}`}>
                {syncModus ? '🔴 Sync aktiv' : '🎬 Video-Sync'}
              </button>
            )}
            {isTrainer() && (
              <button onClick={() => {
                if (showEreignisForm) { setShowEreignisForm(false); setEditEreignis(null); setEreignisForm({ zeitpunkt_min: '', zeitpunkt_sek: '', typ: 'waza_ari', farbe: 'weiss', technik_id: '', technik_frei: '', notiz: '' }) }
                else setShowEreignisForm(true)
              }} className="btn-secondary text-sm">
                {showEreignisForm ? 'Abbrechen' : '+ Ereignis'}
              </button>
            )}
          </div>
          {syncModus && (
            <p className="w-full text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-1.5">
              ▶ Video abspielen → beim richtigen Moment 📍 klicken um den Zeitstempel zu setzen
            </p>
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
              {savingEreignis ? 'Speichern...' : editEreignis ? 'Änderung speichern' : 'Ereignis hinzufügen'}
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
              <div className="flex gap-1 flex-shrink-0 items-center">
                {e.video_timestamp_sek != null && !syncModus && (
                  <button onClick={() => seekEreignisVideo(e.video_timestamp_sek!)}
                    className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200">
                    ▶ {formatZeitpunkt(e.video_timestamp_sek)}
                  </button>
                )}
                {isTrainer() && syncModus && (
                  <button onClick={() => syncEreignisVideo(e)}
                    className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 hover:bg-orange-200">
                    📍 Sync
                  </button>
                )}
                {isTrainer() && !syncModus && (
                  <>
                    <button onClick={() => handleEditEreignis(e)} className="text-blue-400 hover:text-blue-600 text-xs">✎</button>
                    <button onClick={() => handleDeleteEreignis(e)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Medien */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">Medien ({kampf.medien.length})</h2>
          {isTrainer() && (
            <button onClick={() => setShowMedienForm(!showMedienForm)} className="btn-secondary text-sm">
              {showMedienForm ? 'Abbrechen' : '+ Medium'}
            </button>
          )}
        </div>

        {showMedienForm && (
          <form onSubmit={handleAddMedien} className="bg-gray-50 rounded-lg p-3 space-y-3 border border-gray-200">
            <div className="flex gap-2">
              {(['upload', 'url'] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMedienModus(m)}
                  className={`flex-1 py-1.5 rounded-lg text-sm border transition-colors ${medienModus === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'}`}>
                  {m === 'upload' ? '📁 Datei hochladen' : '🔗 Externe URL'}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Typ</label>
                <select className="input" value={medienForm.typ} onChange={(e) => setMedienForm(f => ({ ...f, typ: e.target.value as MedienTyp }))}>
                  <option value="foto">📷 Foto</option>
                  <option value="video">🎥 Video</option>
                </select>
              </div>
              <div>
                <label className="label">Zeitstempel (Coaching)</label>
                <input className="input" type="number" placeholder="Sekunden" value={medienForm.timestamp_sek}
                  onChange={(e) => setMedienForm(f => ({ ...f, timestamp_sek: e.target.value }))} />
              </div>
            </div>
            {medienModus === 'upload' ? (
              <div>
                <label className="label">Datei</label>
                <input ref={medienFileRef} type="file" accept="image/*,video/*" className="input" />
              </div>
            ) : (
              <div>
                <label className="label">URL (NAS-Pfad, YouTube etc.)</label>
                <input className="input" placeholder="https://..." value={medienForm.externe_url}
                  onChange={(e) => setMedienForm(f => ({ ...f, externe_url: e.target.value }))} />
              </div>
            )}
            <div>
              <label className="label">Beschriftung</label>
              <input className="input" value={medienForm.beschriftung}
                onChange={(e) => setMedienForm(f => ({ ...f, beschriftung: e.target.value }))} />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={savingMedien}>
              {savingMedien ? 'Speichern...' : 'Hinzufügen'}
            </button>
          </form>
        )}

        {kampf.medien.length === 0 && !showMedienForm && (
          <p className="text-sm text-gray-400 text-center py-4">Keine Medien vorhanden.</p>
        )}

        {/* Foto-Thumbnails */}
        {kampf.medien.some((m) => m.typ === 'foto' && (m.datei_pfad || m.externe_url)) && (
          <div className="flex flex-wrap gap-2">
            {kampf.medien
              .filter((m) => m.typ === 'foto' && (m.datei_pfad || m.externe_url))
              .map((m, idx) => (
                <div key={m.id} className="relative group">
                  <img
                    src={m.datei_pfad ?? m.externe_url ?? ''}
                    alt={m.beschriftung ?? ''}
                    className="w-20 h-20 object-cover rounded-lg cursor-pointer border-2 border-transparent hover:border-blue-400 transition-colors"
                    onClick={() => setLightboxIndex(idx)}
                    title={m.beschriftung ?? ''}
                  />
                  {isTrainer() && (
                    <button onClick={() => handleDeleteMedien(m)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs items-center justify-center hidden group-hover:flex">
                      ✕
                    </button>
                  )}
                </div>
              ))}
          </div>
        )}

        <div className="space-y-4">
          {kampf.medien.filter((m) => m.typ === 'video').map((m) => (
            <div key={m.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  🎥 {m.beschriftung || 'Video'}
                  {m.timestamp_sek != null && <span className="text-gray-400 ml-1">· {formatZeitpunkt(m.timestamp_sek)}</span>}
                </span>
                {isTrainer() && (
                  <button onClick={() => handleDeleteMedien(m)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                )}
              </div>

              {/* Video: hochgeladen */}
              {m.datei_pfad && (
                <video
                  ref={(el) => { if (el) videoRefs.current[m.id] = el }}
                  src={m.datei_pfad} controls className="w-full rounded-lg max-h-64"
                />
              )}

              {/* Video: YouTube */}
              {m.externe_url && isYoutube(m.externe_url) && (
                <div className="aspect-video">
                  <iframe
                    src={m.externe_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/') + (m.timestamp_sek ? `?start=${m.timestamp_sek}` : '')}
                    className="w-full h-full rounded-lg" allowFullScreen
                  />
                </div>
              )}

              {/* Video: andere externe URL */}
              {m.externe_url && !isYoutube(m.externe_url) && (
                <a href={m.externe_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                  🔗 Video öffnen
                </a>
              )}

              {/* Timestamp-Sprung für hochgeladene Videos */}
              {m.datei_pfad && m.timestamp_sek != null && (
                <button onClick={() => seekVideo(m.id, m.timestamp_sek!)} className="btn-secondary text-xs">
                  ▶ Springe zu {formatZeitpunkt(m.timestamp_sek)}
                </button>
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

      {/* Lightbox */}
      {lightboxIndex !== null && (() => {
        const fotos = kampf.medien.filter((m) => m.typ === 'foto' && (m.datei_pfad || m.externe_url))
        const foto = fotos[lightboxIndex]
        if (!foto) return null
        return (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={() => setLightboxIndex(null)}>
            <button className="absolute top-4 right-4 text-white text-3xl leading-none">✕</button>
            {lightboxIndex > 0 && (
              <button className="absolute left-4 text-white text-4xl leading-none"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1) }}>‹</button>
            )}
            <img
              src={foto.datei_pfad ?? foto.externe_url ?? ''}
              alt={foto.beschriftung ?? ''}
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {lightboxIndex < fotos.length - 1 && (
              <button className="absolute right-4 text-white text-4xl leading-none"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1) }}>›</button>
            )}
            {foto.beschriftung && (
              <p className="absolute bottom-4 text-white text-sm bg-black/50 px-4 py-2 rounded-lg">
                {foto.beschriftung} ({lightboxIndex + 1}/{fotos.length})
              </p>
            )}
          </div>
        )
      })()}
    </div>
  )
}

