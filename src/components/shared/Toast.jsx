import React from 'react'
import { useApp } from '../../context/AppContext'

export function ToastContainer() {
  const { toast } = useApp()
  if (!toast) return null

  const colors = {
    success: { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.35)', icon: '✓', color: '#22c55e' },
    error: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.35)', icon: '✕', color: '#ef4444' },
    info: { bg: 'var(--surface2)', border: 'var(--border)', icon: 'ℹ', color: 'var(--text2)' },
  }
  const c = colors[toast.type] || colors.info

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, animation: 'slideIn 0.3s ease' }}>
      <div style={{
        background: 'var(--surface)',
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        minWidth: 260,
      }}>
        <span style={{ color: c.color, fontSize: 16, fontWeight: 700 }}>{c.icon}</span>
        <span style={{ fontSize: 14, color: 'var(--text)' }}>{toast.msg}</span>
      </div>
    </div>
  )
}
