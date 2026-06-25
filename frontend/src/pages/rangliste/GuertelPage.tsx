import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchKaempfer, fetchHeimverein } from '../../api/client'
import type { Kaempfer, Guertel, Verein } from '../../api/types'
import { GUERTEL_COLOR, GUERTEL_LABEL } from '../../api/types'

const GUERTEL_ORDER: Guertel[] = ['weiss', 'gelb', 'orange', 'gruen', 'blau', 'braun', 'schwarz', 'dan2', 'dan3', 'dan4', 'dan5']

export default function GuertelPage() {
  const [kaempfer, setKaempfer] = useState<Kaempfer[]>([])
  const [heimverein, setHeimverein] = useState<Verein | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchKaempfer(), fetchHeimverein()])
      .then(([k, hv]) => {
        setHeimverein(hv)
        setKaempfer((k as Kaempfer[]).filter((x) => x.verein_id === hv.id))
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-gray-400">Laden...</div>

  // Sortiere Kämpfer nach Gürtelrang (höchster zuerst)
  const sortiert = [...kaempfer].sort((a, b) => {
    const ai = a.aktueller_guertel ? GUERTEL_ORDER.indexOf(a.aktueller_guertel) : -1
    const bi = b.aktueller_guertel ? GUERTEL_ORDER.indexOf(b.aktueller_guertel) : -1
    return bi - ai
  })

  // Gruppiere nach Gürtel
  const gruppen = GUERTEL_ORDER.slice().reverse().reduce<{ guertel: Guertel; mitglieder: Kaempfer[] }[]>((acc, g) => {
    const mitglieder = sortiert.filter((k) => k.aktueller_guertel === g)
    if (mitglieder.length > 0) acc.push({ guertel: g, mitglieder })
    return acc
  }, [])

  const ohneGuertel = sortiert.filter((k) => !k.aktueller_guertel)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Gürtel-Übersicht</h1>
      <p className="text-sm text-gray-500">{kaempfer.length} Vereinsmitglieder</p>

      {gruppen.map(({ guertel, mitglieder }) => (
        <div key={guertel} className="card space-y-2">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${GUERTEL_COLOR[guertel]}`}>
              {GUERTEL_LABEL[guertel]}
            </span>
            <span className="text-sm text-gray-400">{mitglieder.length} Kämpfer</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {mitglieder.map((k) => (
              <Link key={k.id} to={`/kaempfer/${k.id}`}
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-1.5 transition-colors">
                {k.foto_url
                  ? <img src={k.foto_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                  : <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm">🥋</div>
                }
                <span className="text-sm font-medium">{k.vorname} {k.nachname}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {ohneGuertel.length > 0 && (
        <div className="card space-y-2">
          <p className="text-sm text-gray-400">Ohne Gürtel ({ohneGuertel.length})</p>
          <div className="flex flex-wrap gap-2">
            {ohneGuertel.map((k) => (
              <Link key={k.id} to={`/kaempfer/${k.id}`}
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-1.5">
                <span className="text-sm font-medium">{k.vorname} {k.nachname}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
