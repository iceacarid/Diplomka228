import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { Icons } from '../../components/Icons'

const ACTION_LABELS = {
  shift_open:             'Открыл смену',
  shift_close:            'Закрыл смену',
  shift_open_by_manager:  'Смена открыта менеджером',
  shift_close_by_manager: 'Смена закрыта менеджером',
  order_taken:            'Взял заказ',
  order_picked_up:        'Груз забран',
  order_at_warehouse:     'Груз передан на склад',
  reschedule_requested:   'Запросил перенос',
}

const ACTION_COLORS = {
  shift_open:             '#12B76A',
  shift_close:            '#F04438',
  shift_open_by_manager:  'var(--gold)',
  shift_close_by_manager: 'var(--gold)',
  order_taken:            'var(--gold)',
  order_picked_up:        '#7BB4FF',
  order_at_warehouse:     '#A78BFA',
  reschedule_requested:   '#F59E0B',
}

function groupByDate(actions) {
  const groups = {}
  for (const a of actions) {
    const d = new Date(a.created_at)
    const key = d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(a)
  }
  return Object.entries(groups)
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function AdminCouriers() {
  const [couriers, setCouriers]   = useState([])
  const [selected, setSelected]   = useState(null)
  const [detail,   setDetail]     = useState(null)
  const [loading,  setLoading]    = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [search,     setSearch]     = useState('')
  const [filterShift, setFilterShift] = useState('all')
  const [closingShift, setClosingShift] = useState(false)

  useEffect(() => {
    api.get('/admin/couriers')
      .then(r => setCouriers(r.data))
      .finally(() => setLoading(false))
  }, [])

  const q = search.toLowerCase()
  const visibleCouriers = couriers.filter(c => {
    if (q && !`${c.name} ${c.email}`.toLowerCase().includes(q)) return false
    if (filterShift === 'active' && !c.has_open_shift) return false
    if (filterShift === 'inactive' && c.has_open_shift) return false
    return true
  })

  function selectCourier(c) {
    setSelected(c)
    setDetail(null)
    setDetailLoading(true)
    api.get(`/admin/couriers/${c.id}/history`)
      .then(r => setDetail(r.data))
      .finally(() => setDetailLoading(false))
  }

  async function handleCloseShift() {
    if (!selected || closingShift) return
    setClosingShift(true)
    try {
      await api.post(`/admin/couriers/${selected.id}/close-shift`)
      const r = await api.get(`/admin/couriers/${selected.id}/history`)
      setDetail(r.data)
      setCouriers(prev => prev.map(c => c.id === selected.id ? { ...c, has_open_shift: false } : c))
    } catch (e) {
      alert(e?.response?.data?.error || 'Ошибка закрытия смены')
    }
    setClosingShift(false)
  }

  async function handleOpenShift() {
    if (!selected || closingShift) return
    setClosingShift(true)
    try {
      await api.post(`/admin/couriers/${selected.id}/open-shift`)
      const r = await api.get(`/admin/couriers/${selected.id}/history`)
      setDetail(r.data)
      setCouriers(prev => prev.map(c => c.id === selected.id ? { ...c, has_open_shift: true } : c))
    } catch (e) {
      alert(e?.response?.data?.error || 'Ошибка открытия смены')
    }
    setClosingShift(false)
  }

  const grouped = detail ? groupByDate(detail.actions) : []

  return (
    <div style={{ display: 'flex', gap: 20, padding: 24, minHeight: '100%', boxSizing: 'border-box', alignItems: 'flex-start' }}>
      {/* Courier list */}
      <div style={{
        width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8,
        position: 'sticky', top: 24,
        maxHeight: 'calc(100vh - 48px)', overflowY: 'auto',
      }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--gold)', marginBottom: 10 }}>
          Курьеры
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '8px 10px', marginBottom: 8 }}>
          <Icons.Search size={13} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по имени, email..."
            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: 12, fontFamily: 'var(--font-body)', flex: 1, minWidth: 0 }}
          />
          {search && <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>}
        </div>

        {/* Shift filter */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
          {[['all','Все'], ['active','На смене'], ['inactive','Не в смене']].map(([v, l]) => (
            <button key={v} onClick={() => setFilterShift(v)} style={{ flex: 1, padding: '5px 4px', borderRadius: 6, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer', border: filterShift === v ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)', background: filterShift === v ? 'rgba(240,165,0,0.1)' : 'transparent', color: filterShift === v ? 'var(--gold)' : 'rgba(255,255,255,0.4)' }}>{l}</button>
          ))}
        </div>

        {search && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
            {visibleCouriers.length} из {couriers.length}
          </div>
        )}

        {loading && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Загрузка...</div>}
        {!loading && visibleCouriers.length === 0 && (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{couriers.length === 0 ? 'Нет курьеров' : 'Ничего не найдено'}</div>
        )}
        {visibleCouriers.map(c => (
          <div
            key={c.id}
            onClick={() => selectCourier(c)}
            style={{
              background: selected?.id === c.id ? 'rgba(212,175,55,0.13)' : 'rgba(255,255,255,0.04)',
              border: selected?.id === c.id ? '1.5px solid var(--gold)' : '1.5px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.18s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'rgba(212,175,55,0.18)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'var(--gold)',
                flexShrink: 0,
              }}>
                {c.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.name}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                  {c.email}
                </div>
              </div>
              <div style={{
                width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
                background: c.has_open_shift ? '#12B76A' : 'rgba(255,255,255,0.25)',
                boxShadow: c.has_open_shift ? '0 0 6px #12B76A' : 'none',
              }} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Pill label={`${c.active_orders} активных`} color="var(--gold)" />
              <Pill label={`${c.total_orders} всего`} color="rgba(255,255,255,0.45)" />
              {c.has_open_shift && <Pill label="Смена открыта" color="#12B76A" />}
            </div>
            {c.last_action && (
              <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                {c.last_action} · {c.last_action_at ? new Date(c.last_action_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detail panel */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!selected && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 16, opacity: 0.5 }}>
            <EmptyState />
          </div>
        )}

        {selected && detailLoading && (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, paddingTop: 40, textAlign: 'center' }}>
            Загрузка истории...
          </div>
        )}

        {selected && detail && !detailLoading && (
          <>
            {/* Courier header */}
            <div style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, padding: '18px 22px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'rgba(212,175,55,0.18)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'var(--gold)',
                flexShrink: 0,
              }}>
                {detail.courier.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>{detail.courier.name}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                  {detail.courier.email} · {detail.courier.phone || 'нет телефона'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, flexShrink: 0, alignItems: 'center' }}>
                <StatBox value={detail.courier.total_orders} label="Всего" />
                <StatBox value={detail.courier.active_orders} label="Активных" color="var(--gold)" />
                {detail.courier.has_open_shift ? (
                  <button
                    onClick={handleCloseShift}
                    disabled={closingShift}
                    style={{
                      padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      fontFamily: 'var(--font-body)', cursor: closingShift ? 'default' : 'pointer',
                      background: 'rgba(240,68,56,0.12)', border: '1px solid rgba(240,68,56,0.35)',
                      color: closingShift ? 'rgba(255,255,255,0.3)' : '#F04438',
                    }}
                  >
                    {closingShift ? '...' : 'Закрыть смену'}
                  </button>
                ) : (
                  <button
                    onClick={handleOpenShift}
                    disabled={closingShift}
                    style={{
                      padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      fontFamily: 'var(--font-body)', cursor: closingShift ? 'default' : 'pointer',
                      background: 'rgba(18,183,106,0.12)', border: '1px solid rgba(18,183,106,0.35)',
                      color: closingShift ? 'rgba(255,255,255,0.3)' : '#12B76A',
                    }}
                  >
                    {closingShift ? '...' : 'Открыть смену'}
                  </button>
                )}
              </div>
            </div>

            {/* Action history */}
            {grouped.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 14, paddingTop: 30 }}>
                Действий пока нет
              </div>
            ) : (
              grouped.map(([date, actions]) => (
                <div key={date} style={{ marginBottom: 24 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
                  }}>
                    {date}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {actions.map(a => (
                      <div key={a.id} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                        padding: '10px 14px',
                        borderLeft: `3px solid ${ACTION_COLORS[a.action_type] ?? 'rgba(255,255,255,0.2)'}`,
                      }}>
                        <div style={{
                          fontSize: 12, color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums',
                          flexShrink: 0, minWidth: 60,
                        }}>
                          {formatTime(a.created_at)}
                        </div>
                        <div style={{ flex: 1, fontWeight: 600, fontSize: 14, color: '#fff' }}>
                          {ACTION_LABELS[a.action_type] ?? a.action_type}
                        </div>
                        {a.tracking_id && (
                          <div style={{
                            fontSize: 12, color: 'var(--gold)', background: 'rgba(212,175,55,0.12)',
                            borderRadius: 6, padding: '2px 8px', fontWeight: 600, flexShrink: 0,
                          }}>
                            {a.tracking_id}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Pill({ label, color }) {
  return (
    <div style={{
      fontSize: 11, color, border: `1px solid ${color}`, borderRadius: 6,
      padding: '2px 7px', opacity: 0.85,
    }}>
      {label}
    </div>
  )
}

function StatBox({ value, label, color = 'rgba(255,255,255,0.7)' }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function EmptyState() {
  return (
    <>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="30" stroke="var(--gold)" strokeWidth="2" strokeDasharray="4 3" />
        <circle cx="32" cy="24" r="8" stroke="var(--gold)" strokeWidth="2" />
        <path d="M16 48c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>Выберите курьера</div>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>История действий появится здесь</div>
    </>
  )
}
