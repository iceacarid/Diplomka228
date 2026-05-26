import { useState, useEffect, useCallback } from 'react'
import api from '../../api/axios'

const STATUS_LABEL = {
  courier_assigned:    'Назначен',
  missed_pickup:       'Пропущен забор',
  picked_up:           'В пути',
  awaiting_measurement:'Ждёт приёмки',
}

const STATUS_LABEL_DELIVERY = {
  courier_assigned: 'Забор со склада',
  picked_up:        'Выдача клиенту',
}

const STATUS_COLOR = {
  courier_assigned:    '#f0a500',
  missed_pickup:       '#ef4444',
  picked_up:           '#3b82f6',
  awaiting_measurement:'#8b5cf6',
}

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

function Badge({ status, isDelivery }) {
  const label = isDelivery
    ? (STATUS_LABEL_DELIVERY[status] || STATUS_LABEL[status] || status)
    : (STATUS_LABEL[status] || status)
  return (
    <span style={{
      background: (STATUS_COLOR[status] || '#666') + '22',
      color: STATUS_COLOR[status] || '#aaa',
      border: `1px solid ${STATUS_COLOR[status] || '#666'}44`,
      borderRadius: 4,
      padding: '2px 8px',
      fontSize: 11,
      fontWeight: 600,
      fontFamily: 'var(--font-mono)',
    }}>
      {label}
    </span>
  )
}

function RescheduleModal({ order, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!reason.trim()) return
    setLoading(true)
    setError('')
    try {
      await api.post(`/courier/orders/${order.id}/request-reschedule`, { reason })
      onDone()
      onClose()
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <Card style={{ width: 420, maxWidth: '90vw' }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'white', marginBottom: 16 }}>Запрос переноса — {order.tracking_id}</div>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Причина переноса..."
          rows={3}
          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: 10, color: 'white', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
        />
        {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '8px 0', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>Отмена</button>
          <button onClick={submit} disabled={loading || !reason.trim()} style={{ flex: 2, padding: '8px 0', background: 'var(--gold)', border: 'none', borderRadius: 6, color: 'var(--navy)', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </Card>
    </div>
  )
}

function OrderCard({ order, onAction }) {
  const [loading, setLoading] = useState(null)
  const [reschedule, setReschedule] = useState(false)

  const isDelivery = !!order.trip_id  // второе плечо: выдача клиенту со склада

  const action = async (endpoint, label) => {
    setLoading(label)
    try {
      await api.post(`/courier/orders/${order.id}/${endpoint}`)
      onAction()
    } catch (e) {
      alert(e.response?.data?.error || 'Ошибка')
    } finally {
      setLoading(null)
    }
  }

  const Btn = ({ onClick, children, color = 'var(--gold)', disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled || loading !== null}
      style={{
        padding: '6px 14px', background: color, border: 'none', borderRadius: 6,
        color: color === 'var(--gold)' ? 'var(--navy)' : 'white',
        fontWeight: 600, fontSize: 12, cursor: 'pointer', opacity: loading ? 0.7 : 1,
      }}
    >
      {children}
    </button>
  )

  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontSize: 14, fontWeight: 700 }}>{order.tracking_id}</span>
            {isDelivery && (
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '2px 7px', borderRadius: 4,
                background: order.status === 'picked_up' ? 'rgba(16,185,129,0.15)' : 'rgba(240,165,0,0.15)',
                color: order.status === 'picked_up' ? '#10b981' : '#f0a500',
                border: `1px solid ${order.status === 'picked_up' ? 'rgba(16,185,129,0.3)' : 'rgba(240,165,0,0.3)'}`,
              }}>
                {order.status === 'picked_up' ? 'Выдача клиенту' : 'Забор со склада'}
              </span>
            )}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>{order.client_name}</div>
        </div>
        <Badge status={order.status} isDelivery={isDelivery} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', marginBottom: 12, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
        {isDelivery && order.status === 'courier_assigned' ? (
          <>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>Адрес склада: </span>
              <span style={{ color: 'white', fontWeight: 600 }}>{order.warehouse_address || order.warehouse_name || '—'}</span>
            </div>
          </>
        ) : isDelivery && order.status === 'picked_up' ? (
          <>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>Адрес клиента: </span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>{order.dest_address}</span>
            </div>
          </>
        ) : (
          <>
            <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>Забрать: </span>{order.origin_address}</div>
            <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>Склад: </span>{order.warehouse_address || order.warehouse_name || '—'}</div>
          </>
        )}
        <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>Вес: </span>{order.weight} кг</div>
        {order.pickup_date && !isDelivery && <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>Дата: </span>{order.pickup_date}</div>}
      </div>

      {order.courier_blocked && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#fca5a5' }}>
          Заблокировано: {order.courier_blocked_reason}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {order.status === 'courier_assigned' && !order.courier_blocked && (
          <Btn onClick={() => action('pickup', 'pickup')}>
            {loading === 'pickup' ? '...' : isDelivery ? 'Забрал со склада' : 'Забрал груз'}
          </Btn>
        )}
        {order.status === 'courier_assigned' && !order.courier_blocked && !isDelivery && (
          <Btn onClick={() => setReschedule(true)} color="rgba(239,68,68,0.8)">
            Запросить перенос
          </Btn>
        )}
        {order.status === 'missed_pickup' && !order.courier_blocked && (
          <Btn onClick={() => action('pickup', 'pickup')}>
            {loading === 'pickup' ? '...' : 'Забрал (повтор)'}
          </Btn>
        )}
        {order.status === 'picked_up' && !isDelivery && (
          <Btn onClick={() => action('warehouse', 'warehouse')}>
            {loading === 'warehouse' ? '...' : 'Сдал на склад'}
          </Btn>
        )}
        {order.status === 'picked_up' && isDelivery && (
          <Btn onClick={() => action('deliver', 'deliver')} color="#10b981">
            {loading === 'deliver' ? '...' : 'Отдал получателю'}
          </Btn>
        )}
      </div>

      {reschedule && (
        <RescheduleModal order={order} onClose={() => setReschedule(false)} onDone={onAction} />
      )}
    </Card>
  )
}

