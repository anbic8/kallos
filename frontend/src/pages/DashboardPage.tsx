import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchKaempfer } from '../api/client'
import { useAuthStore } from '../store/authStore'
import type { Kaempfer } from '../api/types'
import { GUERTEL_COLOR, GUERTEL_LABEL } from '../api/types'

export default function DashboardPage() {
  const { user, isTrainer } = useAuthStore()
  const [kaempfer, setKaempfer] = useState<Kaempfer[]>([])

  useEffect(() => {
    fetchKaempfer(true).then(setKaempfer).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Willkommen{user ? `, ${user.email.split('@')[0]}` : ''}</h1>
        <p className="text-gray-500 text-sm mt-1">Judo Kampfstatistiken & Coaching</p>
      </div>

      {/* Schnellzugriff */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Link to="/kaempfer" className="card flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center">
          <span className="text-3xl">🥋</span>
          <span className="font-medium text-sm">Kämpfer</span>
          <span className="text-xs text-gray-500">{kaempfer.length} intern</span>
        </Link>
        {isTrainer() && (
          <Link to="/kaempfer/neu" className="card flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center">
            <span className="text-3xl">➕</span>
            <span className="font-medium text-sm">Kämpfer anlegen</span>
          </Link>
        )}
      </div>

      {/* Vereins-Kaempfer Uebersicht */}
      {isTrainer() && kaempfer.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Vereins-Kämpfer</h2>
          <div className="space-y-2">
            {kaempfer.map((k) => (
              <Link
                key={k.id}
                to={`/kaempfer/${k.id}`}
                className="card flex items-center gap-3 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {k.foto_url ? (
                    <img src={k.foto_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg">🥋</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{k.vorname} {k.nachname}</p>
                  <p className="text-xs text-gray-500">{k.verein?.name ?? 'Kein Verein'}</p>
                </div>
                {k.aktueller_guertel && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${GUERTEL_COLOR[k.aktueller_guertel]}`}>
                    {GUERTEL_LABEL[k.aktueller_guertel]}
                  </span>
                )}
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
            <Link to="/kaempfer/neu" className="btn-primary mt-4 inline-flex">
              Ersten Kämpfer anlegen
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
