import { useEffect, useState } from 'react'
import { fetchKaempfer, fetchKaempferStatistik } from '../../api/client'
import type { Kaempfer, KaempferStatistik } from '../../api/types'
import { ABSCHLUSS_LABEL, GUERTEL_LABEL } from '../../api/types'

function StatCell({ a, b, label }: { a: number; b: number; label: string }) {
  const aWins = a > b
  const bWins = b > a
  return (
    <div className="grid grid-cols-3 items-center py-2 border-b border-gray-100 last:border-0 text-sm">
      <span className={`text-right font-bold pr-2 ${aWins ? 'text-green-600' : 'text-gray-700'}`}>{a}</span>
      <span className="text-center text-xs text-gray-400">{label}</span>
      <span className={`text-left font-bold pl-2 ${bWins ? 'text-green-600' : 'text-gray-700'}`}>{b}</span>
    </div>
  )
}

function PctCell({ totalA, siegeA, totalB, siegeB, label }: { totalA: number; siegeA: number; totalB: number; siegeB: number; label: string }) {
  const pctA = totalA > 0 ? Math.round(siegeA / totalA * 100) : 0
  const pctB = totalB > 0 ? Math.round(siegeB / totalB * 100) : 0
  return <StatCell a={pctA} b={pctB} label={`${label} %`} />
}

