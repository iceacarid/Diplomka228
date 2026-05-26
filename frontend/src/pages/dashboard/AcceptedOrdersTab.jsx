import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { Icons } from '../../components/Icons'
import { Btn, PageHeader, StatusPill, Field, Alert, Loading, Empty } from '../../components/ui'

const STATUS_MAP = {
  confirmed:            { bg: 'rgba(18,183,106,0.12)',  fg: '#12B76A', label: 'Подтверждено' },
  courier_assigned:     { bg: 'rgba(139,92,246,0.14)',  fg: '#8B5CF6', label: 'Курьер назначен' },
  picked_up:            { bg: 'rgba(99,102,241,0.14)',  fg: '#6366F1', label: 'Курьер в дороге' },
  awaiting_measurement: { bg: 'rgba(139,92,246,0.12)', fg: '#a78bfa', label: 'Ждёт замера' },
  at_warehouse:         { bg: 'rgba(20,184,166,0.14)',  fg: '#14B8A6', label: 'На складе' },
  shipped:              { bg: 'rgba(240,165,0,0.14)',   fg: '#f0a500', label: 'В пути' },
  ready_for_pickup:     { bg: 'rgba(16,185,129,0.14)', fg: '#10b981', label: 'Готов к выдаче' },
}

function RegionPicker({ regions, regionCounts, value, onChange }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const ref                 = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered  = regions.filter(r => r.toLowerCase().includes(search.toLowerCase()))
  const totalNew  = Object.values(regionCounts).reduce((a, b) => a + b, 0)
  const isAll     = value.length === 0
  const btnLabel  = isAll ? 'Все регионы' : value.length === 1 ? value[0] : `${value.length} региона`
  const toggle    = (r) => onChange(value.includes(r) ? value.filter(x => x !== r) : [...value, r])

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
          <span style={{ background: '#F0A500', color: '#0D0D1F', borderRadius: 10, padding: '0px 5px', fontSize: 9, fontWeight: 800 }}>
            {totalNew}
          </span>
        )}
        {!isAll && (
          <span style={{ background: 'rgba(240,165,0,0.25)', color: '#F0A500', borderRadius: 10, padding: '0px 5px', fontSize: 9, fontWeight: 800 }}>
            {value.length}
          </span>
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
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск региона..."
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, padding: '6px 9px', color: '#fff', fontSize: 12,
                fontFamily: 'var(--font-body)', outline: 'none',
              }}
            />
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            <button
              onClick={() => { onChange([]); setOpen(false); setSearch('') }}
              style={{
                width: '100%', padding: '9px 14px', background: isAll ? 'rgba(240,165,0,0.08)' : 'transparent',
                border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)',
                color: isAll ? '#F0A500' : 'rgba(255,255,255,0.6)',
                fontSize: 12, fontWeight: isAll ? 700 : 500, cursor: 'pointer',
                fontFamily: 'var(--font-body)', textAlign: 'left',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <span>Все регионы</span>
              {totalNew > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(240,165,0,0.15)', color: '#F0A500', borderRadius: 8, padding: '1px 7px' }}>
                  {totalNew} заявок
                </span>
              )}
            </button>
            {filtered.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Не найдено</div>
            ) : filtered.map(r => {
              const sel = value.includes(r)
              return (
                <button
                  key={r}
                  onClick={() => toggle(r)}
                  style={{
                    width: '100%', padding: '9px 14px',
                    background: sel ? 'rgba(240,165,0,0.08)' : 'transparent',
                    border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                    color: sel ? '#F0A500' : 'rgba(255,255,255,0.7)',
                    fontSize: 12, fontWeight: sel ? 700 : 400, cursor: 'pointer',
                    fontFamily: 'var(--font-body)', textAlign: 'left',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{
                      width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                      border: `1.5px solid ${sel ? '#F0A500' : 'rgba(255,255,255,0.2)'}`,
                      background: sel ? '#F0A500' : 'transparent',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {sel && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><polyline points="2 6 5 9 10 3" stroke="#0D0D1F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </span>
                    {r}
                  </span>
                  {regionCounts[r] > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)', borderRadius: 8, padding: '1px 7px' }}>
                      {regionCounts[r]}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function CourierPickerModal({ orderId, originAddress, onClose, onAssigned }) {
  const [couriers, setCouriers]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [assigning, setAssigning] = useState(null)
  const [error, setError]         = useState(null)

  useEffect(() => {
    api.get(`/orders/${orderId}/available-couriers`)
      .then(({ data }) => setCouriers(data))
      .catch(() => setError('Не удалось загрузить список курьеров'))
      .finally(() => setLoading(false))
  }, [orderId])

  const assign = async (courierId) => {
    setAssigning(courierId)
    setError(null)
    try {
      await api.post(`/orders/${orderId}/assign-courier`, { courier_id: courierId })
      onAssigned()
      onClose()
    } catch (e) {
      setError(e?.response?.data?.error || 'Ошибка назначения')
    }
    setAssigning(null)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 24, width: '100%', maxWidth: 520, maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: 'var(--font-body)' }}>Выбор курьера</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginTop: 2 }}>Назначить на заявку</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '8px 12px', fontFamily: 'var(--font-body)' }}>
          Адрес забора: <span style={{ color: 'rgba(255,255,255,0.75)' }}>{originAddress}</span>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Загрузка...</div>
          ) : couriers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Нет доступных курьеров</div>
          ) : couriers.map(c => (
            <div
              key={c.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 14px', borderRadius: 10,
                background: c.geo_match ? 'rgba(18,183,106,0.05)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${c.geo_match ? 'rgba(18,183,106,0.18)' : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{c.name}</span>
                  {c.geo_match && (
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#12B76A', border: '1px solid rgba(18,183,106,0.3)', borderRadius: 4, padding: '1px 5px' }}>GEO ✓</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  {c.warehouse_name && (
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icons.Package size={10}/> {c.warehouse_name}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: c.has_open_shift ? '#12B76A' : 'rgba(255,255,255,0.25)' }}>
                    {c.has_open_shift ? '● Смена открыта' : '○ Не в смене'}
                  </span>
                  {c.active_orders > 0 && (
                    <span style={{ fontSize: 11, color: '#F79009' }}>{c.active_orders} активных заказов</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => assign(c.id)}
                disabled={!!assigning}
                style={{
                  padding: '8px 16px', borderRadius: 7, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)',
                  background: assigning === c.id ? 'rgba(255,255,255,0.08)' : c.geo_match ? 'rgba(18,183,106,0.2)' : 'rgba(255,255,255,0.08)',
                  border: `1px solid ${c.geo_match ? 'rgba(18,183,106,0.35)' : 'rgba(255,255,255,0.12)'}`,
                  color: assigning === c.id ? 'rgba(255,255,255,0.3)' : c.geo_match ? '#12B76A' : 'rgba(255,255,255,0.6)',
                  cursor: assigning ? 'default' : 'pointer',
                  flexShrink: 0,
                }}
              >
                {assigning === c.id ? '...' : 'Назначить'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DatePickerModal({ order, onClose, onSaved }) {
  const [date, setDate]       = useState(order.pickup_date || '')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const save = async () => {
    if (!date) return
    setLoading(true)
    setError(null)
    try {
      await api.patch(`/orders/${order.id}`, { pickup_date: date })
      onSaved()
      onClose()
    } catch (e) {
      setError(e?.response?.data?.error || 'Ошибка сохранения')
    }
    setLoading(false)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 24, width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Изменить дату забора</div>
        {error && <Alert type="error">{error}</Alert>}
        <Field
          label="Новая дата"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn kind="ghost" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Отмена</Btn>
          <Btn onClick={save} disabled={!date || loading} style={{ flex: 1, justifyContent: 'center' }}>
            {loading ? 'Сохраняем...' : 'Сохранить'}
          </Btn>
        </div>
      </div>
    </div>
  )
}

function OrderCard({ order, isFuture, onAssign, onUnassign, onDateChange, onOpenChat }) {
  const hasDate    = !!order.pickup_date
  const isAssigned = order.status === 'courier_assigned'

  return (
    <div style={{
      background: 'var(--navy-2)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>
              {order.tracking_id}
            </span>
            <StatusPill status={order.status} map={STATUS_MAP} />
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {order.origin_address} <span style={{ opacity: 0.4 }}>→</span> {order.dest_address}
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.8)' }}>
            {Number(order.price).toLocaleString('ru')} ₽
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
            {order.weight} кг · {order.volume} м³
          </div>
        </div>
      </div>

      {/* Info row */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
          Клиент: <span style={{ color: 'rgba(255,255,255,0.75)' }}>{order.client_name || '—'}</span>
        </span>
        {isAssigned && order.courier_name && (
          <span style={{ fontSize: 11, color: 'rgba(139,92,246,0.8)' }}>
            Курьер: <span style={{ color: '#8B5CF6' }}>{order.courier_name}</span>
          </span>
        )}
        {isAssigned && isFuture && (
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4, background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)' }}>
            Курьер ждёт даты
          </span>
        )}
        <button
          onClick={() => onDateChange(order)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <Icons.Bell size={11} style={{ color: hasDate ? 'var(--gold)' : 'rgba(255,255,255,0.3)' }} />
          <span style={{ fontSize: 11, color: hasDate ? 'var(--gold)' : 'rgba(255,255,255,0.35)', textDecoration: 'underline' }}>
            {hasDate ? formatDate(order.pickup_date) : 'Дата не задана'}
          </span>
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {!isAssigned && (
          <Btn size="sm" onClick={() => onAssign(order)} icon={<Icons.User size={12}/>}>
            Назначить курьера
          </Btn>
        )}
        {isAssigned && (
          <>
            <Btn size="sm" onClick={() => onAssign(order)} icon={<Icons.User size={12}/>}>
              Переназначить
            </Btn>
            <Btn size="sm" kind="ghost" onClick={() => onUnassign(order.id)}>
              Снять курьера
            </Btn>
          </>
        )}
        {order.chat_id && (
          <Btn size="sm" kind="ghost" icon={<Icons.Chat size={12}/>} onClick={() => onOpenChat(order.chat_id)}>
            Чат
          </Btn>
        )}
      </div>
    </div>
  )
}

const ACTIVE_STATUSES = ['confirmed', 'courier_assigned', 'ready_for_pickup']

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function dateBadge(dateKey) {
  if (dateKey === '__no_date__') return null
  const today    = todayStr()
  const diffDays = Math.round((new Date(dateKey) - new Date(today)) / 86400000)
  if (diffDays < 0)  return { label: 'ПРОСРОЧЕНО',       bg: 'rgba(240,68,56,0.15)',   fg: '#F04438' }
  if (diffDays === 0) return { label: 'СЕГОДНЯ',          bg: 'rgba(240,165,0,0.15)',   fg: '#F0A500' }
  if (diffDays === 1) return { label: 'ЗАВТРА',           bg: 'rgba(46,144,250,0.15)',  fg: '#2E90FA' }
  return               { label: `через ${diffDays} дн.`, bg: 'rgba(255,255,255,0.06)', fg: 'rgba(255,255,255,0.4)' }
}

export default function AcceptedOrdersTab() {
  const navigate = useNavigate()

  const [orders, setOrders]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [assignTarget, setAssignTarget] = useState(null)
  const [dateTarget, setDateTarget]     = useState(null)
  const [actionLoading, setActLoad]     = useState(null)
  const [error, setError]               = useState(null)
  const [sortDir, setSortDir]           = useState('asc')
  const [regionFilter, setRegionFilter] = useState([])
  const pollRef                         = useRef(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const { data } = await api.get('/orders')
      setOrders(Array.isArray(data) ? data.filter(o => ACTIVE_STATUSES.includes(o.status)) : [])
    } catch {}
    if (!silent) setLoading(false)
  }, [])

  useEffect(() => {
    load()
    pollRef.current = setInterval(() => load(true), 15000)
    return () => clearInterval(pollRef.current)
  }, [load])

  const handleUnassign = async (orderId) => {
    setActLoad(orderId)
    setError(null)
    try {
      await api.post(`/orders/${orderId}/unassign-courier`)
      load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Ошибка снятия курьера')
    }
    setActLoad(null)
  }

  const openChat = (chatId) => {
    navigate('/dashboard/chats', { state: { activeChatId: chatId } })
  }

  const regions      = [...new Set(orders.map(o => o.region).filter(Boolean))].sort()
  const regionCounts = regions.reduce((acc, r) => { acc[r] = orders.filter(o => o.region === r).length; return acc }, {})

  const filteredOrders = regionFilter.length > 0
    ? orders.filter(o => regionFilter.includes(o.region))
    : orders

  const grouped = filteredOrders.reduce((acc, o) => {
    const key = o.pickup_date || '__no_date__'
    if (!acc[key]) acc[key] = []
    acc[key].push(o)
    return acc
  }, {})

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (a === '__no_date__') return 1
    if (b === '__no_date__') return -1
    const diff = new Date(a) - new Date(b)
    return sortDir === 'asc' ? diff : -diff
  })

  const accepted = filteredOrders.filter(o => o.status === 'confirmed' || o.status === 'ready_for_pickup').length
  const assigned = filteredOrders.filter(o => o.status === 'courier_assigned').length
  const today    = todayStr()

  return (
    <div style={{ padding: '0 0 40px' }}>
      <PageHeader
        eyebrow="Менеджмент"
        title="Принятые заказы"
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {regions.length > 0 && (
              <RegionPicker
                regions={regions}
                regionCounts={regionCounts}
                value={regionFilter}
                onChange={setRegionFilter}
              />
            )}
            <button
              onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              title={sortDir === 'asc' ? 'Ближайшие сначала' : 'Поздние сначала'}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 7, padding: '6px 12px',
                color: 'rgba(255,255,255,0.55)', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-body)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {sortDir === 'asc'
                  ? <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>
                  : <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>
                }
              </svg>
              {sortDir === 'asc' ? 'Ближайшие' : 'Поздние'}
            </button>
            <Btn kind="ghost" size="sm" onClick={load} icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            }>
              Обновить
            </Btn>
          </div>
        }
      />

      <div style={{ padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: 'Ожидают курьера', value: accepted, color: '#2E90FA' },
            { label: 'Курьер назначен', value: assigned, color: '#8B5CF6' },
            { label: 'Всего', value: orders.length, color: 'var(--gold)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ flex: 1, background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {error && <Alert type="error">{error}</Alert>}

        {loading ? (
          <Loading />
        ) : orders.length === 0 ? (
          <Empty text="Нет принятых заказов" />
        ) : (
          sortedKeys.map(key => {
            const badge = dateBadge(key)
            return (
              <div key={key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: 0.5, color: key === '__no_date__' ? 'rgba(255,255,255,0.4)' : 'white' }}>
                    {key === '__no_date__' ? 'Без даты забора' : formatDate(key)}
                  </div>
                  {badge && (
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4, background: badge.bg, color: badge.fg }}>
                      {badge.label}
                    </span>
                  )}
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
                    {grouped[key].length} заявок
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {grouped[key].map(order => {
                    const isFuture = order.pickup_date && order.pickup_date > today
                    return (
                      <OrderCard
                        key={order.id}
                        order={order}
                        isFuture={isFuture}
                        onAssign={setAssignTarget}
                        onUnassign={handleUnassign}
                        onDateChange={setDateTarget}
                        onOpenChat={openChat}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {assignTarget && (
        <CourierPickerModal
          orderId={assignTarget.id}
          originAddress={
            assignTarget.status === 'ready_for_pickup'
              ? assignTarget.dest_address
              : assignTarget.origin_address
          }
          onClose={() => setAssignTarget(null)}
          onAssigned={load}
        />
      )}

      {dateTarget && (
        <DatePickerModal
          order={dateTarget}
          onClose={() => setDateTarget(null)}
          onSaved={load}
        />
      )}

    </div>
  )
}
