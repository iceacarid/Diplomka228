import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const STATUS_LABEL = {
  draft:       'Черновик',
  pending:     'Ожидает подтверждения',
  in_progress: 'В обработке',
  shipped:     'В пути',
  delivered:   'Доставлен',
  rejected:    'Отклонён',
}

const STATUS_COLOR = {
  draft:       '#8899aa',
  pending:     '#f0a500',
  in_progress: '#3b9eff',
  shipped:     '#22c55e',
  delivered:   '#22c55e',
  rejected:    '#ef4444',
}

const STEPS = ['pending', 'in_progress', 'shipped', 'delivered']

const stepIndex = (status) => {
  if (status === 'rejected') return -1
  const i = STEPS.indexOf(status)
  return i === -1 ? 0 : i
}

export default function TrackingPage() {
  const { tracking_id } = useParams()

  return tracking_id
    ? <TrackingResult tracking_id={tracking_id} />
    : <TrackingSearch />
}

const PREFIX = 'FE-'

/* ── Страница поиска ─────────────────────────────────────────── */
function TrackingSearch() {
  const navigate = useNavigate()
  const [digits, setDigits] = useState('')
  const [error, setError] = useState('')

  const handleChange = (e) => {
    // strip non-digits, max 6
    const raw = e.target.value.replace(/\D/g, '').slice(0, 6)
    setDigits(raw)
    setError('')
  }

  const handleKeyDown = (e) => {
    // prevent deleting the prefix
    if (e.key === 'Backspace' && digits === '') e.preventDefault()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!digits) { setError('Введите номер отслеживания'); return }
    navigate(`/track/${PREFIX}${digits}`)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--navy-1)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px',
      fontFamily: 'var(--font-body)',
      color: 'white',
      position: 'relative',
    }}>
      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(240,165,0,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(240,165,0,0.03) 1px,transparent 1px)',
        backgroundSize: '80px 80px',
      }} />

      <Link to="/" style={{ position: 'absolute', top: 28, left: 36, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>
        ← Главная
      </Link>

      <div style={{ position: 'relative', width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        {/* Logo */}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 3, marginBottom: 32, opacity: 0.6 }}>
          ФУРА<span style={{ color: 'var(--gold)' }}>ЕДЕТ</span>
        </div>

        <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, textAlign: 'center', letterSpacing: '-0.01em' }}>
          Отслеживание заказа
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 36, textAlign: 'center' }}>
          Введите номер из подтверждения заказа
        </div>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={{ display: 'flex', gap: 0, width: '100%' }}>
            {/* masked input wrapper */}
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center',
              background: 'rgba(255,255,255,0.06)',
              border: error ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.12)',
              borderRight: 'none',
              borderRadius: '4px 0 0 4px',
              padding: '0 0 0 18px',
              cursor: 'text',
            }}>
              <span style={{ color: 'var(--gold)', fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', userSelect: 'none', flexShrink: 0 }}>
                FE-
              </span>
              <input
                autoFocus
                value={digits}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="123456"
                inputMode="numeric"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  padding: '14px 18px 14px 4px',
                  color: 'white',
                  fontSize: 16,
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  letterSpacing: '0.06em',
                  width: '100%',
                }}
              />
            </div>
            <button type="submit" style={{
              padding: '14px 28px',
              background: 'var(--gold)',
              color: 'var(--navy)',
              border: 'none',
              borderRadius: '0 4px 4px 0',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}>
              Найти
            </button>
          </div>
          {error && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#fca5a5' }}>{error}</div>
          )}
        </form>

        <div style={{ marginTop: 48, fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center', lineHeight: 1.6 }}>
          Номер отслеживания выглядит как <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>FE-XXXXXX</span><br />
          и указан в письме-подтверждении заказа
        </div>
      </div>
    </div>
  )
}

