import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../../api/axios'

const TRIP_STATUS = {
  forming:    { label: 'Ожидание водителя', color: '#f0a500', next: 'Прибыть на загрузку' },
  loading:    { label: 'Идёт загрузка',     color: '#3b82f6', next: null },
  in_transit: { label: 'В пути',            color: '#8b5cf6', next: 'Прибыть на выгрузку' },
  arrived:    { label: 'Прибыл',            color: '#10b981', next: null },
  completed:  { label: 'Завершён',          color: '#6b7280', next: null },
}

const TWO_GIS_KEY = import.meta.env.VITE_2GIS_KEY || ''

function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--navy-2)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      padding: 20,
      ...style,
    }}>
      {children}
    </div>
  )
}

function Badge({ label, color }) {
  return (
    <span style={{
      background: color + '22', color,
      border: `1px solid ${color}44`,
      borderRadius: 4, padding: '2px 8px',
      fontSize: 11, fontWeight: 600,
      fontFamily: 'var(--font-mono)',
    }}>
      {label}
    </span>
  )
}

// 2GIS MapGL — загрузка через script tag
function useMapGL() {
  const [ready, setReady] = useState(typeof window !== 'undefined' && !!window.mapgl)

  useEffect(() => {
    if (window.mapgl) { setReady(true); return }
    const existing = document.querySelector('script[data-2gis]')
    if (existing) {
      existing.addEventListener('load', () => setReady(true))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://mapgl.2gis.com/api/js/v1'
    script.setAttribute('data-2gis', '1')
    script.onload = () => setReady(true)
    document.head.appendChild(script)
  }, [])

  return ready
}

function TripMap({ trip }) {
  const mapRef    = useRef(null)
  const mapInst   = useRef(null)
  const mapReady  = useMapGL()

  useEffect(() => {
    if (!mapReady || !mapRef.current || !TWO_GIS_KEY) return
    if (mapInst.current) { mapInst.current.destroy(); mapInst.current = null }

    const from = trip.warehouse_from
    const to   = trip.warehouse_to

    if (!from.lat || !from.lng || !to.lat || !to.lng) return

    const centerLng = (from.lng + to.lng) / 2
    const centerLat = (from.lat + to.lat) / 2

    const map = new window.mapgl.Map(mapRef.current, {
      center: [centerLng, centerLat],
      zoom: 6,
      key: TWO_GIS_KEY,
    })
    mapInst.current = map

    map.once('load', () => {
      // Маркер склада А
      new window.mapgl.Marker(map, {
        coordinates: [from.lng, from.lat],
        label: { text: from.name, relativeAnchor: [0.5, 1.5], fontSize: 12 },
      })

      // Маркер склада Б
      new window.mapgl.Marker(map, {
        coordinates: [to.lng, to.lat],
        label: { text: to.name, relativeAnchor: [0.5, 1.5], fontSize: 12 },
      })

      // Линия маршрута
      const coords = trip.route_polyline && trip.route_polyline.length >= 2
        ? trip.route_polyline
        : [[from.lng, from.lat], [to.lng, to.lat]]

      new window.mapgl.Polyline(map, {
        coordinates: coords,
        width: 3,
        color: '#f0a500',
        opacity: 0.85,
      })
    })

    return () => { if (mapInst.current) { mapInst.current.destroy(); mapInst.current = null } }
  }, [mapReady, trip])

  if (!TWO_GIS_KEY) {
    return (
      <div style={{ height: 280, background: 'rgba(255,255,255,0.03)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
        Добавьте VITE_2GIS_KEY в .env для отображения карты
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      style={{ height: 280, borderRadius: 8, overflow: 'hidden', marginTop: 14 }}
    />
  )
}

// ─── Полноэкранная карта позиции водителя ─────────────────────────────────────
function DriverLocationModal({ trip, onClose }) {
  const mapRef   = useRef(null)
  const mapInst  = useRef(null)
  const mapReady = useMapGL()
  const [gpsError, setGpsError] = useState('')
  const [locating, setLocating] = useState(true)

  useEffect(() => {
    if (!mapReady || !mapRef.current || !TWO_GIS_KEY) return
    if (mapInst.current) return

    const from = trip.warehouse_from
    const to   = trip.warehouse_to

    // Сначала создаём карту по центру маршрута, потом сдвинем на GPS
    const center = from?.lng && to?.lng
      ? [(from.lng + to.lng) / 2, (from.lat + to.lat) / 2]
      : [55.75, 55.0]

    const map = new window.mapgl.Map(mapRef.current, { center, zoom: 6, key: TWO_GIS_KEY })
    mapInst.current = map

    map.once('load', () => {
      // Маршрут
      const coords = trip.route_polyline?.length >= 2
        ? trip.route_polyline
        : (from?.lng && to?.lng ? [[from.lng, from.lat], [to.lng, to.lat]] : null)
      if (coords) {
        new window.mapgl.Polyline(map, { coordinates: coords, width: 3, color: '#f0a500', opacity: 0.8 })
      }

      // Склад А
      if (from?.lng) {
        const el = document.createElement('div')
        el.style.cssText = 'padding:4px 10px;background:#f0a500;border-radius:6px;color:#0d0d1f;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.4);'
        el.textContent = `А: ${from.name}`
        new window.mapgl.HtmlMarker(map, { coordinates: [from.lng, from.lat], html: el, anchor: [0.5, 1] })
      }
      // Склад Б
      if (to?.lng) {
        const el = document.createElement('div')
        el.style.cssText = 'padding:4px 10px;background:#10b981;border-radius:6px;color:#0d0d1f;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.4);'
        el.textContent = `Б: ${to.name}`
        new window.mapgl.HtmlMarker(map, { coordinates: [to.lng, to.lat], html: el, anchor: [0.5, 1] })
      }

      // GPS позиция водителя
      if (!navigator.geolocation) {
        setGpsError('Геолокация недоступна на устройстве')
        setLocating(false)
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lng = pos.coords.longitude
          const lat = pos.coords.latitude

          // Золотой пульсирующий маркер
          const dot = document.createElement('div')
          dot.style.cssText = `
            width:18px;height:18px;border-radius:50%;
            background:#f0a500;border:3px solid #fff;
            box-shadow:0 0 0 5px rgba(240,165,0,0.35), 0 2px 8px rgba(0,0,0,0.5);
            animation:pulse 1.8s ease-in-out infinite;
          `
          // Inject animation если ещё нет
          if (!document.getElementById('gps-pulse-style')) {
            const style = document.createElement('style')
            style.id = 'gps-pulse-style'
            style.textContent = '@keyframes pulse{0%,100%{box-shadow:0 0 0 5px rgba(240,165,0,0.35),0 2px 8px rgba(0,0,0,0.5)}50%{box-shadow:0 0 0 10px rgba(240,165,0,0.12),0 2px 8px rgba(0,0,0,0.5)}}'
            document.head.appendChild(style)
          }

          const label = document.createElement('div')
          label.style.cssText = 'position:absolute;top:-26px;left:50%;transform:translateX(-50%);background:rgba(13,13,31,0.9);color:#f0a500;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;white-space:nowrap;border:1px solid rgba(240,165,0,0.3);'
          label.textContent = 'Я здесь'

          const wrap = document.createElement('div')
          wrap.style.cssText = 'position:relative;display:flex;align-items:center;justify-content:center;'
          wrap.appendChild(label)
          wrap.appendChild(dot)

          new window.mapgl.HtmlMarker(map, { coordinates: [lng, lat], html: wrap, anchor: [0.5, 0.5] })
          map.setCenter([lng, lat])
          map.setZoom(13)
          setLocating(false)
        },
        (err) => {
          setGpsError('Не удалось получить координаты: ' + err.message)
          setLocating(false)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })

    return () => { map.destroy(); mapInst.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', flexDirection: 'column', background: 'var(--navy)' }}>
      {/* Шапка */}
      <div style={{ background: 'var(--navy-2)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>Моё местоположение</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
            Рейс #{trip.id} · {trip.warehouse_from?.name} → {trip.warehouse_to?.name}
          </div>
        </div>
        {locating && (
          <div style={{ fontSize: 12, color: '#f0a500', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⌛</span>
            Определяю позицию...
          </div>
        )}
        {gpsError && <div style={{ fontSize: 12, color: '#ef4444' }}>{gpsError}</div>}
        <button
          onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '7px 18px', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          Закрыть
        </button>
      </div>

      {/* Карта */}
      <div style={{ flex: 1, position: 'relative' }}>
        {!TWO_GIS_KEY ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
            Карта недоступна — нет VITE_2GIS_KEY
          </div>
        ) : (
          <>
            <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
            {!mapReady && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(13,13,31,0.9)', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                Загрузка карты...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function TripCard({ trip, onAction }) {
  const [busy, setBusy] = useState(false)
  const [showMyMap, setShowMyMap] = useState(false)
  const st = TRIP_STATUS[trip.status] || { label: trip.status, color: '#999', next: null }

  const doAction = async (endpoint) => {
    setBusy(true)
    try {
      await api.post(`/driver/trips/${trip.id}/${endpoint}`)
      onAction()
    } catch (e) {
      alert(e.response?.data?.error || 'Ошибка')
    } finally {
      setBusy(false)
    }
  }

  const totalWeight = trip.orders.reduce((s, o) => s + (o.weight || 0), 0)
  const totalOrders = trip.orders.length

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 700, color: 'white', fontSize: 16 }}>Рейс #{trip.id}</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 3 }}>
            {trip.truck.label} · {trip.truck.plate}
          </div>
        </div>
        <Badge label={st.label} color={st.color} />
      </div>

      {/* Маршрут */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 2 }}>ОТКУДА</div>
          <div style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>{trip.warehouse_from.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{trip.warehouse_from.address}</div>
        </div>
        <div style={{ color: 'var(--gold)', fontSize: 20 }}>→</div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 2 }}>КУДА</div>
          <div style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>{trip.warehouse_to.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{trip.warehouse_to.address}</div>
        </div>
      </div>

      {/* Карта + кнопка позиции */}
      <div style={{ position: 'relative' }}>
        <TripMap trip={trip} />
        <button
          onClick={() => setShowMyMap(true)}
          style={{
            position: 'absolute', bottom: 10, right: 10,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px',
            background: 'rgba(13,13,31,0.88)',
            border: '1px solid rgba(240,165,0,0.4)',
            borderRadius: 7,
            color: '#f0a500',
            fontWeight: 700, fontSize: 12,
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          📍 Где я
        </button>
      </div>

      {/* Статистика */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14, marginBottom: 14 }}>
        {[
          ['Заказов', totalOrders],
          ['Общий вес', `${totalWeight.toFixed(1)} кг`],
          ['Расстояние', trip.distance_km ? `${trip.distance_km} км` : '—'],
          ['Отправлено', trip.started_at ? new Date(trip.started_at).toLocaleString('ru', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'],
        ].map(([label, val]) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{label}</div>
            <div style={{ color: 'white', fontWeight: 600, fontSize: 15, marginTop: 2 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Манифест */}
      <details style={{ marginBottom: 14 }}>
        <summary style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer', marginBottom: 8 }}>
          Манифест грузов ({totalOrders})
        </summary>
        <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
          {trip.orders.map(o => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, fontSize: 12 }}>
              <div>
                <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{o.tracking_id}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 10 }}>{o.client_name}</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.55)' }}>{o.weight} кг · {o.dest_address}</div>
            </div>
          ))}
        </div>
      </details>

      {/* Кнопки действий */}
      {trip.status === 'forming' && (
        <button
          onClick={() => doAction('arrived-load')}
          disabled={busy}
          style={{ width: '100%', padding: '11px 0', background: 'var(--gold)', border: 'none', borderRadius: 8, color: 'var(--navy)', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: busy ? 0.7 : 1 }}
        >
          {busy ? 'Отправка...' : 'Прибыл на загрузку'}
        </button>
      )}
      {trip.status === 'loading' && (
        <div style={{ padding: '11px 0', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, textAlign: 'center', color: '#93c5fd', fontSize: 14 }}>
          Идёт загрузка кладовщиком...
        </div>
      )}
      {trip.status === 'in_transit' && (
        <button
          onClick={() => doAction('arrived-unload')}
          disabled={busy}
          style={{ width: '100%', padding: '11px 0', background: '#10b981', border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: busy ? 0.7 : 1 }}
        >
          {busy ? 'Отправка...' : 'Прибыл на выгрузку'}
        </button>
      )}
      {trip.status === 'arrived' && (
        <div style={{ padding: '11px 0', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, textAlign: 'center', color: '#6ee7b7', fontSize: 14 }}>
          Ожидается разгрузка кладовщиком...
        </div>
      )}
      {showMyMap && <DriverLocationModal trip={trip} onClose={() => setShowMyMap(false)} />}
    </Card>
  )
}

export default function DriverDashboard() {
  const [shift, setShift]   = useState(null)
  const [trips, setTrips]   = useState([])
  const [loading, setLoading] = useState(true)
  const gpsIntervalRef = useRef(null)

  const loadAll = useCallback(async () => {
    try {
      const [shiftRes, tripsRes] = await Promise.all([
        api.get('/driver/shift'),
        api.get('/driver/trips'),
      ])
      setShift(shiftRes.data)
      setTrips(tripsRes.data)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // GPS трансляция: каждые 30 сек пока смена открыта
  useEffect(() => {
    if (shift?.open) {
      const sendGps = () => {
        if (!navigator.geolocation) return
        navigator.geolocation.getCurrentPosition(
          pos => api.post('/driver/location', {
            latitude:  pos.coords.latitude,
            longitude: pos.coords.longitude,
          }).catch(() => {}),
          () => {}
        )
      }
      sendGps()
      gpsIntervalRef.current = setInterval(sendGps, 30_000)
    } else {
      if (gpsIntervalRef.current) {
        clearInterval(gpsIntervalRef.current)
        gpsIntervalRef.current = null
      }
    }
    return () => { if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current) }
  }, [shift?.open])

  const toggleShift = async () => {
    try {
      if (shift?.open) {
        await api.post('/driver/shift/close')
      } else {
        await api.post('/driver/shift/open')
      }
      loadAll()
    } catch (e) {
      alert(e.response?.data?.error || 'Ошибка')
    }
  }

  if (loading) return <div style={{ padding: 40, color: 'rgba(255,255,255,0.5)' }}>Загрузка...</div>

  return (
    <div style={{ padding: 32, maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'white', margin: 0 }}>Кабинет водителя</h1>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>
            {trips.length} активных рейсов
            {shift?.open && <span style={{ color: '#10b981', marginLeft: 12 }}>· GPS трансляция активна</span>}
          </div>
        </div>
        <button
          onClick={toggleShift}
          style={{
            padding: '10px 22px',
            background: shift?.open ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
            border: `1px solid ${shift?.open ? '#ef4444' : '#10b981'}`,
            borderRadius: 8,
            color: shift?.open ? '#ef4444' : '#10b981',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}
        >
          {shift?.open ? 'Закрыть смену' : 'Открыть смену'}
        </button>
      </div>

      {shift?.open && (
        <div style={{ marginBottom: 20, padding: '10px 16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, fontSize: 13, color: '#10b981' }}>
          Смена открыта · GPS координаты отправляются каждые 30 сек
        </div>
      )}

      {!shift?.open && (
        <div style={{ marginBottom: 20, padding: '10px 16px', background: 'rgba(255,165,0,0.06)', border: '1px solid rgba(255,165,0,0.2)', borderRadius: 8, fontSize: 13, color: '#fbbf24' }}>
          Смена закрыта. Откройте смену для начала работы и GPS трансляции.
        </div>
      )}

      {trips.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '80px 0', fontSize: 15 }}>
          Нет активных рейсов
        </div>
      ) : (
        trips.map(trip => (
          <TripCard key={trip.id} trip={trip} onAction={loadAll} />
        ))
      )}
    </div>
  )
}
