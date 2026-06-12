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

const fmtWeight = (kg) => {
  const abs = Math.abs(kg)
  if (abs >= 500) return (kg < 0 ? '-' : '') + parseFloat((abs / 1000).toFixed(3)) + ' т'
  return Math.round(kg) + ' кг'
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

  const [loadModal,    setLoadModal]   = useState(null)   // { wh } | null
  const [loadForm,     setLoadForm]    = useState({ action: 'manual', weight_change: '', note: '' })
  const [loadSaving,   setLoadSaving]  = useState(false)
  const [loadError,    setLoadError]   = useState('')

  const [editLogModal, setEditLogModal] = useState(null)  // { log, warehouseId } | null
  const [editLogForm,  setEditLogForm]  = useState({ action: 'manual', weight_change: '', note: '' })
  const [editLogSaving,setEditLogSaving]= useState(false)
  const [editLogError, setEditLogError] = useState('')

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
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : []
        setWarehouses(list)
        // Синхронизируем selectedWh и loadModal.wh со свежими данными
        setSelectedWh(prev => prev ? (list.find(w => w.id === prev.id) ?? prev) : null)
        setLoadModal(prev => prev ? { ...prev, wh: list.find(w => w.id === prev.wh.id) ?? prev.wh } : null)
      })
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
          `<b>${wh.name}</b><br>Загружено: ${wh.current_load} т из ${wh.total_capacity} т (${wh.load_percent}%)`,
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

  const openLoadModal = (wh) => {
    setLoadForm({ action: 'manual', weight_change: '', note: '' })
    setLoadError('')
    setLoadModal({ wh })
  }

  const handleManualLoad = async () => {
    const wc = parseFloat(loadForm.weight_change)
    if (!loadForm.weight_change || isNaN(wc) || wc === 0) {
      setLoadError('Введите ненулевое изменение веса')
      return
    }
    setLoadSaving(true)
    setLoadError('')
    try {
      await api.post(`/warehouses/${loadModal.wh.id}/update-load`, {
        action:        loadForm.action,
        weight_change: wc / 1000,   // кг → т для backend
        note:          loadForm.note || null,
      })
      load()
      if (selectedWh?.id === loadModal.wh.id) openLogs(loadModal.wh)
      setLoadModal(null)
    } catch (err) {
      setLoadError(err?.response?.data?.message || err?.response?.data?.error || 'Ошибка')
    }
    setLoadSaving(false)
  }

  const openEditLog = (log, warehouseId) => {
    setEditLogForm({
      action:        log.action,
      weight_change: String(Math.round(log.weight_change * 1000)),  // т → кг для отображения
      note:          log.note || '',
    })
    setEditLogError('')
    setEditLogModal({ log, warehouseId })
  }

  const handleEditLog = async () => {
    const wc = parseFloat(editLogForm.weight_change)
    if (isNaN(wc)) { setEditLogError('Введите корректное число'); return }
    setEditLogSaving(true)
    setEditLogError('')
    try {
      const { data } = await api.patch(
        `/warehouses/${editLogModal.warehouseId}/logs/${editLogModal.log.id}`,
        { action: editLogForm.action, note: editLogForm.note || null, weight_change: wc / 1000 }  // кг → т
      )
      setLogs(prev => prev.map(l => l.id === data.id ? { ...l, ...data } : l))
      load()
      setEditLogModal(null)
    } catch (err) {
      setEditLogError(err?.response?.data?.message || err?.response?.data?.error || 'Ошибка')
    }
    setEditLogSaving(false)
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
                  <span>{wh.current_load} т / {wh.total_capacity} т</span>
                  <span style={{ color }}>{pct}%</span>
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
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
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {isAdmin && selectedWh && (
              <Btn size="sm" icon={<Icons.Bolt size={13}/>} onClick={() => openLoadModal(selectedWh)}>
                Корректировка
              </Btn>
            )}
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
              { value: 'all',            label: 'Все' },
              { value: 'load',           label: 'Загрузка' },
              { value: 'unload',         label: 'Разгрузка' },
              { value: 'courier_pickup', label: 'Выдача курьеру' },
              { value: 'manual',         label: 'Ручное' },
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
                  {['Дата', 'Операция', 'Изменение', 'До → После', 'Заказ', 'Фура', 'Водитель', 'Примечание', ...(isAdmin ? [''] : [])].map((h, i) => (
                    <th key={i} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>{h}</th>
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
                        <span style={{
                          padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                          background: l.action === 'load' ? 'rgba(18,183,106,0.12)'
                            : l.action === 'unload' ? 'rgba(240,68,56,0.12)'
                            : l.action === 'courier_pickup' ? 'rgba(99,179,237,0.12)'
                            : 'rgba(240,165,0,0.1)',
                          color: l.action === 'load' ? '#12B76A'
                            : l.action === 'unload' ? '#F04438'
                            : l.action === 'courier_pickup' ? '#63B3ED'
                            : 'var(--gold)',
                        }}>
                          {l.action === 'load' ? 'Загрузка'
                            : l.action === 'unload' ? 'Разгрузка'
                            : l.action === 'courier_pickup' ? 'Выдача курьеру'
                            : 'Ручное'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: positive ? '#12B76A' : '#F04438' }}>
                        {positive ? '+' : ''}{fmtWeight(l.weight_change * 1000)}
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
                        {l.action === 'courier_pickup' && l.courier
                          ? <span>Курьер: <span style={{ color: '#63B3ED' }}>{l.courier.name}</span></span>
                          : l.driver?.name || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.4)', maxWidth: 200 }}>
                        {l.note || '—'}
                      </td>
                      {isAdmin && (
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            onClick={() => openEditLog(l, selectedWh.id)}
                            title="Редактировать запись"
                            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(240,165,0,0.4)'; e.currentTarget.style.color = 'var(--gold)' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
                          >
                            <Icons.Edit size={11}/> Ред.
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Модалка редактирования записи лога */}
      {editLogModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setEditLogModal(null)}>
          <div style={{ background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 28, width: 420, maxWidth: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 1, marginBottom: 2 }}>Редактировать запись</h3>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
                  #{editLogModal.log.id} · {new Date(editLogModal.log.created_at).toLocaleString('ru', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' })}
                </div>
              </div>
              <button onClick={() => setEditLogModal(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                <Icons.X size={18}/>
              </button>
            </div>

            {/* Тип операции */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Тип операции</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
                {[
                  { value: 'load',           label: 'Загрузка',       color: '#12B76A' },
                  { value: 'unload',         label: 'Разгрузка',      color: '#F04438' },
                  { value: 'courier_pickup', label: 'Курьер',         color: '#63B3ED' },
                  { value: 'manual',         label: 'Ручное',         color: 'var(--gold)' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setEditLogForm(f => ({ ...f, action: opt.value }))}
                    style={{
                      padding: '8px 4px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                      border: editLogForm.action === opt.value ? `1px solid ${opt.color}66` : '1px solid rgba(255,255,255,0.08)',
                      background: editLogForm.action === opt.value ? `${opt.color}18` : 'rgba(255,255,255,0.03)',
                      color: editLogForm.action === opt.value ? opt.color : 'rgba(255,255,255,0.5)',
                      fontSize: 11, fontWeight: 600, textAlign: 'center',
                    }}
                  >{opt.label}</button>
                ))}
              </div>
            </div>

            {/* Изменение веса */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Изменение, кг</div>
              <input
                type="number" step="1"
                value={editLogForm.weight_change}
                onChange={e => setEditLogForm(f => ({ ...f, weight_change: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', color: 'white', fontSize: 14, fontFamily: 'var(--font-mono)', outline: 'none' }}
              />
              <div style={{ marginTop: 5, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)' }}>
                Было: <span style={{ color: 'rgba(255,255,255,0.6)' }}>{editLogModal.log.weight_change > 0 ? '+' : ''}{fmtWeight(editLogModal.log.weight_change * 1000)}</span>
                &nbsp;·&nbsp; До → После было: <span style={{ color: 'rgba(255,255,255,0.6)' }}>{editLogModal.log.load_before} т → {editLogModal.log.load_after} т</span>
              </div>
            </div>

            {/* Примечание */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Примечание</div>
              <textarea
                value={editLogForm.note}
                onChange={e => setEditLogForm(f => ({ ...f, note: e.target.value }))}
                rows={2}
                placeholder="Причина изменения..."
                style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', color: 'white', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' }}
              />
            </div>

            {editLogError && (
              <div style={{ marginBottom: 14, fontSize: 12, color: 'var(--red)', padding: '8px 12px', background: 'rgba(240,68,56,0.08)', borderRadius: 6, border: '1px solid rgba(240,68,56,0.2)' }}>
                {editLogError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn kind="ghost" onClick={() => setEditLogModal(null)}>Отмена</Btn>
              <Btn onClick={handleEditLog} disabled={editLogSaving} icon={<Icons.Check size={14}/>}>
                {editLogSaving ? 'Сохраняем...' : 'Сохранить'}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Модалка ручной корректировки загрузки */}
      {loadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setLoadModal(null)}>
          <div style={{ background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 28, width: 420, maxWidth: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 1, marginBottom: 2 }}>
                  Корректировка загрузки
                </h3>
                <div style={{ fontSize: 12, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{loadModal.wh.name}</div>
              </div>
              <button onClick={() => setLoadModal(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                <Icons.X size={18}/>
              </button>
            </div>

            {/* Текущее состояние */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Сейчас', value: `${loadModal.wh.current_load ?? 0} т`, color: LOAD_COLOR(loadModal.wh.load_percent ?? 0) },
                { label: 'Вместимость', value: `${loadModal.wh.total_capacity ?? '—'} т`, color: 'rgba(255,255,255,0.5)' },
                { label: 'Загружено', value: `${loadModal.wh.load_percent ?? 0}%`, color: LOAD_COLOR(loadModal.wh.load_percent ?? 0) },
              ].map(item => (
                <div key={item.label} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: item.color, fontFamily: 'var(--font-mono)' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Тип операции */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Тип операции</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { value: 'load',    label: 'Загрузка',    hint: '+ вес', color: '#12B76A' },
                  { value: 'unload',  label: 'Разгрузка',   hint: '− вес', color: '#F04438' },
                  { value: 'manual',  label: 'Ручное',       hint: '± вес', color: 'var(--gold)' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setLoadForm(f => ({ ...f, action: opt.value }))}
                    style={{
                      padding: '10px 8px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                      border: loadForm.action === opt.value ? `1px solid ${opt.color}66` : '1px solid rgba(255,255,255,0.08)',
                      background: loadForm.action === opt.value ? `${opt.color}18` : 'rgba(255,255,255,0.03)',
                      color: loadForm.action === opt.value ? opt.color : 'rgba(255,255,255,0.5)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{opt.label}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, fontFamily: 'var(--font-mono)' }}>{opt.hint}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Изменение веса */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                Изменение, кг{loadForm.action === 'unload' ? ' (введите отрицательное)' : ''}
              </div>
              <input
                type="number"
                step="1"
                value={loadForm.weight_change}
                onChange={e => setLoadForm(f => ({ ...f, weight_change: e.target.value }))}
                placeholder={loadForm.action === 'unload' ? '-500' : '500'}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8, padding: '10px 14px', color: 'white', fontSize: 14,
                  fontFamily: 'var(--font-mono)', outline: 'none',
                }}
              />
              {loadForm.weight_change && !isNaN(parseFloat(loadForm.weight_change)) && (
                <div style={{ marginTop: 6, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)' }}>
                  Результат:&nbsp;
                  <span style={{ color: 'white', fontWeight: 600 }}>
                    {Math.max(0, loadModal.wh.current_load + parseFloat(loadForm.weight_change) / 1000).toFixed(3)} т
                  </span>
                  &nbsp;из {loadModal.wh.total_capacity} т
                </div>
              )}
            </div>

            {/* Примечание */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Примечание (необязательно)</div>
              <textarea
                value={loadForm.note}
                onChange={e => setLoadForm(f => ({ ...f, note: e.target.value }))}
                placeholder="Причина корректировки..."
                rows={2}
                style={{
                  width: '100%', boxSizing: 'border-box', resize: 'vertical',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8, padding: '10px 14px', color: 'white', fontSize: 13,
                  fontFamily: 'var(--font-body)', outline: 'none',
                }}
              />
            </div>

            {loadError && (
              <div style={{ marginBottom: 14, fontSize: 12, color: 'var(--red)', padding: '8px 12px', background: 'rgba(240,68,56,0.08)', borderRadius: 6, border: '1px solid rgba(240,68,56,0.2)' }}>
                {loadError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn kind="ghost" onClick={() => setLoadModal(null)}>Отмена</Btn>
              <Btn onClick={handleManualLoad} disabled={loadSaving} icon={<Icons.Check size={14}/>}>
                {loadSaving ? 'Сохраняем...' : 'Применить'}
              </Btn>
            </div>
          </div>
        </div>
      )}

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
