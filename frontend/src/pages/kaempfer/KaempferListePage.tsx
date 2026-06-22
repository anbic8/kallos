import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchKaempfer } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import type { Kaempfer } from '../../api/types'
import { GUERTEL_COLOR, GUERTEL_LABEL } from '../../api/types'

export default function KaempferListePage() {
  const { isTrainer } = useAuthStore()
  const [kaempfer, setKaempfer] = useState<Kaempfer[]>([])
  const [intern, setIntern] = useState(true)
  const [suche, setSuche] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchKaempfer(intern)
      .then(setKaempfer)
      .finally(() => setLoading(false))
  }, [intern])

  const gefiltert = kaempfer.filter((k) => {
    const name = `${k.vorname} ${k.nachname}`.toLowerCase()
    return name.includes(suche.toLowerCase())
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
      <input
        type="search"
        className="input"
        placeholder="Name suchen..."
        value={suche}
        onChange={(e) => setSuche(e.target.value)}
      />

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
