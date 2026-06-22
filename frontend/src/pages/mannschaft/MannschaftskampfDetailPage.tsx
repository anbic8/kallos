import { useEffect, useState, FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  fetchMannschaftskampfById, deleteMannschaftskampf, updateMannschaftskampf,
  addEinzelkampf, deleteEinzelkampf,
  fetchKaempfe, fetchGewichtsklassen,
} from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import type { Mannschaftskampf, Einzelkampf, Kampf, Gewichtsklasse, KampflosSeite } from '../../api/types'
import { ABSCHLUSS_LABEL } from '../../api/types'

function getSiegerSeite(ek: Einzelkampf, mk: Mannschaftskampf): 'heim' | 'gast' | null {
  if (ek.kampflos_sieger) return ek.kampflos_sieger
  if (!ek.kampf) return null
  const k = ek.kampf
  if (k.sieger === 'unentschieden') return null
  const siegerKaempfer = k.sieger === 'weiss' ? k.kaempfer_weiss : k.kaempfer_blau
  if (!siegerKaempfer) return null
  if (siegerKaempfer.verein_id === mk.verein_heim_id) return 'heim'
  if (siegerKaempfer.verein_id === mk.verein_gast_id) return 'gast'
  return null
}

export default function MannschaftskampfDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isTrainer } = useAuthStore()
  const [mk, setMk] = useState<Mannschaftskampf | null>(null)
  const [editErgebnis, setEditErgebnis] = useState(false)
  const [ergebnisForm, setErgebnisForm] = useState({ heim: '', gast: '' })
  const [savingErgebnis, setSavingErgebnis] = useState(false)
  const [gewichtsklassen, setGewichtsklassen] = useState<Gewichtsklasse[]>([])
  const [verfuegbareKaempfe, setVerfuegbareKaempfe] = useState<Kampf[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modus, setModus] = useState<'kampf' | 'kampflos'>('kampf')
  const [form, setForm] = useState({
    gewichtsklasse_id: '',
    kampf_id: '',
    kampflos_sieger: 'heim' as KampflosSeite,
  })

  const reload = () => {
    if (!id) return
    fetchMannschaftskampfById(Number(id))
      .then((data) => {
        setMk(data)
        fetchKaempfe({ veranstaltung_id: data.veranstaltung_id }).then(setVerfuegbareKaempfe).catch(() => {})
      })
      .catch(() => navigate(-1))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
    fetchGewichtsklassen().then(setGewichtsklassen).catch(() => {})
  }, [id])

  const handleDelete = async () => {
    if (!mk || !confirm('Diesen Mannschaftskampf wirklich löschen?')) return
    await deleteMannschaftskampf(mk.id)
    navigate(-1)
  }

  const handleAddEinzelkampf = async (e: FormEvent) => {
    e.preventDefault()
    if (!mk) return
    setSaving(true)
    try {
      const payload = modus === 'kampflos'
        ? {
            gewichtsklasse_id: form.gewichtsklasse_id ? Number(form.gewichtsklasse_id) : null,
            kampflos_sieger: form.kampflos_sieger,
          }
        : {
            gewichtsklasse_id: form.gewichtsklasse_id ? Number(form.gewichtsklasse_id) : null,
            kampf_id: Number(form.kampf_id),
          }
      await addEinzelkampf(mk.id, payload)
      setShowForm(false)
      setForm({ gewichtsklasse_id: '', kampf_id: '', kampflos_sieger: 'heim' })
      reload()
    } catch (err: any) {
      alert(err.response?.data?.detail ?? 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveErgebnis = async () => {
    if (!mk) return
    setSavingErgebnis(true)
    try {
      const updated = await updateMannschaftskampf(mk.id, {
        siege_heim_direkt: ergebnisForm.heim !== '' ? Number(ergebnisForm.heim) : null,
        siege_gast_direkt: ergebnisForm.gast !== '' ? Number(ergebnisForm.gast) : null,
      })
      setMk(updated)
      setEditErgebnis(false)
    } finally {
      setSavingErgebnis(false)
    }
  }

  const handleDeleteEinzelkampf = async (ek: Einzelkampf) => {
    if (!mk) return
    await deleteEinzelkampf(mk.id, ek.id)
    reload()
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Laden...</div>
  if (!mk) return null

  const ergebnis = mk.siege_heim > mk.siege_gast ? 'heim' : mk.siege_gast > mk.siege_heim ? 'gast' : 'unentschieden'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card">
        {mk.veranstaltung_id && (
          <Link to={`/veranstaltungen/${mk.veranstaltung_id}`} className="text-xs text-blue-600 hover:underline mb-2 block">
            ← Kampftag
          </Link>
        )}
        <div className="flex items-center justify-center gap-4 py-2">
          <div className="text-center flex-1">
            <p className={`font-bold text-lg ${ergebnis === 'heim' ? 'text-green-600' : ergebnis === 'gast' ? 'text-red-500' : ''}`}>
              {mk.verein_heim?.name ?? `Verein #${mk.verein_heim_id}`}
            </p>
            <p className="text-xs text-gray-500">Heim</p>
          </div>
          <div className="text-center flex-shrink-0 space-y-1">
            <p className="text-3xl font-bold">
              <span className={mk.siege_heim > mk.siege_gast ? 'text-green-600' : mk.siege_heim < mk.siege_gast ? 'text-red-500' : ''}>
                {mk.siege_heim}
              </span>
              <span className="text-gray-400 mx-1">:</span>
              <span className={mk.siege_gast > mk.siege_heim ? 'text-green-600' : mk.siege_gast < mk.siege_heim ? 'text-red-500' : ''}>
                {mk.siege_gast}
              </span>
            </p>
            {mk.ergebnis_modus === 'direkt' && (
              <span className="text-xs text-gray-400">direkt eingetragen</span>
            )}
            {mk.ergebnis_modus === 'berechnet' && (
              <span className="text-xs text-gray-400">aus Einzelkämpfen</span>
            )}
          </div>
          <div className="text-center flex-1">
            <p className={`font-bold text-lg ${ergebnis === 'gast' ? 'text-green-600' : ergebnis === 'heim' ? 'text-red-500' : ''}`}>
              {mk.verein_gast?.name ?? `Verein #${mk.verein_gast_id}`}
            </p>
            <p className="text-xs text-gray-500">Gast</p>
          </div>
        </div>

        {/* Direktes Ergebnis bearbeiten */}
        {isTrainer() && mk.ergebnis_modus === 'direkt' && !editErgebnis && (
          <button
            onClick={() => { setErgebnisForm({ heim: String(mk.siege_heim_direkt ?? ''), gast: String(mk.siege_gast_direkt ?? '') }); setEditErgebnis(true) }}
            className="text-xs text-blue-600 hover:underline w-full text-center mt-1"
          >
            Ergebnis bearbeiten
          </button>
        )}
        {isTrainer() && !editErgebnis && mk.ergebnis_modus === 'berechnet' && (
          <button
            onClick={() => { setErgebnisForm({ heim: String(mk.siege_heim), gast: String(mk.siege_gast) }); setEditErgebnis(true) }}
            className="text-xs text-gray-400 hover:underline w-full text-center mt-1"
          >
            Ergebnis manuell überschreiben
          </button>
        )}
        {editErgebnis && (
          <div className="flex items-center gap-2 mt-2 justify-center">
            <input className="input w-16 text-center font-bold text-lg" type="number" min="0"
              value={ergebnisForm.heim} onChange={(e) => setErgebnisForm(f => ({ ...f, heim: e.target.value }))} />
            <span className="text-gray-400">:</span>
            <input className="input w-16 text-center font-bold text-lg" type="number" min="0"
              value={ergebnisForm.gast} onChange={(e) => setErgebnisForm(f => ({ ...f, gast: e.target.value }))} />
            <button onClick={handleSaveErgebnis} disabled={savingErgebnis} className="btn-primary text-sm">
              {savingErgebnis ? '...' : 'Speichern'}
            </button>
            <button onClick={() => setEditErgebnis(false)} className="btn-secondary text-sm">✕</button>
          </div>
        )}
      </div>

      {/* Einzelkämpfe */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">Gewichtsklassen ({mk.einzelkaempfe.length})</h2>
          {isTrainer() && (
            <button onClick={() => setShowForm(!showForm)} className="btn-secondary text-sm">
              {showForm ? 'Abbrechen' : '+ Eintrag'}
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleAddEinzelkampf} className="bg-gray-50 rounded-lg p-3 space-y-3 border border-gray-200">
            <div className="flex gap-2">
              {(['kampf', 'kampflos'] as const).map((m) => (
                <button key={m} type="button" onClick={() => setModus(m)}
                  className={`flex-1 py-1.5 rounded-lg text-sm border transition-colors ${modus === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'}`}>
                  {m === 'kampf' ? '🥋 Kampf' : '↔️ Kampflos'}
                </button>
              ))}
            </div>
            <div>
              <label className="label">Gewichtsklasse</label>
              <select className="input" value={form.gewichtsklasse_id} onChange={(e) => setForm(f => ({ ...f, gewichtsklasse_id: e.target.value }))}>
                <option value="">--</option>
                {gewichtsklassen.map((g) => (
                  <option key={g.id} value={g.id}>{g.bezeichnung}{g.altersklasse ? ` ${g.altersklasse}` : ''}{g.geschlecht ? ` ${g.geschlecht === 'm' ? 'H' : 'D'}` : ''}</option>
                ))}
              </select>
            </div>
            {modus === 'kampf' ? (
              <div className="space-y-2">
                <label className="label">Kampf *</label>
                {verfuegbareKaempfe.length === 0 ? (
                  <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    Noch keine Kämpfe für diesen Kampftag vorhanden.{' '}
                    <Link to={`/veranstaltungen/${mk?.veranstaltung_id}/kaempfe/neu`} className="text-blue-600 hover:underline font-medium">
                      Kampf anlegen →
                    </Link>
                  </div>
                ) : (
                  <>
                    <select className="input" value={form.kampf_id} onChange={(e) => setForm(f => ({ ...f, kampf_id: e.target.value }))} required>
                      <option value="">-- Kampf wählen --</option>
                      {verfuegbareKaempfe.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.kaempfer_weiss ? `${k.kaempfer_weiss.vorname} ${k.kaempfer_weiss.nachname}` : '?'}
                          {' vs. '}
                          {k.kaempfer_blau ? `${k.kaempfer_blau.vorname} ${k.kaempfer_blau.nachname}` : '?'}
                          {k.gewichtsklasse ? ` (${k.gewichtsklasse.bezeichnung})` : ''}
                        </option>
                      ))}
                    </select>
                    <Link to={`/veranstaltungen/${mk?.veranstaltung_id}/kaempfe/neu`} className="text-xs text-blue-600 hover:underline">
                      + Neuen Kampf anlegen
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <div>
                <label className="label">Sieger *</label>
                <div className="flex gap-2">
                  {(['heim', 'gast'] as KampflosSeite[]).map((s) => (
                    <label key={s} className={`flex-1 text-center py-2 rounded-lg border cursor-pointer text-sm transition-colors ${form.kampflos_sieger === s ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'}`}>
                      <input type="radio" name="kampflos_sieger" value={s} checked={form.kampflos_sieger === s}
                        onChange={() => setForm(f => ({ ...f, kampflos_sieger: s }))} className="hidden" />
                      {s === 'heim' ? `🏠 ${mk.verein_heim?.name ?? 'Heim'}` : `✈️ ${mk.verein_gast?.name ?? 'Gast'}`}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? 'Speichern...' : 'Hinzufügen'}
            </button>
          </form>
        )}

        {mk.einzelkaempfe.length === 0 && !showForm && (
          <p className="text-sm text-gray-400 text-center py-4">Noch keine Einträge.</p>
        )}

        <div className="space-y-2">
          {mk.einzelkaempfe.map((ek) => {
            const seite = getSiegerSeite(ek, mk)
            return (
              <div key={ek.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <div className="w-16 flex-shrink-0 text-xs font-medium text-gray-500">
                  {ek.gewichtsklasse?.bezeichnung ?? '–'}
                </div>
                <div className="flex-1 min-w-0">
                  {ek.kampflos_sieger ? (
                    <span className="text-sm text-gray-600">
                      Kampflos → <span className="font-medium">{ek.kampflos_sieger === 'heim' ? mk.verein_heim?.name : mk.verein_gast?.name}</span>
                    </span>
                  ) : ek.kampf ? (
                    <Link to={`/kaempfe/${ek.kampf.id}`} className="text-sm hover:text-blue-700">
                      <span>{ek.kampf.kaempfer_weiss ? `${ek.kampf.kaempfer_weiss.vorname} ${ek.kampf.kaempfer_weiss.nachname}` : '?'}</span>
                      <span className="text-gray-400 mx-1">vs.</span>
                      <span>{ek.kampf.kaempfer_blau ? `${ek.kampf.kaempfer_blau.vorname} ${ek.kampf.kaempfer_blau.nachname}` : '?'}</span>
                      <span className="text-xs text-gray-400 ml-1">({ABSCHLUSS_LABEL[ek.kampf.abschluss]})</span>
                    </Link>
                  ) : <span className="text-gray-400 text-sm">–</span>}
                </div>
                <div className="flex-shrink-0">
                  {seite === 'heim' && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Heim</span>}
                  {seite === 'gast' && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Gast</span>}
                  {!seite && !ek.kampflos_sieger && ek.kampf && <span className="text-xs text-yellow-600">Unentschieden</span>}
                </div>
                {isTrainer() && (
                  <button onClick={() => handleDeleteEinzelkampf(ek)} className="text-red-400 hover:text-red-600 text-xs flex-shrink-0">✕</button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {isTrainer() && (
        <button onClick={handleDelete} className="btn-danger w-full">Mannschaftskampf löschen</button>
      )}
    </div>
  )
}
