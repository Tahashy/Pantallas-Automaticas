import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { StatCard, Card, Button, LiveDot, Badge, Spinner } from '../components/shared/UI'

export function Dashboard() {
  const { content, screens, announcements, preferences, loading } = useApp()
  const navigate = useNavigate()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
      <Spinner size={28} />
      <span style={{ color: 'var(--text2)' }}>Cargando sistema...</span>
    </div>
  )

  const activeAnnouncements = announcements.filter(a => a.is_active)

  return (
    <div style={{ padding: '28px 32px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Dashboard</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>Sistema de digital signage · {preferences?.academy_name || 'Academia Adelante'}</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/admin/contenido')}>+ Subir contenido</Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Items de contenido" value={content.length} />
        <StatCard label="Pantallas activas" value={screens.filter(s => s.is_active).length} accent="var(--green)" />
        <StatCard label="Anuncios activos" value={activeAnnouncements.length} accent="var(--accent2)" />
        <StatCard label="Tiempo activo" value="24h" accent="var(--blue)" />
      </div>

      {/* Screens */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        {screens.map((screen, i) => (
          <Card key={screen.id}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i === 0 ? 'rgba(59,130,246,0.15)' : 'rgba(34,197,94,0.15)',
                color: i === 0 ? 'var(--blue)' : 'var(--green)',
                border: `1px solid ${i === 0 ? 'rgba(59,130,246,0.3)' : 'rgba(34,197,94,0.3)'}`,
                fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
              }}>P{i + 1}</div>
              <h3 style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{screen.name}</h3>
              <LiveDot color={i === 0 ? 'var(--blue)' : 'var(--green)'} />
            </div>

            {/* Preview */}
            <div style={{
              margin: 14, aspectRatio: '16/9', background: '#0a0a2e',
              borderRadius: 8, border: '1px solid var(--border)',
              position: 'relative', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ScreenPreview index={i} preferences={preferences} />
              <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.7)', padding: '3px 8px', borderRadius: 4, fontSize: 10, color: i === 0 ? '#3b82f6' : '#22c55e' }}>
                ● EN VIVO
              </div>
            </div>

            <div style={{ padding: '0 14px 14px', display: 'flex', gap: 8 }}>
              <Button size="sm" onClick={() => navigate('/admin/pantallas')}>⚙ Configurar</Button>
              <Button size="sm" onClick={() => window.open(`/pantalla${i + 1}`, '_blank')}>🔗 Abrir pantalla</Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Anuncios activos */}
      {activeAnnouncements.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Anuncios activos</h3>
            <Button size="sm" variant="outline" onClick={() => navigate('/admin/anuncios')}>Ver todos</Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activeAnnouncements.slice(0, 3).map(ann => (
              <div key={ann.id} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                borderLeft: `3px solid ${ann.bg_color || '#E53935'}`,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{ann.title}</div>
                  {ann.body && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{ann.body.slice(0, 80)}...</div>}
                </div>
                <Badge color={ann.type === 'urgent' ? 'red' : ann.type === 'info' ? 'blue' : 'default'}>
                  {ann.type}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ScreenPreview({ index, preferences }) {
  if (index === 0) return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#0d1b6e,#1a237e,#0a0a2e)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <div style={{ width: 36, height: 36, background: 'var(--surface2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#000', fontSize: 14, overflow: 'hidden' }}>
        {preferences?.logo_url ? <img src={preferences.logo_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : 'A'}
      </div>
      <div style={{ color: '#FFD700', fontSize: 11, fontWeight: 600 }}>{preferences?.academy_name || 'Academia Adelante'}</div>
      <div style={{ color: '#90CAF9', fontSize: 9 }}>Bienvenidos</div>
    </div>
  )
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0a0a2e', display: 'flex', flexDirection: 'column', padding: 12, gap: 5 }}>
      <div style={{ color: '#FFD700', fontSize: 10, fontWeight: 600 }}>Horario de hoy</div>
      {[['7:00–8:30', 'Matemática', '#4CAF50'], ['8:45–10:15', 'Física', '#2196F3'], ['10:30–12:00', 'Química', '#FF5722']].map(([t, s, c]) => (
        <div key={s} style={{ background: 'rgba(255,255,255,0.07)', borderLeft: `3px solid ${c}`, borderRadius: 4, padding: '4px 7px', fontSize: 8, color: '#fff', display: 'flex', gap: 8 }}>
          <span style={{ color: '#90CAF9', fontFamily: 'var(--mono)' }}>{t}</span> {s}
        </div>
      ))}
    </div>
  )
}
