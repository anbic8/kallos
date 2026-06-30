import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  fetchTrainingsgruppeById, fetchTeilnehmer, saveAnwesenheit,
  fetchKaempfer, fetchHeimverein,
} from '../../api/client'
import type { Trainingsgruppe, TeilnehmerEintrag, Kaempfer, Verein } from '../../api/types'
import { WOCHENTAG_LABEL } from '../../api/types'

const heute = () => new Date().toISOString().split('T')[0]

export default function AnwesenheitPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tg, setTg] = useState<Trainingsgruppe | null>(null)
  const [datum, setDatum] = useState(heute())
  const [teilnehmer, setTeilnehmer] = useState<TeilnehmerEintrag[]>([])
  const [interneKaempfer, setInterneKaempfer] = useState<Kaempfer[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTeilnehmer, setLoadingTeilnehmer] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([fetchTrainingsgruppeById(Number(id)), fetchKaempfer(), fetchHeimverein()])
      .then(([t, alle, hv]) => {
        setTg(t)
        setInterneKaempfer((alle as Kaempfer[]).filter((x) => x.verein_id === (hv as Verein).id))
      })
      .catch(() => navigate('/training'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    setLoadingTeilnehmer(true)
    setSaved(false)
    fetchTeilnehmer(Number(id), datum)
      .then(setTeilnehmer)
      .finally(() => setLoadingTeilnehmer(false))
  }, [id, datum])

  const toggle = (kaempferId: number) => {
    setTeilnehmer((prev) => prev.map((t) => t.kaempfer_id === kaempferId ? { ...t, anwesend: !t.anwesend } : t))
    setSaved(false)
  }

  const addTeilnehmer = (kaempferId: string) => {
    if (!kaempferId) return
    const k = interneKaempfer.find((x) => x.id === Number(kaempferId))
    if (!k) return
    setTeilnehmer((prev) => [...prev, { kaempfer_id: k.id, vorname: k.vorname, nachname: k.nachname, foto_url: k.foto_url, anwesend: true }])
    setSaved(false)
  }

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    try {
      await saveAnwesenheit(Number(id), datum, teilnehmer.map((t) => ({ kaempfer_id: t.kaempfer_id, anwesend: t.anwesend })))
      setSaved(true)
    } finally { setSaving(false) }
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Laden...</div>
  if (!tg) return null

  const nichtDabei = interneKaempfer.filter((k) => !teilnehmer.some((t) => t.kaempfer_id === k.id))
  const anwesendCount = teilnehmer.filter((t) => t.anwesend).length

  return (
    <div className="space-y-4">
      <div>
        <Link to="/training" className="text-sm text-blue-400 hover:underline">← Trainingstermine</Link>
        <h1 className="text-2xl font-bold mt-1">
          {tg.gruppe?.name} <span className="text-gray-400 font-normal text-lg">· {WOCHENTAG_LABEL[tg.wochentag]} {tg.uhrzeit.slice(0, 5)}</span>
        </h1>
      </div>

      {/* Datum */}
      <div className="card">
        <label className="label">Datum</label>
        <input className="input" type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
      </div>

      {/* Teilnehmerliste */}
      <div className="card space-y-1">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-300">Teilnehmer ({teilnehmer.length})</h2>
          <span className="text-sm text-green-400 font-medium">{anwesendCount} anwesend</span>
        </div>

        {loadingTeilnehmer ? (
          <p className="text-sm text-gray-500 text-center py-6">Laden...</p>
        ) : teilnehmer.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Keine Mitglieder in dieser Gruppe.</p>
        ) : (
          teilnehmer.map((t) => (
            <label key={t.kaempfer_id}
              className={`flex items-center gap-3 py-2 px-2 rounded-lg cursor-pointer transition-colors ${t.anwesend ? 'bg-green-950/40' : ''}`}>
              <input type="checkbox" checked={t.anwesend} onChange={() => toggle(t.kaempfer_id)}
                className="w-5 h-5 rounded accent-green-600 flex-shrink-0" />
              {t.foto_url
                ? <img src={t.foto_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                : <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm flex-shrink-0">🥋</div>
              }
              <span className={`flex-1 ${t.anwesend ? 'text-gray-100' : 'text-gray-500'}`}>{t.vorname} {t.nachname}</span>
            </label>
          ))
        )}

        {/* Weitere Teilnehmer hinzufügen */}
        {nichtDabei.length > 0 && (
          <div className="pt-3 mt-2 border-t border-gray-800">
            <select className="input text-sm" defaultValue="" onChange={(e) => { addTeilnehmer(e.target.value); e.target.value = '' }}>
              <option value="">+ Weiteren Teilnehmer hinzufügen...</option>
              {nichtDabei.map((k) => <option key={k.id} value={k.id}>{k.vorname} {k.nachname}</option>)}
            </select>
          </div>
        )}
      </div>

      <button onClick={handleSave} disabled={saving || teilnehmer.length === 0} className="btn-primary w-full py-3">
        {saving ? 'Speichern...' : saved ? '✓ Gespeichert' : 'Anwesenheit speichern'}
      </button>
    </div>
  )
}
