import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Card, Button, FormGroup, Input, Select, Toggle, LiveDot } from '../components/shared/UI'
import { screensApi } from '../lib/supabase'

export function ScreensPage() {
  const { screens, setScreens, showToast } = useApp()
  const [saving, setSaving] = useState(null)
  const [forms, setForms] = useState({})

  const getForm = (screen) => forms[screen.id] || {
    name: screen.name,
    location: screen.location || '',
    slide_duration: screen.slide_duration || 8,
    transition: screen.transition || 'fade',
    is_active: screen.is_active,
  }

  const setForm = (id, val) => setForms(f => ({ ...f, [id]: { ...getForm({ id, ...screens.find(s => s.id === id) }), ...val } }))

  const save = async (screen) => {
    setSaving(screen.id)
    const form = getForm(screen)
    try {
      await screensApi.update(screen.id, form)
      setScreens(prev => prev.map(s => s.id === screen.id ? { ...s, ...form } : s))
      showToast(`${form.name} guardada correctamente`)
    } catch {
      showToast('Error guardando configuración', 'error')
    } finally {
      setSaving(null)
    }
  }

  const colors = ['var(--blue)', 'var(--green)', 'var(--accent)', 'var(--accent2)']

  return (
    <div style={{ padding: '28px 32px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Configuración de Pantallas</h2>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>Gestiona las {screens.length} pantallas LED del sistema</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {screens.map((screen, i) => {
          const form = getForm(screen)
          return (
            <Card key={screen.id}>
              {/* Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700,
                  background: `${colors[i]}22`, color: colors[i], border: `1px solid ${colors[i]}44`,
                }}>P{i + 1}</div>
                <h3 style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{screen.name}</h3>
                <LiveDot color={colors[i]} />
                <Toggle value={form.is_active} onChange={v => setForm(screen.id, { is_active: v })} />
                <Button size="sm" variant="outline" onClick={() => window.open(`/pantalla${i + 1}`, '_blank')}>🔗 Ver pantalla</Button>
              </div>

              {/* Form */}
              <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormGroup label="Nombre de la pantalla">
                  <Input value={form.name} onChange={e => setForm(screen.id, { name: e.target.value })} />
                </FormGroup>
                <FormGroup label="Ubicación">
                  <Input value={form.location} onChange={e => setForm(screen.id, { location: e.target.value })} placeholder="Ej: Hall de entrada" />
                </FormGroup>
                <FormGroup label="Tiempo por slide (segundos)">
                  <Input type="number" min={3} max={60} value={form.slide_duration} onChange={e => setForm(screen.id, { slide_duration: +e.target.value })} />
                </FormGroup>
                <FormGroup label="Transición">
                  <Select value={form.transition} onChange={e => setForm(screen.id, { transition: e.target.value })}>
                    <option value="fade">Fade (fundido)</option>
                    <option value="slide">Slide (deslizamiento)</option>
                    <option value="zoom">Zoom</option>
                    <option value="none">Ninguna</option>
                  </Select>
                </FormGroup>

                <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
                  <Button variant="primary" onClick={() => save(screen)} disabled={saving === screen.id}>
                    {saving === screen.id ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {form.is_active ? '● Pantalla activa' : '○ Pantalla pausada'}
                  </span>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 24 }}>
                {[
                  ['Duración slide', `${form.slide_duration}s`],
                  ['Transición', form.transition],
                  ['Orientación', 'Horizontal 16:9'],
                  ['Estado', form.is_active ? 'Activa' : 'Pausada'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
