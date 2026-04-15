import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { Button, Card, FormGroup, Input, Spinner, Textarea } from '../components/shared/UI'
import { preferencesApi, contentApi } from '../lib/supabase'

export function PreferencesPage() {
  const { preferences, setPreferences, showToast } = useApp()
  const [form, setForm] = useState({ 
    academy_name: '', 
    logo_url: '', 
    ticker_text: '',
    ticker_messages: [] // Campo temporal para la edición
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (preferences) {
      setForm({
        academy_name: preferences.academy_name || '',
        logo_url: preferences.logo_url || '',
        ticker_text: preferences.ticker_text || '',
        ticker_messages: (preferences.ticker_text || '').split(' ★ ').filter(m => m.trim() !== '')
      })
    }
  }, [preferences])

  const handleSave = async () => {
    if (!form.academy_name.trim()) { showToast('El nombre es obligatorio', 'error'); return }
    setSaving(true)
    try {
      const finalTickerText = form.ticker_messages.filter(m => m.trim() !== '').join(' ★ ')
      const payload = { 
        academy_name: form.academy_name, 
        logo_url: form.logo_url, 
        ticker_text: finalTickerText 
      }
      
      await preferencesApi.update(payload)
      setPreferences(payload)
      showToast('Preferencias guardadas correctamente')
    } catch {
      showToast('Error al guardar en base de datos. Recuerda correr el SQL primero.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleUploadLogo = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await contentApi.uploadFile(file, 'logos')
      setForm(f => ({ ...f, logo_url: url }))
      showToast('Logo subido. Recuerda pulsar Guardar.')
    } catch {
      showToast('Error al subir el logo', 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ padding: '28px 32px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Preferencias</h2>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>Personaliza la identidad visual de tu plataforma y pantallas</p>
      </div>

      <Card>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>Identidad de la Institución</h3>
          
          <FormGroup label="Nombre de la Institución">
            <Input 
              value={form.academy_name} 
              onChange={e => setForm(f => ({ ...f, academy_name: e.target.value }))} 
              placeholder="Ej: Academia Preuniversitaria Descartes" 
            />
          </FormGroup>

          <FormGroup label="Logo de la Institución">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
              <div style={{ 
                width: 100, height: 100, borderRadius: 12, background: 'var(--surface2)', 
                border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0
              }}>
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: 32, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>A</span>
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Input 
                  value={form.logo_url} 
                  onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} 
                  placeholder="URL de la imagen" 
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <Button variant="outline" onClick={() => document.getElementById('logo-upload').click()} disabled={uploading}>
                    {uploading ? <><Spinner size={14} /> Subiendo...</> : '📤 Subir imagen local'}
                  </Button>
                  <input id="logo-upload" type="file" style={{ display: 'none' }} accept="image/*" onChange={handleUploadLogo} />
                  {form.logo_url && (
                    <Button variant="ghost" onClick={() => setForm(f => ({ ...f, logo_url: '' }))}>Quitar Logo</Button>
                  )}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Recomendado: Imagen PNG con fondo transparente (mínimo 200x200px).</p>
              </div>
            </div>
          </FormGroup>
          
          <FormGroup label="Mensajes de la Cinta Inferior (Ticker)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {form.ticker_messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ 
                    width: 24, height: 24, borderRadius: 6, background: 'var(--surface2)', 
                    border: '1px solid var(--border)', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 
                  }}>
                    {i + 1}
                  </div>
                  <Input 
                    value={msg} 
                    onChange={e => {
                      const msgs = [...form.ticker_messages]
                      msgs[i] = e.target.value
                      setForm(f => ({ ...f, ticker_messages: msgs }))
                    }} 
                    placeholder="Escribe un mensaje..."
                  />
                  <Button variant="ghost" size="sm" onClick={() => {
                    const msgs = form.ticker_messages.filter((_, idx) => idx !== i)
                    setForm(f => ({ ...f, ticker_messages: msgs }))
                  }}>✕</Button>
                </div>
              ))}
              <Button variant="outline" size="sm" style={{ width: 'fit-content', marginTop: 4 }} onClick={() => {
                setForm(f => ({ ...f, ticker_messages: [...f.ticker_messages, ''] }))
              }}>
                + Añadir nuevo mensaje
              </Button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
              Cada mensaje tendrá un número de índice. Se mostrarán uno tras otro con una estrella separadora.
            </p>
          </FormGroup>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Preferencias'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
