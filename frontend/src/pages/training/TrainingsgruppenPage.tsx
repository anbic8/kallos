import { useEffect, useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { fetchTrainingsgruppen, createTrainingsgruppe, updateTrainingsgruppe, deleteTrainingsgruppe, fetchGruppen } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import type { Trainingsgruppe, Gruppe, Wochentag } from '../../api/types'
import { WOCHENTAG_LABEL, WOCHENTAG_ORDER } from '../../api/types'

export default function TrainingsgruppenPage() {
  const { isTrainer } = useAuthStore()
  const [trainingsgruppen, setTrainingsgruppen] = useState<Trainingsgruppe[]>([])
  const [gruppen, setGruppen] = useState<Gruppe[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTg, setEditTg] = useState<Trainingsgruppe | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ gruppe_id: '', wochentag: 'montag' as Wochentag, uhrzeit: '18:00' })

  const reload = () => fetchTrainingsgruppen().then(setTrainingsgruppen).catch(() => {})

  useEffect(() => {
    Promise.all([fetchTrainingsgruppen(), fetchGruppen()])
      .then(([tg, g]) => { setTrainingsgruppen(tg); setGruppen(g) })
      .finally(() => setLoading(false))
  }, [])

  const openCreate = () => {
    setEditTg(null)
    setForm({ gruppe_id: gruppen[0] ? String(gruppen[0].id) : '', wochentag: 'montag', uhrzeit: '18:00' })
    setShowForm(true)
  }

  const openEdit = (tg: Trainingsgruppe) => {
    setEditTg(tg)
    setForm({ gruppe_id: String(tg.gruppe_id), wochentag: tg.wochentag, uhrzeit: tg.uhrzeit.slice(0, 5) })
    setShowForm(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.gruppe_id) return
    setSaving(true)
    try {
      const payload = { gruppe_id: Number(form.gruppe_id), wochentag: form.wochentag, uhrzeit: form.uhrzeit }
      if (editTg) await updateTrainingsgruppe(editTg.id, payload)
      else await createTrainingsgruppe(payload)
      setShowForm(false)
      reload()
    } finally { setSaving(false) }
  }

  const handleDelete = async (tg: Trainingsgruppe) => {
    if (!confirm(`Training "${tg.gruppe?.name} · ${WOCHENTAG_LABEL[tg.wochentag]} ${tg.uhrzeit.slice(0, 5)}" wirklich löschen? Alle Anwesenheitsdaten gehen verloren.`)) return
    await deleteTrainingsgruppe(tg.id)
    reload()
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Laden...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trainingstermine</h1>
        {isTrainer() && gruppen.length > 0 && (
          <button onClick={showForm && !editTg ? () => setShowForm(false) : openCreate} className="btn-primary text-sm">
            {showForm && !editTg ? 'Abbrechen' : '+ Neu'}
          </button>
        )}
      </div>

      {isTrainer() && gruppen.length === 0 && (
        <div className="card text-center py-8 text-gray-400 text-sm">
          Lege zuerst eine <Link to="/gruppen" className="text-blue-400 hover:underline">Gruppe</Link> an, bevor du ein Training erstellst.
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-3">
          <h2 className="font-semibold">{editTg ? 'Training bearbeiten' : 'Neues Training'}</h2>
          <div>
            <label className="label">Gruppe *</label>
            <select className="input" value={form.gruppe_id} onChange={(e) => setForm((f) => ({ ...f, gruppe_id: e.target.value }))} required>
              {gruppen.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Wochentag</label>
              <select className="input" value={form.wochentag} onChange={(e) => setForm((f) => ({ ...f, wochentag: e.target.value as Wochentag }))}>
                {WOCHENTAG_ORDER.map((w) => <option key={w} value={w}>{WOCHENTAG_LABEL[w]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Uhrzeit</label>
              <input className="input" type="time" value={form.uhrzeit} onChange={(e) => setForm((f) => ({ ...f, uhrzeit: e.target.value }))} required />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-secondary flex-1" onClick={() => setShowForm(false)}>Abbrechen</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Speichern...' : 'Speichern'}</button>
          </div>
        </form>
      )}

      {trainingsgruppen.length === 0 && !showForm && (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">📅</p>
          <p>Noch keine Trainingstermine angelegt.</p>
        </div>
      )}

      <div className="space-y-2">
        {trainingsgruppen.map((tg) => (
          <div key={tg.id} className="card flex items-center gap-3">
            <Link to={`/training/${tg.id}`} className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 font-medium">
                  {WOCHENTAG_LABEL[tg.wochentag]} {tg.uhrzeit.slice(0, 5)}
                </span>
                <span className="font-semibold">{tg.gruppe?.name ?? `Gruppe #${tg.gruppe_id}`}</span>
              </div>
            </Link>
            {isTrainer() && (
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(tg)} className="text-xs text-blue-400 hover:underline">Bearbeiten</button>
                <button onClick={() => handleDelete(tg)} className="text-xs text-red-400 hover:text-red-300">Löschen</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