export default function VergleichPage() {
  const [alleKaempfer, setAlleKaempfer] = useState<Kaempfer[]>([])
  const [idA, setIdA] = useState('')
  const [idB, setIdB] = useState('')
  const [statA, setStatA] = useState<KaempferStatistik | null>(null)
  const [statB, setStatB] = useState<KaempferStatistik | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchKaempfer().then(setAlleKaempfer).catch(() => {})
  }, [])

  const laden = async () => {
    if (!idA || !idB) return
    setLoading(true)
    try {
      const [a, b] = await Promise.all([
        fetchKaempferStatistik(Number(idA)),
        fetchKaempferStatistik(Number(idB)),
      ])
      setStatA(a)
      setStatB(b)
    } finally {
      setLoading(false)
    }
  }

  const kaempferA = alleKaempfer.find((k) => k.id === Number(idA))
  const kaempferB = alleKaempfer.find((k) => k.id === Number(idB))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Athleten-Vergleich</h1>

      {/* Auswahl */}
      <div className="card space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Kämpfer A</label>
            <select className="input" value={idA} onChange={(e) => { setIdA(e.target.value); setStatA(null) }}>
              <option value="">-- wählen --</option>
              {alleKaempfer.map((k) => (
                <option key={k.id} value={k.id}>{k.vorname} {k.nachname}{k.verein ? ` (${k.verein.name})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Kämpfer B</label>
            <select className="input" value={idB} onChange={(e) => { setIdB(e.target.value); setStatB(null) }}>
              <option value="">-- wählen --</option>
              {alleKaempfer.filter((k) => k.id !== Number(idA)).map((k) => (
                <option key={k.id} value={k.id}>{k.vorname} {k.nachname}{k.verein ? ` (${k.verein.name})` : ''}</option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={laden} disabled={!idA || !idB || loading} className="btn-primary w-full">
          {loading ? 'Laden...' : 'Vergleichen'}
        </button>
      </div>

      {statA && statB && kaempferA && kaempferB && (
        <>
          {/* Header */}
          <div className="card grid grid-cols-3 text-center">
            <div className="space-y-1">
              {kaempferA.foto_url
                ? <img src={kaempferA.foto_url} alt="" className="w-14 h-14 rounded-full object-cover mx-auto" />
                : <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto text-2xl">🥋</div>
              }
              <p className="font-bold text-sm">{kaempferA.vorname}</p>
              <p className="font-bold text-sm">{kaempferA.nachname}</p>
              {kaempferA.aktueller_guertel && (
                <p className="text-xs text-gray-500">{GUERTEL_LABEL[kaempferA.aktueller_guertel]}</p>
              )}
            </div>
            <div className="flex items-center justify-center text-2xl text-gray-300 font-bold">vs.</div>
            <div className="space-y-1">
              {kaempferB.foto_url
                ? <img src={kaempferB.foto_url} alt="" className="w-14 h-14 rounded-full object-cover mx-auto" />
                : <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto text-2xl">🥋</div>
              }
              <p className="font-bold text-sm">{kaempferB.vorname}</p>
              <p className="font-bold text-sm">{kaempferB.nachname}</p>
              {kaempferB.aktueller_guertel && (
                <p className="text-xs text-gray-500">{GUERTEL_LABEL[kaempferB.aktueller_guertel]}</p>
              )}
            </div>
          </div>

          {/* Statistik */}
          <div className="card">
            <h2 className="font-semibold text-gray-700 mb-3 text-sm text-center">Ergebnisse</h2>
            <StatCell a={statA.total} b={statB.total} label="Kämpfe" />
            <StatCell a={statA.siege} b={statB.siege} label="Siege" />
            <StatCell a={statA.niederlagen} b={statB.niederlagen} label="Niederlagen" />
            <StatCell a={statA.unentschieden} b={statB.unentschieden} label="Unentschieden" />
            <PctCell totalA={statA.total} siegeA={statA.siege} totalB={statB.total} siegeB={statB.siege} label="Siegquote" />
          </div>

          {/* Kampfstruktur */}
          <div className="card">
            <h2 className="font-semibold text-gray-700 mb-3 text-sm text-center">Kampfstruktur</h2>
            <StatCell a={statA.kampfstruktur.scoring.frueh} b={statB.kampfstruktur.scoring.frueh} label="Wertungen 0–60s" />
            <StatCell a={statA.kampfstruktur.scoring.mitte} b={statB.kampfstruktur.scoring.mitte} label="Wertungen 61–120s" />
            <StatCell a={statA.kampfstruktur.scoring.spaet} b={statB.kampfstruktur.scoring.spaet} label="Wertungen >120s" />
            <StatCell a={statA.kampfstruktur.golden_score_siege} b={statB.kampfstruktur.golden_score_siege} label="GS-Siege" />
            <StatCell a={statA.kampfstruktur.shido_erhalten} b={statB.kampfstruktur.shido_erhalten} label="Shidos erhalten" />
          </div>

          {/* Top-Techniken */}
          {(statA.techniken.length > 0 || statB.techniken.length > 0) && (
            <div className="card">
              <h2 className="font-semibold text-gray-700 mb-3 text-sm text-center">Siegtechniken (Top 5)</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  {statA.techniken.slice(0, 5).map((t, i) => (
                    <div key={t.name} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 text-xs mr-1">{i + 1}.</span>
                      <span className="flex-1 truncate">{t.name}</span>
                      <span className="font-bold text-blue-700 ml-1">{t.anzahl}×</span>
                    </div>
                  ))}
                  {statA.techniken.length === 0 && <p className="text-xs text-gray-400">–</p>}
                </div>
                <div className="space-y-1">
                  {statB.techniken.slice(0, 5).map((t, i) => (
                    <div key={t.name} className="flex items-center justify-between text-sm">
                      <span className="font-bold text-blue-700 mr-1">{t.anzahl}×</span>
                      <span className="flex-1 truncate text-right">{t.name}</span>
                      <span className="text-gray-500 text-xs ml-1">{i + 1}.</span>
                    </div>
                  ))}
                  {statB.techniken.length === 0 && <p className="text-xs text-gray-400 text-right">–</p>}
                </div>
              </div>
            </div>
          )}

          {/* Abschluss-Siege */}
          {(statA.abschluesse_siege.length > 0 || statB.abschluesse_siege.length > 0) && (
            <div className="card">
              <h2 className="font-semibold text-gray-700 mb-3 text-sm text-center">Wie sie gewinnen</h2>
              {[...new Set([...statA.abschluesse_siege.map(a => a.typ), ...statB.abschluesse_siege.map(a => a.typ)])].map((typ) => (
                <StatCell
                  key={typ}
                  a={statA.abschluesse_siege.find(x => x.typ === typ)?.anzahl ?? 0}
                  b={statB.abschluesse_siege.find(x => x.typ === typ)?.anzahl ?? 0}
                  label={ABSCHLUSS_LABEL[typ as keyof typeof ABSCHLUSS_LABEL] ?? typ}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
