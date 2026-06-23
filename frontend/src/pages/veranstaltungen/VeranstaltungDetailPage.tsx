import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  fetchVeranstaltungById, fetchKaempfe, deleteVeranstaltung, deleteKampf,
  fetchLigaTabelle, fetchKampftage, fetchMannschaftskaempfe, deleteMannschaftskampf,
} from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import type { Veranstaltung, Kampf, Mannschaftskampf, LigaTabelle } from '../../api/types'
import { VERANSTALTUNGSTYP_LABEL, ABSCHLUSS_LABEL, KAMPFRUNDE_LABEL, formatKampfzeit } from '../../api/types'
// fetchKaempfe, deleteKampf bleiben fuer StandardSection (Turniere etc.)

function SiegerBadge({ sieger }: { sieger: string }) {
  if (sieger === 'weiss') return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 font-medium">Sieg ⬜</span>
  if (sieger === 'blau') return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Sieg 🟦</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Unentschieden</span>
}

// ---------- Liga-Ansicht ----------

function LigaSection({ veranstaltung }: { veranstaltung: Veranstaltung }) {
  const { isTrainer } = useAuthStore()
  const [tabelle, setTabelle] = useState<LigaTabelle | null>(null)
  const [kampftage, setKampftage] = useState<Veranstaltung[]>([])

  useEffect(() => {
    fetchLigaTabelle(veranstaltung.id).then(setTabelle).catch(() => {})
    fetchKampftage(veranstaltung.id).then(setKampftage).catch(() => {})
  }, [veranstaltung.id])

  return (
    <div className="space-y-4">
      {/* Ligatabelle */}
      <div className="card">
        <h2 className="font-semibold text-gray-700 mb-3">Ligatabelle</h2>
        {!tabelle || tabelle.eintraege.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Noch keine Mannschaftskämpfe erfasst.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-xs">
                  <th className="text-left py-1.5 pr-3">Verein</th>
                  <th className="text-center px-2">Sp</th>
                  <th className="text-center px-2">S</th>
                  <th className="text-center px-2">U</th>
                  <th className="text-center px-2">N</th>
                  <th className="text-center px-2 font-bold text-gray-700">Pkt</th>
                </tr>
              </thead>
              <tbody>
                {tabelle.eintraege.map((e, i) => (
                  <tr key={e.verein_id} className={`border-b border-gray-100 last:border-0 ${i === 0 ? 'font-semibold' : ''}`}>
                    <td className="py-2 pr-3">{e.verein_name}</td>
                    <td className="text-center px-2 text-gray-500">{e.spiele}</td>
                    <td className="text-center px-2 text-green-600">{e.siege}</td>
                    <td className="text-center px-2 text-yellow-600">{e.unentschieden}</td>
                    <td className="text-center px-2 text-red-500">{e.niederlagen}</td>
                    <td className="text-center px-2 font-bold">{e.punkte}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Kampftage */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-700">Kampftage ({kampftage.length})</h2>
          {isTrainer() && (
            <Link to={`/veranstaltungen/neu?liga_id=${veranstaltung.id}&typ=kampftag`} className="btn-primary text-sm">
              + Kampftag
            </Link>
          )}
        </div>
        {kampftage.length === 0 && (
          <div className="card text-center py-8 text-gray-400 text-sm">Noch keine Kampftage angelegt.</div>
        )}
        <div className="space-y-2">
          {kampftage.map((kt) => (
            <Link key={kt.id} to={`/veranstaltungen/${kt.id}`} className="card flex items-center gap-3 hover:border-blue-300 transition-colors block">
              <div className="flex-1">
                <p className="font-medium">{kt.name}</p>
                <p className="text-sm text-gray-500">
                  {kt.datum ? new Date(kt.datum).toLocaleDateString('de-DE') : 'Kein Datum'}
                  {kt.ort ? ` · ${kt.ort}` : ''}
                </p>
              </div>
              <span className="text-gray-400">›</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------- Kampftag-Ansicht ----------

function KampftagSection({ veranstaltung }: { veranstaltung: Veranstaltung }) {
  const { isTrainer } = useAuthStore()
  const [mannschaftskaempfe, setMannschaftskaempfe] = useState<Mannschaftskampf[]>([])

  const reload = () => {
    fetchMannschaftskaempfe(veranstaltung.id).then(setMannschaftskaempfe).catch(() => {})
  }

  useEffect(reload, [veranstaltung.id])

  const handleDeleteMK = async (mk: Mannschaftskampf) => {
    if (!confirm('Diesen Mannschaftskampf löschen?')) return
    await deleteMannschaftskampf(mk.id)
    reload()
  }

  return (
    <div className="space-y-4">
      {veranstaltung.parent_liga_id && (
        <Link to={`/veranstaltungen/${veranstaltung.parent_liga_id}`} className="text-sm text-blue-600 hover:underline">
          ← Liga
        </Link>
      )}

      {/* Mannschaftskämpfe */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-700">Mannschaftskämpfe ({mannschaftskaempfe.length})</h2>
          {isTrainer() && (
            <Link to={`/veranstaltungen/${veranstaltung.id}/mannschaft/neu`} className="btn-primary text-sm">
              + Mannschaftskampf
            </Link>
          )}
        </div>

        {mannschaftskaempfe.length === 0 && (
          <div className="card text-center py-8 text-gray-400 text-sm">
            <p className="text-2xl mb-2">🤼</p>
            <p>Noch keine Mannschaftskämpfe angelegt.</p>
          </div>
        )}

        <div className="space-y-2">
          {mannschaftskaempfe.map((mk) => (
            <div key={mk.id} className="card flex items-center gap-3">
              <Link to={`/mannschaftskaempfe/${mk.id}`} className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{mk.verein_heim?.name ?? `Verein #${mk.verein_heim_id}`}</span>
                  <span className={`text-lg font-bold px-2 ${mk.siege_heim > mk.siege_gast ? 'text-green-600' : mk.siege_gast > mk.siege_heim ? 'text-red-500' : 'text-yellow-600'}`}>
                    {mk.siege_heim} : {mk.siege_gast}
                  </span>
                  <span className="font-medium">{mk.verein_gast?.name ?? `Verein #${mk.verein_gast_id}`}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{mk.einzelkaempfe.length} Gewichtsklassen erfasst</p>
              </Link>
              {isTrainer() && (
                <button onClick={() => handleDeleteMK(mk)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Hinweis: Kämpfe werden im Mannschaftskampf angelegt */}
      {mannschaftskaempfe.length > 0 && isTrainer() && (
        <p className="text-xs text-gray-400 text-center">
          Einzelkämpfe werden direkt im Mannschaftskampf erfasst und zugewiesen.
        </p>
      )}
    </div>
  )
}

// ---------- Standard-Ansicht (Turnier etc.) ----------

function StandardSection({ veranstaltung }: { veranstaltung: Veranstaltung }) {
  const { isTrainer } = useAuthStore()
  const [kaempfe, setKaempfe] = useState<Kampf[]>([])
  const [filterGK, setFilterGK] = useState('')

  useEffect(() => {
    fetchKaempfe({ veranstaltung_id: veranstaltung.id }).then(setKaempfe).catch(() => {})
  }, [veranstaltung.id])

  const handleDeleteKampf = async (k: Kampf) => {
    if (!confirm('Diesen Kampf wirklich löschen?')) return
    await deleteKampf(k.id)
    setKaempfe((prev) => prev.filter((x) => x.id !== k.id))
  }

  // Zahlenwert aus Bezeichnung extrahieren ("-66" → 66, "+100" → 100)
  const kgAus = (bez?: string) => { const m = bez?.match(/\d+/); return m ? parseInt(m[0]) : 999 }

  // Eindeutige Gewichtsklassen, sortiert nach Zahlenwert
  const gewichtsklassen = Array.from(
    new Map(kaempfe.filter((k) => k.gewichtsklasse).map((k) => [k.gewichtsklasse!.id, k.gewichtsklasse!])).values()
  ).sort((a, b) => kgAus(a.bezeichnung) - kgAus(b.bezeichnung))

  const gefiltert = filterGK
    ? kaempfe.filter((k) => String(k.gewichtsklasse_id) === filterGK)
    : kaempfe

  // Sortiert nach Gewichtsklassen-Zahlenwert
  const sortiert = [...gefiltert].sort((a, b) =>
    kgAus(a.gewichtsklasse?.bezeichnung) - kgAus(b.gewichtsklasse?.bezeichnung)
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">Kämpfe ({kaempfe.length})</h2>
        {isTrainer() && (
          <Link to={`/veranstaltungen/${veranstaltung.id}/kaempfe/neu`} className="btn-primary text-sm">+ Kampf</Link>
        )}
      </div>

      {/* Gewichtsklassen-Filter */}
      {gewichtsklassen.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setFilterGK('')}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${!filterGK ? 'bg-blue-700 text-white border-blue-700' : 'border-gray-300 text-gray-600'}`}>
            Alle ({kaempfe.length})
          </button>
          {gewichtsklassen.map((gk) => (
            <button key={gk.id} onClick={() => setFilterGK(String(gk.id))}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${filterGK === String(gk.id) ? 'bg-blue-700 text-white border-blue-700' : 'border-gray-300 text-gray-600'}`}>
              {gk.bezeichnung}
              <span className="ml-1 opacity-60">({kaempfe.filter((k) => k.gewichtsklasse_id === gk.id).length})</span>
            </button>
          ))}
        </div>
      )}

      {sortiert.length === 0 && (
        <div className="card text-center py-10 text-gray-400 text-sm">
          <p className="text-3xl mb-2">🥊</p>
          <p>Noch keine Kämpfe erfasst.</p>
        </div>
      )}
      <div className="space-y-2">
        {sortiert.map((k) => (
          <div key={k.id} className="card flex items-start gap-2">
            <Link to={`/kaempfe/${k.id}`} className="flex-1 min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="font-medium">{k.kaempfer_weiss ? `${k.kaempfer_weiss.vorname} ${k.kaempfer_weiss.nachname}` : '?'}</span>
                <span className="text-gray-400 text-sm">vs.</span>
                <span className="font-medium">{k.kaempfer_blau ? `${k.kaempfer_blau.vorname} ${k.kaempfer_blau.nachname}` : '?'}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <SiegerBadge sieger={k.sieger} />
                <span className="text-xs text-gray-500">{ABSCHLUSS_LABEL[k.abschluss]}</span>
                {k.sieger_technik && <span className="text-xs text-gray-500">{k.sieger_technik.name}</span>}
                {k.gewichtsklasse && <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 rounded">{k.gewichtsklasse.bezeichnung}</span>}
                {k.runde && <span className="text-xs text-gray-400">{KAMPFRUNDE_LABEL[k.runde]}</span>}
                {k.kampfzeit_sek != null && <span className="text-xs text-gray-400">{formatKampfzeit(k.kampfzeit_sek)}</span>}
              </div>
            </Link>
            {isTrainer() && (
              <button onClick={() => handleDeleteKampf(k)} className="text-red-400 hover:text-red-600 text-sm flex-shrink-0">✕</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- Hauptkomponente ----------

export default function VeranstaltungDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isTrainer } = useAuthStore()
  const [veranstaltung, setVeranstaltung] = useState<Veranstaltung | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetchVeranstaltungById(Number(id))
      .then(setVeranstaltung)
      .catch(() => navigate('/veranstaltungen'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!veranstaltung || !confirm(`"${veranstaltung.name}" wirklich löschen?`)) return
    await deleteVeranstaltung(veranstaltung.id)
    navigate('/veranstaltungen')
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Laden...</div>
  if (!veranstaltung) return null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{veranstaltung.name}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
              {VERANSTALTUNGSTYP_LABEL[veranstaltung.typ]}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {veranstaltung.datum ? new Date(veranstaltung.datum).toLocaleDateString('de-DE') : ''}
            {veranstaltung.ort ? ` · ${veranstaltung.ort}` : ''}
            {veranstaltung.veranstalter ? ` · ${veranstaltung.veranstalter}` : ''}
          </p>
        </div>
        {isTrainer() && (
          <Link to={`/veranstaltungen/${veranstaltung.id}/bearbeiten`} className="btn-secondary text-sm flex-shrink-0">Bearbeiten</Link>
        )}
      </div>

      {/* Inhalt je nach Typ */}
      {veranstaltung.typ === 'liga' && <LigaSection veranstaltung={veranstaltung} />}
      {veranstaltung.typ === 'kampftag' && <KampftagSection veranstaltung={veranstaltung} />}
      {veranstaltung.typ !== 'liga' && veranstaltung.typ !== 'kampftag' && (
        <StandardSection veranstaltung={veranstaltung} />
      )}

      {isTrainer() && (
        <button onClick={handleDelete} className="btn-danger w-full mt-4">Veranstaltung löschen</button>
      )}
    </div>
  )
}
