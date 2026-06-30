import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchRangliste, fetchGruppen } from '../../api/client'
import { GUERTEL_COLOR, GUERTEL_LABEL, type Guertel, type Gruppe } from '../../api/types'

const KRITERIEN = [
  { key: 'siege', label: 'Siege gesamt' },
  { key: 'siegquote', label: 'Siegquote %' },
  { key: 'ippons', label: 'Ippons' },
  { key: 'turnier', label: 'Turniersiege' },
  { key: 'erfolge', label: 'Erfolge-Punkte' },
  { key: 'anwesenheit', label: 'Anwesenheit %' },
]

const RANG_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function RanglistePage() {
  const [kriterium, setKriterium] = useState('siege')
  const [minKaempfe, setMinKaempfe] = useState(0)
  const [filterGruppe, setFilterGruppe] = useState<number | undefined>()
  const [gruppen, setGruppen] = useState<Gruppe[]>([])
  const [rangliste, setRangliste] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchGruppen().then(setGruppen).catch(() => {}) }, [])

  const laden = () => {
    setLoading(true)
    fetchRangliste(kriterium, minKaempfe, filterGruppe)
      .then(setRangliste)
      .finally(() => setLoading(false))
  }

  useEffect(() => { laden() }, [kriterium, minKaempfe, filterGruppe])

  const wertLabel = (r: any) => {
    if (kriterium === 'siegquote') return `${r.siegquote} %`
    if (kriterium === 'ippons') return r.ippons
    if (kriterium === 'turnier') return `${r.turnier_siege} 🏆`
    if (kriterium === 'erfolge') return `${r.erfolge_punkte} Pkt`
    if (kriterium === 'anwesenheit') return `${r.anwesenheit_quote} %`
    return r.siege
  }

  const wertAbsolut = (r: any) => {
    if (kriterium === 'siegquote') return `${r.siege}/${r.total} Siege`
    if (kriterium === 'anwesenheit') return `${r.anwesenheit_anwesend}/${r.anwesenheit_total} Termine`
    return null
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Vereins-Rangliste</h1>

      {/* Kriterium-Wahl */}
      <div className="flex gap-2 flex-wrap">
        {KRITERIEN.map(({ key, label }) => (
          <button key={key} onClick={() => setKriterium(key)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${kriterium === key ? 'bg-blue-700 text-white border-blue-700' : 'border-gray-300 text-gray-600'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 text-sm flex-wrap">
        <label className="text-gray-500">Mindest-Kämpfe:</label>
        <select className="input w-20 text-sm py-1" value={minKaempfe} onChange={(e) => setMinKaempfe(Number(e.target.value))}>
          {[0, 1, 3, 5, 10].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {gruppen.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setFilterGruppe(undefined)}
            className={`text-xs px-3 py-1 rounded-full border ${!filterGruppe ? 'bg-blue-700 text-white border-blue-700' : 'border-gray-300 text-gray-600'}`}>
            Alle
          </button>
          {gruppen.map((g) => (
            <button key={g.id} onClick={() => setFilterGruppe(filterGruppe === g.id ? undefined : g.id)}
              className={`text-xs px-3 py-1 rounded-full border ${filterGruppe === g.id ? 'bg-blue-700 text-white border-blue-700' : 'border-gray-300 text-gray-600'}`}>
              {g.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">Laden...</div>
      ) : rangliste.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">🥋</p>
          <p>Noch keine Kämpfe erfasst.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rangliste.map((r) => (
            <Link key={r.kaempfer_id} to={`/kaempfer/${r.kaempfer_id}/statistik`}
              className="card flex items-center gap-3 hover:border-blue-300 transition-colors">
              {/* Rang */}
              <div className="w-10 text-center flex-shrink-0">
                {RANG_MEDAL[r.rang]
                  ? <span className="text-2xl">{RANG_MEDAL[r.rang]}</span>
                  : <span className="text-lg font-bold text-gray-500">{r.rang}.</span>
                }
              </div>

              {/* Foto */}
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {r.foto_url
                  ? <img src={r.foto_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-lg">🥋</span>
                }
              </div>

              {/* Name + Gürtel */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{r.vorname} {r.nachname}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {r.aktueller_guertel && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GUERTEL_COLOR[r.aktueller_guertel as Guertel]}`}>
                      {GUERTEL_LABEL[r.aktueller_guertel as Guertel]}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {kriterium === 'anwesenheit'
                      ? `${r.anwesenheit_anwesend}/${r.anwesenheit_total} Trainings`
                      : `${r.total} Kämpfe`}
                  </span>
                </div>
              </div>

              {/* Wert */}
              <div className="text-right flex-shrink-0">
                <p className="text-xl font-bold text-blue-700">{wertLabel(r)}</p>
                <p className="text-xs text-gray-400">
                  {wertAbsolut(r) ?? KRITERIEN.find(k => k.key === kriterium)?.label}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
