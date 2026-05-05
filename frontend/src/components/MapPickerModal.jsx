import { useState, useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../api/axios'
import { Btn } from './ui'
import { Icons } from './Icons'

function debounce(fn, delay) {
  let t
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay) }
}

export default function MapPickerModal({ onClose, onSelect, title }) {
  const mapRef  = useRef(null)
  const mapInst = useRef(null)
  const pinRef  = useRef(null)
  const iconRef = useRef(null)
  const searchWrapRef = useRef(null)

  const [address,       setAddress]      = useState('')
  const [loading,       setLoading]      = useState(false)
  const [search,        setSearch]       = useState('')
  const [suggestions,   setSugg]        = useState([])
  const [searchOpen,    setSearchOpen]   = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  const fetchSugg = useCallback(
    debounce(async (q) => {
      if (!q || q.length < 2) { setSugg([]); setSearchOpen(false); return }
      setSearchLoading(true)
      try {
        const { data } = await api.get('/suggest', { params: { q } })
        const items = Array.isArray(data) ? data.filter(i => i.name && i.lat && i.lon) : []
        setSugg(items)
        setSearchOpen(items.length > 0)
      } catch { setSugg([]) }
      setSearchLoading(false)
    }, 300),
    []
  )

  useEffect(() => { fetchSugg(search) }, [search, fetchSugg])

  useEffect(() => {
    const handler = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const placePin = (lat, lng, addr) => {
    const map = mapInst.current
    if (!map) return
    if (pinRef.current) pinRef.current.setLatLng([lat, lng])
    else pinRef.current = L.marker([lat, lng], { icon: iconRef.current }).addTo(map)
    map.setView([lat, lng], 15)
    setAddress(addr)
  }

  const selectSugg = (item) => {
    setSearch(item.name)
    setSugg([])
    setSearchOpen(false)
    placePin(item.lat, item.lon, item.name)
  }

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return

    const map = L.map(mapRef.current).setView([55.75, 37.61], 10)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    }).addTo(map)

    iconRef.current = L.divIcon({
      html: '<div style="width:16px;height:16px;background:#F0A500;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.5)"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      className: '',
    })

    map.on('click', async (e) => {
      const { lat, lng } = e.latlng
      if (pinRef.current) pinRef.current.setLatLng([lat, lng])
      else pinRef.current = L.marker([lat, lng], { icon: iconRef.current }).addTo(map)

      setAddress('')
      setLoading(true)
      try {
        const { data } = await api.get('/geocode/reverse', { params: { lat, lon: lng } })
        setAddress(data.address || '')
        setSearch(data.address || '')
      } catch { setAddress('') }
      setLoading(false)
    })

    mapInst.current = map
    return () => { map.remove(); mapInst.current = null; pinRef.current = null }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', background: 'var(--navy-1)' }}>

      {/* Header */}
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'var(--navy-2)', flexShrink: 0, position: 'relative', zIndex: 1000 }}>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4, flexShrink: 0 }}
        >✕</button>

        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 1, fontFamily: 'var(--font-body)' }}>
            Выбор на карте
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'white', fontFamily: 'var(--font-body)' }}>{title}</div>
        </div>

        {/* Search bar */}
        <div ref={searchWrapRef} style={{ position: 'relative', flex: 1, maxWidth: 460 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, padding: '9px 13px' }}>
            <Icons.Search size={14} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => suggestions.length > 0 && setSearchOpen(true)}
              placeholder="Поиск адреса на карте..."
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: 13, fontFamily: 'var(--font-body)', flex: 1, minWidth: 0 }}
            />
            {searchLoading && (
              <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.12)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'mp-spin 0.6s linear infinite', flexShrink: 0 }} />
            )}
          </div>

          {searchOpen && suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 2000, background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', maxHeight: 220, overflowY: 'auto' }}>
              {suggestions.map((item, i) => (
                <div
                  key={i}
                  onMouseDown={(e) => { e.preventDefault(); selectSugg(item) }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(240,165,0,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  style={{ padding: '10px 14px', fontSize: 13, color: 'rgba(255,255,255,0.8)', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  <Icons.Pin size={12} style={{ color: 'rgba(240,165,0,0.55)', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div ref={mapRef} style={{ flex: 1 }} />

      {/* Bottom bar */}
      <div style={{ padding: '14px 20px', background: 'var(--navy-2)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, minHeight: 64 }}>
        {loading ? (
          <div style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)' }}>
            Определяем адрес...
          </div>
        ) : address ? (
          <>
            <div style={{ flex: 1, fontSize: 13, color: 'white', padding: '9px 13px', background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 6, fontFamily: 'var(--font-body)', lineHeight: 1.4 }}>
              {address}
            </div>
            <Btn onClick={() => { onSelect(address); onClose() }}>Выбрать</Btn>
          </>
        ) : (
          <div style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', fontFamily: 'var(--font-body)' }}>
            Найдите адрес через поиск или нажмите на карту
          </div>
        )}
      </div>

      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
