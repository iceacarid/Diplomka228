/* eslint-disable no-empty */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { Icons } from '../../components/Icons'
import { Card, Btn, Field, StatTile, DataTable, StatusPill } from '../../components/ui'
import AddressField from '../../components/AddressField'

const ORDER_STATUS_MAP = {
  draft:            { bg: 'rgba(255,255,255,0.06)', fg: 'rgba(255,255,255,0.45)', label: 'Черновик' },
  pending:          { bg: 'rgba(240,165,0,0.14)',   fg: 'var(--gold)',            label: 'Новая' },
  in_progress:      { bg: 'rgba(247,144,9,0.14)',   fg: '#F79009',               label: 'В работе' },
  confirmed:        { bg: 'rgba(18,183,106,0.12)',  fg: '#12B76A',               label: 'Подтверждено' },
  courier_assigned: { bg: 'rgba(139,92,246,0.14)',  fg: '#8B5CF6',               label: 'Курьер назначен' },
  picked_up:        { bg: 'rgba(99,102,241,0.14)',  fg: '#6366F1',               label: 'Курьер в дороге' },
  at_warehouse:     { bg: 'rgba(20,184,166,0.14)',  fg: '#14B8A6',               label: 'Груз на складе' },
  shipped:          { bg: 'rgba(123,180,255,0.14)', fg: '#7BB4FF',               label: 'В пути' },
  delivered:        { bg: 'rgba(18,183,106,0.14)',  fg: '#12B76A',               label: 'Доставлено' },
  rejected:         { bg: 'rgba(240,68,56,0.14)',   fg: 'var(--red)',            label: 'Отменено' },
}

function debounce(fn, delay) {
  let t
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay) }
}

function PriceCalc() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ origin: '', destination: '', weight: '', volume: '' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = k => v => setForm(f => ({ ...f, [k]: typeof v === 'string' ? v : v.target.value }))

  const doCalc = useCallback(
    debounce(async (origin, destination, weight, volume) => {
      if (!origin || !destination || !weight) return
      setLoading(true)
      setResult(null)
      try {
        const { data } = await api.post('/calculator', {
          origin, destination,
          weight: parseFloat(weight),
          volume: parseFloat(volume) || 0,
        })
        setResult(data)
      } catch {}
      setLoading(false)
    }, 600),
    []
  )

  useEffect(() => {
    doCalc(form.origin, form.destination, form.weight, form.volume)
  }, [form.origin, form.destination, form.weight, form.volume])

  return (
    <Card padding={26}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 1, marginBottom: 4 }}>
        Быстрый <span style={{ color: 'var(--gold)' }}>расчёт</span>
      </h3>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 20, fontWeight: 300 }}>
        Узнайте стоимость перевозки
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <AddressField label="Откуда" placeholder="Москва, Каширское ш. 60" value={form.origin} onChange={set('origin')} />
        <AddressField label="Куда" placeholder="Казань, Кремлёвская 12" value={form.destination} onChange={set('destination')} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Вес, кг" type="number" placeholder="5000" value={form.weight} onChange={set('weight')} />
          <Field label="Объём, м³" type="number" placeholder="20" value={form.volume} onChange={set('volume')} />
        </div>
      </div>

      {result && (
        <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            {[
              ['Стоимость', `₽ ${Number(result.price).toLocaleString('ru')}`, 'var(--gold)'],
              ['Расстояние', `${result.distance_km} км`, 'white'],
              ['Срок', `${result.estimated_delivery_days} дн.`, 'white'],
              ['Тариф', result.tariff_name, 'rgba(255,255,255,0.55)'],
            ].map(([l, v, c]) => (
              <div key={l}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>{l}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: c, letterSpacing: 0.4 }}>{v}</div>
              </div>
            ))}
          </div>
          <Btn icon={<Icons.Plus size={14} />} style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/dashboard/new-order')}>
            Оформить заявку
          </Btn>
        </div>
      )}
    </Card>
  )
}

