/* eslint-disable no-empty, react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { Icons } from '../../components/Icons'
import { Card, Btn, Field, Select, Modal, PageHeader, StatusPill, Alert, Loading, Empty } from '../../components/ui'
import MapPickerModal from '../../components/MapPickerModal'

const ORDER_STATUS_MAP = {
  draft:            { bg: 'rgba(255,255,255,0.06)', fg: 'rgba(255,255,255,0.45)', label: 'Черновик' },
  pending:          { bg: 'rgba(247,144,9,0.14)',   fg: 'var(--amber)',           label: 'На рассмотрении' },
  pending_approval: { bg: 'rgba(240,165,0,0.14)',   fg: 'var(--gold)',            label: 'Ожидает проверки' },
  in_progress:      { bg: 'rgba(46,144,250,0.14)',  fg: 'var(--blue)',            label: 'В работе' },
  accepted:         { bg: 'rgba(46,144,250,0.14)',  fg: '#2E90FA',               label: 'Принята' },
  confirmed:        { bg: 'rgba(18,183,106,0.12)',  fg: '#12B76A',               label: 'Подтверждено' },
  courier_assigned: { bg: 'rgba(139,92,246,0.14)',  fg: '#8B5CF6',               label: 'Курьер назначен' },
  picked_up:        { bg: 'rgba(99,102,241,0.14)',  fg: '#6366F1',               label: 'Курьер в дороге' },
  at_warehouse:     { bg: 'rgba(20,184,166,0.14)',  fg: '#14B8A6',               label: 'Груз на складе' },
  missed_pickup:    { bg: 'rgba(240,68,56,0.16)',   fg: '#F04438',               label: '⚠ Пропущен забор' },
  shipped:          { bg: 'rgba(240,165,0,0.14)',   fg: 'var(--gold)',            label: 'В пути' },
  delivered:        { bg: 'rgba(18,183,106,0.14)',  fg: 'var(--green)',           label: 'Доставлено' },
  rejected:         { bg: 'rgba(240,68,56,0.14)',   fg: 'var(--red)',             label: 'Отклонено' },
}

const thStyle = { textAlign: 'left', padding: '14px 20px', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)' }
const tdStyle = { padding: '14px 20px', fontSize: 13, color: 'rgba(255,255,255,0.85)' }

function RegionPicker({ regions, regionCounts, value, onChange }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const ref                 = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = regions.filter(r => r.toLowerCase().includes(search.toLowerCase()))
  const totalNew = Object.values(regionCounts).reduce((a, b) => a + b, 0)
  const isAll    = value.length === 0
  const btnLabel = isAll ? 'Все регионы' : value.length === 1 ? value[0] : `${value.length} региона`
  const toggle   = (r) => onChange(value.includes(r) ? value.filter(x => x !== r) : [...value, r])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: !isAll ? 'rgba(240,165,0,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${!isAll ? 'rgba(240,165,0,0.35)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 7, padding: '6px 10px',
          color: !isAll ? '#F0A500' : 'rgba(255,255,255,0.55)',
          fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-body)',
          cursor: 'pointer', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 14 8 14s8-8.75 8-14a8 8 0 0 0-8-8z"/>
        </svg>
        {btnLabel}
        {isAll && totalNew > 0 && (
          <span style={{ background: '#F0A500', color: '#0D0D1F', borderRadius: 10, padding: '0px 5px', fontSize: 9, fontWeight: 800 }}>{totalNew}</span>
        )}
        {!isAll && (
          <span style={{ background: 'rgba(240,165,0,0.25)', color: '#F0A500', borderRadius: 10, padding: '0px 5px', fontSize: 9, fontWeight: 800 }}>{value.length}</span>
        )}
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points={open ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200,
          background: '#1A1A35', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, minWidth: 220, maxWidth: 280,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)', overflow: 'hidden',
        }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск региона..."
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 9px', color: '#fff', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none' }}
            />
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            <button onClick={() => { onChange([]); setOpen(false); setSearch('') }}
              style={{ width: '100%', padding: '9px 14px', background: isAll ? 'rgba(240,165,0,0.08)' : 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', color: isAll ? '#F0A500' : 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: isAll ? 700 : 500, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Все регионы</span>
              {totalNew > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(240,165,0,0.15)', color: '#F0A500', borderRadius: 8, padding: '1px 7px' }}>{totalNew} заявок</span>}
            </button>
            {filtered.length === 0
              ? <div style={{ padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Не найдено</div>
              : filtered.map(r => {
                  const sel = value.includes(r)
                  return (
                    <button key={r} onClick={() => toggle(r)}
                      style={{ width: '100%', padding: '9px 14px', background: sel ? 'rgba(240,165,0,0.08)' : 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', color: sel ? '#F0A500' : 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: sel ? 700 : 400, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, border: `1.5px solid ${sel ? '#F0A500' : 'rgba(255,255,255,0.2)'}`, background: sel ? '#F0A500' : 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          {sel && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><polyline points="2 6 5 9 10 3" stroke="#0D0D1F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </span>
                        {r}
                      </span>
                      {regionCounts[r] > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)', borderRadius: 8, padding: '1px 7px' }}>{regionCounts[r]}</span>}
                    </button>
                  )
                })
            }
          </div>
        </div>
      )}
    </div>
  )
}

function StatusPicker({ statusMap, statusCounts, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref             = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const available = Object.keys(statusMap).filter(s => (statusCounts[s] || 0) > 0)
  const isAll     = value.length === 0
  const btnLabel  = isAll ? 'Все статусы' : value.length === 1 ? (statusMap[value[0]]?.label || value[0]) : `${value.length} статуса`
  const toggle    = (s) => onChange(value.includes(s) ? value.filter(x => x !== s) : [...value, s])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: !isAll ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${!isAll ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 7, padding: '6px 10px',
          color: !isAll ? '#6366F1' : 'rgba(255,255,255,0.55)',
          fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-body)',
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
        </svg>
        {btnLabel}
        {!isAll && (
          <span style={{ background: 'rgba(99,102,241,0.25)', color: '#6366F1', borderRadius: 10, padding: '0px 5px', fontSize: 9, fontWeight: 800 }}>{value.length}</span>
        )}
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points={open ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200,
          background: '#1A1A35', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, minWidth: 210, maxWidth: 270,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)', overflow: 'hidden',
        }}>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            <button onClick={() => { onChange([]); setOpen(false) }}
              style={{ width: '100%', padding: '9px 14px', background: isAll ? 'rgba(99,102,241,0.08)' : 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', color: isAll ? '#6366F1' : 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: isAll ? 700 : 500, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}>
              Все статусы
            </button>
            {available.map(s => {
              const sel  = value.includes(s)
              const info = statusMap[s] || { label: s, fg: 'rgba(255,255,255,0.6)' }
              return (
                <button key={s} onClick={() => toggle(s)}
                  style={{ width: '100%', padding: '9px 14px', background: sel ? 'rgba(255,255,255,0.04)' : 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', color: sel ? info.fg : 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: sel ? 700 : 400, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, border: `1.5px solid ${sel ? info.fg : 'rgba(255,255,255,0.2)'}`, background: sel ? info.fg : 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {sel && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><polyline points="2 6 5 9 10 3" stroke="#0D0D1F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </span>
                    {info.label}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)', borderRadius: 8, padding: '1px 7px' }}>{statusCounts[s]}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrdersTab() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate]   = useState(false)
  const [selected, setSelected]       = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [trackInput, setTrackInput]   = useState('')
  const [trackResult, setTrackResult] = useState(null)
  const [statusFilter, setStatusFilter] = useState([])
  const [regionFilter, setRegionFilter] = useState([])
  const [sortDir, setSortDir]           = useState('desc')
  const [searchQuery, setSearchQuery]   = useState('')

  const loadOrders = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/orders')
      setOrders(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadOrders() }, [])

  const handleTrack = async () => {
    try {
      const { data } = await api.get(`/orders/track/${trackInput}`)
      setTrackResult(data)
    } catch {
      setTrackResult(null)
      alert('Заказ не найден')
    }
  }

  const [rescheduleDate, setRescheduleDate]       = useState('')
  const [rescheduleLoading, setRescheduleLoading] = useState(false)

  const handleRescheduleConfirm = async (id) => {
    if (!rescheduleDate) return
    setRescheduleLoading(true)
    try {
      await api.post(`/orders/${id}/reschedule-confirm`, { pickup_date: rescheduleDate })
      loadOrders()
      setSelected(null)
      setRescheduleDate('')
    } catch (e) {
      alert(e?.response?.data?.error || 'Ошибка подтверждения')
    }
    setRescheduleLoading(false)
  }

  const handleAccept = async (id) => {
    await api.post(`/orders/${id}/accept`)
    loadOrders()
    setSelected(null)
  }

  const handleReject = (id) => setRejectTarget(id)

  const confirmReject = async (id, reason) => {
    await api.post(`/orders/${id}/reject`, { rejection_reason: reason })
    loadOrders()
    setSelected(null)
    setRejectTarget(null)
  }

  const regions      = [...new Set(orders.map(o => o.region).filter(Boolean))].sort()
  const regionCounts = regions.reduce((acc, r) => { acc[r] = orders.filter(o => o.region === r).length; return acc }, {})
  const statusCounts = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc }, {})

  const matchesSearch = (o) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    const hay = [
      o.tracking_id, o.origin_address, o.dest_address,
      o.client_name, o.manager_name, o.driver_name, o.courier_name,
      o.cargo_type, o.cargo_description, o.region,
      String(o.weight ?? ''), String(o.volume ?? ''), String(o.price ?? ''),
      ORDER_STATUS_MAP[o.status]?.label || o.status,
    ].filter(Boolean).join(' ').toLowerCase()
    return hay.includes(q)
  }

  const displayedOrders = orders
    .filter(matchesSearch)
    .filter(o => statusFilter.length === 0 || statusFilter.includes(o.status))
    .filter(o => regionFilter.length === 0 || regionFilter.includes(o.region))
    .sort((a, b) => sortDir === 'desc'
      ? new Date(b.created_at) - new Date(a.created_at)
      : new Date(a.created_at) - new Date(b.created_at))

  return (
    <div style={{ padding: '0 0 40px' }}>
      <PageHeader
        eyebrow="Логистика"
        title="Заказы"
        action={user?.role === 'client' && (
          <Btn icon={<Icons.Plus size={14} />} onClick={() => setShowCreate(true)}>
            Новый заказ
          </Btn>
        )}
      />

      <div style={{ padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card padding={16} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icons.Search size={15} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
            <input
              value={trackInput}
              onChange={(e) => setTrackInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
              placeholder="Трекинг-номер (FE-XXXXXX)"
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', flex: 1, fontSize: 13, fontFamily: 'var(--font-body)' }}
            />
          </div>
          <Btn kind="ghost" size="sm" onClick={handleTrack}>Отследить</Btn>
        </Card>

        {trackResult && (
          <Card padding={16} style={{ borderLeft: '3px solid var(--gold)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--gold)', marginBottom: 6 }}>
              {trackResult.tracking_id}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 10 }}>
              {trackResult.origin_address} → {trackResult.dest_address}
            </div>
            <StatusPill status={trackResult.status} map={ORDER_STATUS_MAP} />
          </Card>
        )}

        {orders.length > 0 && !loading && (
          <Card padding={12} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icons.Search size={14} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск по заказам — адрес, клиент, трекинг, тип груза, регион..."
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', flex: 1, fontSize: 13, fontFamily: 'var(--font-body)' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}>✕</button>
            )}
          </Card>
        )}

        {orders.length > 0 && !loading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusPicker
              statusMap={ORDER_STATUS_MAP}
              statusCounts={statusCounts}
              value={statusFilter}
              onChange={setStatusFilter}
            />
            {regions.length > 0 && (
              <RegionPicker
                regions={regions}
                regionCounts={regionCounts}
                value={regionFilter}
                onChange={setRegionFilter}
              />
            )}
            <button
              onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 7, padding: '6px 12px',
                color: 'rgba(255,255,255,0.55)', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-body)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {sortDir === 'desc'
                  ? <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>
                  : <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>
                }
              </svg>
              {sortDir === 'desc' ? 'Новые сначала' : 'Старые сначала'}
            </button>
            {(statusFilter.length > 0 || regionFilter.length > 0) && (
              <button
                onClick={() => { setStatusFilter([]); setRegionFilter([]); setSearchQuery('') }}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-body)', padding: '6px 4px', textDecoration: 'underline' }}
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        )}

        {loading ? (
          <Loading />
        ) : displayedOrders.length === 0 ? (
          <Empty text={orders.length === 0 ? 'Заказов пока нет' : 'Нет заказов по выбранным фильтрам'} />
        ) : (
          <Card padding={0}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th style={thStyle}>Трекинг</th>
                  <th style={thStyle}>Маршрут</th>
                  <th style={thStyle}>Груз</th>
                  <th style={thStyle}>Цена</th>
                  <th style={thStyle}>Статус</th>
                  <th style={thStyle}>Дата</th>
                  {user?.role !== 'client' && <th style={thStyle}>Клиент</th>}
                  {user?.role !== 'client' && <th style={thStyle}>Закреплён за</th>}
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {displayedOrders.map((order, i) => (
                  <tr
                    key={order.id}
                    style={{ borderBottom: i < displayedOrders.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={tdStyle}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--gold)' }}>
                        {order.tracking_id}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, maxWidth: 220 }}>
                      <div style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.origin_address}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        → {order.dest_address}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: 12 }}>{order.weight} кг</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{order.volume} м³</div>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {Number(order.price).toLocaleString('ru')} ₽
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <StatusPill status={order.status} map={ORDER_STATUS_MAP} />
                        {order.courier_blocked && (
                          <span style={{ fontSize: 10, color: '#F59E0B', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 4, padding: '1px 5px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            🔒 Блок
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      {new Date(order.created_at).toLocaleDateString('ru')}
                    </td>
                    {user?.role !== 'client' && (
                      <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{order.client_name || '—'}</td>
                    )}
                    {user?.role !== 'client' && (
                      <td style={{ ...tdStyle, fontSize: 12 }}>
                        {order.manager_name
                          ? <span style={{ color: 'rgba(255,255,255,0.75)' }}>{order.manager_name}</span>
                          : <span style={{ color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>Свободна</span>
                        }
                      </td>
                    )}
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setSelected(order)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                        >
                          Детали
                        </button>
                        {user?.role !== 'client' && order.chat_id && order.manager_id && (
                          <button
                            onClick={() => navigate('/dashboard/chats', { state: { activeChatId: order.chat_id } })}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-body)', padding: '3px 8px', letterSpacing: '0.06em' }}
                          >
                            <Icons.Chat size={11} /> Чат
                          </button>
                        )}
                        {user?.role !== 'client' && ['pending', 'pending_approval'].includes(order.status) && (
                          <>
                            <button onClick={() => handleAccept(order.id)} style={{ background: 'transparent', border: 'none', color: 'var(--green)', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                              Принять
                            </button>
                            <button onClick={() => handleReject(order.id)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                              Отклонить
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {selected && (
        <Modal onClose={() => setSelected(null)} title={`Заказ ${selected.tracking_id}`}>
          <div>
            <InfoRow label="Статус"><StatusPill status={selected.status} map={ORDER_STATUS_MAP} /></InfoRow>
            <InfoRow label="Отправление">{selected.origin_address}</InfoRow>
            <InfoRow label="Доставка">{selected.dest_address}</InfoRow>
            <InfoRow label="Вес">{selected.weight} кг</InfoRow>
            <InfoRow label="Объём">{selected.volume} м³</InfoRow>
            <InfoRow label="Тип груза">{selected.cargo_type}</InfoRow>
            <InfoRow label="Стоимость"><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--gold)' }}>{Number(selected.price).toLocaleString('ru')} ₽</span></InfoRow>
            {selected.driver_name && <InfoRow label="Водитель">{selected.driver_name}</InfoRow>}
            {selected.truck_plate && <InfoRow label="Транспорт"><span style={{ fontFamily: 'var(--font-mono)' }}>{selected.truck_plate}</span></InfoRow>}
            {selected.pickup_date && <InfoRow label="Дата забора">{new Date(selected.pickup_date).toLocaleDateString('ru-RU')}</InfoRow>}
            {selected.courier_blocked_reason && <InfoRow label="Причина блокировки"><span style={{ color: '#F59E0B' }}>{selected.courier_blocked_reason}</span></InfoRow>}
            {selected.rejection_reason && <InfoRow label="Причина отклонения"><span style={{ color: 'var(--red)' }}>{selected.rejection_reason}</span></InfoRow>}
          </div>

          {/* Reschedule confirm (manager/admin only) */}
          {user?.role !== 'client' && selected.status === 'missed_pickup' && (
            <div style={{
              marginTop: 20, padding: '16px', borderRadius: 10,
              background: 'rgba(240,68,56,0.07)', border: '1px solid rgba(240,68,56,0.2)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F04438', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Груз не забран — требуется перенос
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 12, lineHeight: 1.5 }}>
                Согласуйте с клиентом новую дату и подтвердите. Курьер будет разблокирован.
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>
                    Новая дата забора
                  </div>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={e => setRescheduleDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 7, padding: '9px 11px', color: 'white', fontSize: 13,
                      outline: 'none', colorScheme: 'dark', fontFamily: 'var(--font-body)',
                    }}
                  />
                </div>
                <Btn
                  onClick={() => handleRescheduleConfirm(selected.id)}
                  disabled={!rescheduleDate || rescheduleLoading}
                  style={{ whiteSpace: 'nowrap', opacity: (!rescheduleDate || rescheduleLoading) ? 0.5 : 1 }}
                >
                  {rescheduleLoading ? 'Подтверждение...' : 'Подтвердить перенос'}
                </Btn>
              </div>
            </div>
          )}

          {user?.role !== 'client' && selected.status === 'pending' && (
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <Btn onClick={() => handleAccept(selected.id)} style={{ flex: 1, justifyContent: 'center' }}>Принять</Btn>
              <Btn kind="danger" onClick={() => handleReject(selected.id)} style={{ flex: 1, justifyContent: 'center' }}>Отклонить</Btn>
            </div>
          )}
        </Modal>
      )}

      {showCreate && (
        <CreateOrderModal onClose={() => setShowCreate(false)} onCreated={loadOrders} />
      )}

      {rejectTarget && (
        <RejectModal
          onClose={() => setRejectTarget(null)}
          onConfirm={(reason) => confirmReject(rejectTarget, reason)}
        />
      )}
    </div>
  )
}

