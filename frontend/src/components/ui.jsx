import { useState } from 'react'

const inp = {
  background: 'var(--navy-3)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'white',
  padding: '11px 13px',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  fontFamily: 'var(--font-body)',
  outline: 'none',
  width: '100%',
}

export function Card({ children, style, padding = 24, onClick, hover }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: 'var(--navy-2)',
        border: hovered ? '1px solid var(--gold-line)' : '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8,
        padding,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.2s var(--ease-out)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function Btn({ children, kind = 'primary', icon, onClick, size = 'md', style, disabled, type = 'button' }) {
  const sizes = {
    sm: { padding: '7px 14px', fontSize: 11 },
    md: { padding: '10px 20px', fontSize: 11 },
    lg: { padding: '14px 28px', fontSize: 12 },
  }
  const kinds = {
    primary: { background: 'var(--gold)', color: 'var(--navy)', border: 'none' },
    ghost:   { background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' },
    danger:  { background: 'rgba(240,68,56,0.12)', color: 'var(--red)', border: '1px solid rgba(240,68,56,0.3)' },
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        borderRadius: 6,
        fontFamily: 'var(--font-body)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap',
        transition: 'opacity 0.15s',
        ...sizes[size],
        ...kinds[kind],
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  )
}

export function Field({ label, type = 'text', as: As = 'input', ...rest }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)' }}>
        {label}
      </span>
      <As
        type={As === 'input' ? type : undefined}
        {...rest}
        style={{ ...inp, ...(As === 'textarea' ? { resize: 'vertical', minHeight: 80 } : {}), ...rest.style }}
      />
    </label>
  )
}

export function Select({ label, children, ...rest }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)' }}>
          {label}
        </span>
      )}
      <select
        {...rest}
        style={{
          ...inp,
          cursor: 'pointer',
          ...rest.style,
        }}
      >
        {children}
      </select>
    </label>
  )
}

export function Modal({ onClose, title, children, maxWidth = 480 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div style={{ background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 28, width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 1 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4 }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function PageHeader({ eyebrow, title, action }) {
  return (
    <div style={{ padding: '28px 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
      <div>
        {eyebrow && (
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>
            {eyebrow}
          </div>
        )}
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 38, letterSpacing: 1, lineHeight: 1 }}>{title}</h1>
      </div>
      {action}
    </div>
  )
}

export function StatusPill({ status, map }) {
  const s = map[status] || { bg: 'rgba(255,255,255,0.06)', fg: 'rgba(255,255,255,0.45)', label: status }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
      borderRadius: 999, background: s.bg, color: s.fg,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.fg, flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

export function RolePill({ role }) {
  const map = {
    client:  { bg: 'rgba(123,180,255,0.14)', fg: '#7BB4FF', label: 'Клиент' },
    manager: { bg: 'rgba(240,165,0,0.14)',   fg: 'var(--gold)', label: 'Менеджер' },
    admin:   { bg: 'rgba(240,68,56,0.14)',   fg: '#FF8A8A', label: 'Админ' },
    courier: { bg: 'rgba(20,184,166,0.14)',  fg: '#14B8A6', label: 'Курьер' },
  }
  const s = map[role] || map.client
  return (
    <span style={{ padding: '3px 9px', borderRadius: 4, background: s.bg, color: s.fg, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
      {s.label}
    </span>
  )
}

export function Alert({ type = 'error', children }) {
  const styles = {
    error:   { bg: 'rgba(240,68,56,0.1)',    border: 'rgba(240,68,56,0.3)',    color: 'var(--red)' },
    success: { bg: 'rgba(18,183,106,0.1)',   border: 'rgba(18,183,106,0.3)',   color: 'var(--green)' },
    warning: { bg: 'rgba(247,144,9,0.1)',    border: 'rgba(247,144,9,0.3)',    color: 'var(--amber)' },
  }
  const s = styles[type]
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: 6, padding: '10px 14px', fontSize: 13, fontFamily: 'var(--font-body)', marginBottom: 16 }}>
      {children}
    </div>
  )
}

export function Loading() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0', fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)' }}>
      Загрузка...
    </div>
  )
}

export function Empty({ text = 'Нет данных' }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0', fontSize: 13, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-body)' }}>
      {text}
    </div>
  )
}

export function StatTile({ icon, label, value, sub, trend }) {
  const up = trend && trend.startsWith('+')
  const down = trend && trend.startsWith('-')
  return (
    <Card padding={22}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)', lineHeight: 1.4, paddingRight: 8 }}>{label}</div>
        <div style={{ color: 'var(--gold)', opacity: 0.75, flexShrink: 0 }}>{icon}</div>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, letterSpacing: 1, lineHeight: 1, marginBottom: 10 }}>{value}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)' }}>{sub}</div>
        {trend && trend !== '—' && (
          <span style={{
            fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', flexShrink: 0,
            color: up ? '#12B76A' : down ? 'var(--red)' : 'rgba(255,255,255,0.4)',
            background: up ? 'rgba(18,183,106,0.12)' : down ? 'rgba(240,68,56,0.12)' : 'rgba(255,255,255,0.06)',
            padding: '3px 7px', borderRadius: 4,
          }}>{trend}</span>
        )}
      </div>
    </Card>
  )
}

export function DataTable({ columns, rows }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {columns.map((c, i) => (
              <th key={i} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: '13px 16px', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
