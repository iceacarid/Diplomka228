import { useState, useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { Icons } from '../../components/Icons'
import { Card, Btn, Field } from '../../components/ui'

function debounce(fn, delay) {
  let t
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay) }
}

const LOAD_COLOR = (pct) => {
  if (pct >= 90) return '#F04438'
  if (pct >= 70) return '#F79009'
  return '#12B76A'
}

const LOAD_LABEL = (pct) => {
  if (pct >= 90) return 'Критично'
  if (pct >= 70) return 'Загружен'
  return 'Свободен'
}

function makeIcon(pct) {
  const color = LOAD_COLOR(pct)
  return L.divIcon({
    className: '',
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:${color};border:3px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.5);
      display:flex;align-items:center;justify-content:center;
      font-size:10px;font-weight:700;color:#fff;
      font-family:monospace;
    ">${Math.round(pct)}%</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

const EMPTY_FORM = { name: '', address: '', total_capacity: '', current_load: '' }

export default function WarehousesTab() {
  const { user } = useAuth()
  const isAdmin  = user?.role === 'admin'

  const [warehouses,   setWarehouses]   = useState([])
  const [loading,      setLoading]      = useState(true)
  const [modal,        setModal]        = useState(null)   // null | { mode: 'create'|'edit', data }
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [pendingCoord, setPendingCoord] = useState(null)  // { lat, lng } при клике по карте
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')
  const [deleteConfirm,setDeleteConfirm]= useState(null)

  const [selectedWh,   setSelectedWh]  = useState(null)   // склад для логов
  const [logs,         setLogs]        = useState([])
  const [logsLoading,  setLogsLoading] = useState(false)
  const [logFilter,    setLogFilter]   = useState('all')
  const [logWhFilter,  setLogWhFilter] = useState('all')   // фильтр по складу для логов

  const [search,        setSearch]       = useState('')
  const [suggestions,   setSugg]         = useState([])
  const [searchOpen,    setSearchOpen]   = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchWrapRef = useRef(null)

  const mapRef  = useRef(null)
  const mapInst = useRef(null)
  const markers = useRef({})
  const tempMarker = useRef(null)

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

  useEffect(() => { if (isAdmin) fetchSugg(search) }, [search, fetchSugg, isAdmin])

  useEffect(() => {
    const handler = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectSugg = (item) => {
    setSearch(item.name)
    setSugg([])
    setSearchOpen(false)
    if (!mapInst.current) return
    mapInst.current.setView([item.lat, item.lon], 15)
  }

  const load = useCallback(() => {
    setLoading(true)
    api.get('/warehouses')
      .then(({ data }) => setWarehouses(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // Инициализация карты
  useEffect(() => {
    if (mapInst.current || !mapRef.current) return
    const map = L.map(mapRef.current, { zoomControl: true }).setView([55.75, 37.62], 5)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map)

    map.on('click', (e) => {
      if (!isAdmin) return
      const { lat, lng } = e.latlng
      if (tempMarker.current) tempMarker.current.remove()
      tempMarker.current = L.marker([lat, lng], {
        icon: L.divIcon({
          className: '',
          html: '<div style="width:16px;height:16px;border-radius:50%;background:#F0A500;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.5)"></div>',
          iconSize: [16, 16], iconAnchor: [8, 8],
        }),
      }).addTo(map)
      setPendingCoord({ lat, lng })
      setForm(EMPTY_FORM)
      setError('')
      setModal({ mode: 'create', lat, lng })
    })

    mapInst.current = map
  }, [])

  // Обновить маркеры при изменении списка складов
  useEffect(() => {
    if (!mapInst.current) return

    // Удалить старые
    Object.values(markers.current).forEach(m => m.remove())
    markers.current = {}

    warehouses.forEach(wh => {
      const icon = makeIcon(wh.load_percent)
      const marker = L.marker([wh.latitude, wh.longitude], { icon })
        .addTo(mapInst.current)
        .bindTooltip(
          `<b>${wh.name}</b><br>Загружено: ${wh.current_load} из ${wh.total_capacity} т (${wh.load_percent}%)`,
          { sticky: true }
        )
        .on('click', () => {
          if (!isAdmin) return
          setForm({
            name:           wh.name,
            address:        wh.address || '',
            total_capacity: String(wh.total_capacity),
            current_load:   String(wh.current_load),
          })
          setError('')
          setModal({ mode: 'edit', wh })
        })
      markers.current[wh.id] = marker
    })
  }, [warehouses])

  const setF = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.name || !form.total_capacity) { setError('Название и вместимость обязательны'); return }
    setSaving(true)
    setError('')
    try {
      if (modal.mode === 'create') {
        await api.post('/warehouses', {
          name:           form.name,
          address:        form.address || null,
          latitude:       pendingCoord.lat,
          longitude:      pendingCoord.lng,
          total_capacity: parseFloat(form.total_capacity),
          current_load:   parseFloat(form.current_load) || 0,
        })
      } else {
        await api.put(`/warehouses/${modal.wh.id}`, {
          name:           form.name,
          address:        form.address || null,
          total_capacity: parseFloat(form.total_capacity),
          current_load:   parseFloat(form.current_load) || 0,
        })
      }
      load()
      closeModal()
    } catch (err) {
      setError(err?.response?.data?.message || 'Ошибка сохранения')
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/warehouses/${id}`)
      load()
      closeModal()
      setDeleteConfirm(null)
    } catch {}
  }

  const closeModal = () => {
    setModal(null)
    setPendingCoord(null)
    setDeleteConfirm(null)
    if (tempMarker.current) { tempMarker.current.remove(); tempMarker.current = null }
  }

  const openLogs = async (wh) => {
    setSelectedWh(wh)
    setLogsLoading(true)
    try {
      const { data } = await api.get(`/warehouses/${wh.id}/logs`)
      setLogs(Array.isArray(data) ? data : [])
    } catch { setLogs([]) }
    setLogsLoading(false)
  }

  const filteredLogs = logs.filter(l => logFilter === 'all' || l.action === logFilter)
  const allLogsFiltered = warehouses
    .filter(wh => logWhFilter === 'all' || String(wh.id) === logWhFilter)

  return (
    <div style={{ padding: 36, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, letterSpacing: 1 }}>
          Склады <span style={{ color: 'var(--gold)' }}>/ Карта</span>
        </h2>
        {isAdmin && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
            Кликните по карте, чтобы добавить склад
          </div>
        )}
      </div>

      {/* Карта + список */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, alignItems: 'start' }}>
        <Card padding={0} style={{ overflow: 'hidden', position: 'relative' }}>
          {isAdmin && (
            <div ref={searchWrapRef} style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, width: 320 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 13px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                <Icons.Search size={14} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setSearchOpen(true)}
                  placeholder="Поиск..."
                  style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: 13, fontFamily: 'var(--font-body)', flex: 1, minWidth: 0 }}
                />
                {searchLoading && (
                  <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.12)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'wh-spin 0.6s linear infinite', flexShrink: 0 }} />
                )}
                {search && !searchLoading && (
                  <button onClick={() => { setSearch(''); setSugg([]); setSearchOpen(false) }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
                    <Icons.X size={13} />
                  </button>
                )}
              </div>
              {searchOpen && suggestions.length > 0 && (
                <div style={{ marginTop: 4, background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', maxHeight: 220, overflowY: 'auto' }}>
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
          )}
          <div ref={mapRef} style={{ height: 480, width: '100%' }} />
          <button
            onClick={() => mapRef.current?.requestFullscreen?.()}
            title="Во весь экран"
            style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 1000, background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '6px 10px', fontSize: 12, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
          >
            <Icons.Bolt size={13} /> Во весь экран
          </button>
          <style>{`@keyframes wh-spin { to { transform: rotate(360deg); } }`}</style>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: 16 }}>Загрузка...</div>
          ) : warehouses.length === 0 ? (
            <Card padding={20}>
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                Складов нет. Добавьте первый, кликнув по карте.
              </div>
            </Card>
          ) : warehouses.map(wh => {
            const pct   = wh.load_percent
            const color = LOAD_COLOR(pct)
            return (
              <Card key={wh.id} padding={16} style={{ cursor: 'pointer' }} hover onClick={() => {
                mapInst.current?.setView([wh.latitude, wh.longitude], 13)
                markers.current[wh.id]?.openTooltip()
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{wh.name}</div>
                    {wh.address && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{wh.address}</div>}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: `${color}22`, color, border: `1px solid ${color}44` }}>
                    {LOAD_LABEL(pct)}
                  </span>
                </div>

                {/* Прогресс-бар */}
                <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, marginBottom: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 2, transition: 'width 0.3s' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)' }}>
                  <span>{wh.current_load} / {wh.total_capacity} т</span>
                  <span style={{ color }}>{pct}%</span>
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  {isAdmin && (
                    <Btn kind="ghost" size="sm" icon={<Icons.Edit size={12}/>} onClick={(e) => {
                      e.stopPropagation()
                      setForm({ name: wh.name, address: wh.address || '', total_capacity: String(wh.total_capacity), current_load: String(wh.current_load) })
                      setError('')
                      setModal({ mode: 'edit', wh })
                    }}>Ред.</Btn>
                  )}
                  <Btn kind="ghost" size="sm" icon={<Icons.Boxes size={12}/>} onClick={(e) => { e.stopPropagation(); openLogs(wh) }}>Логи</Btn>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Таблица логов */}
      <Card padding={0}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1 }}>
              История изменений {selectedWh && <span style={{ color: 'var(--gold)', fontSize: 16 }}>· {selectedWh.name}</span>}
            </h3>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
              {filteredLogs.length} записей
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Фильтр по складу */}
            <select
              value={logWhFilter}
              onChange={e => { setLogWhFilter(e.target.value); if (e.target.value !== 'all') { const wh = warehouses.find(w => String(w.id) === e.target.value); if (wh) openLogs(wh) } else { setSelectedWh(null); setLogs([]) } }}
              style={{ background: 'var(--navy-3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px 10px', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer' }}
            >
              <option value="all">Все склады</option>
              {warehouses.map(wh => <option key={wh.id} value={String(wh.id)}>{wh.name}</option>)}
            </select>
            {/* Фильтр по типу операции */}
            {[
              { value: 'all',    label: 'Все' },
              { value: 'load',   label: 'Загрузка' },
              { value: 'unload', label: 'Разгрузка' },
              { value: 'manual', label: 'Ручное' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setLogFilter(opt.value)}
                style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'all 0.15s', border: logFilter === opt.value ? '1px solid rgba(240,165,0,0.5)' : '1px solid rgba(255,255,255,0.08)', background: logFilter === opt.value ? 'rgba(240,165,0,0.1)' : 'transparent', color: logFilter === opt.value ? 'var(--gold)' : 'rgba(255,255,255,0.5)' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {logsLoading ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Загрузка...</div>
        ) : !selectedWh ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
            Выберите склад из списка выше, чтобы увидеть историю
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Нет записей</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--font-body)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Дата', 'Операция', 'Изменение', 'До → После', 'Заказ', 'Фура', 'Водитель', 'Примечание'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((l, i) => {
                  const positive = l.weight_change >= 0
                  return (
                    <tr key={l.id} style={{ borderBottom: i < filteredLogs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                        {new Date(l.created_at).toLocaleString('ru', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: l.action === 'load' ? 'rgba(18,183,106,0.12)' : l.action === 'unload' ? 'rgba(240,68,56,0.12)' : 'rgba(240,165,0,0.1)', color: l.action === 'load' ? '#12B76A' : l.action === 'unload' ? '#F04438' : 'var(--gold)' }}>
                          {l.action === 'load' ? 'Загрузка' : l.action === 'unload' ? 'Разгрузка' : 'Ручное'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: positive ? '#12B76A' : '#F04438' }}>
                        {positive ? '+' : ''}{l.weight_change} т
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.55)' }}>
                        {l.load_before} → {l.load_after}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--gold)' }}>
                        {l.order?.tracking_id || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.65)' }}>
                        {l.truck ? `${l.truck.plate_number}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.65)' }}>
                        {l.driver?.name || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.4)', maxWidth: 200 }}>
                        {l.note || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Модалка создания/редактирования */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={closeModal}>
          <div style={{ background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 28, width: 420, maxWidth: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1 }}>
                {modal.mode === 'create' ? 'Новый склад' : 'Редактировать склад'}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                <Icons.X size={18}/>
              </button>
            </div>

            {modal.mode === 'create' && (
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--gold)', marginBottom: 16, padding: '8px 12px', background: 'rgba(240,165,0,0.07)', borderRadius: 6, border: '1px solid rgba(240,165,0,0.15)' }}>
                {pendingCoord?.lat.toFixed(5)}, {pendingCoord?.lng.toFixed(5)}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Название" value={form.name} onChange={setF('name')} placeholder="Склад №1, Москва" />
              <Field label="Адрес (необязательно)" value={form.address} onChange={setF('address')} placeholder="ул. Складская 10" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Вместимость, т" type="number" value={form.total_capacity} onChange={setF('total_capacity')} placeholder="500" />
                <Field label="Текущая загрузка, т" type="number" value={form.current_load} onChange={setF('current_load')} placeholder="0" />
              </div>
            </div>

            {error && (
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--red)', padding: '8px 12px', background: 'rgba(240,68,56,0.08)', borderRadius: 6, border: '1px solid rgba(240,68,56,0.2)' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'space-between' }}>
              {modal.mode === 'edit' && (
                deleteConfirm ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--red)' }}>Удалить склад?</span>
                    <Btn kind="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>Нет</Btn>
                    <Btn size="sm" onClick={() => handleDelete(modal.wh.id)}>Да, удалить</Btn>
                  </div>
                ) : (
                  <Btn kind="ghost" size="sm" icon={<Icons.Trash size={13}/>} onClick={() => setDeleteConfirm(true)}>Удалить</Btn>
                )
              )}
              <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
                <Btn kind="ghost" onClick={closeModal} type="button">Отмена</Btn>
                <Btn onClick={handleSave} disabled={saving} icon={<Icons.Check size={14}/>}>
                  {saving ? 'Сохраняем...' : modal.mode === 'create' ? 'Создать' : 'Сохранить'}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
