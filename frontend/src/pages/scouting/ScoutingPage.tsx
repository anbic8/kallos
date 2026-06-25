import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchKaempfe, fetchKaempfer, fetchHeimverein } from '../../api/client'
import type { Kampf, Kaempfer, Verein } from '../../api/types'
import { ABSCHLUSS_LABEL, VERANSTALTUNGSTYP_LABEL } from '../../api/types'

export default function ScoutingPage() {
  const [kaempfe, setKaempfe] = useState<Kampf[]>([])
  const [gegner, setGegner] = useState<Kaempfer[]>([])
  const [loading, setLoading] = useState(true)
  const [ansicht, setAnsicht] = useState<'kaempfe' | 'gegner'>('gegner')

  useEffect(() => {
    Promise.all([
      fetchKaempfe({ is_scouting: true }),
      fetchKaempfer(),
      fetchHeimverein(),
    ])
      .then(([k, alle, hv]) => {
        setKaempfe(k)
        // Alle Kämpfer die NICHT vom Heimverein sind (andere Vereine oder kein Verein)
        setGegner((alle as Kaempfer[]).filter((x) => x.verein_id !== (hv as Verein).id))
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-gray-400">Laden...</div>

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Scouting</h1>
        <p className="text-sm text-gray-500 mt-1">Gegner-Profile und Scouting-Kämpfe</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { key: 'gegner', label: `Gegner-Profile (${gegner.length})` },
          { key: 'kaempfe', label: `Scouting-Kämpfe (${kaempfe.length})` },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setAnsicht(key)}
            className={`btn text-sm ${ansicht === key ? 'btn-primary' : 'btn-secondary'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Gegner-Profile */}
      {ansicht === 'gegner' && (
        <div className="space-y-2">
          {gegner.length === 0 && (
            <div className="card text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">🔍</p>
              <p>Noch keine externen Kämpfer angelegt.</p>
              <Link to="/kaempfer/neu" className="btn-primary mt-4 inline-block text-sm">Gegner anlegen</Link>
            </div>
          )}
          {gegner.map((k) => (
            <div key={k.id} className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {k.foto_url
                  ? <img src={k.foto_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-lg">👤</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{k.vorname} {k.nachname}</p>
                <p className="text-xs text-gray-500">{k.verein?.name ?? 'Kein Verein'}</p>
              </div>
              <div className="flex gap-1.5">
                <Link to={`/kaempfer/${k.id}`} className="text-xs px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">Profil</Link>
                <Link to={`/kaempfer/${k.id}/ikkz`} className="text-xs px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700">IKKZ</Link>
                <Link to={`/kaempfer/${k.id}/statistik`} className="text-xs px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700">Statistik</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scouting-Kämpfe */}
      {ansicht === 'kaempfe' && (
        <div className="space-y-2">
          {kaempfe.length === 0 && (
            <div className="card text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">🔍</p>
              <p>Noch keine Scouting-Kämpfe erfasst.</p>
              <p className="text-xs mt-2">Beim Kampf erfassen "Scouting-Kampf" ankreuzen.</p>
            </div>
          )}
          {kaempfe.map((k) => {
            const weiss = k.kaempfer_weiss
            const blau = k.kaempfer_blau
            return (
              <Link key={k.id} to={`/kaempfe/${k.id}`} className="card flex items-start gap-3 hover:border-blue-300 transition-colors block">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap text-sm">
                    <span className="font-medium">{weiss ? `${weiss.vorname} ${weiss.nachname}` : '?'}</span>
                    <span className="text-gray-400">vs.</span>
                    <span className="font-medium">{blau ? `${blau.vorname} ${blau.nachname}` : '?'}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-500">{ABSCHLUSS_LABEL[k.abschluss]}</span>
                    {k.veranstaltung && (
                      <span className="text-xs text-gray-400">
                        {k.veranstaltung.name}
                        {k.veranstaltung.datum ? ` · ${new Date(k.veranstaltung.datum).toLocaleDateString('de-DE')}` : ''}
                      </span>
                    )}
                    {k.gewichtsklasse && <span className="text-xs text-gray-400">{k.gewichtsklasse.bezeichnung}</span>}
                  </div>
                </div>
                <span className="text-gray-400 text-sm">›</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
