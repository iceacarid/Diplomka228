import { useState, useEffect, useRef } from 'react'
import api from '../../api/axios'
import { Icons } from '../../components/Icons'
import { Card, Btn, StatTile, StatusPill } from '../../components/ui'

const ORDER_STATUS_MAP = {
  draft:            { bg: 'rgba(255,255,255,0.06)', fg: 'rgba(255,255,255,0.45)', label: 'Черновик' },
  pending:          { bg: 'rgba(240,165,0,0.14)',   fg: 'var(--gold)',            label: 'Новая' },
  in_progress:      { bg: 'rgba(247,144,9,0.14)',   fg: '#F79009',               label: 'В работе' },
  confirmed:        { bg: 'rgba(18,183,106,0.12)',  fg: '#12B76A',               label: 'Подтверждено' },
  courier_assigned: { bg: 'rgba(139,92,246,0.14)',  fg: '#8B5CF6',               label: 'Курьер едет' },
  picked_up:        { bg: 'rgba(99,102,241,0.14)',  fg: '#6366F1',               label: 'Курьер в дороге' },
  at_warehouse:     { bg: 'rgba(20,184,166,0.14)',  fg: '#14B8A6',               label: 'На складе' },
  shipped:          { bg: 'rgba(123,180,255,0.14)', fg: '#7BB4FF',               label: 'В пути' },
  delivered:        { bg: 'rgba(18,183,106,0.14)',  fg: '#12B76A',               label: 'Доставлено' },
  rejected:         { bg: 'rgba(240,68,56,0.14)',   fg: 'var(--red)',            label: 'Отменено' },
}

function PriorityDot({ high }) {
  return (
    <span style={{ width: 8, height: 8, borderRadius: '50%', background: high ? 'var(--red)' : 'var(--gold)', display: 'inline-block', flexShrink: 0 }}/>
  )
}

const QUEUE_STATUSES = ['pending', 'in_progress', 'confirmed', 'courier_assigned', 'picked_up', 'at_warehouse', 'shipped']

const SORT_OPTIONS = [
  { value: 'priority', label: 'По приоритету' },
  { value: 'newest',   label: 'Сначала новые' },
  { value: 'oldest',   label: 'Сначала старые' },
  { value: 'weight',   label: 'По весу' },
]

