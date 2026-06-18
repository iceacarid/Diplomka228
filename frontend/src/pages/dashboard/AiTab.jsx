import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { Icons } from '../../components/Icons'
import { Card, Btn, Alert, PageHeader } from '../../components/ui'

const TWO_GIS_KEY = import.meta.env.VITE_2GIS_KEY || ''

// ─── 2GIS MapGL loader ────────────────────────────────────────────────────────
function useMapGL() {
  const [ready, setReady] = useState(typeof window !== 'undefined' && !!window.mapgl)
  useEffect(() => {
    if (window.mapgl) { setReady(true); return }
    const existing = document.querySelector('script[data-2gis]')
    if (existing) { existing.addEventListener('load', () => setReady(true)); return }
    const s = document.createElement('script')
    s.src = 'https://mapgl.2gis.com/api/js/v1'
    s.setAttribute('data-2gis', '1')
    s.onload = () => setReady(true)
    document.head.appendChild(s)
  }, [])
  return ready
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtNum(n) { return n % 1 === 0 ? String(n) : n.toFixed(1) }
function shortAddr(addr) { return addr?.split(',')[0]?.trim() ?? addr ?? '' }

const CARGO_LABELS = {
  general:   'Обычный',
  fragile:   'Хрупкий',
  perishable:'Скоропорт.',
  hazardous: 'Опасный',
  oversized: 'Негабарит',
}

function cityOf(wh) {
  return (wh?.address || wh?.name || '').split(',')[0].trim().toLowerCase()
}

function orderBelongsToWarehouse(order, wh) {
  if (!wh) return true
  const city = cityOf(wh)
  return (order.origin_address || '').toLowerCase().includes(city)
}

// ─── LoadBar ──────────────────────────────────────────────────────────────────
function LoadBar({ label, pct, rem, unit, visible = true }) {
  if (!visible) return null
  const over = pct > 100
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ color: over ? '#f04438' : 'rgba(255,255,255,0.6)' }}>
          {Math.round(pct)}%{over ? ' · перегруз!' : rem != null ? ` · ост. ${fmtNum(rem)} ${unit}` : ''}
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 3, background: over ? '#f04438' : 'var(--gold)', transition: 'width 0.25s ease' }} />
      </div>
    </div>
  )
}

