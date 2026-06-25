import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchKaempfer, fetchHeimverein, fetchGruppen } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import type { Kaempfer, Verein, Gruppe } from '../../api/types'
import { GUERTEL_COLOR, GUERTEL_LABEL } from '../../api/types'

export default function KaempferListePage() {
  const { isTrainer } = useAuthStore()
  const [alleKaempfer, setAlleKaempfer] = useState<Kaempfer[]>([])
  const [heimverein, setHeimverein] = useState<Verein | null>(null)
  const [gruppen, setGruppen] = useState<Gruppe[]>([])
  const [intern, setIntern] = useState(true)
  const [filterGruppe, setFilterGruppe] = useState<number | null>(null)
  const [suche, setSuche] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchKaempfer(), fetchHeimverein(), fetchGruppen()])
      .then(([k, hv, g]) => { setAlleKaempfer(k); setHeimverein(hv); setGruppen(g) })
      .finally(() => setLoading(false))
  }, [])

  const kaempfer = heimverein
    ? alleKaempfer.filter((k) => intern ? k.verein_id === heimverein.id : k.verein_id !== heimverein.id)
    : alleKaempfer.filter((k) => intern ? k.verein_id != null : k.verein_id == null)

  const gefiltert = kaempfer.filter((k) => {
    const name = `${k.vorname} ${k.nachname}`.toLowerCase()
    const matchSuche = name.includes(suche.toLowerCase())
    const matchGruppe = !filterGruppe || k.gruppen?.some((g) => g.id === filterGruppe)
    return matchSuche && matchGruppe
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kämpfer</h1>
        {isTrainer() && (
          <Link to="/kaempfer/neu" className="btn-primary">
            + Neu
          </Link>
        )}
      </div>

      {/* Filter-Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setIntern(true)}
          className={`btn text-sm ${intern ? 'btn-primary' : 'btn-secondary'}`}
        >
          Intern
        </button>
        {isTrainer() && (
          <button
            onClick={() => setIntern(false)}
            className={`btn text-sm ${!intern ? 'btn-primary' : 'btn-secondary'}`}
          >
            Extern / Gegner
          </button>
        )}
      </div>

      {/* Suche */}
      <input type="search" className="input" placeholder="Name suchen..."
        value={suche} onChange={(e) => setSuche(e.target.value)} />

      {/* Gruppen-Filter (nur intern) */}
      {intern && gruppen.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setFilterGruppe(null)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${!filterGruppe ? 'bg-blue-700 text-white border-blue-700' : 'border-gray-300 text-gray-600'}`}>
            Alle
          </button>
          {gruppen.map((g) => (
            <button key={g.id} onClick={() => setFilterGruppe(filterGruppe === g.id ? null : g.id)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${filterGruppe === g.id ? 'bg-blue-700 text-white border-blue-700' : 'border-gray-300 text-gray-600'}`}>
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Laden...</div>
      ) : gefiltert.length === 0 ? (
        <div className="card text-center py-10 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p>Keine Kämpfer gefunden</p>
        </div>
      ) : (
        <div className="space-y-2">
          {gefiltert.map((k) => (
            <Link
              key={k.id}
              to={`/kaempfer/${k.id}`}
              className="card flex items-center gap-3 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {k.foto_url ? (
                  <img src={k.foto_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🥋</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{k.vorname} {k.nachname}</p>
                <p className="text-xs text-gray-500">
                  {k.geburtsjahr ? `Jg. ${k.geburtsjahr}` : ''}{k.geburtsjahr && k.verein ? ' · ' : ''}{k.verein?.name ?? ''}
                </p>
              </div>
              {k.aktueller_guertel && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${GUERTEL_COLOR[k.aktueller_guertel]}`}>
                  {GUERTEL_LABEL[k.aktueller_guertel]}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
