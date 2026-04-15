import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { LiveDot } from '../shared/UI'

const NAV = [
  { icon: '📊', label: 'Dashboard', path: '/admin' },
  { icon: '🎬', label: 'Contenido', path: '/admin/contenido' },
  { icon: '🖥️', label: 'Pantallas', path: '/admin/pantallas' },
  { icon: '📅', label: 'Programar', path: '/admin/programar' },
  { icon: '📢', label: 'Anuncios', path: '/admin/anuncios' },
  { icon: '🕐', label: 'Horarios', path: '/admin/horarios' },
  { icon: '⚙️', label: 'Preferencias', path: '/admin/preferencias' },
]

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { screens, content, preferences } = useApp()
  const academyName = preferences?.academy_name || 'Academia Adelante'
  const logoUrl = preferences?.logo_url || null

  return (
    <aside style={{
      width: 240,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'var(--surface2)', color: '#000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 18,
          marginBottom: 10, overflow: 'hidden', border: '1px solid var(--border)'
        }}>
          {logoUrl ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : 'A'}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{academyName}</div>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>Panel de Pantallas</div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text3)', padding: '0 8px', marginBottom: 8, textTransform: 'uppercase' }}>Principal</div>
        {NAV.map(item => {
          const active = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 8,
                color: active ? 'var(--accent)' : 'var(--text2)',
                fontSize: 13, fontWeight: 500,
                cursor: 'pointer', marginBottom: 2,
                background: active ? 'var(--accent-dim)' : 'none',
                border: 'none', width: '100%', textAlign: 'left',
                fontFamily: 'var(--sans)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => !active && (e.currentTarget.style.background = 'var(--surface2)')}
              onMouseLeave={e => !active && (e.currentTarget.style.background = 'none')}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
              {item.path === '/admin/contenido' && content.length > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--accent2)', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 10 }}>
                  {content.length}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Screen Status */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        {screens.map((screen, i) => (
          <div key={screen.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px', borderRadius: 8, marginBottom: 6,
            border: '1px solid var(--border)', fontSize: 12, fontWeight: 500,
          }}>
            <LiveDot color={i === 0 ? 'var(--blue)' : 'var(--green)'} />
            <span style={{ flex: 1, fontSize: 12 }}>{screen.name.split('—')[0].trim()}</span>
            <span style={{ color: 'var(--text3)', fontSize: 10 }}>{screen.is_active ? 'Activa' : 'Pausada'}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}
