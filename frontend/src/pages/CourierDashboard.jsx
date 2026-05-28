import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import ProfileTab from './dashboard/ProfileTab'
import { Icons } from '../components/Icons'

const TABS = ['my', 'history']
const TAB_LABELS = { my: 'Мои заказы', history: 'История' }

const STATUS_LABEL = {
  confirmed:        'Ожидает курьера',
  courier_assigned: 'Едете на точку',
  picked_up:        'Груз забран',
  at_warehouse:     'На складе',
  missed_pickup:    'Пропущен забор',
}

const STATUS_LABEL_DELIVERY = {
  courier_assigned: 'Забор со склада',
  picked_up:        'Выдача клиенту',
}

const STATUS_COLOR = {
  confirmed:        '#F0A500',
  courier_assigned: '#8B5CF6',
  picked_up:        '#6366F1',
  at_warehouse:     '#14B8A6',
  missed_pickup:    '#F04438',
}

const MISSED_REASONS = [
  'Клиент не берёт трубку',
  'Не успел по времени',
  'Клиент попросил перенести',
  'Адрес недоступен',
]

function make2GisUrl(address) {
  return `https://2gis.ru/search/${encodeURIComponent(address)}`
}

function CargoTypeLabel({ type, custom }) {
  const labels = {
    general:              'Обычный',
    fragile:              'Хрупкое',
    flammable:            'Огнеопасное',
    perishable:           'Скоропортящееся',
    hazardous:            'Опасное',
    oversized:            'Негабаритное',
    temperature_controlled: 'Темп. режим',
    other:                'Другое',
  }
  if (type === 'other' && custom) return custom
  return labels[type] || type
}

