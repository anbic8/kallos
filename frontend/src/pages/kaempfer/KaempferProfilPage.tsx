import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fetchKaempferById, uploadFoto, deleteKaempfer } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import type { Kaempfer } from '../../api/types'
import { GUERTEL_COLOR, GUERTEL_LABEL } from '../../api/types'

export default function KaempferProfilPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isTrainer, user } = useAuthStore()
  const [kaempfer, setKaempfer] = useState<Kaempfer | null>(null)
  const [loading, setLoading] = useState(true)
  const [fotoLoading, setFotoLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!id) return
    fetchKaempferById(Number(id))
      .then(setKaempfer)
      .catch(() => navigate('/kaempfer'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !kaempfer) return
    setFotoLoading(true)
    try {
      const updated = await uploadFoto(kaempfer.id, file)
      setKaempfer(updated)
    } catch (err: any) {
      alert(err.response?.data?.detail ?? 'Foto-Upload fehlgeschlagen')
    } finally {
      setFotoLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!kaempfer || !confirm(`${kaempfer.vorname} ${kaempfer.nachname} wirklich löschen?`)) return
    await deleteKaempfer(kaempfer.id)
    navigate('/kaempfer')
  }

  const kannBearbeiten = isTrainer() || kaempfer?.user_id === user?.id

  if (loading) return <div className="text-center py-20 text-gray-400">Laden...</div>
  if (!kaempfer) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        {/* Profilfoto */}
        <div
          className="relative w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer"
          onClick={() => kannBearbeiten && fileRef.current?.click()}
          title={kannBearbeiten ? 'Foto ändern' : ''}
        >
          {kaempfer.foto_url ? (
            <img src={kaempfer.foto_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl">🥋</span>
          )}
          {fotoLoading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs">
              Lädt...
            </div>
          )}
          {kannBearbeiten && !fotoLoading && (
            <div className="absolute bottom-0 right-0 bg-blue-700 rounded-full w-7 h-7 flex items-center justify-center text-white text-sm">
              📷
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">{kaempfer.vorname} {kaempfer.nachname}</h1>
          {kaempfer.verein && <p className="text-gray-500 text-sm">{kaempfer.verein.name}</p>}
          {kaempfer.aktueller_guertel && (
            <span className={`inline-block mt-2 text-sm px-3 py-1 rounded-full font-medium ${GUERTEL_COLOR[kaempfer.aktueller_guertel]}`}>
              {GUERTEL_LABEL[kaempfer.aktueller_guertel]}
            </span>
          )}
        </div>

        {kannBearbeiten && (
          <Link to={`/kaempfer/${kaempfer.id}/bearbeiten`} className="btn-secondary flex-shrink-0">
            Bearbeiten
          </Link>
        )}
      </div>

      {/* Details */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-700">Details</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          {kaempfer.geburtsjahr && (
            <>
              <dt className="text-gray-500">Jahrgang</dt>
              <dd className="font-medium">{kaempfer.geburtsjahr}</dd>
            </>
          )}
          {kaempfer.geschlecht && (
            <>
              <dt className="text-gray-500">Geschlecht</dt>
              <dd className="font-medium">{{ m: 'Männlich', w: 'Weiblich', d: 'Divers' }[kaempfer.geschlecht]}</dd>
            </>
          )}
          {kaempfer.verein && (
            <>
              <dt className="text-gray-500">Verein</dt>
              <dd className="font-medium">{kaempfer.verein.name}{kaempfer.verein.ort ? `, ${kaempfer.verein.ort}` : ''}</dd>
            </>
          )}
        </dl>
        {kaempfer.notizen && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Notizen</p>
            <p className="text-sm whitespace-pre-wrap">{kaempfer.notizen}</p>
          </div>
        )}
      </div>

      {/* Statistiken, Erfolge, IKKZ, Tests */}
      <div className="grid grid-cols-2 gap-3">
        <Link to={`/kaempfer/${kaempfer.id}/statistik`} className="card flex flex-col items-center gap-1 py-4 hover:border-blue-300 transition-colors text-center">
          <span className="text-3xl">📊</span>
          <p className="font-semibold text-sm">Statistiken</p>
          <p className="text-xs text-gray-500">Siege, Techniken</p>
        </Link>
        <Link to={`/kaempfer/${kaempfer.id}/erfolge`} className="card flex flex-col items-center gap-1 py-4 hover:border-blue-300 transition-colors text-center">
          <span className="text-3xl">🏆</span>
          <p className="font-semibold text-sm">Erfolge</p>
          <p className="text-xs text-gray-500">Pokale, Platzierungen</p>
        </Link>
        {kannBearbeiten && (
          <Link to={`/kaempfer/${kaempfer.id}/ikkz`} className="card flex flex-col items-center gap-1 py-4 hover:border-blue-300 transition-colors text-center">
            <span className="text-3xl">🎯</span>
            <p className="font-semibold text-sm">IKKZ</p>
            <p className="text-xs text-gray-500">Kampfkonzept</p>
          </Link>
        )}
        {kannBearbeiten && (
          <Link to={`/kaempfer/${kaempfer.id}/leistungstests`} className="card flex flex-col items-center gap-1 py-4 hover:border-blue-300 transition-colors text-center">
            <span className="text-3xl">📋</span>
            <p className="font-semibold text-sm">Leistungstests</p>
            <p className="text-xs text-gray-500">Uchi-komi, Griffkraft</p>
          </Link>
        )}
        {isTrainer() && (
          <Link to={`/kaempfer/${kaempfer.id}/druck`} className="card flex flex-col items-center gap-1 py-4 hover:border-blue-300 transition-colors text-center col-span-2">
            <span className="text-3xl">🖨</span>
            <p className="font-semibold text-sm">Druckansicht / PDF</p>
            <p className="text-xs text-gray-500">IKKZ + Kampfstruktur + Gegner-Scouting</p>
          </Link>
        )}
      </div>

      {/* Löschen (nur Trainer) */}
      {isTrainer() && (
        <button onClick={handleDelete} className="btn-danger w-full">
          Kämpfer löschen
        </button>
      )}
    </div>
  )
}
