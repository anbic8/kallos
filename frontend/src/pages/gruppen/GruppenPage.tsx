import { useEffect, useState, FormEvent } from 'react'
import {
  fetchGruppen, createGruppe, updateGruppe, deleteGruppe,
  addMitglied, removeMitglied,
  fetchKaempfer, fetchHeimverein,
} from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import type { Gruppe, Kaempfer, Verein } from '../../api/types'
import { GUERTEL_LABEL, GUERTEL_COLOR } from '../../api/types'

export default function GruppenPage() {
  const { isTrainer } = useAuthStore()
  const [gruppen, setGruppen] = useState<Gruppe[]>([])
  const [interneKaempfer, setInterneKaempfer] = useState<Kaempfer[]>([])
  const [heimverein, setHeimverein] = useState<Verein | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [mitglieder, setMitglieder] = useState<Record<number, Kaempfer[]>>({})
  const [showForm, setShowForm] = useState(false)
  const [editGruppe, setEditGruppe] = useState<Gruppe | null>(null)
  const [form, setForm] = useState({ name: '', beschreibung: '' })
  const [saving, setSaving] = useState(false)

  const reload = () => fetchGruppen().then(setGruppen).catch(() => {})

  useEffect(() => {
    Promise.all([fetchGruppen(), fetchKaempfer(), fetchHeimverein()])
      .then(([g, k, hv]) => {
        setGruppen(g)
        setHeimverein(hv)
        setInterneKaempfer((k as Kaempfer[]).filter((x) => x.verein_id === hv.id))
      })
      .finally(() => setLoading(false))
  }, [])

  const toggleExpand = async (g: Gruppe) => {
    if (expanded === g.id) { setExpanded(null); return }
    setExpanded(g.id)
    if (!mitglieder[g.id]) {
      const response = await fetchKaempfer(undefined, g.id).catch(() => []) as Kaempfer[]
      setMitglieder((prev) => ({ ...prev, [g.id]: response }))
    }
  }

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createGruppe({ name: form.name, beschreibung: form.beschreibung || undefined })
      setShowForm(false); setForm({ name: '', beschreibung: '' }); reload()
    } finally { setSaving(false) }
  }

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault()
    if (!editGruppe) return
    setSaving(true)
    try {
      await updateGruppe(editGruppe.id, { name: form.name, beschreibung: form.beschreibung || undefined })
      setEditGruppe(null); setForm({ name: '', beschreibung: '' }); reload()
    } finally { setSaving(false) }
  }

  const handleDelete = async (g: Gruppe) => {
    if (!confirm(`Gruppe "${g.name}" löschen?`)) return
    await deleteGruppe(g.id)
    reload()
  }

  const handleAdd = async (gruppeId: number, kaempferId: number) => {
    await addMitglied(gruppeId, kaempferId)
    const updated = await fetchKaempfer(undefined, gruppeId).catch(() => []) as Kaempfer[]
    setMitglieder((prev) => ({ ...prev, [gruppeId]: updated }))
    reload()
  }

  const handleRemove = async (gruppeId: number, kaempferId: number) => {
    await removeMitglied(gruppeId, kaempferId)
    setMitglieder((prev) => ({ ...prev, [gruppeId]: (prev[gruppeId] ?? []).filter((k) => k.id !== kaempferId) }))
    reload()
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Laden...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gruppen</h1>
        {isTrainer() && (
          <button onClick={() => { setShowForm(!showForm); setEditGruppe(null); setForm({ name: '', beschreibung: '' }) }}
            className="btn-primary text-sm">
            {showForm ? 'Abbrechen' : '+ Gruppe anlegen'}
          </button>
        )}
      </div>

      {(showForm || editGruppe) && (
        <form onSubmit={editGruppe ? handleUpdate : handleCreate} className="card space-y-3">
          <h2 className="font-semibold">{editGruppe ? `Gruppe bearbeiten: ${editGruppe.name}` : 'Neue Gruppe'}</h2>
          <div>
            <label className="label">Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="z.B. U18, Kampfmannschaft, Anfänger" />
          </div>
          <div>
            <label className="label">Beschreibung</label>
            <input className="input" value={form.beschreibung} onChange={(e) => setForm((f) => ({ ...f, beschreibung: e.target.value }))} placeholder="Optional" />
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-secondary flex-1" onClick={() => { setShowForm(false); setEditGruppe(null) }}>Abbrechen</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Speichern...' : 'Speichern'}</button>
          </div>
        </form>
      )}

      {gruppen.length === 0 && !showForm && (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">👥</p>
          <p>Noch keine Gruppen angelegt.</p>
          <p className="text-xs mt-1">Beispiele: U18, Kampfmannschaft, Anfänger, Elitekader</p>
        </div>
      )}

      <div className="space-y-2">
        {gruppen.map((g) => {
          const isOpen = expanded === g.id
          const gruppenMitglieder = mitglieder[g.id] ?? []
          const nichtMitglieder = interneKaempfer.filter((k) => !gruppenMitglieder.some((m) => m.id === k.id))

          return (
            <div key={g.id} className="card space-y-3">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleExpand(g)} className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{isOpen ? '▾' : '▸'}</span>
                    <span className="font-semibold">{g.name}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{g.mitglieder_anzahl} Kämpfer</span>
                  </div>
                  {g.beschreibung && <p className="text-xs text-gray-500 mt-0.5 ml-6">{g.beschreibung}</p>}
                </button>
                {isTrainer() && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => { setEditGruppe(g); setForm({ name: g.name, beschreibung: g.beschreibung ?? '' }); setShowForm(false) }}
                      className="text-xs text-blue-600 hover:underline">Bearbeiten</button>
                    <button onClick={() => handleDelete(g)} className="text-xs text-red-400 hover:text-red-600">Löschen</button>
                  </div>
                )}
              </div>

              {isOpen && (
                <div className="border-t border-gray-100 pt-3 space-y-3">
                  {/* Mitglieder */}
                  <div className="flex flex-wrap gap-2">
                    {gruppenMitglieder.length === 0 && (
                      <p className="text-sm text-gray-400">Noch keine Mitglieder.</p>
                    )}
                    {gruppenMitglieder.map((k) => (
                      <div key={k.id} className="flex items-center gap-1.5 bg-blue-50 rounded-full pl-2 pr-1 py-1">
                        {k.foto_url
                          ? <img src={k.foto_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                          : <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-xs">🥋</div>
                        }
                        <span className="text-sm font-medium">{k.vorname} {k.nachname}</span>
                        {k.aktueller_guertel && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${GUERTEL_COLOR[k.aktueller_guertel]}`}>
                            {GUERTEL_LABEL[k.aktueller_guertel]}
                          </span>
                        )}
                        {isTrainer() && (
                          <button onClick={() => handleRemove(g.id, k.id)}
                            className="w-5 h-5 rounded-full bg-blue-200 hover:bg-red-200 text-xs flex items-center justify-center ml-0.5">
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Mitglied hinzufügen */}
                  {isTrainer() && nichtMitglieder.length > 0 && (
                    <div className="flex items-center gap-2">
                      <select
                        className="input flex-1 text-sm py-1"
                        defaultValue=""
                        onChange={(e) => { if (e.target.value) { handleAdd(g.id, Number(e.target.value)); e.target.value = '' } }}
                      >
                        <option value="">+ Kämpfer hinzufügen...</option>
                        {nichtMitglieder.map((k) => (
                          <option key={k.id} value={k.id}>{k.vorname} {k.nachname}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