function InfoRow({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'right' }}>{children}</span>
    </div>
  )
}

function RejectModal({ onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason.trim()) { setError('Укажите причину отклонения'); return }
    setLoading(true)
    try { await onConfirm(reason.trim()) } catch { setError('Ошибка') }
    setLoading(false)
  }

  return (
    <Modal onClose={onClose} title="Отклонить заявку" maxWidth={440}>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 16, lineHeight: 1.6 }}>
        Укажите причину отклонения — клиент увидит её в своём профиле.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field
          label="Причина отклонения"
          as="textarea"
          rows={4}
          placeholder="Например: груз не соответствует требованиям перевозки..."
          value={reason}
          onChange={e => setReason(e.target.value)}
          required
        />
        {error && <Alert type="error">{error}</Alert>}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Btn kind="ghost" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
            Отмена
          </Btn>
          <Btn kind="danger" type="submit" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
            {loading ? 'Отклоняем...' : 'Отклонить'}
          </Btn>
        </div>
      </form>
    </Modal>
  )
}

function CreateOrderModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    origin_address: '', dest_address: '', weight: '', volume: '',
    cargo_type: 'general', cargo_description: '', price: '', pickup_date: '',
  })
  const [calculating, setCalculating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mapPicker, setMapPicker] = useState(null)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const calcPrice = async () => {
    if (!form.origin_address || !form.dest_address || !form.weight || !form.volume) return
    setCalculating(true)
    try {
      const { data } = await api.post('/calculator', {
        origin: form.origin_address, destination: form.dest_address,
        weight: parseFloat(form.weight), volume: parseFloat(form.volume),
      })
      setForm((f) => ({ ...f, price: String(data.price) }))
    } catch {}
    setCalculating(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/orders', {
        ...form,
        weight: parseFloat(form.weight),
        volume: parseFloat(form.volume),
        price: parseFloat(form.price),
      })
      onCreated()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка')
    }
    setLoading(false)
  }

  return (
    <>
    <Modal onClose={onClose} title="Новый заказ" maxWidth={520}>
      {error && <Alert type="error">{error}</Alert>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Field label="Адрес отправления" required value={form.origin_address} onChange={set('origin_address')} />
          <Btn kind="ghost" size="sm" type="button" onClick={() => setMapPicker('origin_address')} icon={<Icons.Pin size={13} />}>
            Выбрать на карте
          </Btn>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Field label="Адрес доставки" required value={form.dest_address} onChange={set('dest_address')} />
          <Btn kind="ghost" size="sm" type="button" onClick={() => setMapPicker('dest_address')} icon={<Icons.Pin size={13} />}>
            Выбрать на карте
          </Btn>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Вес (кг)" type="number" min="0" required value={form.weight} onChange={set('weight')} />
          <Field label="Объём (м³)" type="number" min="0" step="0.1" required value={form.volume} onChange={set('volume')} />
        </div>
        <Select label="Тип груза" value={form.cargo_type} onChange={set('cargo_type')}>
          <option value="general">Обычный груз</option>
          <option value="fragile">Хрупкое</option>
          <option value="flammable">Огнеопасное</option>
          <option value="perishable">Скоропортящееся</option>
          <option value="hazardous">Опасное</option>
          <option value="oversized">Негабаритное</option>
          <option value="temperature_controlled">Температурный режим</option>
          <option value="other">Другое</option>
        </Select>
        <Field label="Описание груза" as="textarea" rows={2} value={form.cargo_description} onChange={set('cargo_description')} />
        <Field label="Желаемая дата забора" type="date" value={form.pickup_date} onChange={set('pickup_date')} />
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Field label="Стоимость (₽)" type="number" min="0" required value={form.price} onChange={set('price')} />
          </div>
          <Btn kind="ghost" size="sm" type="button" onClick={calcPrice} disabled={calculating}>
            {calculating ? '...' : 'Рассчитать'}
          </Btn>
        </div>
        <Btn type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
          {loading ? 'Создаём...' : 'Создать заказ'}
        </Btn>
      </form>
    </Modal>

    {mapPicker && (
      <MapPickerModal
        title={mapPicker === 'origin_address' ? 'Адрес отправления' : 'Адрес доставки'}
        onClose={() => setMapPicker(null)}
        onSelect={(addr) => setForm(f => ({ ...f, [mapPicker]: addr }))}
      />
    )}
    </>
  )
}