/* ── Страница результата ─────────────────────────────────────── */
function TrackingResult({ tracking_id }) {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get(`/api/orders/track/${tracking_id}`)
      .then(r => setOrder(r.data))
      .catch(e => setError(e.response?.data?.error ?? 'Заказ не найден'))
      .finally(() => setLoading(false))
  }, [tracking_id])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--navy-1)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 16px',
      fontFamily: 'var(--font-body)',
      color: 'white',
    }}>
      <div style={{ width: '100%', maxWidth: 660, marginBottom: 32 }}>
        <Link to="/track" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>
          ← Поиск
        </Link>
        <div style={{ marginTop: 14, fontSize: 22, fontWeight: 700 }}>Отслеживание заказа</div>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4, letterSpacing: '0.04em' }}>
          #{tracking_id}
        </div>
      </div>

      {loading && (
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Загрузка…</div>
      )}

      {error && (
        <div style={{
          width: '100%', maxWidth: 660,
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8, padding: '20px 24px',
          color: '#fca5a5', fontSize: 14,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <span>{error}</span>
          <Link to="/track" style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Попробовать другой номер →
          </Link>
        </div>
      )}

      {order && (
        <div style={{ width: '100%', maxWidth: 660, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Status card */}
          <div style={{ background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Статус заказа</span>
              <span style={{
                background: STATUS_COLOR[order.status] + '22',
                color: STATUS_COLOR[order.status],
                border: `1px solid ${STATUS_COLOR[order.status]}44`,
                borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 600,
              }}>
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
            </div>

            {order.status !== 'rejected' && (
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
                  {/* progress line */}
                  <div style={{
                    position: 'absolute', top: 12, left: 12, right: 12, height: 2,
                    background: 'rgba(255,255,255,0.08)', borderRadius: 2, zIndex: 0,
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 2, background: 'var(--gold)',
                      width: `${(stepIndex(order.status) / (STEPS.length - 1)) * 100}%`,
                      transition: 'width 0.4s',
                    }} />
                  </div>
                  {STEPS.map((s, i) => (
                    <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: stepIndex(order.status) >= i ? 'var(--gold)' : 'var(--navy-3, #1a2d45)',
                        border: stepIndex(order.status) >= i ? 'none' : '2px solid rgba(255,255,255,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700,
                        color: stepIndex(order.status) >= i ? '#000' : 'rgba(255,255,255,0.3)',
                      }}>
                        {stepIndex(order.status) > i ? '✓' : i + 1}
                      </div>
                      <span style={{
                        fontSize: 10, marginTop: 6, textAlign: 'center', lineHeight: 1.3, maxWidth: 70,
                        color: stepIndex(order.status) >= i ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
                      }}>
                        {STATUS_LABEL[s]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {order.status === 'rejected' && order.rejection_reason && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 6, color: '#fca5a5', fontSize: 13 }}>
                Причина отклонения: {order.rejection_reason}
              </div>
            )}
          </div>

          {/* Route */}
          <div style={{ background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '20px 24px' }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Маршрут</div>
            <RouteRow label="Откуда" value={order.origin_address} />
            <div style={{ margin: '8px 0 8px 20px', width: 2, height: 20, background: 'rgba(255,255,255,0.1)' }} />
            <RouteRow label="Куда" value={order.dest_address} />
            {order.pickup_date && (
              <div style={{ marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                Дата забора: <span style={{ color: 'white' }}>{order.pickup_date}{order.pickup_time ? ` в ${order.pickup_time}` : ''}</span>
              </div>
            )}
            {order.eta && (
              <div style={{ marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                ETA: <span style={{ color: 'white' }}>{order.eta}</span>
              </div>
            )}
          </div>

          {/* Cargo */}
          <div style={{ background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '20px 24px' }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Груз</div>
            <InfoGrid items={[
              { label: 'Тип груза', value: order.cargo_type ?? '—' },
              { label: 'Вес', value: order.weight ? `${order.weight} кг` : '—' },
              { label: 'Объём', value: order.volume ? `${order.volume} м³` : '—' },
              { label: 'Стоимость', value: order.price ? `${Number(order.price).toLocaleString('ru-RU')} ₽` : '—' },
            ]} />
            {order.cargo_description && (
              <div style={{ marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                Описание: <span style={{ color: 'rgba(255,255,255,0.8)' }}>{order.cargo_description}</span>
              </div>
            )}
          </div>

          {/* Personnel */}
          {(order.manager_name || order.driver_name || order.truck_plate || order.courier_name) && (
            <div style={{ background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '20px 24px' }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Исполнители</div>
              <InfoGrid items={[
                order.manager_name && { label: 'Менеджер', value: order.manager_name },
                order.driver_name  && { label: 'Водитель', value: order.driver_name },
                order.truck_plate  && { label: 'Транспорт', value: order.truck_plate },
                order.courier_name && { label: 'Курьер', value: order.courier_name },
              ].filter(Boolean)} />
            </div>
          )}

          <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>
            Заказ создан {order.created_at ? new Date(order.created_at).toLocaleDateString('ru-RU') : ''}
          </div>
        </div>
      )}
    </div>
  )
}

function RouteRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', marginTop: 5, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 14, color: 'white', lineHeight: 1.4 }}>{value || '—'}</div>
      </div>
    </div>
  )
}

function InfoGrid({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px 24px' }}>
      {items.map(({ label, value }) => (
        <div key={label}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>{label}</div>
          <div style={{ fontSize: 14, color: 'white' }}>{value}</div>
        </div>
      ))}
    </div>
  )
}
