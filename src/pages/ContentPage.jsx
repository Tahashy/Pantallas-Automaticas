import React, { useState, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { Button, Card, Modal, FormGroup, Input, Select, Badge, EmptyState, Spinner, ConfirmModal } from '../components/shared/UI'
import { contentApi } from '../lib/supabase'

const TYPE_EMOJI = { image: '🖼️', video: '🎥', slide: '📋', announcement: '📢' }
const TYPE_LABELS = { image: 'Imagen', video: 'Video', slide: 'Slide', announcement: 'Anuncio' }

export function ContentPage() {
  const { content, setContent, showToast, loading } = useApp()
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [modal, setModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ name: '', type: 'image', duration: 8, priority: 'normal' })
  const [selectedFile, setSelectedFile] = useState(null)

  const filtered = filter === 'all' ? content : content.filter(c => c.type === filter)

  const handleFiles = useCallback(async (files) => {
    const file = files[0]
    if (!file) return
    setSelectedFile(file)
    const ext = file.name.split('.').pop().toLowerCase()
    const type = ['mp4', 'webm', 'mov'].includes(ext) ? 'video' : 'image'
    setForm(f => ({ ...f, name: file.name.replace(/\.[^.]+$/, ''), type }))
    setModal(true)
  }, [])

  const handleDrop = useCallback(e => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }, [handleFiles])

  const handleSubmit = async () => {
    if (!form.name.trim()) { showToast('Ingresa un nombre', 'error'); return }
    setUploading(true)
    try {
      let fileUrl = null
      if (selectedFile) {
        fileUrl = await contentApi.uploadFile(selectedFile)
      }
      if (editItem) {
        await contentApi.update(editItem.id, { ...form, file_url: fileUrl || editItem.file_url })
        setContent(prev => prev.map(c => c.id === editItem.id ? { ...c, ...form, file_url: fileUrl || c.file_url } : c))
        showToast('Contenido actualizado')
      } else {
        const { data } = await contentApi.create({ ...form, file_url: fileUrl })
        setContent(prev => [data, ...prev])
        showToast('Contenido publicado en pantallas')
      }
      setModal(false)
      setEditItem(null)
      setSelectedFile(null)
      setForm({ name: '', type: 'image', duration: 8, priority: 'normal' })
    } catch (err) {
      showToast('Error subiendo contenido', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    const id = confirmDelete.id
    try {
      await contentApi.delete(id)
      setContent(prev => prev.filter(c => c.id !== id))
      showToast('Contenido eliminado')
    } catch {
      showToast('Error al eliminar contenido', 'error')
    } finally {
      setConfirmDelete(null)
    }
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({ name: item.name, type: item.type, duration: item.duration, priority: item.priority })
    setModal(true)
  }

  return (
    <div style={{ padding: '28px 32px', animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Gestión de Contenido</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>Sube imágenes, videos y slides para las pantallas</p>
        </div>
        <Button variant="primary" onClick={() => { setEditItem(null); setForm({ name: '', type: 'image', duration: 8, priority: 'normal' }); setModal(true) }}>+ Subir contenido</Button>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 12, padding: '40px 32px', textAlign: 'center',
          cursor: 'pointer', marginBottom: 24,
          background: dragOver ? 'var(--accent-dim)' : 'var(--surface)',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 10 }}>☁️</div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Arrastra archivos aquí o haz clic para seleccionar</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>JPG, PNG, MP4, WebM, GIF — Máx. 50MB</div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['JPG / PNG', 'MP4 / WebM', 'GIF', 'SVG'].map(f => (
            <span key={f} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', padding: '3px 10px', borderRadius: 20, fontSize: 11, color: 'var(--text2)' }}>{f}</span>
          ))}
        </div>
      </div>
      <input id="file-input" type="file" style={{ display: 'none' }} multiple accept="image/*,video/*" onChange={e => handleFiles(Array.from(e.target.files))} />

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600 }}>Biblioteca ({filtered.length})</h3>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'image', 'video', 'slide', 'announcement'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              background: filter === f ? 'var(--surface2)' : 'transparent',
              color: filter === f ? 'var(--text)' : 'var(--text2)',
              border: '1px solid ' + (filter === f ? 'var(--border2)' : 'transparent'),
              fontFamily: 'var(--sans)',
            }}>
              {f === 'all' ? 'Todo' : TYPE_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🎬" title="Sin contenido" desc="Sube tu primer archivo para comenzar" action={<Button variant="primary" onClick={() => setModal(true)}>Subir ahora</Button>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {filtered.map(item => (
            <ContentCard key={item.id} item={item} onEdit={() => openEdit(item)} onDelete={() => setConfirmDelete(item)} />
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal 
        open={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)} 
        onConfirm={handleDelete}
        title="Eliminar Contenido"
        message={`¿Estás seguro de que deseas eliminar "${confirmDelete?.name}"? Esta acción no se puede deshacer.`}
      />

      {/* Modal */}
      <Modal open={modal} onClose={() => { setModal(false); setEditItem(null); setSelectedFile(null) }} title={editItem ? 'Editar contenido' : 'Subir contenido'} width="480px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {selectedFile && (
            <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📎</span> {selectedFile.name}
            </div>
          )}
          {!selectedFile && !editItem && (
            <button onClick={() => document.getElementById('file-input').click()} style={{ background: 'var(--surface2)', border: '2px dashed var(--border)', borderRadius: 8, padding: '20px', fontSize: 13, color: 'var(--text2)', cursor: 'pointer', textAlign: 'center', fontFamily: 'var(--sans)' }}>
              📁 Seleccionar archivo
            </button>
          )}
          <FormGroup label="Nombre">
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Banner Simulacro Abril" />
          </FormGroup>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormGroup label="Tipo">
              <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="image">Imagen</option>
                <option value="video">Video</option>
                <option value="slide">Slide</option>
                <option value="announcement">Anuncio</option>
              </Select>
            </FormGroup>
            <FormGroup label="Duración (seg)">
              <Input type="number" min={3} max={120} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))} />
            </FormGroup>
            <FormGroup label="Prioridad">
              <Select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </Select>
            </FormGroup>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button variant="ghost" onClick={() => { setModal(false); setEditItem(null); setSelectedFile(null) }}>Cancelar</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={uploading}>
              {uploading ? <><Spinner size={14} /> Subiendo...</> : editItem ? 'Guardar cambios' : 'Publicar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function ContentCard({ item, onEdit, onDelete }) {
  const [hover, setHover] = useState(false)
  return (
    <Card onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div style={{ aspectRatio: '16/9', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {item.file_url && item.type === 'image' ? (
          <img src={item.file_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : item.file_url && item.type === 'video' ? (
          <video src={item.file_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
        ) : (
          <span style={{ fontSize: 32 }}>{TYPE_EMOJI[item.type] || '📄'}</span>
        )}
        <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.8)', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontFamily: 'var(--mono)', color: '#fff' }}>
          {item.duration}s
        </div>
        {hover && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <button onClick={onEdit} style={{ background: 'var(--surface)', border: 'none', color: 'var(--text)', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 13 }}>✏</button>
            <button onClick={onDelete} style={{ background: 'var(--surface)', border: 'none', color: 'var(--red)', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 13 }}>🗑</button>
          </div>
        )}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <Badge color={item.priority === 'urgent' ? 'red' : item.priority === 'high' ? 'orange' : 'default'}>{item.priority}</Badge>
          <span style={{ fontSize: 10, color: 'var(--text3)' }}>{TYPE_LABELS[item.type]}</span>
        </div>
      </div>
    </Card>
  )
}
