import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Button, Card, Modal, FormGroup, Input, Select, Textarea, Badge, EmptyState, ConfirmModal } from '../components/shared/UI'
import { announcementsApi, schedulesApi } from '../lib/supabase'

// ── ANUNCIOS ─────────────────────────────────────────────────
export function AnnouncementsPage() {
  const { announcements, setAnnouncements, showToast } = useApp()
  const [modal, setModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [form, setForm] = useState({ title: '', body: '', type: 'general', bg_color: '#E53935', expires_at: '' })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.title.trim()) { showToast('Ingresa un título', 'error'); return }
    setSaving(true)
    try {
      const { data } = await announcementsApi.create({ ...form, is_active: true })
      setAnnouncements(prev => [data, ...prev])
      setModal(false)
      setForm({ title: '', body: '', type: 'general', bg_color: '#E53935', expires_at: '' })
      showToast('Anuncio publicado en pantallas')
    } catch { showToast('Error publicando anuncio', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await announcementsApi.delete(confirmDelete.id)
      setAnnouncements(prev => prev.filter(a => a.id !== confirmDelete.id))
      showToast('Anuncio eliminado')
    } catch { showToast('Error al eliminar', 'error') }
    finally { setConfirmDelete(null) }
  }

  return (
    <div style={{ padding: '28px 32px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Anuncios</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>Crea avisos que aparecen en las pantallas</p>
        </div>
        <Button variant="primary" onClick={() => setModal(true)}>+ Nuevo anuncio</Button>
      </div>

      {announcements.length === 0 ? (
        <EmptyState icon="📢" title="Sin anuncios" desc="Crea tu primer aviso para las pantallas" action={<Button variant="primary" onClick={() => setModal(true)}>Crear anuncio</Button>} />
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Título', 'Tipo', 'Vencimiento', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: 11, color: 'var(--text2)', padding: '10px 16px', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {announcements.map(ann => (
                <tr key={ann.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 3, height: 32, borderRadius: 2, background: ann.bg_color || '#E53935', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{ann.title}</div>
                        {ann.body && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{ann.body.slice(0, 60)}...</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge color={ann.type === 'urgent' ? 'red' : ann.type === 'info' ? 'blue' : 'default'}>{ann.type}</Badge>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text2)' }}>
                    {ann.expires_at ? new Date(ann.expires_at).toLocaleDateString('es-PE') : 'Permanente'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: 'var(--green)', fontSize: 12 }}>● Activo</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Button size="sm" variant="danger" onClick={() => setConfirmDelete(ann)}>Eliminar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal 
        open={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)} 
        onConfirm={handleDelete}
        title="Eliminar Anuncio"
        message={`¿Deseas eliminar el anuncio "${confirmDelete?.title}"?`}
      />

      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo anuncio" width="500px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormGroup label="Título del anuncio">
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ej: Examen de recuperación — Miércoles 15" />
          </FormGroup>
          <FormGroup label="Descripción">
            <Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Detalles del aviso..." />
          </FormGroup>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormGroup label="Tipo">
              <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="general">General</option>
                <option value="urgent">Urgente</option>
                <option value="info">Informativo</option>
                <option value="academic">Académico</option>
              </Select>
            </FormGroup>
            <FormGroup label="Color de fondo">
              <Select value={form.bg_color} onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))}>
                <option value="#E53935">Rojo — Urgente</option>
                <option value="#1565C0">Azul — Info</option>
                <option value="#2E7D32">Verde — Éxito</option>
                <option value="#F57C00">Naranja — Aviso</option>
                <option value="#6A0DAD">Morado — Académico</option>
              </Select>
            </FormGroup>
            <FormGroup label="Fecha de vencimiento">
              <Input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
            </FormGroup>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Publicando...' : 'Publicar anuncio'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── HORARIOS ──────────────────────────────────────────────────
const DAYS = [
  { key: 'Mon', label: 'Lunes' }, { key: 'Tue', label: 'Martes' },
  { key: 'Wed', label: 'Miércoles' }, { key: 'Thu', label: 'Jueves' },
  { key: 'Fri', label: 'Viernes' }, { key: 'Sat', label: 'Sábado' },
]
const COLORS = [
  { value: '#4CAF50', label: 'Verde — Matemática' },
  { value: '#2196F3', label: 'Azul — Física' },
  { value: '#FF5722', label: 'Naranja — Química' },
  { value: '#9C27B0', label: 'Morado — Literatura' },
  { value: '#FF9800', label: 'Ámbar — Historia' },
  { value: '#00BCD4', label: 'Cian — Biología' },
  { value: '#E91E63', label: 'Rosa — Otro' },
]

export function SchedulesPage() {
  const { schedules, setSchedules, showToast } = useApp()
  const [activeDay, setActiveDay] = useState('Mon')
  const [modal, setModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ subject: '', teacher: '', room: '', start_time: '07:00', end_time: '08:30', day_of_week: 'Mon', color: '#4CAF50' })

  const daySchedules = schedules.filter(s => s.day_of_week === activeDay).sort((a, b) => a.start_time.localeCompare(b.start_time))

  const handleSave = async () => {
    if (!form.subject.trim()) { showToast('Ingresa la materia', 'error'); return }
    setSaving(true)
    try {
      const { data } = await schedulesApi.create({ ...form, is_active: true })
      setSchedules(prev => [...prev, data])
      setModal(false)
      setActiveDay(form.day_of_week)
      setForm({ subject: '', teacher: '', room: '', start_time: '07:00', end_time: '08:30', day_of_week: 'Mon', color: '#4CAF50' })
      showToast('Clase agregada al horario')
    } catch { showToast('Error guardando clase', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await schedulesApi.delete(confirmDelete.id)
      setSchedules(prev => prev.filter(s => s.id !== confirmDelete.id))
      showToast('Clase eliminada')
    } catch { showToast('Error al eliminar', 'error') }
    finally { setConfirmDelete(null) }
  }

  return (
    <div style={{ padding: '28px 32px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Horarios de Clases</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>Se muestran en tiempo real en Pantalla 2</p>
        </div>
        <Button variant="primary" onClick={() => setModal(true)}>+ Agregar clase</Button>
      </div>

      {/* Day tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--surface)', borderRadius: 10, padding: 4, border: '1px solid var(--border)', width: 'fit-content' }}>
        {DAYS.map(d => (
          <button key={d.key} onClick={() => setActiveDay(d.key)} style={{
            padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            background: activeDay === d.key ? 'var(--surface2)' : 'none',
            color: activeDay === d.key ? 'var(--text)' : 'var(--text2)',
            border: 'none', fontFamily: 'var(--sans)',
          }}>{d.label}</button>
        ))}
      </div>

      {daySchedules.length === 0 ? (
        <EmptyState icon="📅" title="Sin clases este día" desc="Agrega clases al horario" action={<Button variant="primary" onClick={() => { setForm(f => ({ ...f, day_of_week: activeDay })); setModal(true) }}>Agregar clase</Button>} />
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Hora', 'Materia', 'Profesor', 'Aula', 'Acciones'].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: 11, color: 'var(--text2)', padding: '10px 16px', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {daySchedules.map(cls => (
                <tr key={cls.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>{cls.start_time.slice(0, 5)} – {cls.end_time.slice(0, 5)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ borderLeft: `3px solid ${cls.color}`, paddingLeft: 10, fontSize: 14, fontWeight: 500 }}>{cls.subject}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text2)' }}>{cls.teacher}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{cls.room}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <Button size="sm" variant="danger" onClick={() => setConfirmDelete(cls)}>Eliminar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal 
        open={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)} 
        onConfirm={handleDelete}
        title="Eliminar Clase"
        message={`¿Deseas eliminar la clase de "${confirmDelete?.subject}"?`}
      />

      <Modal open={modal} onClose={() => setModal(false)} title="Agregar clase" width="480px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormGroup label="Materia">
              <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Ej: Matemática" />
            </FormGroup>
            <FormGroup label="Profesor">
              <Input value={form.teacher} onChange={e => setForm(f => ({ ...f, teacher: e.target.value }))} placeholder="Ej: Prof. García" />
            </FormGroup>
            <FormGroup label="Hora inicio">
              <Input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Hora fin">
              <Input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Aula">
              <Input value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} placeholder="Ej: Aula 101" />
            </FormGroup>
            <FormGroup label="Color">
              <Select value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}>
                {COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Día de la semana">
              <Select value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: e.target.value }))}>
                {DAYS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
              </Select>
            </FormGroup>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar clase'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
