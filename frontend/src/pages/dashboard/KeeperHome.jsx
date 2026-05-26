import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { Card, StatTile } from '../../components/ui'
import { Icons } from '../../components/Icons'

const STATUS_MAP = {
  at_warehouse:    { label: 'На складе',       color: '#14B8A6' },
  shipped:         { label: 'В пути',    color: '#7BB4FF' },
  ready_for_pickup:{ label: 'Ждёт курьера',    color: '#10b981' },
  awaiting_measurement: { label: 'Ждёт замера', color: '#8b5cf6' },
}

function LoadBar({ percent }) {
  const color = percent >= 90 ? '#ef4444' : percent >= 70 ? '#f79009' : '#10b981'
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 5 }}>
        <span>Загрузка склада</span>
        <span style={{ color, fontWeight: 700 }}>{percent}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(percent, 100)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, color: '#999' }
  return (
    <span style={{
      background: s.color + '22', color: s.color,
      border: `1px solid ${s.color}44`,
      borderRadius: 4, padding: '2px 8px',
      fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
      whiteSpace: 'nowrap',
    }}>{s.label}</span>
  )
}

export default function KeeperHome() {
  const { user } = useAuth()
  const [stats, setStats]   = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/keeper/stats'),
      api.get('/keeper/warehouse-orders'),
    ]).then(([statsRes, ordersRes]) => {
      setStats(statsRes.data)
      setOrders(ordersRes.data.slice(0, 8))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, color: 'rgba(255,255,255,0.4)' }}>Загрузка...</div>

  const wh = stats?.warehouse
  const counts = stats?.counts || {}

  return (
    <div style={{ padding: 36, maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Шапка */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'white', margin: 0 }}>Сводка</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          {wh ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(240,165,0,0.10)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 6, padding: '4px 12px', fontSize: 13, color: 'var(--gold)', fontWeight: 600 }}>
              <Icons.Boxes size={14} />
              {wh.name}
            </div>
          ) : (
            <div style={{ color: '#ef4444', fontSize: 13 }}>Склад не назначен</div>
          )}
          {wh && <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>{wh.address}</div>}
        </div>
      </div>

      {/* Статистика */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <StatTile
          icon={<Icons.Boxes size={20}/>}
          label="Грузов на складе"
          value={String(counts.at_warehouse ?? 0)}
          sub={`свободно ${wh ? `${wh.free_capacity?.toFixed(0)} т` : '—'}`}
          trend={counts.at_warehouse > 0 ? `+${counts.at_warehouse}` : '0'}
        />
        <StatTile
          icon={<Icons.Bell size={20}/>}
          label="Очередь приёмки"
          value={String(counts.awaiting_measurement ?? 0)}
          sub="ждут замера"
          trend={counts.awaiting_measurement > 0 ? `!${counts.awaiting_measurement}` : '0'}
        />
        <StatTile
          icon={<Icons.Check size={20}/>}
          label="Ожидают курьера"
          value={String(counts.ready_for_pickup ?? 0)}
          sub="ready_for_pickup"
          trend={counts.ready_for_pickup > 0 ? `+${counts.ready_for_pickup}` : '0'}
        />
        <StatTile
          icon={<Icons.Truck size={20}/>}
          label="Активных рейсов"
          value={String(counts.active_trips ?? 0)}
          sub={`в пути: ${counts.shipped_from_here ?? 0} заказов`}
          trend="—"
        />
      </div>

      {/* Загрузка склада */}
      {wh && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontWeight: 700, color: 'white', fontSize: 15 }}>Ёмкость склада</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
              {wh.current_load} / {wh.total_capacity} т
            </div>
          </div>
          <LoadBar percent={wh.load_percent ?? 0} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 14 }}>
            {[
              ['Занято', `${wh.current_load} т`, '#f79009'],
              ['Свободно', `${wh.free_capacity?.toFixed(1)} т`, '#10b981'],
              ['Загружено', `${wh.load_percent}%`, wh.load_percent >= 90 ? '#ef4444' : wh.load_percent >= 70 ? '#f79009' : '#10b981'],
            ].map(([label, val, color]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{label}</div>
                <div style={{ color, fontWeight: 700, fontSize: 18, marginTop: 2, fontFamily: 'var(--font-mono)' }}>{val}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Последние заказы склада */}
      <Card padding={0}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 1, margin: 0 }}>Заказы склада</h3>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>последние {orders.length}</div>
          </div>
          <a href="/dashboard/warehouse-orders" style={{ fontSize: 12, color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>
            Все заказы →
          </a>
        </div>

        {orders.length === 0 ? (
          <div style={{ padding: '40px 22px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
            Нет активных заказов на складе
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {orders.map((o, i) => (
              <div key={o.id} style={{
                padding: '12px 22px',
                display: 'grid',
                gridTemplateColumns: '130px 1fr auto auto',
                gap: 14,
                alignItems: 'center',
                borderBottom: i < orders.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>
                  {o.tracking_id}
                </span>
                <div style={{ fontSize: 13, minWidth: 0 }}>
                  <div style={{ color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {o.client_name || '—'}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 1 }}>
                    {o.weight} кг
                    {o.trip_dest && <span> · → {o.trip_dest}</span>}
                    {o.trip_from && o.status === 'ready_for_pickup' && <span> · из {o.trip_from}</span>}
                  </div>
                </div>
                <StatusBadge status={o.status} />
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(o.updated_at).toLocaleString('ru', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
