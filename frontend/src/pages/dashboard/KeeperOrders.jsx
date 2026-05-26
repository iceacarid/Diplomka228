import { useState, useEffect, useCallback } from 'react'
import api from '../../api/axios'
import { Card } from '../../components/ui'

const STATUS_MAP = {
  at_warehouse:         { label: 'На складе',    color: '#14B8A6' },
  shipped:              { label: 'В пути', color: '#7BB4FF' },
  ready_for_pickup:     { label: 'Ждёт курьера', color: '#10b981' },
  awaiting_measurement: { label: 'Ждёт замера',  color: '#8b5cf6' },
}

const CARGO_LABELS = {
  general:   'Обычный',
  fragile:   'Хрупкий',
  perishable:'Скоропорт.',
  hazardous: 'Опасный',
  oversized: 'Негабарит',
}

const FILTERS = [
  { key: 'all',             label: 'Все' },
  { key: 'at_warehouse',    label: 'На складе' },
  { key: 'shipped',         label: 'В пути' },
  { key: 'ready_for_pickup',label: 'Ждёт курьера' },
]

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

export default function KeeperOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const [search, setSearch]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/keeper/warehouse-orders')
      setOrders(res.data)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = orders.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return o.tracking_id?.toLowerCase().includes(q)
          || o.client_name?.toLowerCase().includes(q)
          || o.origin_address?.toLowerCase().includes(q)
          || o.dest_address?.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div style={{ padding: 36, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'white', margin: 0 }}>Заказы склада</h1>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>
          Грузы принятые, отправленные и ожидающие курьера
        </div>
      </div>

      {/* Фильтры + поиск */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 4 }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '7px 14px',
                background: filter === f.key ? 'rgba(240,165,0,0.12)' : 'transparent',
                border: filter === f.key ? '1px solid rgba(240,165,0,0.3)' : '1px solid transparent',
                borderRadius: 6,
                color: filter === f.key ? 'var(--gold)' : 'rgba(255,255,255,0.5)',
                fontWeight: 600, fontSize: 12, cursor: 'pointer',
              }}
            >
              {f.label}
              {filter === f.key && filtered.length > 0 && (
                <span style={{ marginLeft: 6, background: 'rgba(240,165,0,0.2)', borderRadius: 3, padding: '1px 5px', fontSize: 10 }}>
                  {filtered.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Поиск по треку, клиенту, адресу..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, padding: '9px 14px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, color: 'white', fontSize: 13, outline: 'none',
          }}
        />
        <button onClick={load} style={{ padding: '9px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 12 }}>
          Обновить
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'rgba(255,255,255,0.4)', padding: 40, textAlign: 'center' }}>Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.3)', padding: '60px 0', textAlign: 'center', fontSize: 14 }}>
          Нет заказов
        </div>
      ) : (
        <Card padding={0}>
          {/* Заголовок таблицы */}
          <div style={{ padding: '10px 22px', display: 'grid', gridTemplateColumns: '130px 1fr 1fr 90px 80px 110px', gap: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {['Трек', 'Клиент', 'Маршрут / Рейс', 'Вес', 'Груз', 'Статус'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{h}</div>
            ))}
          </div>

          {filtered.map((o, i) => (
            <div key={o.id} style={{
              padding: '13px 22px',
              display: 'grid',
              gridTemplateColumns: '130px 1fr 1fr 90px 80px 110px',
              gap: 14,
              alignItems: 'center',
              borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>
                {o.tracking_id}
              </span>

              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {o.client_name || '—'}
                </div>
              </div>

              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', minWidth: 0 }}>
                {o.status === 'shipped' && o.trip_dest && (
                  <span>→ {o.trip_dest}</span>
                )}
                {o.status === 'ready_for_pickup' && o.trip_from && (
                  <span style={{ color: '#10b981' }}>← {o.trip_from}</span>
                )}
                {o.status === 'at_warehouse' && (
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>на складе</span>
                )}
                {o.trip_id && (
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }}>
                    Рейс #{o.trip_id}
                  </div>
                )}
              </div>

              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)' }}>
                {o.weight} кг
              </div>

              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                {CARGO_LABELS[o.cargo_type] || o.cargo_type}
              </div>

              <StatusBadge status={o.status} />
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