export default function CourierDashboard() {
  const [shift, setShift]   = useState(null)
  const [orders, setOrders] = useState([])
  const [history, setHistory] = useState([])
  const [tab, setTab]       = useState('active')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [shiftRes, ordersRes] = await Promise.all([
        api.get('/courier/shift'),
        api.get('/courier/orders/my'),
      ])
      setShift(shiftRes.data)
      setOrders(ordersRes.data)
    } catch {}
    setLoading(false)
  }, [])

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.get('/courier/orders/history')
      setHistory(res.data)
    } catch {}
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab, loadHistory])

  const toggleShift = async () => {
    try {
      if (shift?.open) {
        await api.post('/courier/shift/close')
      } else {
        await api.post('/courier/shift/open')
      }
      load()
    } catch (e) {
      alert(e.response?.data?.error || 'Ошибка')
    }
  }

  if (loading) return <div style={{ padding: 40, color: 'rgba(255,255,255,0.5)' }}>Загрузка...</div>

  return (
    <div style={{ padding: 32, maxWidth: 780, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'white', margin: 0 }}>Кабинет курьера</h1>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 4 }}>
            {orders.length} активных заказов
          </div>
        </div>
        <button
          onClick={toggleShift}
          style={{
            padding: '10px 22px',
            background: shift?.open ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
            border: `1px solid ${shift?.open ? '#ef4444' : '#10b981'}`,
            borderRadius: 8, color: shift?.open ? '#ef4444' : '#10b981',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}
        >
          {shift?.open ? 'Закрыть смену' : 'Открыть смену'}
        </button>
      </div>

      {shift?.open && (
        <Card style={{ marginBottom: 20, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div style={{ color: '#10b981', fontWeight: 600, fontSize: 13 }}>
            Смена открыта с {new Date(shift.shift?.opened_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 4 }}>
        {[['active', 'Активные'], ['history', 'История']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, padding: '8px 0', background: tab === key ? 'rgba(240,165,0,0.12)' : 'transparent',
              border: tab === key ? '1px solid rgba(240,165,0,0.3)' : '1px solid transparent',
              borderRadius: 6, color: tab === key ? 'var(--gold)' : 'rgba(255,255,255,0.5)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'active' && (
        <>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '60px 0', fontSize: 14 }}>
              Нет активных заказов
            </div>
          ) : (
            orders.map(o => <OrderCard key={o.id} order={o} onAction={load} />)
          )}
        </>
      )}

      {tab === 'history' && (
        <>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '60px 0', fontSize: 14 }}>
              История пуста
            </div>
          ) : (
            history.map(o => (
              <Card key={o.id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontSize: 13 }}>{o.tracking_id}</span>
                  <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>Выполнено</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{o.dest_address}</div>
              </Card>
            ))
          )}
        </>
      )}
    </div>
  )
}
