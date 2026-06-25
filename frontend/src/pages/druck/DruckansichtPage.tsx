import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { fetchKaempferById, fetchIKKZ, fetchKaempferStatistik, fetchKaempfer } from '../../api/client'
import type { Kaempfer, IKKZEintrag, KaempferStatistik } from '../../api/types'
import { GUERTEL_LABEL, IKKZ_RICHTUNG_LABEL, IKKZ_SITUATION_LABEL, IKKZ_PRIORITAET_LABEL, ABSCHLUSS_LABEL } from '../../api/types'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-bold border-b-2 border-gray-800 pb-1 mb-3">{title}</h2>
      {children}
    </div>
  )
}

function IKKZTabelle({ eintraege, titel }: { eintraege: IKKZEintrag[]; titel: string }) {
  if (eintraege.length === 0) return null
  return (
    <Section title={titel}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-1 text-left">Priorität</th>
            <th className="border border-gray-300 px-2 py-1 text-left">Technik</th>
            <th className="border border-gray-300 px-2 py-1 text-left">Richtung</th>
            <th className="border border-gray-300 px-2 py-1 text-left">Situation</th>
            <th className="border border-gray-300 px-2 py-1 text-left">Kombination</th>
            <th className="border border-gray-300 px-2 py-1 text-left">Notiz</th>
          </tr>
        </thead>
        <tbody>
          {eintraege.map((e) => (
            <tr key={e.id}>
              <td className="border border-gray-300 px-2 py-1 font-medium">{IKKZ_PRIORITAET_LABEL[e.prioritaet]}</td>
              <td className="border border-gray-300 px-2 py-1 font-bold">{e.technik?.name ?? e.technik_frei ?? '–'}</td>
              <td className="border border-gray-300 px-2 py-1">{IKKZ_RICHTUNG_LABEL[e.richtung]}</td>
              <td className="border border-gray-300 px-2 py-1">{IKKZ_SITUATION_LABEL[e.situation]}</td>
              <td className="border border-gray-300 px-2 py-1 text-xs">
                {e.kombinations_technik || e.kombinations_technik_frei
                  ? `${e.hauptwaffe_position === 'erst' ? '→' : '←'} ${e.kombinations_technik?.name ?? e.kombinations_technik_frei}`
                  : '–'}
              </td>
              <td className="border border-gray-300 px-2 py-1 text-xs text-gray-600">{e.notizen ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  )
}

export default function DruckansichtPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const gegnerId = searchParams.get('gegner')

  const [kaempfer, setKaempfer] = useState<Kaempfer | null>(null)
  const [gegner, setGegner] = useState<Kaempfer | null>(null)
  const [ikkz, setIkkz] = useState<IKKZEintrag[]>([])
  const [gegnerIkkz, setGegnerIkkz] = useState<IKKZEintrag[]>([])
  const [statistik, setStatistik] = useState<KaempferStatistik | null>(null)
  const [alleKaempfer, setAlleKaempfer] = useState<Kaempfer[]>([])
  const [selectedGegner, setSelectedGegner] = useState(gegnerId ?? '')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetchKaempferById(Number(id)),
      fetchIKKZ(Number(id)),
      fetchKaempferStatistik(Number(id)).catch(() => null),
      fetchKaempfer(),
    ])
      .then(([k, e, s, alle]) => {
        setKaempfer(k as Kaempfer)
        setIkkz(e as IKKZEintrag[])
        setStatistik(s as KaempferStatistik | null)
        setAlleKaempfer((alle as Kaempfer[]).filter((x) => x.id !== Number(id)))
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!selectedGegner) { setGegner(null); setGegnerIkkz([]); return }
    Promise.all([
      fetchKaempferById(Number(selectedGegner)),
      fetchIKKZ(Number(selectedGegner)),
    ]).then(([k, e]) => { setGegner(k as Kaempfer); setGegnerIkkz(e as IKKZEintrag[]) })
  }, [selectedGegner])

  if (loading) return <div className="text-center py-20 text-gray-400">Laden...</div>
  if (!kaempfer) return null

  return (
    <>
      {/* Steuerung (wird beim Drucken ausgeblendet) */}
      <div className="print:hidden mb-6 flex items-center gap-4 flex-wrap">
        <button onClick={() => window.print()} className="btn-primary">🖨 Drucken / Als PDF speichern</button>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Gegner:</label>
          <select className="input text-sm w-60" value={selectedGegner} onChange={(e) => setSelectedGegner(e.target.value)}>
            <option value="">– kein Gegner –</option>
            {alleKaempfer.map((k) => (
              <option key={k.id} value={k.id}>{k.vorname} {k.nachname}{k.verein ? ` (${k.verein.name})` : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Druckbereich */}
      <div className="max-w-3xl mx-auto font-sans text-gray-900 text-sm">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6 border-b-2 border-gray-800 pb-4">
          {kaempfer.foto_url && (
            <img src={kaempfer.foto_url} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{kaempfer.vorname} {kaempfer.nachname}</h1>
            {kaempfer.aktueller_guertel && (
              <p className="text-gray-600">{GUERTEL_LABEL[kaempfer.aktueller_guertel]}</p>
            )}
            {kaempfer.verein && <p className="text-gray-500">{kaempfer.verein.name}</p>}
          </div>
          {gegner && (
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Gegner</p>
              <p className="font-bold">{gegner.vorname} {gegner.nachname}</p>
              {gegner.aktueller_guertel && <p className="text-sm text-gray-600">{GUERTEL_LABEL[gegner.aktueller_guertel]}</p>}
              {gegner.verein && <p className="text-xs text-gray-400">{gegner.verein.name}</p>}
            </div>
          )}
        </div>

        {/* Kampfstruktur */}
        {statistik && statistik.total > 0 && (
          <Section title="Kampfstruktur">
            <div className="grid grid-cols-4 gap-3 text-center mb-3">
              {[
                { l: 'Kämpfe', v: statistik.total },
                { l: 'Siege', v: `${statistik.siege} (${statistik.total > 0 ? Math.round(statistik.siege / statistik.total * 100) : 0}%)` },
                { l: 'GS-Siege', v: statistik.kampfstruktur.golden_score_siege },
                { l: 'Shidos erh.', v: statistik.kampfstruktur.shido_erhalten },
              ].map(({ l, v }) => (
                <div key={l} className="border border-gray-300 rounded p-2">
                  <p className="font-bold text-lg">{v}</p>
                  <p className="text-xs text-gray-500">{l}</p>
                </div>
              ))}
            </div>
            {statistik.techniken.length > 0 && (
              <div>
                <p className="font-medium mb-1">Siegtechniken:</p>
                <div className="flex flex-wrap gap-2">
                  {statistik.techniken.slice(0, 8).map((t, i) => (
                    <span key={t.name} className="text-xs bg-gray-100 rounded px-2 py-0.5">
                      {i + 1}. {t.name} ({t.anzahl}×)
                    </span>
                  ))}
                </div>
              </div>
            )}
            {statistik.abschluesse_siege.length > 0 && (
              <div className="mt-2">
                <p className="font-medium mb-1">Wie ich gewinne:</p>
                <div className="flex flex-wrap gap-2">
                  {statistik.abschluesse_siege.map((a) => (
                    <span key={a.typ} className="text-xs bg-green-50 text-green-700 rounded px-2 py-0.5">
                      {ABSCHLUSS_LABEL[a.typ as keyof typeof ABSCHLUSS_LABEL] ?? a.typ}: {a.anzahl}×
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Eigenes IKKZ */}
        <IKKZTabelle eintraege={ikkz} titel="Kampfkonzept (IKKZ)" />

        {/* Gegner IKKZ */}
        {gegner && <IKKZTabelle eintraege={gegnerIkkz} titel={`Scouting: ${gegner.vorname} ${gegner.nachname}`} />}

        <p className="text-xs text-gray-400 text-right mt-8">JudoApp · {new Date().toLocaleDateString('de-DE')}</p>
      </div>
    </>
  )
}