export default function ManagerHome() {
  const [orders,  setOrders]  = useState([])
  const [drivers, setDrivers] = useState([])
  const [trucks,  setTrucks]  = useState([])

  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy,       setSortBy]       = useState('priority')
  const [filterOpen,   setFilterOpen]   = useState(false)
  const filterRef = useRef(null)

  useEffect(() => {
    api.get('/orders').then(({ data }) => setOrders(Array.isArray(data) ? data : [])).catch(() => {})
    api.get('/drivers').then(({ data }) => setDrivers(Array.isArray(data) ? data : [])).catch(() => {})
    api.get('/trucks').then(({ data }) => setTrucks(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const newOrders  = orders.filter(o => o.status === 'pending')
  const inWork     = orders.filter(o => QUEUE_STATUSES.filter(s => s !== 'pending').includes(o.status))
  const freeTrucks = trucks.filter(t => t.status === 'available')
  const revenue    = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (parseFloat(o.price) || 0), 0)

  const allQueue = orders.filter(o => QUEUE_STATUSES.includes(o.status))

  const filtered = filterStatus === 'all'
    ? allQueue
    : allQueue.filter(o => o.status === filterStatus)

  const queueAll = [...filtered].sort((a, b) => {
    if (sortBy === 'priority') {
      if (a.status === 'pending' && b.status !== 'pending') return -1
      if (b.status === 'pending' && a.status !== 'pending') return 1
      return new Date(b.created_at) - new Date(a.created_at)
    }
    if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at)
    if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at)
    if (sortBy === 'weight') return (b.weight || 0) - (a.weight || 0)
    return 0
  })
  const queue = queueAll.slice(0, 7)

  const fmtRevenue = n => n >= 1000000 ? `₽ ${(n / 1000000).toFixed(1)}M` : `₽ ${Math.round(n / 1000)}k`

  return (
    <div style={{ padding: 36, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <StatTile icon={<Icons.Bell size={20}/>} label="Новых заявок" value={String(newOrders.length)} sub={`за последний час: ${Math.min(newOrders.length, 3)}`} trend={`+${newOrders.length}`} />
        <StatTile icon={<Icons.Truck size={20}/>} label="В работе" value={String(inWork.length)} sub={`${inWork.filter(o => o.status === 'shipped').length} в пути · ${inWork.filter(o => o.status === 'in_progress').length} загрузка`} trend={`+${inWork.length}`} />
        <StatTile icon={<Icons.Users size={20}/>} label="Свободных машин" value={String(freeTrucks.length)} sub={`из ${trucks.length} активных`} trend="—" />
        <StatTile icon={<Icons.TrendingUp size={20}/>} label="Выручка за день" value={fmtRevenue(revenue)} sub="по закрытым заявкам" trend="—" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18 }}>
        <Card padding={0}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 1 }}>Очередь заявок</h3>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                {queue.length} заявок · {SORT_OPTIONS.find(s => s.value === sortBy)?.label}
                {filterStatus !== 'all' && <span style={{ color: 'var(--gold)' }}> · фильтр активен</span>}
              </div>
            </div>

            {/* Filter dropdown */}
            <div ref={filterRef} style={{ position: 'relative' }}>
              <Btn
                kind={filterOpen || filterStatus !== 'all' ? 'primary' : 'ghost'}
                icon={<Icons.Filter size={14}/>}
                size="sm"
                onClick={() => setFilterOpen(v => !v)}
              >
                Фильтр
              </Btn>

              {filterOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50, background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 16, width: 240, boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>

                  {/* Sort */}
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 8, fontFamily: 'var(--font-body)' }}>
                    Сортировка
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 14 }}>
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setSortBy(opt.value)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, background: sortBy === opt.value ? 'rgba(240,165,0,0.1)' : 'transparent', border: sortBy === opt.value ? '1px solid rgba(240,165,0,0.3)' : '1px solid transparent', color: sortBy === opt.value ? 'var(--gold)' : 'rgba(255,255,255,0.65)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', textAlign: 'left' }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: sortBy === opt.value ? 'var(--gold)' : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Status filter */}
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 8, fontFamily: 'var(--font-body)' }}>
                    Статус
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[{ value: 'all', label: 'Все' }, ...QUEUE_STATUSES.map(s => ({ value: s, label: ORDER_STATUS_MAP[s]?.label || s }))].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setFilterStatus(opt.value)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, background: filterStatus === opt.value ? 'rgba(240,165,0,0.1)' : 'transparent', border: filterStatus === opt.value ? '1px solid rgba(240,165,0,0.3)' : '1px solid transparent', color: filterStatus === opt.value ? 'var(--gold)' : 'rgba(255,255,255,0.65)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', textAlign: 'left' }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: filterStatus === opt.value ? 'var(--gold)' : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {(filterStatus !== 'all' || sortBy !== 'priority') && (
                    <button
                      onClick={() => { setFilterStatus('all'); setSortBy('priority') }}
                      style={{ marginTop: 12, width: '100%', padding: '7px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-body)' }}
                    >
                      Сбросить
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {queue.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                Очередь пуста
              </div>
            ) : queue.map((o, i) => (
              <div key={o.id} style={{ padding: '14px 24px', display: 'grid', gridTemplateColumns: '8px 110px 1fr auto auto', gap: 14, alignItems: 'center', borderBottom: i < queue.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <PriorityDot high={o.status === 'pending'} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>
                  {o.tracking_id}
                </span>
                <div style={{ fontSize: 13, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {o.origin_address} <span style={{ color: 'rgba(255,255,255,0.3)' }}>→</span> {o.dest_address}
                  </div>
                </div>
                <StatusPill status={o.status} map={ORDER_STATUS_MAP} />
                {o.status === 'pending' && (
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                    Ожидает подтверждения
                  </span>
                )}
              </div>
            ))}
          </div>
          {queueAll.length > 7 && (
            <div style={{ padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
              +{queueAll.length - 7} заявок не показано · откройте раздел «Заказы»
            </div>
          )}
        </Card>

        <Card padding={0}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 1 }}>Водители</h3>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>В смене сегодня</div>
            </div>
            <Btn kind="ghost" size="sm">Все</Btn>
          </div>
          <div>
            {drivers.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                Нет водителей
              </div>
            ) : drivers.slice(0, 6).map((d, i) => (
              <div key={d.id} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < Math.min(drivers.length, 6) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', position: 'relative', flexShrink: 0 }}>
                  <Icons.User size={18}/>
                  <span style={{ position: 'absolute', bottom: -1, right: -1, width: 11, height: 11, borderRadius: '50%', background: d.availability_status === 'free' ? '#12B76A' : '#F79009', border: '2px solid var(--navy-2)' }}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {d.license_number || '—'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, color: d.availability_status === 'free' ? '#12B76A' : 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
                    {d.availability_status === 'free' ? 'Свободен' : 'В рейсе'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card padding={0} style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 1 }}>Карта операций</h3>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
              {inWork.length} машин в пути · 1 200+ городов
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn kind="ghost" size="sm">Все</Btn>
            <Btn kind="ghost" size="sm">В пути</Btn>
            <Btn size="sm" icon={<Icons.Pin size={14}/>}>Открыть</Btn>
          </div>
        </div>
        <div style={{ height: 280, position: 'relative', background: 'var(--navy)', backgroundImage: ['linear-gradient(rgba(240,165,0,0.05) 1px, transparent 1px)', 'linear-gradient(90deg, rgba(240,165,0,0.05) 1px, transparent 1px)'].join(', '), backgroundSize: '40px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {[
            { l: '20%', t: '50%', label: 'МСК · 12' },
            { l: '12%', t: '38%', label: 'СПБ · 5' },
            { l: '34%', t: '52%', label: 'НН · 3' },
            { l: '46%', t: '58%', label: 'КЗН · 4' },
            { l: '24%', t: '70%', label: 'РСТ · 6' },
            { l: '60%', t: '50%', label: 'ЕКБ · 8' },
            { l: '78%', t: '58%', label: 'НВС · 2' },
          ].map((p, i) => (
            <div key={i} style={{ position: 'absolute', left: p.l, top: p.t, transform: 'translate(-50%, -50%)' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--gold)', boxShadow: '0 0 0 6px rgba(240,165,0,0.18)' }}/>
              <div style={{ position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--gold)', background: 'var(--navy-2)', padding: '3px 7px', borderRadius: 3, whiteSpace: 'nowrap', border: '1px solid rgba(240,165,0,0.2)' }}>
                {p.label}
              </div>
            </div>
          ))}
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, opacity: 0.5 }}>
            <Icons.Map size={42} style={{ color: 'rgba(240,165,0,0.5)' }}/>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)', marginTop: 8, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              Демо · Карта операций
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