export default function ClientHome() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])

  useEffect(() => {
    api.get('/orders').then(({ data }) => setOrders(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  const active    = orders.filter(o => ['pending', 'in_progress', 'shipped'].includes(o.status))
  const delivered = orders.filter(o => o.status === 'delivered')
  const totalSpent = delivered.reduce((s, o) => s + (parseFloat(o.price) || 0), 0)
  const transit   = orders.find(o => o.status === 'shipped')

  const fmtMoney = n => n >= 1000000 ? `₽ ${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `₽ ${Math.round(n / 1000)}k` : `₽ ${n}`

  return (
    <div style={{ padding: 36, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <StatTile icon={<Icons.Package size={20}/>} label="Активных заявок" value={String(active.length)} sub={`${active.filter(o => o.status === 'shipped').length} в пути · ${active.filter(o => o.status === 'pending').length} новая`} trend={`+${active.length}`} />
        <StatTile icon={<Icons.Check size={20}/>} label="Доставлено в этом месяце" value={String(delivered.length)} sub="из них все в срок" trend={`+${delivered.length}`} />
        <StatTile icon={<Icons.Wallet size={20}/>} label="Расходы за месяц" value={fmtMoney(totalSpent)} sub="по доставленным" trend="—" />
        <StatTile icon={<Icons.Map size={20}/>} label="Текущий пробег" value={`${active.length * 700} км`} sub={`по ${active.length} активным`} trend="—" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
        <Card padding={28}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 }}>Активная доставка</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 1 }}>
                {transit ? `${transit.tracking_id} · ${transit.origin} → ${transit.destination}` : 'Нет активных доставок'}
              </h3>
            </div>
            {transit && <StatusPill status="shipped" map={ORDER_STATUS_MAP} />}
          </div>

          {transit ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                  {(transit.origin || '').slice(0, 3).toUpperCase()}
                </div>
                <div style={{ flex: 1, position: 'relative', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: 4, width: '62%', background: 'var(--gold)', borderRadius: 2 }}/>
                  <div style={{ position: 'absolute', left: '62%', top: '50%', transform: 'translate(-50%, -50%)', width: 28, height: 28, borderRadius: '50%', background: 'var(--gold)', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icons.Truck size={14}/>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                  {(transit.destination || '').slice(0, 3).toUpperCase()}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, padding: '18px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {[
                  ['Откуда', transit.origin, 'var(--gold)'],
                  ['Куда', transit.destination, 'white'],
                  ['Вес', `${(transit.weight || 0).toLocaleString('ru')} кг`, 'white'],
                  ['Сумма', transit.price ? `₽ ${Number(transit.price).toLocaleString('ru')}` : '—', 'white'],
                ].map(([l, v, c], i) => (
                  <div key={i}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{l}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: c, letterSpacing: 0.5 }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
                  <Icons.User size={20}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Водитель назначен</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                    {transit.truck_info || 'Транспорт назначается'}
                  </div>
                </div>
                <Btn kind="ghost" icon={<Icons.Phone size={14}/>} size="sm">Связаться</Btn>
                <Btn icon={<Icons.Map size={14}/>} size="sm">На карте</Btn>
              </div>
            </>
          ) : (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              Нет активных доставок в пути
            </div>
          )}
        </Card>

        <PriceCalc />
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 26, letterSpacing: 1 }}>Последние заявки</h3>
          <Btn kind="ghost" icon={<Icons.Arrow size={14}/>} size="sm" onClick={() => navigate('/dashboard/my-orders')}>
            Все заявки
          </Btn>
        </div>
        <Card padding={0}>
          {orders.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              Заявок пока нет
            </div>
          ) : (
            <DataTable
              columns={['№ Заявки', 'Маршрут', 'Дата', 'Вес', 'Сумма', 'Статус']}
              rows={orders.slice(0, 5).map(o => [
                <span key="id" style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontWeight: 600 }}>{o.tracking_id}</span>,
                <span key="route" style={{ fontWeight: 500 }}>{o.origin} <span style={{ color: 'rgba(255,255,255,0.3)' }}>→</span> {o.destination}</span>,
                <span key="date" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.7)' }}>
                  {o.created_at ? new Date(o.created_at).toLocaleDateString('ru') : '—'}
                </span>,
                <span key="weight" style={{ fontFamily: 'var(--font-mono)' }}>{(o.weight || 0).toLocaleString('ru')} кг</span>,
                <span key="price" style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--gold)' }}>
                  {o.price ? `₽ ${Number(o.price).toLocaleString('ru')}` : '—'}
                </span>,
                <StatusPill key="status" status={o.status} map={ORDER_STATUS_MAP} />,
              ])}
            />
          )}
        </Card>
      </div>
    </div>
  )
}
