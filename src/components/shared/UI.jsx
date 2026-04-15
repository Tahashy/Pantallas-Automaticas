import React from 'react'

// ── BUTTON ────────────────────────────────────────────────────
export function Button({ children, variant = 'ghost', size = 'md', onClick, disabled, className = '', type = 'button', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-bold uppercase tracking-wider rounded-full cursor-pointer transition-all duration-100 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-linear-to-r from-[#FF0080] to-[#FF8C00] text-white hover:brightness-110', 
    ghost: 'bg-linear-to-r from-[#7928CA] to-[#FF0080] text-white hover:brightness-110',
    danger: 'bg-linear-to-r from-[#FF4D4D] to-[#F9CB28] text-white hover:brightness-110',
    outline: 'bg-linear-to-r from-[#00DFD8] to-[#007CF0] text-white hover:brightness-110',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={{ fontFamily: 'var(--sans)' }}
      {...props}
    >
      {children}
    </button>
  )
}

export function Card({ children, className = '', onClick, ...props }) {
  return (
    <div
      className={`bg-surface border border-border rounded-lg overflow-hidden ${onClick ? 'cursor-pointer hover:border-border2 transition-colors' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

// ── CONFIRM MODAL ─────────────────────────────────────────────
export function ConfirmModal({ open, onClose, onConfirm, title, message, loading }) {
  if (!open) return null
  return (
    <Modal open={open} onClose={onClose} title={title} width="400px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Eliminando...' : 'Sí, eliminar'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── MODAL ─────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = '520px' }) {
  if (!open) return null
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', animation: 'fadeIn 0.2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={{ fontSize: 17, fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 16, fontFamily: 'var(--sans)' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── FORM FIELDS ───────────────────────────────────────────────
const inputStyle = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 13,
  fontFamily: 'var(--sans)',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.15s',
}

export function FormGroup({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>{label}</label>
      {children}
    </div>
  )
}

export function Input({ ...props }) {
  return <input style={inputStyle} {...props} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
}

export function Select({ children, ...props }) {
  return <select style={inputStyle} {...props}>{children}</select>
}

export function Textarea({ ...props }) {
  return <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} {...props} />
}

// ── BADGE ─────────────────────────────────────────────────────
export function Badge({ children, color = 'default' }) {
  const colors = {
    default: 'bg-surface2 text-text2 border-border',
    yellow: 'bg-accent/10 text-accent border-accent/20',
    blue: 'bg-blue/10 text-blue border-blue/20',
    green: 'bg-green/10 text-green border-green/20',
    red: 'bg-red/10 text-red border-red/20',
    orange: 'bg-accent2/10 text-accent2 border-accent2/20',
  }
  const c = colors[color] || colors.default
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${c}`}>
      {children}
    </span>
  )
}

// ── STAT CARD ─────────────────────────────────────────────────
export function StatCard({ label, value, accent }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--mono)', color: accent || 'var(--accent)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{label}</div>
    </div>
  )
}

// ── SPINNER ───────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return (
    <div style={{ width: size, height: size, border: `2px solid var(--border)`, borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  )
}

// ── TOGGLE ───────────────────────────────────────────────────
export function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
        background: value ? 'var(--accent)' : 'var(--surface2)',
        border: `1px solid ${value ? 'var(--accent)' : 'var(--border)'}`,
        position: 'relative', transition: 'all 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: value ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%',
        background: value ? '#000' : '#fff', transition: 'left 0.2s',
      }} />
    </div>
  )
}

// ── LIVE DOT ─────────────────────────────────────────────────
export function LiveDot({ color = 'var(--green)' }) {
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, animation: 'pulse 2s infinite' }} />
}

// ── EMPTY STATE ──────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, desc, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text2)' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, marginBottom: action ? 20 : 0 }}>{desc}</div>
      {action}
    </div>
  )
}
