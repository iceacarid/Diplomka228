import { useState, useEffect, useCallback } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

const TRIP_STATUS = {
  forming:    { label: 'Формируется',  color: '#f0a500' },
  loading:    { label: 'Загрузка',     color: '#3b82f6' },
  in_transit: { label: 'В пути',       color: '#8b5cf6' },
  arrived:    { label: 'Прибыл',       color: '#10b981' },
  completed:  { label: 'Завершён',     color: '#6b7280' },
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

function Badge({ label, color }) {
  return (
    <span style={{
      background: color + '22',
      color,
      border: `1px solid ${color}44`,
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

function MeasureModal({ order, onClose, onDone }) {
  const [weight, setWeight] = useState(order.weight ?? '')
  const [volume, setVolume] = useState(order.volume ?? '')
  const [note, setNote]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const submit = async () => {
    if (!weight || !volume) { setError('Заполните вес и объём'); return }
    setLoading(true)
    setError('')
    try {
      await api.post(`/keeper/orders/${order.id}/confirm`, {
        actual_weight: parseFloat(weight),
        actual_volume: parseFloat(volume),
        note: note || undefined,
      })
      onDone()
      onClose()
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const reject = async () => {
    const reason = prompt('Причина отклонения:')
    if (!reason) return
    setLoading(true)
    try {
      await api.post(`/keeper/orders/${order.id}/reject`, { reason })
      onDone()
      onClose()
    } catch (e) {
      alert(e.response?.data?.error || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <Card style={{ width: 460, maxWidth: '92vw' }}>
        <div style={{ fontWeight: 700, fontSize: 17, color: 'white', marginBottom: 4 }}>Замер груза</div>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginBottom: 20 }}>
          {order.tracking_id} · {order.client_name}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 12 }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Заявленные данные</div>
          <div style={{ color: 'white' }}>Вес: {order.weight} кг &nbsp;·&nbsp; Объём: {order.volume} м³</div>
          <div style={{ color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{order.origin_address}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'block', marginBottom: 4 }}>Фактический вес, кг *</label>
            <input
              type="number" step="0.1" min="0.01"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '8px 10px', color: 'white', fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'block', marginBottom: 4 }}>Фактический объём, м³ *</label>
            <input
              type="number" step="0.01" min="0.01"
              value={volume}
              onChange={e => setVolume(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '8px 10px', color: 'white', fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'block', marginBottom: 4 }}>Примечание (необязательно)</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Повреждения упаковки, расхождения..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '8px 10px', color: 'white', fontSize: 13, boxSizing: 'border-box' }}
          />
        </div>

        {error && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 10 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '9px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: 13 }}>
            Отмена
          </button>
          <button onClick={reject} disabled={loading} style={{ padding: '9px 16px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Отклонить
          </button>
          <button onClick={submit} disabled={loading} style={{ flex: 1, padding: '9px 0', background: 'var(--gold)', border: 'none', borderRadius: 6, color: 'var(--navy)', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Сохранение...' : 'Принять и подтвердить'}
          </button>
        </div>
      </Card>
    </div>
  )
}

function QueueTab({ onRefresh }) {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/keeper/queue')
      setOrders(res.data)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <div style={{ color: 'rgba(255,255,255,0.4)', padding: 24 }}>Загрузка...</div>

  if (orders.length === 0) return (
    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '60px 0', fontSize: 14 }}>
      Нет грузов, ожидающих замера
    </div>
  )

  return (
    <>
      <div style={{ display: 'grid', gap: 12 }}>
        {orders.map(o => (
          <Card key={o.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontSize: 14, fontWeight: 700 }}>{o.tracking_id}</span>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>
                  {o.client_name} · Курьер: {o.courier_name || '—'}
                </div>
              </div>
              <Badge label="Ждёт замера" color="#8b5cf6" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px 16px', marginBottom: 14, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
              <div><span style={{ color: 'rgba(255,255,255,0.35)' }}>Откуда: </span>{o.origin_address}</div>
              <div><span style={{ color: 'rgba(255,255,255,0.35)' }}>Куда: </span>{o.dest_address}</div>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>Заявлено: </span>
                {o.weight} кг / {o.volume} м³
              </div>
            </div>

            <button
              onClick={() => setModal(o)}
              style={{ padding: '7px 18px', background: 'var(--gold)', border: 'none', borderRadius: 6, color: 'var(--navy)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              Произвести замер
            </button>
          </Card>
        ))}
      </div>

      {modal && (
        <MeasureModal
          order={modal}
          onClose={() => setModal(null)}
          onDone={() => { load(); onRefresh() }}
        />
      )}
    </>
  )
}

function ManifestsTab() {
  const [trips, setTrips]     = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]       = useState(null)
  const [loadingOrder, setLoadingOrder] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/keeper/manifests')
      setTrips(res.data)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const doAction = async (tripId, endpoint, label) => {
    setBusy(tripId)
    try {
      await api.post(`/keeper/trips/${tripId}/${endpoint}`)
      load()
    } catch (e) {
      alert(e.response?.data?.error || `Ошибка: ${label}`)
    } finally {
      setBusy(null)
    }
  }

  const toggleLoaded = async (orderId) => {
    setLoadingOrder(orderId)
    try {
      await api.post(`/keeper/orders/${orderId}/mark-loaded`)
      setTrips(prev => prev.map(t => ({
        ...t,
        orders: t.orders.map(o => o.id === orderId
          ? { ...o, loaded_at: o.loaded_at ? null : new Date().toISOString() }
          : o
        ),
      })))
    } catch (e) {
      alert(e.response?.data?.error || 'Ошибка')
    } finally {
      setLoadingOrder(null)
    }
  }

  const toggleUnloaded = async (orderId) => {
    setLoadingOrder(orderId)
    try {
      await api.post(`/keeper/orders/${orderId}/mark-unloaded`)
      setTrips(prev => prev.map(t => ({
        ...t,
        orders: t.orders.map(o => o.id === orderId
          ? { ...o, unloaded_at: o.unloaded_at ? null : new Date().toISOString() }
          : o
        ),
      })))
    } catch (e) {
      alert(e.response?.data?.error || 'Ошибка')
    } finally {
      setLoadingOrder(null)
    }
  }

  if (loading) return <div style={{ color: 'rgba(255,255,255,0.4)', padding: 24 }}>Загрузка...</div>

  if (trips.length === 0) return (
    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '60px 0', fontSize: 14 }}>
      Активных рейсов нет
    </div>
  )

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {trips.map(trip => {
        const st = TRIP_STATUS[trip.status] || { label: trip.status, color: '#999' }
        const isSource = trip.role === 'source'
        const isDest   = trip.role === 'destination'

        return (
          <Card key={trip.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 700, color: 'white', fontSize: 15 }}>
                  Рейс #{trip.id} — {trip.warehouse_from.name} → {trip.warehouse_to.name}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 3 }}>
                  {trip.truck.label} · {trip.truck.plate} · Водитель: {trip.driver.name}
                </div>
                {trip.estimated_arrival_at && (
                  <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 5, padding: '3px 10px', fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>
                    <span style={{ fontSize: 10, opacity: 0.7 }}>ПРИБЫТИЕ</span>
                    {new Date(trip.estimated_arrival_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge label={isSource ? 'Склад отправления' : isDest ? 'Склад назначения' : 'Наблюдатель'} color={isSource ? '#f0a500' : '#3b82f6'} />
                <Badge label={st.label} color={st.color} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              {(() => {
                const loadedCount   = trip.orders.filter(o => o.loaded_at).length
                const unloadedCount = trip.orders.filter(o => o.unloaded_at).length
                const total = trip.orders.length
                const allLoaded   = loadedCount === total && total > 0
                const allUnloaded = unloadedCount === total && total > 0
                const isLoadingPhase   = isSource && trip.status === 'loading'
                const isUnloadingPhase = isDest   && trip.status === 'arrived'

                return (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                        Манифест ({trip.orders_count} заказов)
                      </div>
                      {isLoadingPhase && (
                        <div style={{ fontSize: 11, fontWeight: 700, color: allLoaded ? '#10b981' : '#f0a500' }}>
                          {loadedCount}/{total} загружено
                        </div>
                      )}
                      {isUnloadingPhase && (
                        <div style={{ fontSize: 11, fontWeight: 700, color: allUnloaded ? '#10b981' : '#3b82f6' }}>
                          {unloadedCount}/{total} разгружено
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {trip.orders.map(o => {
                        const isLoaded   = !!o.loaded_at
                        const isUnloaded = !!o.unloaded_at
                        const checked    = isLoadingPhase ? isLoaded : isUnloadingPhase ? isUnloaded : false
                        const checkedColor = isUnloadingPhase ? '#3b82f6' : '#10b981'
                        return (
                          <div
                            key={o.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              background: checked
                                ? (isUnloadingPhase ? 'rgba(59,130,246,0.07)' : 'rgba(16,185,129,0.07)')
                                : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${checked
                                ? (isUnloadingPhase ? 'rgba(59,130,246,0.25)' : 'rgba(16,185,129,0.25)')
                                : 'rgba(255,255,255,0.07)'}`,
                              borderRadius: 7, padding: '7px 12px',
                              transition: 'all 0.15s',
                            }}
                          >
                            {(isLoadingPhase || isUnloadingPhase) && (
                              <button
                                onClick={() => isLoadingPhase ? toggleLoaded(o.id) : toggleUnloaded(o.id)}
                                disabled={loadingOrder === o.id}
                                style={{
                                  width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                                  background: checked ? checkedColor : 'transparent',
                                  border: `2px solid ${checked ? checkedColor : 'rgba(255,255,255,0.25)'}`,
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#fff', fontSize: 12, fontWeight: 700,
                                  opacity: loadingOrder === o.id ? 0.5 : 1,
                                }}
                              >
                                {checked ? '✓' : ''}
                              </button>
                            )}
                            <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{o.tracking_id}</span>
                            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, flex: 1 }}>{o.client_name}</span>
                            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>{o.weight} кг</span>
                            {isLoaded   && !isUnloadingPhase && <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700 }}>Загружен</span>}
                            {isUnloaded && isUnloadingPhase  && <span style={{ fontSize: 10, color: '#3b82f6', fontWeight: 700 }}>Разгружен</span>}
                          </div>
                        )
                      })}
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Склад А: водитель прибыл для загрузки → показать кнопку "Отгрузить" */}
            {isSource && trip.status === 'loading' && (() => {
              const allLoaded = trip.orders.length > 0 && trip.orders.every(o => !!o.loaded_at)
              return (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#93c5fd', flex: 1, minWidth: 200 }}>
                    {allLoaded
                      ? 'Все грузы загружены. Можно отправлять фуру.'
                      : `Отметьте каждый груз как загруженный (${trip.orders.filter(o => o.loaded_at).length}/${trip.orders.length})`}
                  </div>
                  <button
                    onClick={() => doAction(trip.id, 'dispatch', 'отгрузка')}
                    disabled={busy === trip.id || !allLoaded}
                    title={!allLoaded ? 'Сначала отметьте все грузы загруженными' : ''}
                    style={{
                      padding: '10px 22px',
                      background: allLoaded ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
                      border: 'none', borderRadius: 8,
                      color: allLoaded ? 'var(--navy)' : 'rgba(255,255,255,0.25)',
                      fontWeight: 700, cursor: allLoaded ? 'pointer' : 'not-allowed',
                      whiteSpace: 'nowrap',
                      opacity: busy === trip.id ? 0.6 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {busy === trip.id ? '...' : 'Отгрузить'}
                  </button>
                </div>
              )
            })()}

            {/* Склад Б: фура прибыла для разгрузки */}
            {isDest && trip.status === 'arrived' && (() => {
              const allUnloaded = trip.orders.length > 0 && trip.orders.every(o => !!o.unloaded_at)
              return (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#6ee7b7', flex: 1, minWidth: 200 }}>
                    {allUnloaded
                      ? 'Все грузы разгружены. Можно подтвердить приёмку.'
                      : `Отметьте каждый груз как разгруженный (${trip.orders.filter(o => o.unloaded_at).length}/${trip.orders.length})`}
                  </div>
                  <button
                    onClick={() => doAction(trip.id, 'unload', 'разгрузка')}
                    disabled={busy === trip.id || !allUnloaded}
                    title={!allUnloaded ? 'Сначала отметьте все грузы разгруженными' : ''}
                    style={{
                      padding: '10px 22px',
                      background: allUnloaded ? '#10b981' : 'rgba(255,255,255,0.06)',
                      border: 'none', borderRadius: 8,
                      color: allUnloaded ? 'white' : 'rgba(255,255,255,0.25)',
                      fontWeight: 700, cursor: allUnloaded ? 'pointer' : 'not-allowed',
                      whiteSpace: 'nowrap',
                      opacity: busy === trip.id ? 0.6 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {busy === trip.id ? '...' : 'Подтвердить разгрузку'}
                  </button>
                </div>
              )
            })()}

            {/* Ожидание водителя */}
            {isSource && trip.status === 'forming' && (
              <div style={{ background: 'rgba(240,165,0,0.06)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: 'rgba(255,165,0,0.8)' }}>
                Ожидание прибытия водителя на загрузку
                {trip.estimated_arrival_at && (
                  <span style={{ fontWeight: 700, marginLeft: 6 }}>
                    — {new Date(trip.estimated_arrival_at).toLocaleString('ru-RU', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

export default function WarehouseDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('queue')
  const [queueCount, setQueueCount] = useState(0)

  const refreshQueueCount = useCallback(async () => {
    try {
      const res = await api.get('/keeper/queue')
      setQueueCount(res.data.length)
    } catch {}
  }, [])

  useEffect(() => { refreshQueueCount() }, [refreshQueueCount])

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'white', margin: 0 }}>
          Кабинет кладовщика
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          {user?.warehouse_name ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(240,165,0,0.10)', border: '1px solid rgba(240,165,0,0.25)',
              borderRadius: 6, padding: '4px 12px', fontSize: 13, color: 'var(--gold)', fontWeight: 600,
            }}>
              <span style={{ opacity: 0.6, fontSize: 11 }}>СКЛАД</span>
              {user.warehouse_name}
            </div>
          ) : (
            <div style={{ color: '#ef4444', fontSize: 13 }}>Склад не назначен</div>
          )}
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
            Приёмка, замер и отгрузка грузов
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 4 }}>
        {[
          ['queue',     `Очередь приёмки${queueCount > 0 ? ` (${queueCount})` : ''}`],
          ['manifests', 'Рейсы / Манифесты'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1,
              padding: '9px 0',
              background: tab === key ? 'rgba(240,165,0,0.12)' : 'transparent',
              border: tab === key ? '1px solid rgba(240,165,0,0.3)' : '1px solid transparent',
              borderRadius: 6,
              color: tab === key ? 'var(--gold)' : 'rgba(255,255,255,0.5)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'queue'     && <QueueTab onRefresh={refreshQueueCount} />}
      {tab === 'manifests' && <ManifestsTab />}
    </div>
  )
}
