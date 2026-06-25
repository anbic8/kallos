import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchVeranstaltungen } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import type { Veranstaltung } from '../../api/types'
import { VERANSTALTUNGSTYP_LABEL } from '../../api/types'

const TYP_COLOR: Record<string, string> = {
  liga: 'bg-purple-100 text-purple-700',
  turnier: 'bg-blue-100 text-blue-700',
  meisterschaft: 'bg-yellow-100 text-yellow-700',
  kampftag: 'bg-green-100 text-green-700',
  pokal: 'bg-orange-100 text-orange-700',
  sonstiges: 'bg-gray-100 text-gray-600',
}

export default function VeranstaltungenListePage() {
  const { isTrainer } = useAuthStore()
  const [veranstaltungen, setVeranstaltungen] = useState<Veranstaltung[]>([])
  const [loading, setLoading] = useState(true)
  const [suche, setSuche] = useState('')
  const [filterTyp, setFilterTyp] = useState('')

  useEffect(() => {
    fetchVeranstaltungen()
      .then(setVeranstaltungen)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-gray-400">Laden...</div>

  const hauptEvents = veranstaltungen.filter((v) => !v.parent_liga_id)
  const gefiltert = hauptEvents.filter((v) => {
    const matchSuche = suche === '' || v.name.toLowerCase().includes(suche.toLowerCase()) || v.ort?.toLowerCase().includes(suche.toLowerCase())
    const matchTyp = filterTyp === '' || v.typ === filterTyp
    return matchSuche && matchTyp
  })

  const verfuegbareTypen = [...new Set(hauptEvents.map((v) => v.typ))]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Veranstaltungen</h1>
        {isTrainer() && (
          <Link to="/veranstaltungen/neu" className="btn-primary">+ Neu</Link>
        )}
      </div>

      {/* Suche + Filter */}
      {hauptEvents.length > 0 && (
        <div className="space-y-2">
          <input type="search" className="input" placeholder="Suche nach Name oder Ort..."
            value={suche} onChange={(e) => setSuche(e.target.value)} />
          {verfuegbareTypen.length > 1 && (
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => setFilterTyp('')}
                className={`text-xs px-3 py-1 rounded-full border ${!filterTyp ? 'bg-blue-700 text-white border-blue-700' : 'border-gray-300 text-gray-600'}`}>
                Alle
              </button>
              {verfuegbareTypen.map((t) => (
                <button key={t} onClick={() => setFilterTyp(filterTyp === t ? '' : t)}
                  className={`text-xs px-3 py-1 rounded-full border ${filterTyp === t ? 'bg-blue-700 text-white border-blue-700' : `${TYP_COLOR[t] ?? TYP_COLOR.sonstiges} border-transparent`}`}>
                  {VERANSTALTUNGSTYP_LABEL[t as keyof typeof VERANSTALTUNGSTYP_LABEL]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {gefiltert.length === 0 && hauptEvents.length === 0 && (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">🏆</p>
          <p>Noch keine Veranstaltungen erfasst.</p>
          {isTrainer() && (
            <Link to="/veranstaltungen/neu" className="mt-4 inline-block btn-primary">Erste Veranstaltung anlegen</Link>
          )}
        </div>
      )}

      {gefiltert.length === 0 && hauptEvents.length > 0 && (
        <div className="card text-center py-8 text-gray-400 text-sm">Keine Treffer.</div>
      )}

      <div className="space-y-2">
        {gefiltert.map((v) => (
          <Link key={v.id} to={`/veranstaltungen/${v.id}`} className="card flex items-center gap-3 hover:border-blue-300 transition-colors block">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{v.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYP_COLOR[v.typ] ?? TYP_COLOR.sonstiges}`}>
                  {VERANSTALTUNGSTYP_LABEL[v.typ]}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {v.datum ? new Date(v.datum).toLocaleDateString('de-DE') : 'Kein Datum'}
                {v.ort ? ` · ${v.ort}` : ''}
              </p>
            </div>
            <span className="text-gray-400">›</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
