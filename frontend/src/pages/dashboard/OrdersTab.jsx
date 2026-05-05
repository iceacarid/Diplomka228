/* eslint-disable no-empty, react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { Icons } from '../../components/Icons'
import { Card, Btn, Field, Select, Modal, PageHeader, StatusPill, Alert, Loading, Empty } from '../../components/ui'
import MapPickerModal from '../../components/MapPickerModal'

const ORDER_STATUS_MAP = {
  draft:            { bg: 'rgba(255,255,255,0.06)', fg: 'rgba(255,255,255,0.45)', label: 'Черновик' },
  pending:          { bg: 'rgba(247,144,9,0.14)',   fg: 'var(--amber)',           label: 'На рассмотрении' },
  in_progress:      { bg: 'rgba(46,144,250,0.14)',  fg: 'var(--blue)',            label: 'В работе' },
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

        {loading ? (
          <Loading />
        ) : orders.length === 0 ? (
          <Empty text="Заказов пока нет" />
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
                {orders.map((order, i) => (
                  <tr
                    key={order.id}
                    style={{ borderBottom: i < orders.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
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
                        {user?.role !== 'client' && order.status === 'pending' && (
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