function OrderCard({ order, onAction, actionLabel, actionColor, actionLoading, onNotifyMissed, onRequestReschedule }) {
  const isBusy      = actionLoading === order.id
  const isMissed    = order.status === 'missed_pickup'
  const isBlocked   = order.courier_blocked
  const isDelivery  = !!order.trip_id
  const canReschedule = order.status === 'courier_assigned' && !isBlocked && !isDelivery

  return (
    <div style={{
      background:    isMissed ? 'rgba(240,68,56,0.05)' : '#141428',
      border:        isMissed ? '1.5px solid rgba(240,68,56,0.40)' : '1px solid rgba(255,255,255,0.08)',
      borderRadius:  14,
      padding:       '16px 16px 14px',
      marginBottom:  12,
      position:      'relative',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: '#F0A500', letterSpacing: '0.05em' }}>
          {order.tracking_id}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          padding: '3px 10px', borderRadius: 20,
          background: `${STATUS_COLOR[order.status] ?? '#888'}22`,
          color: STATUS_COLOR[order.status] ?? '#aaa',
          border: `1px solid ${STATUS_COLOR[order.status] ?? '#888'}44`,
          whiteSpace: 'nowrap',
        }}>
          {isDelivery
            ? (STATUS_LABEL_DELIVERY[order.status] ?? STATUS_LABEL[order.status] ?? order.status)
            : (STATUS_LABEL[order.status] ?? order.status)}
        </span>
      </div>

      {/* Missed pickup alert banner */}
      {isMissed && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(240,68,56,0.12)', border: '1px solid rgba(240,68,56,0.25)',
          borderRadius: 8, padding: '8px 12px', marginBottom: 12,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F04438" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#F04438' }}>Груз не забран в срок</div>
            {order.pickup_date && (
              <div style={{ fontSize: 11, color: 'rgba(240,68,56,0.7)', marginTop: 1 }}>
                Дата забора: {new Date(order.pickup_date).toLocaleDateString('ru-RU')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Blocked state banner */}
      {isBlocked && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 8, padding: '8px 12px', marginBottom: 12,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>Ожидание менеджера</div>
            <div style={{ fontSize: 11, color: 'rgba(245,158,11,0.7)', marginTop: 1 }}>
              {order.courier_blocked_reason || 'Уточнение нового времени забора'}
            </div>
          </div>
        </div>
      )}

      {/* Client */}
      <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 4 }}>
          {order.client_name || '—'}
        </div>
        {order.client_phone ? (
          <a
            href={`tel:${order.client_phone}`}
            style={{ fontSize: 13, color: '#60A5FA', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.02 2.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14z"/>
            </svg>
            {order.client_phone}
          </a>
        ) : (
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Телефон не указан</span>
        )}
      </div>

      {/* Address block */}
      <div style={{ marginBottom: 12 }}>
        {isDelivery && order.status === 'courier_assigned' ? (
          <>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 5 }}>
              Адрес склада (забор груза)
            </div>
            <a
              href={make2GisUrl(order.warehouse_address || order.warehouse_name || '')}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 13, color: '#F0A500', wordBreak: 'break-word', display: 'inline-flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.4 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F0A500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {order.warehouse_address || order.warehouse_name || '—'}
            </a>
          </>
        ) : isDelivery && order.status === 'picked_up' ? (
          <>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 5 }}>
              Адрес клиента (доставка)
            </div>
            <a
              href={make2GisUrl(order.dest_address)}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 13, color: '#34D399', wordBreak: 'break-word', display: 'inline-flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.4 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {order.dest_address}
            </a>
          </>
        ) : (
          <>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 5 }}>
              Адрес забора
            </div>
            <a
              href={make2GisUrl(order.origin_address)}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 13, color: '#34D399', wordBreak: 'break-word', display: 'inline-flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.4 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {order.origin_address}
            </a>
            {order.created_at && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                marginTop: 8,
                background: 'rgba(240,165,0,0.10)',
                border: '1px solid rgba(240,165,0,0.25)',
                borderRadius: 6, padding: '4px 10px',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F0A500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#F0A500', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
                  {new Date(order.created_at).toLocaleString('ru', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cargo info */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 10, padding: '12px 14px', marginBottom: 14,
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: order.cargo_description ? 10 : 0 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(255,255,255,0.06)', borderRadius: 6,
            padding: '5px 10px', fontSize: 12, fontWeight: 600, color: 'white',
          }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em' }}>ВЕС</span>
            {order.weight} кг
          </span>
          {order.volume > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(255,255,255,0.06)', borderRadius: 6,
              padding: '5px 10px', fontSize: 12, fontWeight: 600, color: 'white',
            }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em' }}>ОБЪ</span>
              {order.volume} м³
            </span>
          )}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(240,165,0,0.10)', border: '1px solid rgba(240,165,0,0.2)',
            borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, color: '#F0A500',
          }}>
            <span style={{ fontSize: 10, color: 'rgba(240,165,0,0.55)', fontWeight: 700, letterSpacing: '0.1em' }}>ТИП</span>
            <CargoTypeLabel type={order.cargo_type} custom={order.cargo_type_custom} />
          </span>
        </div>
        {order.cargo_description && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
            {order.cargo_description}
          </div>
        )}
      </div>

      {/* Action button area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Кнопка аварийного переноса — доступна ДО забора груза */}
      {canReschedule && !isBusy && onRequestReschedule && (
        <button
          onClick={() => onRequestReschedule(order.id)}
          style={{
            width: '100%', padding: '11px 20px',
            borderRadius: 10, border: '1.5px solid rgba(245,158,11,0.45)',
            background: 'rgba(245,158,11,0.10)',
            color: '#F59E0B',
            fontSize: 13, fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.15s',
          }}
        >
          {/* calendar-x icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <line x1="10" y1="14" x2="14" y2="18"/><line x1="14" y1="14" x2="10" y2="18"/>
          </svg>
          Запросить перенос даты
        </button>
      )}

      {/* Кнопка уведомления менеджера при автоматическом missed_pickup */}
      {isMissed && !isBlocked && !isBusy && onNotifyMissed && (
        <button
          onClick={() => onNotifyMissed(order.id)}
          disabled={isBusy}
          style={{
            width: '100%', padding: '12px 20px',
            borderRadius: 10, border: '1.5px solid rgba(240,68,56,0.4)',
            background: 'rgba(240,68,56,0.12)',
            color: '#F04438',
            fontSize: 13, fontWeight: 700,
            cursor: isBusy ? 'default' : 'pointer',
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.15s',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          {isBusy ? 'Отправка...' : 'Отправить в чат для уточнения'}
        </button>
      )}

      {onAction && (
        <button
          onClick={() => onAction(order.id)}
          disabled={isBusy}
          style={{
            width: '100%', padding: '14px 20px',
            borderRadius: 10, border: 'none',
            background: isBusy ? 'rgba(255,255,255,0.1)' : actionColor,
            color: isBusy ? 'rgba(255,255,255,0.4)' : '#fff',
            fontSize: 14, fontWeight: 800,
            cursor: isBusy ? 'default' : 'pointer',
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            transition: 'opacity 0.15s',
          }}
        >
          {isBusy ? 'Загрузка...' : actionLabel}
        </button>
      )}
      </div>
    </div>
  )
}

function EmptyState({ icon, text, gold }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, color: gold ? '#F0A500' : 'rgba(255,255,255,0.15)' }}>
        {icon}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.25)' }}>{text}</div>
    </div>
  )
}

