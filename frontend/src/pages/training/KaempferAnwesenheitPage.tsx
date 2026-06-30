import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fetchKaempferById, fetchKaempferAnwesenheit } from '../../api/client'
import type { Kaempfer, KaempferAnwesenheitStatistik } from '../../api/types'

function Bar({ pct, color = 'bg-green-500' }: { pct: number; color?: string }) {
  return (
    <div className="flex-1 bg-gray-800 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function KaempferAnwesenheitPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [kaempfer, setKaempfer] = useState<Kaempfer | null>(null)
  const [stat, setStat] = useState<KaempferAnwesenheitStatistik | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([fetchKaempferById(Number(id)), fetchKaempferAnwesenheit(Number(id))])
      .then(([k, s]) => { setKaempfer(k); setStat(s) })
      .catch(() => navigate(-1))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center py-20 text-gray-400">Laden...</div>
  if (!kaempfer || !stat) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {kaempfer.foto_url
          ? <img src={kaempfer.foto_url} alt="" className="w-10 h-10 rounded-full object-cover" />
          : <div className="w-10 h-10 rounded-full bg-blue-950 flex items-center justify-center">🥋</div>
        }
        <div>
          <h1 className="text-xl font-bold">{kaempfer.vorname} {kaempfer.nachname} — Anwesenheit</h1>
          <Link to={`/kaempfer/${kaempfer.id}`} className="text-sm text-blue-400 hover:underline">← Profil</Link>
        </div>
      </div>

      {stat.total_termine === 0 ? (
        <div className="card text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">📅</p>
          <p>Noch keine Trainingsanwesenheit erfasst.</p>
        </div>
      ) : (
        <>
          <div className="card space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-300">Gesamt-Quote</span>
              <span className="text-2xl font-bold text-green-400">{stat.quote} %</span>
            </div>
            <Bar pct={stat.quote} />
            <p className="text-xs text-gray-500">{stat.anwesend} von {stat.total_termine} Terminen anwesend</p>
          </div>

          {stat.nach_trainingsgruppe.length > 1 && (
            <div className="card space-y-3">
              <h2 className="font-semibold text-gray-300 text-sm">Nach Trainingsgruppe</h2>
              {stat.nach_trainingsgruppe.map((g) => (
                <div key={g.trainingsgruppe_id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{g.label}</span>
                    <span className="text-gray-400">{g.anwesend}/{g.total} ({g.quote}%)</span>
                  </div>
                  <Bar pct={g.quote} color="bg-blue-500" />
                </div>
              ))}
            </div>
          )}

          <div className="card space-y-1">
            <h2 className="font-semibold text-gray-300 text-sm mb-2">Verlauf</h2>
            {stat.verlauf.map((v, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800 last:border-0 text-sm">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${v.anwesend ? 'bg-green-900 text-green-400' : 'bg-red-950 text-red-400'}`}>
                  {v.anwesend ? '✓' : '✕'}
                </span>
                <span className="text-gray-400 flex-1">{v.trainingsgruppe_label}</span>
                <span className="text-gray-500">{new Date(v.datum).toLocaleDateString('de-DE')}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