// ─── CargoCard ─────────────────────────────────────────────────────────────────
function CargoCard({ order, selected, aiSuggested, onClick, onRemove, onChatOpen }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: aiSuggested ? 'rgba(139,92,246,0.08)' : selected ? 'rgba(240,165,0,0.08)' : 'var(--navy-3)',
        border: `1px solid ${aiSuggested ? 'rgba(139,92,246,0.45)' : selected ? 'rgba(240,165,0,0.35)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 7, padding: '10px 12px', cursor: onClick ? 'pointer' : 'default',
        position: 'relative', transition: 'border-color 0.15s',
      }}
    >
      {aiSuggested && (
        <div style={{ position: 'absolute', top: 6, right: onRemove ? 26 : 7, display: 'flex', alignItems: 'center', gap: 3, color: '#8b5cf6', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em' }}>
          <Icons.Sparkles size={9} />AI
        </div>
      )}
      {onRemove && (
        <button onClick={e => { e.stopPropagation(); onRemove() }}
          style={{ position: 'absolute', top: 7, right: 7, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 2 }}>
          <Icons.X size={11} />
        </button>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <button
          onClick={e => { e.stopPropagation(); onChatOpen?.() }}
          title="Открыть чат с клиентом"
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gold)',
            background: 'none', border: 'none', padding: 0, cursor: onChatOpen ? 'pointer' : 'default',
            textDecoration: onChatOpen ? 'underline dotted' : 'none',
            textUnderlineOffset: 3,
          }}
        >
          {order.tracking_id}
        </button>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
          {order.actual_weight ?? order.weight} кг
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.35 }}>
        {order.client_name || shortAddr(order.origin_address)}
      </div>
      {/* Описание груза */}
      {order.cargo_description && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {order.cargo_description}
        </div>
      )}
      {/* Тип + маршрут */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
        {order.cargo_type && (
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)', borderRadius: 3, padding: '1px 5px', textTransform: 'uppercase' }}>
            {CARGO_LABELS[order.cargo_type] || order.cargo_type}
          </span>
        )}
        {(order.origin_address || order.dest_address) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
            <span>{shortAddr(order.origin_address)}</span>
            <span style={{ color: 'var(--gold)', fontSize: 10 }}>→</span>
            <span>{shortAddr(order.dest_address)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Warehouse Map ─────────────────────────────────────────────────────────────
function WarehouseMap({ warehouses, whFrom, whTo, onSelectFrom, onSelectTo, fullscreen, onToggleFullscreen }) {
  const mapRef      = useRef(null)
  const mapInst     = useRef(null)
  const markers     = useRef([])
  const polyline    = useRef(null)
  const mapReady    = useMapGL()
  const [routeLoading, setRouteLoading] = useState(false)

  // Init map
  useEffect(() => {
    if (!mapReady || !mapRef.current || !TWO_GIS_KEY) return
    if (mapInst.current) return

    const map = new window.mapgl.Map(mapRef.current, {
      center: [55.75, 55.0],
      zoom: 4,
      key: TWO_GIS_KEY,
    })
    mapInst.current = map
    return () => { map.destroy(); mapInst.current = null }
  }, [mapReady])

  // Update markers when warehouses / selection changes
  useEffect(() => {
    if (!mapInst.current || !mapReady || warehouses.length === 0) return

    // Remove old markers
    markers.current.forEach(m => m.destroy?.())
    markers.current = []
    if (polyline.current) { polyline.current.destroy?.(); polyline.current = null }

    warehouses.forEach(wh => {
      if (!wh.latitude || !wh.longitude) return

      const isFrom = whFrom?.id === wh.id
      const isTo   = whTo?.id   === wh.id
      const color  = isFrom ? '#f0a500' : isTo ? '#10b981' : 'rgba(255,255,255,0.6)'
      const loadPct = wh.load_percent ?? 0
      const loadColor = loadPct >= 90 ? '#ef4444' : loadPct >= 70 ? '#f79009' : '#10b981'

      const el = document.createElement('div')
      el.style.cssText = `
        min-width:56px; padding:4px 8px; border-radius:8px;
        background:${isFrom ? '#f0a500' : isTo ? '#10b981' : '#1e1e3a'};
        border:2px solid ${isFrom ? '#f0a500' : isTo ? '#10b981' : 'rgba(255,255,255,0.25)'};
        color:${isFrom || isTo ? '#0d0d1f' : '#fff'};
        font-size:11px; font-weight:700; text-align:center;
        box-shadow:0 2px 10px rgba(0,0,0,0.5); cursor:pointer; white-space:nowrap;
      `
      el.innerHTML = `
        ${wh.name}
        <div style="font-size:9px; opacity:0.7; color:${isFrom || isTo ? '#0d0d1f' : loadColor}">
          ${loadPct}% загружен
        </div>`

      el.addEventListener('click', () => {
        if (!whFrom || whFrom.id === wh.id) {
          onSelectFrom(whFrom?.id === wh.id ? null : wh)
        } else {
          onSelectTo(whTo?.id === wh.id ? null : wh)
        }
      })

      const marker = new window.mapgl.HtmlMarker(mapInst.current, {
        coordinates: [wh.longitude, wh.latitude],
        html: el,
        anchor: [0.5, 1],
      })

      markers.current.push(marker)
    })

    // Draw route via OSRM
    if (whFrom?.latitude && whFrom?.longitude && whTo?.latitude && whTo?.longitude) {
      let cancelled = false
      setRouteLoading(true)

      const drawPoly = (coords) => {
        if (cancelled || !mapInst.current) return
        if (polyline.current) { polyline.current.destroy?.(); polyline.current = null }
        polyline.current = new window.mapgl.Polyline(mapInst.current, {
          coordinates: coords,
          width: 4,
          color: '#f0a500',
          opacity: 0.9,
        })
      }

      ;(async () => {
        const fallback = [[whFrom.longitude, whFrom.latitude], [whTo.longitude, whTo.latitude]]
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${whFrom.longitude},${whFrom.latitude};${whTo.longitude},${whTo.latitude}?overview=full&geometries=geojson`
          const res  = await fetch(url)
          const json = await res.json()
          const coords = json?.routes?.[0]?.geometry?.coordinates
          if (!cancelled) { drawPoly(coords?.length ? coords : fallback) }
        } catch {
          if (!cancelled) { drawPoly(fallback) }
        } finally {
          if (!cancelled) setRouteLoading(false)
        }
      })()

      return () => { cancelled = true; setRouteLoading(false) }
    }
  }, [mapReady, warehouses, whFrom, whTo, onSelectFrom, onSelectTo])

  // Invalidate map size when fullscreen changes
  useEffect(() => {
    if (mapInst.current) {
      setTimeout(() => mapInst.current?.invalidateSize?.(), 50)
    }
  }, [fullscreen])

  if (!TWO_GIS_KEY) {
    return (
      <div style={{ height: 480, background: 'rgba(255,255,255,0.03)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
        <Icons.Map size={28} />
        <div>Карта недоступна — добавьте VITE_2GIS_KEY в frontend/.env</div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', height: fullscreen ? '100%' : 480, borderRadius: fullscreen ? 0 : 10, overflow: 'hidden' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      {!mapReady && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(13,13,31,0.85)', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          Загрузка карты...
        </div>
      )}
      {routeLoading && (
        <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 10, background: 'rgba(13,13,31,0.88)', border: '1px solid rgba(240,165,0,0.35)', borderRadius: 6, padding: '5px 10px', color: 'var(--gold)', fontSize: 11, fontWeight: 600, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block', animation: 'pulse 1s infinite' }} />
          Строим маршрут...
        </div>
      )}
      <button
        onClick={onToggleFullscreen}
        title={fullscreen ? 'Свернуть' : 'На весь экран'}
        style={{
          position: 'absolute', top: 10, right: 10, zIndex: 10,
          background: 'rgba(13,13,31,0.85)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 6, padding: '6px 8px', color: 'rgba(255,255,255,0.7)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
          backdropFilter: 'blur(4px)',
        }}
      >
        {fullscreen ? <Icons.Minimize size={14} /> : <Icons.Maximize size={14} />}
        {fullscreen ? 'Свернуть' : 'На весь экран'}
      </button>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function AiTab() {
  const navigate = useNavigate()
  const [warehouses, setWarehouses] = useState([])
  const [trucks,     setTrucks]     = useState([])
  const [orders,     setOrders]     = useState([])

  const [whFrom, setWhFrom] = useState(null)
  const [whTo,   setWhTo]   = useState(null)
  const [selectedTruck,    setSelectedTruck]    = useState(null)
  const [selectedOrders,   setSelectedOrders]   = useState([])
  const [aiSuggestedIds,   setAiSuggestedIds]   = useState([])

  const [loading,    setLoading]    = useState(true)
  const [aiLoading,  setAiLoading]  = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')
  const [mapFullscreen,     setMapFullscreen]     = useState(false)
  const [createdTrip,       setCreatedTrip]       = useState(null)
  const [activeTrips,       setActiveTrips]       = useState([])
  const [estimatedArrival,  setEstimatedArrival]  = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [w, t, o, tr] = await Promise.all([
        api.get('/warehouses'),
        api.get('/trucks'),
        api.get('/orders'),
        api.get('/trips').catch(() => ({ data: [] })),
      ])
      setWarehouses(w.data || [])
      setTrucks((t.data || []).filter(x => x.status === 'available'))
      setOrders((o.data || []).filter(x => x.status === 'at_warehouse' && !x.trip_id))
      setActiveTrips((tr.data || []).filter(x => ['forming','loading','in_transit','arrived'].includes(x.status)))
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Filter orders by source warehouse city
  const filteredOrders = whFrom
    ? orders.filter(o => orderBelongsToWarehouse(o, whFrom))
    : orders

  const toggleOrder = (id) => {
    setSelectedOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    setAiSuggestedIds(prev => prev.filter(x => x !== id))
  }

  const selectAll = () => { setSelectedOrders(filteredOrders.map(o => o.id)); setAiSuggestedIds([]) }
  const clearAll  = () => { setSelectedOrders([]); setAiSuggestedIds([]) }

  // Truck load calc
  const truckLoad = (truck) => {
    const sel = orders.filter(o => selectedOrders.includes(o.id))
    const w   = sel.reduce((s, o) => s + Number(o.actual_weight ?? o.weight ?? 0), 0)
    const v   = sel.reduce((s, o) => s + Number(o.actual_volume ?? o.volume ?? 0), 0)
    const wCap = Number(truck.capacity_weight) || 1
    const vCap = Number(truck.capacity_volume) || 0
    return {
      w, v,
      wPct: (w / wCap) * 100,
      vPct: vCap > 0 ? (v / vCap) * 100 : 0,
      wOver: w > wCap,
      vOver: vCap > 0 && v > vCap,
      wRem: wCap - w,
      vRem: vCap > 0 ? vCap - v : null,
    }
  }

  const handleAiSuggest = async () => {
    if (!whFrom || !whTo) { setError('Сначала выберите склады на карте'); return }
    setAiLoading(true); setError(''); setSuccess('')
    try {
      const { data } = await api.post('/ai/distribution-plan', {
        warehouse_from_id: whFrom.id,
        warehouse_to_id:   whTo.id,
        order_ids:         filteredOrders.map(o => o.id),
      })
      // AI returns suggested orders for first truck
      const firstPlan = (data.plan || [])[0]
      if (firstPlan) {
        const suggestedIds = (firstPlan.orders || []).map(o => o.id)
        setSelectedOrders(suggestedIds)
        setAiSuggestedIds(suggestedIds)
        const sugTruck = trucks.find(t => t.id === firstPlan.truck_id)
        if (sugTruck) setSelectedTruck(sugTruck)
      } else {
        setError('AI не смог предложить план — выберите заказы вручную')
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка AI запроса')
    }
    setAiLoading(false)
  }

  const handleCreateTrip = async () => {
    if (!whFrom || !whTo) { setError('Выберите склад отправления и назначения на карте'); return }
    if (!selectedTruck)   { setError('Выберите фуру'); return }
    if (selectedOrders.length === 0) { setError('Выберите хотя бы один заказ'); return }

    const loadCalc = truckLoad(selectedTruck)
    if (loadCalc.wOver || loadCalc.vOver) { setError('Выбранные заказы превышают грузоподъёмность фуры'); return }

    setSubmitting(true); setError('')
    try {
      const driverRec = trucks.find(t => t.id === selectedTruck.id)
      const { data } = await api.post('/trips', {
        truck_id:             selectedTruck.id,
        driver_id:            driverRec?.driver_id || null,
        warehouse_from_id:    whFrom.id,
        warehouse_to_id:      whTo.id,
        order_ids:            selectedOrders,
        estimated_arrival_at: estimatedArrival || null,
      })
      setMapFullscreen(false)
      setCreatedTrip(data)
      setSelectedOrders([])
      setSelectedTruck(null)
      setAiSuggestedIds([])
      setEstimatedArrival('')
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка создания рейса')
    }
    setSubmitting(false)
  }

  const handleTripModalClose = () => {
    const t = createdTrip
    setCreatedTrip(null)
    if (t) {
      setSuccess(`Рейс #${t.id} создан: ${t.warehouse_from?.name} → ${t.warehouse_to?.name} (${t.orders?.length || 0} заказов)`)
      loadData()
    }
  }

  const selTruckLoad = selectedTruck ? truckLoad(selectedTruck) : null
  const canCreate    = whFrom && whTo && selectedTruck && selectedOrders.length > 0

  const selStyle = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6, padding: '8px 10px', color: 'white', fontSize: 12,
    width: '100%', outline: 'none',
  }

  return (
    <>
    <div style={{ padding: '0 0 60px' }}>
      <PageHeader eyebrow="Менеджмент" title="Распределение заказов" />

      <div style={{ padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {error   && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        {/* ── Карта + выбор маршрута ── */}
        <Card padding={0} style={{
          overflow: 'hidden',
          ...(mapFullscreen ? {
            position: 'fixed', inset: 0, zIndex: 300,
            borderRadius: 0, margin: 0,
          } : {}),
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 700, color: 'white', fontSize: 15 }}>Выбор маршрута</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexWrap: 'wrap' }}>
              {/* Откуда */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>Откуда:</span>
                <select
                  value={whFrom?.id || ''}
                  onChange={e => setWhFrom(warehouses.find(w => String(w.id) === e.target.value) || null)}
                  style={{ ...selStyle, width: 180 }}
                >
                  <option value="">Склад отправления...</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div style={{ color: 'var(--gold)', fontSize: 20 }}>→</div>

              {/* Куда */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>Куда:</span>
                <select
                  value={whTo?.id || ''}
                  onChange={e => setWhTo(warehouses.find(w => String(w.id) === e.target.value && w.id !== whFrom?.id) || null)}
                  style={{ ...selStyle, width: 180 }}
                >
                  <option value="">Склад назначения...</option>
                  {warehouses.filter(w => w.id !== whFrom?.id).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              {whFrom && whTo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 20, fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>
                  <Icons.Truck size={13} />
                  {whFrom.name} → {whTo.name}
                </div>
              )}

              {(whFrom || whTo) && (
                <button onClick={() => { setWhFrom(null); setWhTo(null) }}
                  style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 11 }}>
                  Сбросить
                </button>
              )}
            </div>
          </div>

          {/* Подсказка по карте */}
          {TWO_GIS_KEY && (
            <div style={{ padding: '8px 20px', background: 'rgba(240,165,0,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
              Нажмите на склад чтобы выбрать отправление, затем на второй склад — назначение
            </div>
          )}

          <div style={{ padding: mapFullscreen ? 0 : 16 }}>
            <WarehouseMap
              warehouses={warehouses}
              whFrom={whFrom}
              whTo={whTo}
              onSelectFrom={setWhFrom}
              onSelectTo={setWhTo}
              fullscreen={mapFullscreen}
              onToggleFullscreen={() => setMapFullscreen(f => !f)}
            />
          </div>
        </Card>

        {/* ── Активные рейсы ── */}
        {activeTrips.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
              Активные рейсы · {activeTrips.length}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {activeTrips.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8 }}>
                  <Icons.Truck size={13} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      #{t.id} · {t.warehouse_from?.name || t.truck?.plate} → {t.warehouse_to?.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                      {t.truck?.label} · {t.driver?.name}
                      {t.distance_km ? ` · ${t.distance_km} км` : ''}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const { data } = await api.get(`/trips/${t.id}`)
                        setCreatedTrip(data)
                      } catch {}
                    }}
                    style={{ padding: '5px 12px', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 5, color: 'var(--gold)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
                  >
                    <Icons.Map size={12} /> Маршрут
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Основная секция ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

          {/* Левая: Заказы */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                Грузы на складе · {filteredOrders.length}
                {whFrom && orders.length !== filteredOrders.length && (
                  <span style={{ color: 'rgba(255,255,255,0.35)', marginLeft: 6 }}>/ {orders.length} всего</span>
                )}
              </div>
              {filteredOrders.length > 0 && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {aiSuggestedIds.length > 0 && (
                    <button
                      onClick={() => setAiSuggestedIds([])}
                      style={{ fontSize: 10, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 4, padding: '2px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                    >
                      <Icons.Sparkles size={9} /> Снять AI
                    </button>
                  )}
                  <button onClick={selectAll} style={{ fontSize: 11, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer' }}>Все</button>
                  <button onClick={clearAll}  style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>Сбросить</button>
                </div>
              )}
            </div>

            {loading ? (
              <div style={{ color: 'rgba(255,255,255,0.35)', padding: 32, textAlign: 'center' }}>Загрузка...</div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.25)', padding: '40px 0', textAlign: 'center', fontSize: 13 }}>
                {orders.length === 0
                  ? 'Нет заказов на складе'
                  : 'Нет заказов для выбранного склада отправления'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {filteredOrders.map(o => (
                  <CargoCard
                    key={o.id}
                    order={o}
                    selected={selectedOrders.includes(o.id)}
                    aiSuggested={aiSuggestedIds.includes(o.id)}
                    onClick={() => toggleOrder(o.id)}
                    onChatOpen={o.chat_id ? () => navigate('/dashboard/chats', { state: { activeChatId: o.chat_id } }) : undefined}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Правая: Фуры + создать рейс */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 0 }}>
              Свободные фуры · {trucks.length}
            </div>

            {trucks.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.25)', padding: '40px 0', textAlign: 'center', fontSize: 13 }}>
                Нет свободных фур
              </div>
            ) : (
              trucks.map(truck => {
                const isSel  = selectedTruck?.id === truck.id
                const load   = isSel ? truckLoad(truck) : null
                return (
                  <div
                    key={truck.id}
                    onClick={() => setSelectedTruck(isSel ? null : truck)}
                    style={{
                      background: isSel ? 'rgba(240,165,0,0.07)' : 'var(--navy-2)',
                      border: `1px solid ${isSel ? 'rgba(240,165,0,0.35)' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
                      transition: 'border-color 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: isSel ? 10 : 0 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'white', fontSize: 14, marginBottom: 2 }}>
                          {truck.brand} {truck.model}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                          {truck.plate_number}
                          {truck.driver_name && <span style={{ color: 'rgba(255,255,255,0.55)', marginLeft: 8 }}>· {truck.driver_name}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>
                          {Number(truck.capacity_weight).toLocaleString('ru')} кг
                        </div>
                        {truck.capacity_volume > 0 && (
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
                            {truck.capacity_volume} м³
                          </div>
                        )}
                      </div>
                    </div>

                    {isSel && load && (
                      <>
                        <LoadBar label="Вес" pct={load.wPct} rem={load.wRem} unit="кг" />
                        <LoadBar label="Объём" pct={load.vPct} rem={load.vRem} unit="м³" visible={truck.capacity_volume > 0} />
                        {selectedOrders.length > 0 && (
                          <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
                              Назначено грузов · {selectedOrders.length}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {orders.filter(o => selectedOrders.includes(o.id)).map(o => (
                                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: aiSuggestedIds.includes(o.id) ? 'rgba(139,92,246,0.07)' : 'rgba(255,255,255,0.03)', borderRadius: 5, border: `1px solid ${aiSuggestedIds.includes(o.id) ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
                                  {aiSuggestedIds.includes(o.id) && <Icons.Sparkles size={9} style={{ color: '#8b5cf6', flexShrink: 0 }} />}
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gold)', flexShrink: 0 }}>{o.tracking_id}</span>
                                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {o.cargo_description || o.client_name || shortAddr(o.origin_address)}
                                  </span>
                                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                                    {o.actual_weight ?? o.weight} кг
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })
            )}

            {/* Итог + кнопки */}
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* AI кнопка */}
              <Btn
                kind="ghost"
                icon={<Icons.Sparkles size={14}/>}
                onClick={handleAiSuggest}
                disabled={aiLoading || orders.length === 0 || trucks.length === 0}
                style={{ justifyContent: 'center' }}
              >
                {aiLoading ? 'AI думает...' : 'AI предложит заказы'}
              </Btn>

              {/* Сводка выбора */}
              {(whFrom || whTo || selectedTruck || selectedOrders.length > 0) && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px', fontSize: 12 }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Параметры рейса</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ color: 'rgba(255,255,255,0.35)', width: 80 }}>Откуда:</span>
                      <span style={{ color: whFrom ? '#f0a500' : 'rgba(255,255,255,0.2)' }}>{whFrom?.name || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ color: 'rgba(255,255,255,0.35)', width: 80 }}>Куда:</span>
                      <span style={{ color: whTo ? '#10b981' : 'rgba(255,255,255,0.2)' }}>{whTo?.name || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ color: 'rgba(255,255,255,0.35)', width: 80 }}>Фура:</span>
                      <span style={{ color: selectedTruck ? 'white' : 'rgba(255,255,255,0.2)' }}>
                        {selectedTruck ? `${selectedTruck.brand} ${selectedTruck.model}` : '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ color: 'rgba(255,255,255,0.35)', width: 80 }}>Заказов:</span>
                      <span style={{ color: selectedOrders.length > 0 ? 'var(--gold)' : 'rgba(255,255,255,0.2)' }}>
                        {selectedOrders.length > 0 ? `${selectedOrders.length} шт.` : '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                      <span style={{ color: 'rgba(255,255,255,0.35)', width: 80, flexShrink: 0 }}>Прибытие:</span>
                      <input
                        type="datetime-local"
                        value={estimatedArrival}
                        onChange={e => setEstimatedArrival(e.target.value)}
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 5, padding: '4px 8px', color: 'white', fontSize: 12, colorScheme: 'dark', flex: 1 }}
                      />
                    </div>
                    {estimatedArrival && (
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2, paddingLeft: 88 }}>
                        Кладовщик увидит это время на манифесте
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleCreateTrip}
                disabled={!canCreate || submitting || selTruckLoad?.wOver || selTruckLoad?.vOver}
                style={{
                  padding: '12px 0',
                  background: canCreate && !selTruckLoad?.wOver && !selTruckLoad?.vOver ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
                  border: 'none', borderRadius: 8,
                  color: canCreate && !selTruckLoad?.wOver && !selTruckLoad?.vOver ? 'var(--navy)' : 'rgba(255,255,255,0.25)',
                  fontWeight: 700, fontSize: 14, cursor: canCreate && !submitting ? 'pointer' : 'default',
                  opacity: submitting ? 0.7 : 1, transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Icons.Truck size={16} />
                {submitting ? 'Создание...' : 'Отправить в рейс'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {createdTrip && (
      <TripRouteModal trip={createdTrip} onClose={handleTripModalClose} warehouses={warehouses} />
    )}
    </>
  )
}

// ─── Trip Route Modal ─────────────────────────────────────────────────────────
function routeCenter(polyline, wFrom, wTo) {
  if (polyline && polyline.length > 0) {
    const lngs = polyline.map(p => p[0])
    const lats  = polyline.map(p => p[1])
    return [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2]
  }
  if (wFrom?.lng && wTo?.lng) return [(wFrom.lng + wTo.lng) / 2, (wFrom.lat + wTo.lat) / 2]
  return [55.75, 55.0]
}

function routeZoom(polyline, wFrom, wTo) {
  let span = 0
  if (polyline && polyline.length > 0) {
    const lngs = polyline.map(p => p[0]); const lats = polyline.map(p => p[1])
    span = Math.max(Math.max(...lngs) - Math.min(...lngs), Math.max(...lats) - Math.min(...lats))
  } else if (wFrom && wTo) {
    span = Math.max(Math.abs(wFrom.lng - wTo.lng), Math.abs(wFrom.lat - wTo.lat))
  }
  if (span > 20) return 4; if (span > 10) return 5; if (span > 5) return 6
  if (span > 2) return 7; if (span > 0.5) return 8; return 9
}

function TripRouteModal({ trip: initialTrip, onClose, warehouses = [] }) {
  const mapRef    = useRef(null)
  const mapInst   = useRef(null)
  const polyRef   = useRef(null)
  const markersRef = useRef([])
  const mapReady  = useMapGL()

  const [waypoints,     setWaypoints]     = useState(initialTrip.waypoints || [])
  const [routePolyline, setRoutePolyline] = useState(initialTrip.route_polyline || [])
  const [distanceKm,    setDistanceKm]    = useState(initialTrip.distance_km)
  const [recalcLoading, setRecalcLoading] = useState(false)
  const [recalcError,   setRecalcError]   = useState('')

  const trip = initialTrip

  // Auto-build OSRM route if only straight-line fallback (≤ 2 points)
  useEffect(() => {
    const poly = initialTrip.route_polyline || []
    if (poly.length <= 2 && initialTrip.id) {
      setRecalcLoading(true)
      api.put(`/trips/${initialTrip.id}/waypoints`, { waypoints: initialTrip.waypoints || [] })
        .then(({ data }) => {
          if (data.route_polyline?.length > 2) setRoutePolyline(data.route_polyline)
          if (data.distance_km) setDistanceKm(data.distance_km)
        })
        .catch(() => {})
        .finally(() => setRecalcLoading(false))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Init map
  useEffect(() => {
    if (!mapReady || !mapRef.current || !TWO_GIS_KEY) return
    if (mapInst.current) return

    const map = new window.mapgl.Map(mapRef.current, {
      center: routeCenter(routePolyline, trip.warehouse_from, trip.warehouse_to),
      zoom:   routeZoom(routePolyline, trip.warehouse_from, trip.warehouse_to),
      key: TWO_GIS_KEY,
    })
    mapInst.current = map

    map.on('click', (e) => {
      const [lng, lat] = e.lngLat
      setWaypoints(prev => [...prev, { lat, lng, label: '' }])
    })

    return () => { map.destroy(); mapInst.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady])

  // Update polyline
  useEffect(() => {
    if (!mapInst.current || !mapReady) return
    if (polyRef.current) { polyRef.current.destroy?.(); polyRef.current = null }
    if (routePolyline && routePolyline.length >= 2) {
      polyRef.current = new window.mapgl.Polyline(mapInst.current, {
        coordinates: routePolyline,
        width: 4,
        color: '#f0a500',
        opacity: 0.85,
      })
    }
  }, [mapReady, routePolyline])

  // Update markers
  useEffect(() => {
    if (!mapInst.current || !mapReady) return
    markersRef.current.forEach(m => m.destroy?.())
    markersRef.current = []

    const whEl = (label, bg) => {
      const el = document.createElement('div')
      el.style.cssText = `padding:4px 10px;background:${bg};border-radius:6px;color:#0d0d1f;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.45);`
      el.textContent = label
      return el
    }

    if (trip.warehouse_from?.lng) {
      markersRef.current.push(new window.mapgl.HtmlMarker(mapInst.current, {
        coordinates: [trip.warehouse_from.lng, trip.warehouse_from.lat],
        html: whEl(`А: ${trip.warehouse_from.name}`, '#f0a500'),
        anchor: [0.5, 1],
      }))
    }
    if (trip.warehouse_to?.lng) {
      markersRef.current.push(new window.mapgl.HtmlMarker(mapInst.current, {
        coordinates: [trip.warehouse_to.lng, trip.warehouse_to.lat],
        html: whEl(`Б: ${trip.warehouse_to.name}`, '#10b981'),
        anchor: [0.5, 1],
      }))
    }

    // Other warehouses (secondary markers)
    warehouses.forEach(wh => {
      if (!wh.latitude || !wh.longitude) return
      if (wh.id === trip.warehouse_from?.id || wh.id === trip.warehouse_to?.id) return
      const el = document.createElement('div')
      el.style.cssText = `padding:3px 8px;background:rgba(13,13,31,0.9);border:1px solid rgba(255,255,255,0.18);border-radius:5px;color:rgba(255,255,255,0.55);font-size:10px;font-weight:600;white-space:nowrap;box-shadow:0 1px 5px rgba(0,0,0,0.35);`
      el.textContent = wh.name
      markersRef.current.push(new window.mapgl.HtmlMarker(mapInst.current, {
        coordinates: [wh.longitude, wh.latitude],
        html: el,
        anchor: [0.5, 1],
      }))
    })

    waypoints.forEach((wp, i) => {
      const el = document.createElement('div')
      el.style.cssText = `width:26px;height:26px;border-radius:50%;background:#6366f1;border:2px solid #818cf8;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.5);`
      el.textContent = String(i + 1)
      el.title = 'Нажмите чтобы удалить'
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        setWaypoints(prev => prev.filter((_, idx) => idx !== i))
      })
      markersRef.current.push(new window.mapgl.HtmlMarker(mapInst.current, {
        coordinates: [wp.lng, wp.lat],
        html: el,
        anchor: [0.5, 0.5],
      }))
    })
  }, [mapReady, trip, warehouses, waypoints])

  const handleRecalculate = async () => {
    setRecalcLoading(true); setRecalcError('')
    try {
      const { data } = await api.put(`/trips/${trip.id}/waypoints`, { waypoints })
      setRoutePolyline(data.route_polyline || [])
      setDistanceKm(data.distance_km)
    } catch (e) {
      setRecalcError(e.response?.data?.error || 'Ошибка пересчёта маршрута')
    }
    setRecalcLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', flexDirection: 'column', background: 'var(--navy)' }}>
      {/* Header */}
      <div style={{ background: 'var(--navy-2)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <Icons.Truck size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            Рейс #{trip.id} — {trip.warehouse_from?.name} → {trip.warehouse_to?.name}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
            {trip.truck?.label || ''} · {trip.orders?.length || 0} заказов
            {distanceKm ? ` · ${distanceKm} км` : ''}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '7px 18px', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          Готово
        </button>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {!TWO_GIS_KEY ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
            <Icons.Map size={28} />
            Карта недоступна
          </div>
        ) : (
          <>
            <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
            {!mapReady && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(13,13,31,0.9)', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                Загрузка карты...
              </div>
            )}
            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 5, background: 'rgba(13,13,31,0.88)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 11px', fontSize: 11, color: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(4px)', pointerEvents: 'none' }}>
              Нажмите на карту чтобы добавить точку заезда
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ background: 'var(--navy-2)', padding: '11px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minHeight: 56 }}>
        {waypoints.length === 0 ? (
          <div style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            Нет промежуточных точек — нажмите на карту чтобы добавить остановку
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>Остановки:</span>
            {waypoints.map((wp, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 4, padding: '2px 7px', fontSize: 11 }}>
                <span style={{ color: '#818cf8', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{i + 1}</span>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>{wp.label || `${wp.lat.toFixed(3)}°, ${wp.lng.toFixed(3)}°`}</span>
                <button onClick={() => setWaypoints(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: '0 2px', lineHeight: 1, fontSize: 14 }}>×</button>
              </div>
            ))}
          </div>
        )}
        {recalcError && <span style={{ fontSize: 11, color: '#f04438' }}>{recalcError}</span>}
        <button
          onClick={handleRecalculate}
          disabled={recalcLoading}
          style={{ padding: '6px 14px', background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: 6, color: 'var(--gold)', fontSize: 12, fontWeight: 700, cursor: recalcLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
        >
          <Icons.Map size={13} />
          {recalcLoading ? 'Пересчёт...' : waypoints.length > 0 ? 'Пересчитать маршрут' : 'Построить по дорогам'}
        </button>
      </div>
    </div>
  )
}
