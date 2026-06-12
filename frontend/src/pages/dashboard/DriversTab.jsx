/* eslint-disable no-empty, react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from 'react'
import api from '../../api/axios'
import { Icons } from '../../components/Icons'
import { Card, Btn, Field, Select, Modal, PageHeader, StatusPill, Alert, Loading, Empty } from '../../components/ui'

const TWO_GIS_KEY = import.meta.env.VITE_2GIS_KEY || ''

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

const AVAIL_MAP = {
  available: { bg: 'rgba(18,183,106,0.14)', fg: 'var(--green)', label: 'Доступен' },
  busy:      { bg: 'rgba(240,68,56,0.14)',  fg: 'var(--red)',   label: 'Занят' },
}

const TYPE_MAP = {
  staff:  { bg: 'rgba(46,144,250,0.14)',  fg: 'var(--blue)',  label: 'Штатный' },
  hired:  { bg: 'rgba(122,90,248,0.14)',  fg: 'var(--violet)', label: 'Наёмный' },
}

export default function DriversTab() {
  const [drivers,      setDrivers]      = useState([])
  const [activeTrips,  setActiveTrips]  = useState([])
  const [trucks,       setTrucks]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showForm,     setShowForm]     = useState(false)
  const [editing,      setEditing]      = useState(null)
  const [expandedMap,  setExpandedMap]  = useState(null)
  const [search,      setSearch]      = useState('')
  const [filterAvail, setFilterAvail] = useState('all')
  const [filterType,  setFilterType]  = useState('all')

  const load = async () => {
    setLoading(true)
    try {
      const [driversRes, tripsRes, trucksRes] = await Promise.allSettled([
        api.get('/drivers'),
        api.get('/trips/active-trucks'),
        api.get('/trucks'),
      ])
      if (driversRes.status === 'fulfilled') setDrivers(driversRes.value.data)
      if (tripsRes.status === 'fulfilled') setActiveTrips(tripsRes.value.data)
      if (trucksRes.status === 'fulfilled') setTrucks(Array.isArray(trucksRes.value.data) ? trucksRes.value.data : [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const q = search.toLowerCase()
  const visible = drivers.filter(d => {
    if (q && !`${d.name} ${d.phone} ${d.license_number}`.toLowerCase().includes(q)) return false
    if (filterAvail !== 'all' && String(d.is_available) !== filterAvail) return false
    if (filterType  !== 'all' && d.type !== filterType) return false
    return true
  })

  const handleDelete = async (id) => {
    if (!confirm('Удалить водителя?')) return
    try {
      await api.delete(`/drivers/${id}`)
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка')
    }
  }

  return (
    <div style={{ padding: '0 0 40px' }}>
      <PageHeader
        eyebrow="Персонал"
        title="Водители"
        action={
          <Btn icon={<Icons.Plus size={14} />} onClick={() => { setEditing(null); setShowForm(true) }}>
            Добавить водителя
          </Btn>
        }
      />

      <div style={{ padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Search + filters */}
        <Card padding={14} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
            <Icons.Search size={14} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по имени, телефону, правам..."
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: 13, fontFamily: 'var(--font-body)', flex: 1 }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>✕</button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['all','Все'], ['true','Доступен'], ['false','Занят']].map(([v, l]) => (
              <button key={v} onClick={() => setFilterAvail(v)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer', border: filterAvail === v ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)', background: filterAvail === v ? 'rgba(240,165,0,0.12)' : 'transparent', color: filterAvail === v ? 'var(--gold)' : 'rgba(255,255,255,0.5)' }}>{l}</button>
            ))}
            <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', alignSelf: 'stretch' }} />
            {[['all','Все типы'], ['staff','Штатный'], ['hired','Наёмный']].map(([v, l]) => (
              <button key={v} onClick={() => setFilterType(v)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer', border: filterType === v ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)', background: filterType === v ? 'rgba(240,165,0,0.12)' : 'transparent', color: filterType === v ? 'var(--gold)' : 'rgba(255,255,255,0.5)' }}>{l}</button>
            ))}
          </div>
          {(search || filterAvail !== 'all' || filterType !== 'all') && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
              {visible.length} из {drivers.length}
            </div>
          )}
        </Card>

        {loading ? (
          <Loading />
        ) : visible.length === 0 ? (
          <Empty text={drivers.length === 0 ? 'Водителей пока нет' : 'Ничего не найдено'} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {visible.map((d) => (
              <DriverCard
                key={d.id}
                driver={d}
                activeTrip={activeTrips.find(t => t.driver_id === d.id) || null}
                expanded={expandedMap === d.id}
                onToggleMap={() => setExpandedMap(prev => prev === d.id ? null : d.id)}
                onEdit={() => { setEditing(d); setShowForm(true) }}
                onDelete={() => handleDelete(d.id)}
                trucks={trucks}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <DriverForm initial={editing} trucks={trucks} onClose={() => setShowForm(false)} onSaved={load} />
      )}
    </div>
  )
}

// ─── Driver Card ──────────────────────────────────────────────────────────────
function DriverCard({ driver: d, activeTrip, expanded, onToggleMap, onEdit, onDelete, trucks }) {
  const [tripDetail, setTripDetail] = useState(null)

  useEffect(() => {
    if (expanded && activeTrip?.trip_id && !tripDetail) {
      api.get(`/trips/${activeTrip.trip_id}`)
        .then(({ data }) => setTripDetail(data))
        .catch(() => {})
    }
  }, [expanded, activeTrip?.trip_id])

  return (
    <Card padding={20} hover>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 0.5, marginBottom: 4 }}>{d.name}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{d.phone}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            Права: {d.license_number}
          </div>
        </div>
        <StatusPill status={d.is_available ? 'available' : 'busy'} map={AVAIL_MAP} />
      </div>
      <div style={{ marginBottom: activeTrip ? 12 : 16, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <StatusPill status={d.type} map={TYPE_MAP} />
        {(!d.trucks || d.trucks.length === 0) && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(247,144,9,0.12)', color: '#F79009', border: '1px solid rgba(247,144,9,0.25)' }}>
            Без машины
          </span>
        )}
        {d.trucks && d.trucks.length > 0 && (
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)' }}>
            {d.trucks.map(t => t.plate_number).join(', ')}
          </span>
        )}
      </div>

      {/* Active trip info */}
      {activeTrip && (
        <div style={{ marginBottom: 12, padding: '8px 10px', background: 'rgba(240,165,0,0.06)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: 6, fontSize: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <Icons.Truck size={11} style={{ color: 'var(--gold)' }} />
            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>В рейсе</span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>· {activeTrip.truck?.label}</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.55)' }}>
            {activeTrip.from} → {activeTrip.to}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
        <button
          onClick={onEdit}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'white'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
        >
          <Icons.Edit size={14} /> Изменить
        </button>
        <button
          onClick={onDelete}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
        >
          <Icons.Trash size={14} /> Удалить
        </button>
        {activeTrip && (
          <button
            onClick={onToggleMap}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, background: expanded ? 'rgba(240,165,0,0.1)' : 'transparent', border: expanded ? '1px solid rgba(240,165,0,0.3)' : 'none', borderRadius: 5, padding: expanded ? '3px 10px' : '3px 0', color: expanded ? 'var(--gold)' : 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
          >
            <Icons.Map size={13} /> {expanded ? 'Скрыть' : 'Маршрут и груз'}
          </button>
        )}
      </div>

      {/* Route map + cargo */}
      {activeTrip && expanded && (
        <div style={{ marginTop: 12 }}>
          <div style={{ borderRadius: 7, overflow: 'hidden', height: 260 }}>
            <DriverTripMap trip={activeTrip} />
          </div>

          {/* Cargo list */}
          {tripDetail?.orders && tripDetail.orders.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>
                Груз в фуре · {tripDetail.orders.length} заказов
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {tripDetail.orders.map(o => (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 5, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gold)', flexShrink: 0 }}>{o.tracking_id}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.cargo_description || o.client_name || o.origin_address}
                    </span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                      {o.weight} кг
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tripDetail && (!tripDetail.orders || tripDetail.orders.length === 0) && (
            <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>Заказы не найдены</div>
          )}
          {!tripDetail && (
            <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>Загрузка...</div>
          )}
        </div>
      )}
    </Card>
  )
}

// ─── Driver Trip Map ──────────────────────────────────────────────────────────
function DriverTripMap({ trip }) {
  const mapRef     = useRef(null)
  const mapInst    = useRef(null)
  const polyRef    = useRef(null)
  const markersRef = useRef([])
  const mapReady   = useMapGL()
  const [poly, setPoly] = useState(trip.route_polyline || [])

  // Auto-recalculate if straight line (≤ 2 points)
  useEffect(() => {
    const polyline = trip.route_polyline || []
    if (polyline.length <= 2 && trip.trip_id) {
      api.put(`/trips/${trip.trip_id}/waypoints`, { waypoints: trip.waypoints || [] })
        .then(({ data }) => { if (data.route_polyline?.length > 2) setPoly(data.route_polyline) })
        .catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.trip_id])

  // Init map once
  useEffect(() => {
    if (!mapReady || !mapRef.current || !TWO_GIS_KEY) return
    if (mapInst.current) return

    const polyline = poly
    let center = [55.75, 55.0], zoom = 6

    if (trip.location?.lng) {
      center = [trip.location.lng, trip.location.lat]; zoom = 9
    } else if (polyline.length > 0) {
      const lngs = polyline.map(p => p[0]); const lats = polyline.map(p => p[1])
      center = [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2]
      const span = Math.max(Math.max(...lngs) - Math.min(...lngs), Math.max(...lats) - Math.min(...lats))
      zoom = span > 10 ? 5 : span > 5 ? 6 : span > 2 ? 7 : 8
    } else if (trip.warehouse_from?.lng && trip.warehouse_to?.lng) {
      center = [(trip.warehouse_from.lng + trip.warehouse_to.lng) / 2, (trip.warehouse_from.lat + trip.warehouse_to.lat) / 2]
    }

    const map = new window.mapgl.Map(mapRef.current, { center, zoom, key: TWO_GIS_KEY })
    mapInst.current = map

    // Static markers (don't change)
    const whEl = (label, bg) => {
      const el = document.createElement('div')
      el.style.cssText = `padding:3px 8px;background:${bg};border-radius:5px;color:#0d0d1f;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.4);`
      el.textContent = label
      return el
    }

    if (trip.warehouse_from?.lng) {
      markersRef.current.push(new window.mapgl.HtmlMarker(map, {
        coordinates: [trip.warehouse_from.lng, trip.warehouse_from.lat],
        html: whEl(`А: ${trip.warehouse_from.name}`, '#f0a500'),
        anchor: [0.5, 1],
      }))
    }
    if (trip.warehouse_to?.lng) {
      markersRef.current.push(new window.mapgl.HtmlMarker(map, {
        coordinates: [trip.warehouse_to.lng, trip.warehouse_to.lat],
        html: whEl(`Б: ${trip.warehouse_to.name}`, '#10b981'),
        anchor: [0.5, 1],
      }))
    }
    if (trip.waypoints) {
      trip.waypoints.forEach((wp, i) => {
        const el = document.createElement('div')
        el.style.cssText = `width:20px;height:20px;border-radius:50%;background:#6366f1;border:2px solid #818cf8;color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 5px rgba(0,0,0,0.4);`
        el.textContent = String(i + 1)
        markersRef.current.push(new window.mapgl.HtmlMarker(map, {
          coordinates: [wp.lng, wp.lat], html: el, anchor: [0.5, 0.5],
        }))
      })
    }
    if (trip.location?.lng) {
      const el = document.createElement('div')
      el.style.cssText = `width:16px;height:16px;border-radius:50%;background:#f0a500;border:3px solid #fff;box-shadow:0 0 0 4px rgba(240,165,0,0.3);`
      markersRef.current.push(new window.mapgl.HtmlMarker(map, {
        coordinates: [trip.location.lng, trip.location.lat], html: el, anchor: [0.5, 0.5],
      }))
    }

    return () => {
      polyRef.current?.destroy?.()
      markersRef.current.forEach(m => m.destroy?.())
      map.destroy()
      mapInst.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady])

  // Update polyline when poly changes (incl. after OSRM auto-recalc)
  useEffect(() => {
    if (!mapInst.current || !mapReady) return
    if (polyRef.current) { polyRef.current.destroy?.(); polyRef.current = null }
    if (poly.length >= 2) {
      polyRef.current = new window.mapgl.Polyline(mapInst.current, {
        coordinates: poly, width: 3, color: '#f0a500', opacity: 0.8,
      })
    }
  }, [mapReady, poly])

  if (!TWO_GIS_KEY) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
        Карта недоступна
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      {!mapReady && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(13,13,31,0.85)', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
          Загрузка карты...
        </div>
      )}
    </div>
  )
}

// ─── Driver Form ──────────────────────────────────────────────────────────────
function DriverForm({ initial, trucks = [], onClose, onSaved }) {
  const currentTruckId = initial?.trucks?.[0]?.id ?? ''
  const [form, setForm] = useState({
    name:           initial?.name || '',
    phone:          initial?.phone || '',
    license_number: initial?.license_number || '',
    type:           initial?.type || 'staff',
    is_available:   initial?.is_available ?? true,
  })
  const [truckId, setTruckId] = useState(String(currentTruckId))
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // Фуры доступные для назначения: не занятые или уже назначенные этому водителю
  const availableTrucks = trucks.filter(t =>
    !t.driver_id || t.driver_id === initial?.id || String(t.id) === truckId
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let driverId = initial?.id
      if (initial) {
        await api.put(`/drivers/${initial.id}`, form)
      } else {
        const { data } = await api.post('/drivers', form)
        driverId = data.id
      }

      // Назначить фуру водителю
      const newTruckId = truckId ? parseInt(truckId) : null
      if (newTruckId && newTruckId !== currentTruckId) {
        await api.put(`/trucks/${newTruckId}`, { driver_id: driverId })
      }
      // Снять фуру если выбрано "Без машины" и раньше была
      if (!newTruckId && currentTruckId) {
        await api.put(`/trucks/${currentTruckId}`, { driver_id: null })
      }

      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors
        ? Object.values(err.response.data.errors || {}).flat().join(', ')
        : 'Ошибка')
    }
    setLoading(false)
  }

  return (
    <Modal onClose={onClose} title={initial ? 'Изменить водителя' : 'Новый водитель'} maxWidth={460}>
      {error && <Alert type="error">{error}</Alert>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="ФИО" required value={form.name} onChange={set('name')} />
        <Field label="Телефон" required value={form.phone} onChange={set('phone')} />
        <Field label="Номер прав" required value={form.license_number} onChange={set('license_number')} />

        {/* Тип: штатный / наёмный */}
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Тип водителя</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { value: 'staff',  label: 'Штатный',  color: 'var(--blue)' },
              { value: 'hired',  label: 'Наёмный',  color: 'var(--violet)' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                style={{
                  padding: '10px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                  border: form.type === opt.value ? `1px solid ${opt.color}66` : '1px solid rgba(255,255,255,0.08)',
                  background: form.type === opt.value ? `${opt.color}18` : 'rgba(255,255,255,0.03)',
                  color: form.type === opt.value ? opt.color : 'rgba(255,255,255,0.5)',
                  fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
                }}
              >{opt.label}</button>
            ))}
          </div>
        </div>

        {/* Назначение фуры */}
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Назначенная фура</div>
          <select
            value={truckId}
            onChange={e => setTruckId(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', color: truckId ? 'white' : 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer' }}
          >
            <option value="">— Без машины —</option>
            {availableTrucks.map(t => (
              <option key={t.id} value={String(t.id)}>
                {t.plate_number} · {t.brand} {t.model} ({t.capacity_weight} т)
              </option>
            ))}
          </select>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)' }}>
          <input
            type="checkbox"
            checked={form.is_available}
            onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))}
            style={{ accentColor: 'var(--gold)', width: 16, height: 16 }}
          />
          Доступен
        </label>
        <Btn type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
          {loading ? 'Сохраняем...' : 'Сохранить'}
        </Btn>
      </form>
    </Modal>
  )
}
