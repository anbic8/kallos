import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fetchVeranstaltungById, fetchKaempfe, deleteVeranstaltung, deleteKampf } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import type { Veranstaltung, Kampf } from '../../api/types'
import { VERANSTALTUNGSTYP_LABEL, ABSCHLUSS_LABEL, KAMPFRUNDE_LABEL, formatKampfzeit } from '../../api/types'

function SiegerBadge({ sieger }: { sieger: string }) {
  if (sieger === 'weiss') return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 font-medium">Sieg Weiss</span>
  if (sieger === 'blau') return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Sieg Blau</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Unentschieden</span>
}

export default function VeranstaltungDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isTrainer } = useAuthStore()
  const [veranstaltung, setVeranstaltung] = useState<Veranstaltung | null>(null)
  const [kaempfe, setKaempfe] = useState<Kampf[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (!id) return
    Promise.all([
      fetchVeranstaltungById(Number(id)),
      fetchKaempfe({ veranstaltung_id: Number(id) }),
    ])
      .then(([v, k]) => { setVeranstaltung(v); setKaempfe(k) })
      .catch(() => navigate('/veranstaltungen'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const handleDeleteVeranstaltung = async () => {
    if (!veranstaltung || !confirm(`"${veranstaltung.name}" und alle Kämpfe wirklich löschen?`)) return
    await deleteVeranstaltung(veranstaltung.id)
    navigate('/veranstaltungen')
  }

  const handleDeleteKampf = async (kampf: Kampf) => {
    if (!confirm('Diesen Kampf wirklich löschen?')) return
    await deleteKampf(kampf.id)
    setKaempfe((prev) => prev.filter((k) => k.id !== kampf.id))
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Laden...</div>
  if (!veranstaltung) return null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{veranstaltung.name}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
              {VERANSTALTUNGSTYP_LABEL[veranstaltung.typ]}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {veranstaltung.datum ? new Date(veranstaltung.datum).toLocaleDateString('de-DE') : ''}
            {veranstaltung.ort ? ` · ${veranstaltung.ort}` : ''}
            {veranstaltung.veranstalter ? ` · ${veranstaltung.veranstalter}` : ''}
          </p>
        </div>
        {isTrainer() && (
          <Link to={`/veranstaltungen/${veranstaltung.id}/bearbeiten`} className="btn-secondary flex-shrink-0 text-sm">
            Bearbeiten
          </Link>
        )}
      </div>

      {/* Kämpfe */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">Kämpfe ({kaempfe.length})</h2>
        {isTrainer() && (
          <Link to={`/veranstaltungen/${veranstaltung.id}/kaempfe/neu`} className="btn-primary text-sm">
            + Kampf erfassen
          </Link>
        )}
      </div>

      {kaempfe.length === 0 && (
        <div className="card text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">🥊</p>
          <p className="text-sm">Noch keine Kämpfe erfasst.</p>
        </div>
      )}

      <div className="space-y-2">
        {kaempfe.map((k) => {
          const weiss = k.kaempfer_weiss
          const blau = k.kaempfer_blau
          return (
            <div key={k.id} className="card space-y-2">
              <div className="flex items-start gap-2">
                <Link to={`/kaempfe/${k.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="font-medium">{weiss ? `${weiss.vorname} ${weiss.nachname}` : '?'}</span>
                    <span className="text-gray-400 text-sm">vs.</span>
                    <span className="font-medium">{blau ? `${blau.vorname} ${blau.nachname}` : '?'}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <SiegerBadge sieger={k.sieger} />
                    <span className="text-xs text-gray-500">{ABSCHLUSS_LABEL[k.abschluss]}</span>
                    {k.sieger_technik && <span className="text-xs text-gray-500">{k.sieger_technik.name}</span>}
                    {k.sieger_technik_frei && <span className="text-xs text-gray-500">{k.sieger_technik_frei}</span>}
                    {k.gewichtsklasse && <span className="text-xs text-gray-400">{k.gewichtsklasse.bezeichnung}</span>}
                    {k.runde && <span className="text-xs text-gray-400">{KAMPFRUNDE_LABEL[k.runde]}</span>}
                    {k.kampfzeit_sek != null && <span className="text-xs text-gray-400">{formatKampfzeit(k.kampfzeit_sek)}</span>}
                  </div>
                </Link>
                {isTrainer() && (
                  <button onClick={() => handleDeleteKampf(k)} className="text-red-400 hover:text-red-600 text-sm flex-shrink-0 mt-0.5">
                    ✕
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {isTrainer() && (
        <button onClick={handleDeleteVeranstaltung} className="btn-danger w-full mt-4">
          Veranstaltung löschen
        </button>
      )}
    </div>
  )
}
