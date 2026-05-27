import { useState, useEffect, useCallback } from 'react'
import api from '../../api/axios'
import { Card } from '../../components/ui'

const ACTION_MAP = {
  load:           { label: 'Загрузка',        color: '#12B76A', bg: 'rgba(18,183,106,0.12)' },
  unload:         { label: 'Разгрузка',       color: '#F04438', bg: 'rgba(240,68,56,0.12)' },
  courier_pickup: { label: 'Выдача курьеру',  color: '#63B3ED', bg: 'rgba(99,179,237,0.12)' },
  manual:         { label: 'Ручное',          color: '#F0A500', bg: 'rgba(240,165,0,0.10)' },
}

const FILTERS = [
  { value: 'all',            label: 'Все' },
  { value: 'load',           label: 'Загрузка' },
  { value: 'unload',         label: 'Разгрузка' },
  { value: 'courier_pickup', label: 'Выдача курьеру' },
  { value: 'manual',         label: 'Ручное' },
]

export default function KeeperHistory() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/keeper/history')
      setData(res.data)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const logs = (data?.logs ?? []).filter(l => filter === 'all' || l.action === filter)

  return (
    <div style={{ padding: 36, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'white', margin: 0 }}>
          История склада
          {data?.warehouse && (
            <span style={{ color: 'var(--gold)', fontSize: 18, marginLeft: 12, fontWeight: 400 }}>
              · {data.warehouse.name}
            </span>
          )}
        </h1>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>
          Все операции с грузами вашего склада
        </div>
      </div>

      {/* Фильтры */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 4 }}>
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: '7px 14px',
                background: filter === f.value ? 'rgba(240,165,0,0.12)' : 'transparent',
                border: filter === f.value ? '1px solid rgba(240,165,0,0.3)' : '1px solid transparent',
                borderRadius: 6,
                color: filter === f.value ? 'var(--gold)' : 'rgba(255,255,255,0.5)',
                fontWeight: 600, fontSize: 12, cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={load}
          style={{ padding: '7px 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 12 }}
        >
          Обновить
        </button>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginLeft: 4, fontFamily: 'var(--font-mono)' }}>
          {logs.length} записей
        </span>
      </div>

      {loading ? (
        <div style={{ color: 'rgba(255,255,255,0.4)', padding: '60px 0', textAlign: 'center' }}>Загрузка...</div>
      ) : logs.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.3)', padding: '60px 0', textAlign: 'center', fontSize: 14 }}>
          Нет записей
        </div>
      ) : (
        <Card padding={0}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--font-body)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Дата', 'Операция', 'Изменение', 'До → После', 'Заказ', 'Фура / Исполнитель', 'Примечание'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => {
                  const act = ACTION_MAP[l.action] || { label: l.action, color: '#999', bg: 'rgba(153,153,153,0.1)' }
                  const positive = l.weight_change >= 0
                  return (
                    <tr key={l.id} style={{ borderBottom: i < logs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                        {new Date(l.created_at).toLocaleString('ru', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: act.bg, color: act.color }}>
                          {act.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: positive ? '#12B76A' : '#F04438', whiteSpace: 'nowrap' }}>
                        {positive ? '+' : ''}{l.weight_change} т
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
                        {l.load_before} → {l.load_after}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--gold)' }}>
                        {l.order?.tracking_id || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.65)' }}>
                        {l.action === 'courier_pickup' && l.courier
                          ? <span>Курьер: <span style={{ color: '#63B3ED' }}>{l.courier.name}</span></span>
                          : l.driver?.name
                            ? <span>{l.driver.name}{l.truck ? <span style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', fontSize: 11 }}> · {l.truck.plate_number}</span> : ''}</span>
                            : l.truck
                              ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{l.truck.plate_number}</span>
                              : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.4)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {l.note || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
