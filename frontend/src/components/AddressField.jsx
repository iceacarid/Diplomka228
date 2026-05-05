import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../api/axios'

function debounce(fn, delay) {
  let t
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay) }
}

export default function AddressField({ label, value, onChange, placeholder }) {
  const [query, setQuery]         = useState(value || '')
  const [suggestions, setSugg]    = useState([])
  const [open, setOpen]           = useState(false)
  const [loading, setLoading]     = useState(false)
  const [cursor, setCursor]       = useState(-1)
  const wrapRef                   = useRef(null)
  const inputRef                  = useRef(null)

  const fetchSugg = useCallback(
    debounce(async (q) => {
      if (!q || q.length < 2) { setSugg([]); setOpen(false); return }
      setLoading(true)
      try {
        const { data } = await api.get('/suggest', { params: { q } })
        const items = Array.isArray(data) ? data.filter(i => i.name) : []
        setSugg(items)
        setOpen(items.length > 0)
        setCursor(-1)
      } catch {
        setSugg([])
        setOpen(false)
      }
      setLoading(false)
    }, 300),
    []
  )

  useEffect(() => { setQuery(value || '') }, [value])
  useEffect(() => { fetchSugg(query) }, [query])

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (item) => {
    setQuery(item.name)
    onChange(item.name)
    setSugg([])
    setOpen(false)
    setCursor(-1)
  }

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    onChange(val)
  }

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor(c => Math.min(c + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor(c => Math.max(c - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (cursor >= 0) select(suggestions[cursor])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setCursor(-1)
    }
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {label && (
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.4)',
          marginBottom: 6,
          fontFamily: 'var(--font-body)',
        }}>
          {label}
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder || 'Введите адрес...'}
          autoComplete="off"
          style={{
            background: 'var(--navy-3)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'white',
            padding: '11px 36px 11px 13px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            fontFamily: 'var(--font-body)',
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
        {loading && (
          <div style={{
            position: 'absolute',
            right: 11,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 14,
            height: 14,
            border: '2px solid rgba(255,255,255,0.12)',
            borderTopColor: 'var(--gold)',
            borderRadius: '50%',
            animation: 'af-spin 0.6s linear infinite',
            pointerEvents: 'none',
          }} />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'var(--navy-2)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6,
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        }}>
          {suggestions.map((item, i) => (
            <SuggestItem
              key={i}
              item={item}
              active={i === cursor}
              onSelect={select}
              onHover={() => setCursor(i)}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes af-spin {
          to { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function SuggestItem({ item, active, onSelect, onHover }) {
  return (
    <div
      onMouseEnter={onHover}
      onMouseDown={(e) => { e.preventDefault(); onSelect(item) }}
      style={{
        padding: '10px 14px',
        fontSize: 13,
        color: active ? 'white' : 'rgba(255,255,255,0.75)',
        background: active ? 'rgba(240,165,0,0.1)' : 'transparent',
        cursor: 'pointer',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        fontFamily: 'var(--font-body)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(240,165,0,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.name}
      </span>
    </div>
  )
}