const filterLabelStyle = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.3)', marginBottom: 4,
}

const filterInputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, padding: '6px 8px',
  color: 'white', fontSize: 12,
  fontFamily: 'var(--font-body)',
  outline: 'none', colorScheme: 'dark',
}

const filterSelectStyle = {
  ...filterInputStyle,
  cursor: 'pointer',
  colorScheme: 'dark',
  backgroundColor: '#1A1A35',
}

export default function CourierDashboard() {
  const { user, logout }           = useAuth()
  const navigate                   = useNavigate()
  const [tab, setTab]              = useState('my')
  const [shift, setShift]          = useState(null)
  const [myOrders, setMyOrders]    = useState([])
  const [history, setHistory]      = useState([])
  const [ordersLoading, setOL]     = useState(false)
  const [shiftLoading, setSL]      = useState(false)
  const [actionLoading, setAL]     = useState(null)
  const [error, setError]          = useState(null)

  const loadShift = useCallback(async () => {
    try {
      const { data } = await api.get('/courier/shift')
      setShift(data)
    } catch {
      setShift({ open: false, shift: null })
    }
  }, [])

  const loadOrders = useCallback(async () => {
    setOL(true)
    setError(null)
    try {
      const [my, hist] = await Promise.all([
        api.get('/courier/orders/my').then(r => r.data).catch(() => []),
        api.get('/courier/orders/history').then(r => r.data).catch(() => []),
      ])
      setMyOrders(Array.isArray(my) ? my : [])
      setHistory(Array.isArray(hist) ? hist : [])
    } catch {
      setError('Ошибка загрузки заказов')
    }
    setOL(false)
  }, [])

  useEffect(() => { loadShift() }, [loadShift])

  useEffect(() => {
    if (shift?.open) loadOrders()
  }, [shift?.open, loadOrders])

  const handleOpenShift = async () => {
    setSL(true); setError(null)
    try {
      const { data } = await api.post('/courier/shift/open')
      setShift(data)
    } catch (e) {
      setError(e?.response?.data?.error || 'Ошибка открытия смены')
    }
    setSL(false)
  }

  const handleCloseShift = async () => {
    if (myOrders.length > 0) {
      setError(`Нельзя закрыть смену: есть ${myOrders.length} активн. ${myOrders.length === 1 ? 'заказ' : myOrders.length < 5 ? 'заказа' : 'заказов'}. Завершите все заказы.`)
      return
    }
    if (!window.confirm('Закрыть смену?')) return
    setSL(true); setError(null)
    try {
      const { data } = await api.post('/courier/shift/close')
      setShift(data)
      setMyOrders([]); setHistory([])
    } catch (e) {
      setError(e?.response?.data?.error || 'Ошибка закрытия смены')
    }
    setSL(false)
  }

  const handlePickup = async (id) => {
    setAL(id); setError(null)
    try {
      await api.post(`/courier/orders/${id}/pickup`)
      await loadOrders()
    } catch (e) {
      setError(e?.response?.data?.error || 'Ошибка')
    }
    setAL(null)
  }

  const handleWarehouse = async (id) => {
    setAL(id); setError(null)
    try {
      await api.post(`/courier/orders/${id}/warehouse`)
      await loadOrders()
      setTab('history')
    } catch (e) {
      setError(e?.response?.data?.error || 'Ошибка')
    }
    setAL(null)
  }

  const handleDeliver = async (id) => {
    setAL(id); setError(null)
    try {
      await api.post(`/courier/orders/${id}/deliver`)
      await loadOrders()
      setTab('history')
    } catch (e) {
      setError(e?.response?.data?.error || 'Ошибка')
    }
    setAL(null)
  }

  const [missedModal, setMissedModal]   = useState(null)  // order id or null
  const [missedModalMode, setMissedModalMode] = useState('missed') // 'missed' | 'reschedule'
  const [missedReason, setMissedReason] = useState(MISSED_REASONS[0])
  const [customReason, setCustomReason] = useState('')

  const openReasonModal = (id, mode) => {
    setMissedReason(MISSED_REASONS[0])
    setCustomReason('')
    setMissedModalMode(mode)
    setMissedModal(id)
  }

  const handleNotifyMissed    = (id) => openReasonModal(id, 'missed')
  const handleRequestReschedule = (id) => openReasonModal(id, 'reschedule')

  const submitNotifyMissed = async () => {
    const reason = missedReason === '__custom__' ? customReason.trim() : missedReason
    if (!reason) return
    const id = missedModal
    setMissedModal(null)
    setAL(id); setError(null)
    try {
      const endpoint = missedModalMode === 'reschedule'
        ? `/courier/orders/${id}/request-reschedule`
        : `/courier/orders/${id}/notify-missed`
      await api.post(endpoint, { reason })
      await loadOrders()
    } catch (e) {
      setError(e?.response?.data?.error || 'Ошибка отправки')
    }
    setAL(null)
  }

  const [view, setView]         = useState('orders') // 'orders' | 'profile'
  const [showMenu, setShowMenu] = useState(false)
  const menuRef                 = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch {}
    logout()
    navigate('/login')
  }

  const shiftTime = shift?.shift?.opened_at
    ? new Date(shift.shift.opened_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
    : null

  const [showFilters, setShowFilters] = useState(false)
  const [filterDate,      setFilterDate]      = useState('')
  const [filterTimeFrom,  setFilterTimeFrom]  = useState('')
  const [filterTimeTo,    setFilterTimeTo]    = useState('')
  const [filterWeightMin, setFilterWeightMin] = useState('')
  const [filterWeightMax, setFilterWeightMax] = useState('')
  const [filterVolMin,    setFilterVolMin]    = useState('')
  const [filterVolMax,    setFilterVolMax]    = useState('')
  const [sortBy,          setSortBy]          = useState('date_desc')

  const resetFilters = () => {
    setFilterDate(''); setFilterTimeFrom(''); setFilterTimeTo('')
    setFilterWeightMin(''); setFilterWeightMax('')
    setFilterVolMin(''); setFilterVolMax('')
    setSortBy('date_desc')
  }

  const applyFilters = (orders) => {
    let out = [...orders]

    if (filterDate) {
      out = out.filter(o => {
        const d = new Date(o.created_at)
        return d.toISOString().slice(0, 10) === filterDate
      })
    }
    if (filterTimeFrom) {
      out = out.filter(o => {
        const t = new Date(o.created_at).toTimeString().slice(0, 5)
        return t >= filterTimeFrom
      })
    }
    if (filterTimeTo) {
      out = out.filter(o => {
        const t = new Date(o.created_at).toTimeString().slice(0, 5)
        return t <= filterTimeTo
      })
    }
    if (filterWeightMin !== '') out = out.filter(o => o.weight >= parseFloat(filterWeightMin))
    if (filterWeightMax !== '') out = out.filter(o => o.weight <= parseFloat(filterWeightMax))
    if (filterVolMin    !== '') out = out.filter(o => o.volume >= parseFloat(filterVolMin))
    if (filterVolMax    !== '') out = out.filter(o => o.volume <= parseFloat(filterVolMax))

    out.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':    return new Date(a.created_at) - new Date(b.created_at)
        case 'date_desc':   return new Date(b.created_at) - new Date(a.created_at)
        case 'weight_asc':  return a.weight - b.weight
        case 'weight_desc': return b.weight - a.weight
        case 'vol_asc':     return a.volume - b.volume
        case 'vol_desc':    return b.volume - a.volume
        default:            return 0
      }
    })
    return out
  }

  const rawOrders    = tab === 'my' ? myOrders : history
  const currentOrders = applyFilters(rawOrders)

  const hasActiveFilters = filterDate || filterTimeFrom || filterTimeTo ||
    filterWeightMin || filterWeightMax || filterVolMin || filterVolMax || sortBy !== 'date_desc'

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D1F', fontFamily: 'var(--font-body)', color: 'white' }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        background: '#141428',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, letterSpacing: '0.1em' }}>
            ФУРА<span style={{ color: '#F0A500' }}>ЕДЕТ</span>
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.25em', textTransform: 'uppercase', marginTop: 1 }}>
            КУРЬЕР · {user?.name ?? ''}
          </div>
        </div>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(v => !v)}
            style={{
              background: showMenu ? 'rgba(255,255,255,0.08)' : 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer', padding: '8px 10px',
              display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center',
            }}
          >
            <span style={{ display: 'block', width: 18, height: 2, background: 'currentColor', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 18, height: 2, background: 'currentColor', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 18, height: 2, background: 'currentColor', borderRadius: 2 }} />
          </button>

          {showMenu && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 100,
              background: '#1A1A35', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, overflow: 'hidden', minWidth: 160,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}>
              {[
                { label: 'Заказы',  icon: <Icons.Package size={15} />, view: 'orders' },
                { label: 'Профиль', icon: <Icons.User size={15} />, view: 'profile' },
              ].map(item => (
                <button
                  key={item.view}
                  onClick={() => { setView(item.view); setShowMenu(false) }}
                  style={{
                    width: '100%', padding: '11px 16px',
                    background: view === item.view ? 'rgba(240,165,0,0.1)' : 'transparent',
                    border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    color: view === item.view ? '#F0A500' : 'rgba(255,255,255,0.75)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 15 }}>{item.icon}</span> {item.label}
                </button>
              ))}
              <button
                onClick={() => { setShowMenu(false); handleLogout() }}
                style={{
                  width: '100%', padding: '11px 16px',
                  background: 'transparent', border: 'none',
                  color: '#F87171', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                  display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                }}
              >
                <Icons.Logout size={15} /> Выйти
              </button>
            </div>
          )}
        </div>
      </div>

      {view === 'profile' && (
        <div style={{ padding: '14px 14px 40px', maxWidth: 520, margin: '0 auto' }}>
          <ProfileTab compact />
        </div>
      )}

      <div style={{ display: view === 'orders' ? 'block' : 'none', padding: '14px 14px 40px', maxWidth: 520, margin: '0 auto' }}>
        {/* Error banner */}
        {error && (
          <div style={{
            background: 'rgba(240,68,56,0.10)', border: '1px solid rgba(240,68,56,0.25)',
            borderRadius: 9, padding: '10px 14px', marginBottom: 14,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: 13, color: '#F87171',
          }}>
            {error}
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* Shift status card */}
        {shift === null ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
            Загрузка...
          </div>
        ) : (
          <>
            <div style={{
              background: shift.open ? 'rgba(18,183,106,0.07)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${shift.open ? 'rgba(18,183,106,0.22)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 12, padding: '14px 16px', marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div>
                <div style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: shift.open ? '#12B76A' : 'rgba(255,255,255,0.35)',
                }}>
                  {shift.open ? '● Смена открыта' : '○ Смена закрыта'}
                </div>
                {shiftTime && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
                    начало в {shiftTime}
                  </div>
                )}
              </div>
              <button
                onClick={shift.open ? handleCloseShift : handleOpenShift}
                disabled={shiftLoading}
                title={shift.open && myOrders.length > 0 ? `Завершите ${myOrders.length} активн. заказ(а) перед закрытием смены` : undefined}
                style={{
                  padding: '9px 18px', borderRadius: 8, flexShrink: 0,
                  background: shift.open
                    ? (myOrders.length > 0 ? 'rgba(255,255,255,0.05)' : 'rgba(240,68,56,0.14)')
                    : '#F0A500',
                  border: shift.open
                    ? (myOrders.length > 0 ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(240,68,56,0.3)')
                    : 'none',
                  color: shift.open
                    ? (myOrders.length > 0 ? 'rgba(255,255,255,0.3)' : '#F87171')
                    : '#0D0D1F',
                  fontSize: 12, fontWeight: 700,
                  cursor: (shiftLoading || (shift.open && myOrders.length > 0)) ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '0.04em',
                  opacity: shiftLoading ? 0.6 : 1,
                }}
              >
                {shiftLoading ? '...' : shift.open ? 'Закрыть смену' : 'Открыть смену'}
              </button>
            </div>

            {!shift.open ? (
              <EmptyState icon={<Icons.Truck size={52} />} text="Откройте смену, чтобы увидеть доступные заявки" />
            ) : (
              <>
                {/* Tab bar */}
                <div style={{
                  display: 'flex', gap: 3, marginBottom: 14,
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 11, padding: 4,
                }}>
                  {TABS.map(t => {
                    const count = t === 'my' ? myOrders.length : 0
                    return (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                          flex: 1, padding: '9px 6px',
                          borderRadius: 8, border: 'none',
                          background: tab === t ? '#1A1A35' : 'transparent',
                          color: tab === t ? '#F0A500' : 'rgba(255,255,255,0.4)',
                          fontSize: 12, fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-body)',
                          boxShadow: tab === t ? '0 1px 6px rgba(0,0,0,0.4)' : 'none',
                          transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        }}
                      >
                        {TAB_LABELS[t]}
                        {count > 0 && (
                          <span style={{
                            background: '#8B5CF6',
                            color: 'white',
                            borderRadius: 10, padding: '1px 6px',
                            fontSize: 10, fontWeight: 800, lineHeight: 1.4,
                          }}>
                            {count}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Toolbar: refresh + filter toggle */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                  <button
                    onClick={loadOrders}
                    disabled={ordersLoading}
                    style={{
                      background: 'none', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 6, color: 'rgba(255,255,255,0.35)',
                      cursor: ordersLoading ? 'default' : 'pointer',
                      padding: '6px 12px', fontSize: 11,
                      fontFamily: 'var(--font-body)',
                      opacity: ordersLoading ? 0.5 : 1,
                    }}
                  >
                    {ordersLoading ? '...' : '↻ Обновить'}
                  </button>
                  <button
                    onClick={() => setShowFilters(v => !v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: hasActiveFilters ? 'rgba(240,165,0,0.12)' : 'none',
                      border: `1px solid ${hasActiveFilters ? 'rgba(240,165,0,0.35)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 6,
                      color: hasActiveFilters ? '#F0A500' : 'rgba(255,255,255,0.35)',
                      cursor: 'pointer', padding: '6px 12px', fontSize: 11,
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                    </svg>
                    Фильтры{hasActiveFilters ? ' ●' : ''}
                  </button>
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      style={{
                        background: 'none', border: 'none',
                        color: 'rgba(240,68,56,0.7)', cursor: 'pointer',
                        fontSize: 11, fontFamily: 'var(--font-body)', padding: '6px 4px',
                      }}
                    >
                      Сброс
                    </button>
                  )}
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)' }}>
                    {currentOrders.length} / {rawOrders.length}
                  </span>
                </div>

                {/* Filter panel */}
                {showFilters && (
                  <div style={{
                    background: '#141428', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12, padding: '14px 14px 10px', marginBottom: 14,
                    display: 'flex', flexDirection: 'column', gap: 10,
                  }}>
                    {/* Sort */}
                    <div>
                      <div style={filterLabelStyle}>Сортировка</div>
                      <select
                        value={sortBy} onChange={e => setSortBy(e.target.value)}
                        style={filterSelectStyle}
                      >
                        <option value="date_desc">Дата: новые сначала</option>
                        <option value="date_asc">Дата: старые сначала</option>
                        <option value="weight_asc">Вес: по возрастанию</option>
                        <option value="weight_desc">Вес: по убыванию</option>
                        <option value="vol_asc">Объём: по возрастанию</option>
                        <option value="vol_desc">Объём: по убыванию</option>
                      </select>
                    </div>

                    {/* Date + time */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      <div>
                        <div style={filterLabelStyle}>Дата</div>
                        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={filterInputStyle} />
                      </div>
                      <div>
                        <div style={filterLabelStyle}>Время с</div>
                        <input type="time" value={filterTimeFrom} onChange={e => setFilterTimeFrom(e.target.value)} style={filterInputStyle} />
                      </div>
                      <div>
                        <div style={filterLabelStyle}>Время до</div>
                        <input type="time" value={filterTimeTo} onChange={e => setFilterTimeTo(e.target.value)} style={filterInputStyle} />
                      </div>
                    </div>

                    {/* Weight + volume */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                      <div>
                        <div style={filterLabelStyle}>Вес от (кг)</div>
                        <input type="number" min="0" value={filterWeightMin} onChange={e => setFilterWeightMin(e.target.value)} placeholder="0" style={filterInputStyle} />
                      </div>
                      <div>
                        <div style={filterLabelStyle}>Вес до (кг)</div>
                        <input type="number" min="0" value={filterWeightMax} onChange={e => setFilterWeightMax(e.target.value)} placeholder="∞" style={filterInputStyle} />
                      </div>
                      <div>
                        <div style={filterLabelStyle}>Объём от (м³)</div>
                        <input type="number" min="0" step="0.1" value={filterVolMin} onChange={e => setFilterVolMin(e.target.value)} placeholder="0" style={filterInputStyle} />
                      </div>
                      <div>
                        <div style={filterLabelStyle}>Объём до (м³)</div>
                        <input type="number" min="0" step="0.1" value={filterVolMax} onChange={e => setFilterVolMax(e.target.value)} placeholder="∞" style={filterInputStyle} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Content */}
                {ordersLoading ? (
                  <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                    Загрузка заказов...
                  </div>
                ) : currentOrders.length === 0 ? (
                  tab === 'my'
                    ? <EmptyState icon={
                        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                        </svg>
                      } text="У вас нет активных заказов." />
                    : <EmptyState icon={
                        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                        </svg>
                      } text="История пуста." />
                ) : currentOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    actionLoading={actionLoading}
                    onNotifyMissed={tab === 'my' ? handleNotifyMissed : undefined}
                    onRequestReschedule={tab === 'my' ? handleRequestReschedule : undefined}
                    onAction={
                      tab !== 'my' ? null
                      : (order.status === 'courier_assigned' || (order.status === 'missed_pickup' && !order.courier_blocked))
                        ? handlePickup
                        : order.status === 'picked_up'
                          ? (order.trip_id ? handleDeliver : handleWarehouse)
                          : null
                    }
                    actionLabel={
                      (order.status === 'courier_assigned' || order.status === 'missed_pickup')
                        ? (order.trip_id ? 'Забрал со склада' : 'Груз забран')
                        : order.status === 'picked_up'
                          ? (order.trip_id ? 'Отдал получателю' : 'Передать на склад')
                          : ''
                    }
                    actionColor={
                      (order.status === 'courier_assigned' || order.status === 'missed_pickup')
                        ? '#7C3AED'
                        : order.trip_id ? '#059669' : '#059669'
                    }
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Reason modal */}
      {missedModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 16px',
        }} onClick={() => setMissedModal(null)}>
          <div style={{
            background: '#1A1A35', borderRadius: 16, padding: '24px 20px',
            width: '100%', maxWidth: 380,
            border: '1px solid rgba(255,255,255,0.1)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              {missedModalMode === 'reschedule' ? 'Запрос переноса даты' : 'Причина переноса'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
              {missedModalMode === 'reschedule'
                ? 'Заявка перейдёт в статус «Ожидание менеджера». Менеджер назначит новую дату.'
                : 'Сообщение уйдёт в чат с клиентом и менеджером'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {MISSED_REASONS.map(r => (
                <label key={r} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
                  background: missedReason === r ? 'rgba(240,68,56,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${missedReason === r ? 'rgba(240,68,56,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  transition: 'all 0.15s',
                }}>
                  <input
                    type="radio" name="reason" value={r}
                    checked={missedReason === r}
                    onChange={() => { setMissedReason(r); setCustomReason('') }}
                    style={{ accentColor: '#F04438' }}
                  />
                  <span style={{ fontSize: 13, color: missedReason === r ? '#fff' : 'rgba(255,255,255,0.6)' }}>{r}</span>
                </label>
              ))}
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
                background: missedReason === '__custom__' ? 'rgba(240,68,56,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${missedReason === '__custom__' ? 'rgba(240,68,56,0.4)' : 'rgba(255,255,255,0.07)'}`,
              }}>
                <input
                  type="radio" name="reason" value="__custom__"
                  checked={missedReason === '__custom__'}
                  onChange={() => setMissedReason('__custom__')}
                  style={{ accentColor: '#F04438' }}
                />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Другое...</span>
              </label>
              {missedReason === '__custom__' && (
                <input
                  autoFocus
                  type="text"
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  placeholder="Укажите причину..."
                  style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 13,
                    outline: 'none', fontFamily: 'var(--font-body)', width: '100%', boxSizing: 'border-box',
                  }}
                />
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setMissedModal(null)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: 'rgba(255,255,255,0.5)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >
                Отмена
              </button>
              <button
                onClick={submitNotifyMissed}
                disabled={missedReason === '__custom__' && !customReason.trim()}
                style={{
                  flex: 2, padding: '12px', borderRadius: 9, border: 'none',
                  background: '#F04438',
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  opacity: (missedReason === '__custom__' && !customReason.trim()) ? 0.4 : 1,
                }}
              >
                Отправить в чат
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
