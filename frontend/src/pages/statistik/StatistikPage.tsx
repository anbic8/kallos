import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fetchKaempferById, fetchKaempferStatistik, fetchKaempfe } from '../../api/client'
import type { Kaempfer, KaempferStatistik, Kampf } from '../../api/types'
import { ABSCHLUSS_LABEL, formatKampfzeit, VERANSTALTUNGSTYP_LABEL } from '../../api/types'

function StatBar({ value, max, color = 'bg-blue-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-6 text-right">{value}</span>
    </div>
  )
}

export default function StatistikPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [kaempfer, setKaempfer] = useState<Kaempfer | null>(null)
  const [statistik, setStatistik] = useState<KaempferStatistik | null>(null)
  const [kaempfe, setKaempfe] = useState<Kampf[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetchKaempferById(Number(id)),
      fetchKaempferStatistik(Number(id)),
      fetchKaempfe({ kaempfer_id: Number(id) }),
    ])
      .then(([k, s, kf]) => { setKaempfer(k); setStatistik(s); setKaempfe(kf) })
      .catch(() => navigate(-1))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center py-20 text-gray-400">Laden...</div>
  if (!kaempfer || !statistik) return null

  const winRate = statistik.total > 0 ? Math.round((statistik.siege / statistik.total) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        {kaempfer.foto_url ? (
          <img src={kaempfer.foto_url} alt="" className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">🥋</div>
        )}
        <div>
          <h1 className="text-xl font-bold">{kaempfer.vorname} {kaempfer.nachname}</h1>
          <Link to={`/kaempfer/${kaempfer.id}`} className="text-sm text-blue-600 hover:underline">← Profil</Link>
        </div>
      </div>

      {statistik.total === 0 && (
        <div className="card text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">📊</p>
          <p>Noch keine Kämpfe erfasst.</p>
        </div>
      )}

      {statistik.total > 0 && (
        <>
          {/* Zusammenfassung */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card text-center">
              <p className="text-3xl font-bold text-green-600">{statistik.siege}</p>
              <p className="text-xs text-gray-500 mt-1">Siege</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-red-500">{statistik.niederlagen}</p>
              <p className="text-xs text-gray-500 mt-1">Niederlagen</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-yellow-500">{statistik.unentschieden}</p>
              <p className="text-xs text-gray-500 mt-1">Unentschieden</p>
            </div>
          </div>

          <div className="card space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Siegquote</span>
              <span className="font-bold text-green-600">{winRate} %</span>
            </div>
            <StatBar value={statistik.siege} max={statistik.total} color="bg-green-500" />
            <div className="flex justify-between text-xs text-gray-400">
              <span>{statistik.total} Kämpfe gesamt</span>
            </div>
          </div>

          {/* Techniken */}
          {statistik.techniken.length > 0 && (
            <div className="card space-y-3">
              <h2 className="font-semibold text-gray-700">Siegtechniken</h2>
              <div className="space-y-2">
                {statistik.techniken.map((t) => (
                  <div key={t.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t.name}</span>
                    </div>
                    <StatBar value={t.anzahl} max={statistik.techniken[0].anzahl} color="bg-blue-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Abschluss-Verteilung */}
          {statistik.abschluesse.length > 0 && (
            <div className="card space-y-3">
              <h2 className="font-semibold text-gray-700">Abschluss-Verteilung</h2>
              <div className="space-y-2">
                {statistik.abschluesse.map((a) => (
                  <div key={a.typ}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{ABSCHLUSS_LABEL[a.typ as keyof typeof ABSCHLUSS_LABEL] ?? a.typ}</span>
                    </div>
                    <StatBar value={a.anzahl} max={statistik.abschluesse[0].anzahl} color="bg-purple-500" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Letzte Kämpfe */}
      {kaempfe.length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-700">Letzte Kämpfe</h2>
          <div className="space-y-2">
            {kaempfe.slice(0, 10).map((k) => {
              const istWeiss = k.kaempfer_weiss_id === Number(id)
              const gegner = istWeiss ? k.kaempfer_blau : k.kaempfer_weiss
              const gewonnen = (istWeiss && k.sieger === 'weiss') || (!istWeiss && k.sieger === 'blau')
              const unentschieden = k.sieger === 'unentschieden'
              return (
                <Link key={k.id} to={`/kaempfe/${k.id}`} className="flex items-center gap-3 py-1.5 border-b border-gray-100 last:border-0">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    unentschieden ? 'bg-yellow-100 text-yellow-700' : gewonnen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {unentschieden ? '=' : gewonnen ? 'S' : 'N'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {gegner ? `${gegner.vorname} ${gegner.nachname}` : 'Unbekannt'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {ABSCHLUSS_LABEL[k.abschluss]}
                      {k.veranstaltung ? ` · ${k.veranstaltung.name}` : ''}
                      {k.kampfzeit_sek != null ? ` · ${formatKampfzeit(k.kampfzeit_sek)}` : ''}
                    </p>
                  </div>
                  <span className="text-gray-400 text-xs">›</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
