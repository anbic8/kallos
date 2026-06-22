import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchKaempfer, fetchVeranstaltungen, fetchKaempfe } from '../api/client'
import { useAuthStore } from '../store/authStore'
import type { Kaempfer, Veranstaltung } from '../api/types'
import { GUERTEL_COLOR, GUERTEL_LABEL, VERANSTALTUNGSTYP_LABEL } from '../api/types'

export default function DashboardPage() {
  const { user, isTrainer } = useAuthStore()
  const [kaempfer, setKaempfer] = useState<Kaempfer[]>([])
  const [veranstaltungen, setVeranstaltungen] = useState<Veranstaltung[]>([])
  const [kaempfeCount, setKaempfeCount] = useState(0)
  const [scoutingCount, setScoutingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchKaempfer(true),
      fetchVeranstaltungen(),
      isTrainer() ? fetchKaempfe() : Promise.resolve([]),
      isTrainer() ? fetchKaempfe({ is_scouting: true }) : Promise.resolve([]),
    ])
      .then(([k, v, kf, sc]) => {
        setKaempfer(k)
        setVeranstaltungen(v.filter((v) => !v.parent_liga_id).slice(0, 5))
        setKaempfeCount((kf as any[]).length)
        setScoutingCount((sc as any[]).length)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-gray-400">Laden...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Willkommen{user ? `, ${user.email.split('@')[0]}` : ''}</h1>
        <p className="text-gray-500 text-sm mt-1">Judo Kampfstatistiken & Coaching</p>
      </div>

      {/* Schnellzugriff */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-blue-700">{kaempfer.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Kämpfer intern</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-blue-700">{kaempfeCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Kämpfe erfasst</p>
        </div>
        {isTrainer() && (
          <div className="card text-center py-3">
            <p className="text-2xl font-bold text-purple-600">{scoutingCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Scouting-Kämpfe</p>
          </div>
        )}
      </div>

      {/* Trainer-Schnellzugriff */}
      {isTrainer() && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link to="/kaempfer/neu" className="card flex flex-col items-center gap-1.5 py-4 hover:border-blue-300 transition-colors text-center text-sm">
            <span className="text-2xl">➕</span>
            <span className="font-medium">Kämpfer anlegen</span>
          </Link>
          <Link to="/veranstaltungen/neu" className="card flex flex-col items-center gap-1.5 py-4 hover:border-blue-300 transition-colors text-center text-sm">
            <span className="text-2xl">🏆</span>
            <span className="font-medium">Veranstaltung</span>
          </Link>
          <Link to="/vergleich" className="card flex flex-col items-center gap-1.5 py-4 hover:border-blue-300 transition-colors text-center text-sm">
            <span className="text-2xl">⚖️</span>
            <span className="font-medium">Vergleich</span>
          </Link>
          <Link to="/scouting" className="card flex flex-col items-center gap-1.5 py-4 hover:border-blue-300 transition-colors text-center text-sm">
            <span className="text-2xl">🔍</span>
            <span className="font-medium">Scouting</span>
          </Link>
        </div>
      )}

      {/* Athleten-Übersicht (Trainer) */}
      {isTrainer() && kaempfer.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Vereins-Athleten</h2>
          <div className="space-y-2">
            {kaempfer.map((k) => (
              <div key={k.id} className="card flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {k.foto_url
                    ? <img src={k.foto_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-lg">🥋</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{k.vorname} {k.nachname}</p>
                  {k.aktueller_guertel && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${GUERTEL_COLOR[k.aktueller_guertel]}`}>
                      {GUERTEL_LABEL[k.aktueller_guertel]}
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Link to={`/kaempfer/${k.id}`} className="text-xs px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">Profil</Link>
                  <Link to={`/kaempfer/${k.id}/statistik`} className="text-xs px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700">Statistik</Link>
                  <Link to={`/kaempfer/${k.id}/ikkz`} className="text-xs px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700">IKKZ</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Letzte Veranstaltungen */}
      {veranstaltungen.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Veranstaltungen</h2>
            <Link to="/veranstaltungen" className="text-sm text-blue-600 hover:underline">Alle →</Link>
          </div>
          <div className="space-y-2">
            {veranstaltungen.map((v) => (
              <Link key={v.id} to={`/veranstaltungen/${v.id}`} className="card flex items-center gap-3 hover:border-blue-300 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{v.name}</p>
                  <p className="text-xs text-gray-500">
                    {VERANSTALTUNGSTYP_LABEL[v.typ]}
                    {v.datum ? ` · ${new Date(v.datum).toLocaleDateString('de-DE')}` : ''}
                    {v.ort ? ` · ${v.ort}` : ''}
                  </p>
                </div>
                <span className="text-gray-400">›</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {kaempfer.length === 0 && (
        <div className="card text-center py-10 text-gray-400">
          <p className="text-4xl mb-3">🥋</p>
          <p className="font-medium">Noch keine Kämpfer angelegt</p>
          {isTrainer() && (
            <Link to="/kaempfer/neu" className="btn-primary mt-4 inline-flex">Ersten Kämpfer anlegen</Link>
          )}
        </div>
      )}
    </div>
  )
}
