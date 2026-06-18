import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../../api/axios'
import { Icons } from '../../components/Icons'
import { Card, Btn, StatTile, DataTable, StatusPill, RolePill } from '../../components/ui'

const TWO_GIS_KEY = import.meta.env.VITE_2GIS_KEY || ''

const USER_STATUS_MAP = {
  active:  { bg: 'rgba(18,183,106,0.14)', fg: '#12B76A',    label: 'Активен' },
  blocked: { bg: 'rgba(240,68,56,0.14)',  fg: 'var(--red)', label: 'Заблокирован' },
}

const WH_COLOR = (pct) => pct >= 90 ? '#F04438' : pct >= 70 ? '#F79009' : '#12B76A'

function useMapGL() {
  const [ready, setReady] = useState(typeof window !== 'undefined' && !!window.mapgl)
  useEffect(() => {
    if (window.mapgl) { setReady(true); return }
    const existing = document.querySelector('script[data-2gis]')
    if (existing) { existing.addEventListener('load', () => setReady(true)); return }
    const s = document.createElement('script')
    s.src = 'https://mapgl.2gis.com/api/js/v1'
    s.setAttribute('data-2gis', '1')
    s.onload = () => setReady(true)
    document.head.appendChild(s)
  }, [])
  return ready
}

function statusDot(status) {
  const map = {
    ok:       { bg: '#12B76A', pulse: false },
    warn:     { bg: '#F79009', pulse: false },
    error:    { bg: 'var(--red)', pulse: false },
    critical: { bg: 'var(--red)', pulse: true },
    unknown:  { bg: 'rgba(255,255,255,0.3)', pulse: false },
  }
  return map[status] ?? map.unknown
}

function StatusDot({ status }) {
  const { bg, pulse } = statusDot(status)
  return (
    <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: bg }} />
      {pulse && (
        <div style={{
          position: 'absolute', inset: -3, borderRadius: '50%',
          border: `2px solid ${bg}`, opacity: 0.5,
          animation: 'pulse 1.4s ease-out infinite',
        }} />
      )}
    </div>
  )
}

function statusColor(status) {
  return { ok: '#12B76A', warn: '#F79009', error: 'var(--red)', critical: 'var(--red)', unknown: 'rgba(255,255,255,0.35)' }[status] ?? 'inherit'
}

export default function AdminHome() {
  const [users, setUsers]         = useState([])
  const [trucks, setTrucks]       = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [stats, setStats]         = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [health, setHealth]       = useState(null)
  const [healthLoading, setHealthLoading] = useState(true)
  const [log, setLog]             = useState([])
  const [logLoading, setLogLoading] = useState(true)

  const mapReady  = useMapGL()
  const whMapRef  = useRef(null)
  const whMapInst = useRef(null)
  const whMarkers = useRef([])

  useEffect(() => {
    api.get('/users').then(({ data }) => setUsers(Array.isArray(data) ? data : (data?.data ?? []))).catch(() => {})
    api.get('/trucks').then(({ data }) => setTrucks(Array.isArray(data) ? data : [])).catch(() => {})
    api.get('/warehouses').then(({ data }) => setWarehouses(Array.isArray(data) ? data : [])).catch(() => {})
    setStatsLoading(true)
    api.get('/admin/stats?period=14').then(({ data }) => setStats(data)).catch(() => setStats(null)).finally(() => setStatsLoading(false))
  }, [])

  const loadHealth = useCallback(() => {
    setHealthLoading(true)
    api.get('/admin/system-health').then(({ data }) => setHealth(data)).catch(() => setHealth(null)).finally(() => setHealthLoading(false))
  }, [])

  useEffect(() => {
    loadHealth()
    const id = setInterval(loadHealth, 60_000)
    return () => clearInterval(id)
  }, [loadHealth])

  const loadLog = useCallback(() => {
    api.get('/admin/activity-log?limit=20').then(({ data }) => setLog(Array.isArray(data) ? data : [])).catch(() => {}).finally(() => setLogLoading(false))
  }, [])

  useEffect(() => {
    loadLog()
    const id = setInterval(loadLog, 30_000)
    return () => clearInterval(id)
  }, [loadLog])

  // Map init
  useEffect(() => {
    if (!mapReady || !whMapRef.current || !TWO_GIS_KEY) return
    if (whMapInst.current) return
    const map = new window.mapgl.Map(whMapRef.current, { center: [95, 62], zoom: 3, key: TWO_GIS_KEY })
    whMapInst.current = map
    return () => { map.destroy(); whMapInst.current = null }
  }, [mapReady])

  // Map markers
  useEffect(() => {
    if (!whMapInst.current || !mapReady) return
    whMarkers.current.forEach(m => m.destroy?.())
    whMarkers.current = []
    warehouses.forEach(wh => {
      if (!wh.latitude || !wh.longitude) return
      const color = WH_COLOR(wh.load_percent)
      const el = document.createElement('div')
      el.style.cssText = `position:relative;width:40px;height:40px;border-radius:50%;background:${color};border:3px solid rgba(255,255,255,0.9);box-shadow:0 2px 10px rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;font-family:monospace;cursor:pointer;`
      el.textContent = `${Math.round(wh.load_percent)}%`
      const tip = document.createElement('div')
      tip.style.cssText = `position:absolute;bottom:46px;left:50%;transform:translateX(-50%);background:rgba(10,10,30,0.96);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:7px 11px;border-radius:7px;font-size:11px;white-space:nowrap;pointer-events:none;display:none;font-family:sans-serif;line-height:1.5;`
      tip.innerHTML = `<b style="color:#f0a500">${wh.name}</b><br>${wh.current_load ?? '?'} / ${wh.total_capacity ?? '?'} т · ${Math.round(wh.load_percent)}%`
      el.appendChild(tip)
      el.addEventListener('mouseenter', () => { tip.style.display = 'block' })
      el.addEventListener('mouseleave', () => { tip.style.display = 'none' })
      const marker = new window.mapgl.HtmlMarker(whMapInst.current, { coordinates: [wh.longitude, wh.latitude], html: el, anchor: [0.5, 0.5] })
      whMarkers.current.push(marker)
    })
  }, [warehouses, mapReady])

  const criticalServices = (health?.items ?? []).filter(i => i.status === 'critical' || i.status === 'error')

  return (
    <div style={{ padding: 36, display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Critical banner */}
      {criticalServices.length > 0 && (
        <div style={{ background: 'rgba(240,68,56,0.12)', border: '1px solid rgba(240,68,56,0.4)', borderRadius: 8, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icons.AlertTriangle size={18} style={{ color: 'var(--red)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 2 }}>
              Критические ошибки: {criticalServices.map(s => s.name).join(', ')}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>
              {criticalServices.map(s => s.note).join(' · ')}
            </div>
          </div>
        </div>
      )}

      {/* Stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <StatTile icon={<Icons.Users size={20}/>} label="Всего пользователей" value={String(users.length)} sub="зарегистрировано" trend="—" />
        <StatTile icon={<Icons.Truck size={20}/>} label="Парк машин" value={String(trucks.length)} sub={`${trucks.filter(t => t.status === 'available').length} доступно`} trend="—" />
        <StatTile icon={<Icons.Package size={20}/>} label="Всего заказов" value={statsLoading ? '...' : String(stats?.total_orders ?? 0)} sub="за последние 14 дней" trend="—" />
        <StatTile icon={<Icons.Check size={20}/>} label="Доставлено" value={statsLoading ? '...' : String(stats?.delivered_orders ?? 0)} sub={stats ? `из ${stats.total_orders ?? 0} заказов` : 'за 14 дней'} trend="—" />
      </div>

      {/* Users + System Health */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18 }}>

        {/* Users table */}
        <Card padding={0}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 1 }}>Пользователи</h3>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{users.length} всего</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn kind="ghost" size="sm" icon={<Icons.Filter size={14}/>}>Фильтр</Btn>
              <Btn size="sm" icon={<Icons.Plus size={14}/>}>Добавить</Btn>
            </div>
          </div>
          {users.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Нет пользователей</div>
          ) : (
            <DataTable
              columns={['Имя', 'Роль', 'Email', 'Статус', '']}
              rows={users.slice(0, 8).map(u => [
                <span style={{ fontWeight: 500 }}>{u.name}</span>,
                <RolePill role={u.role} />,
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{u.email}</span>,
                <StatusPill status={u.status || 'active'} map={USER_STATUS_MAP} />,
                <div style={{ display: 'flex', gap: 4 }}>
                  <button style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}><Icons.Edit size={14}/></button>
                  <button style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}><Icons.Trash size={14}/></button>
                </div>,
              ])}
            />
          )}
        </Card>

        {/* System Health */}
        <Card padding={26}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1 }}>Состояние системы</h3>
            <button onClick={loadHealth} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }} title="Обновить">
              <Icons.RefreshCw size={14} />
            </button>
          </div>
          {healthLoading && !health ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Проверка...</div>
          ) : !health ? (
            <div style={{ color: 'var(--red)', fontSize: 13 }}>Не удалось получить статус</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {health.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: 'var(--navy-3)', borderRadius: 6, border: `1px solid ${item.status === 'critical' ? 'rgba(240,68,56,0.35)' : item.status === 'error' ? 'rgba(240,68,56,0.2)' : 'rgba(255,255,255,0.04)'}` }}>
                  <StatusDot status={item.status} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.note}</div>
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: statusColor(item.status), fontWeight: 700, flexShrink: 0 }}>{item.value}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 14, fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>Обновляется каждые 60 с</div>
        </Card>
      </div>

      {/* Activity Log */}
      <Card padding={26}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1 }}>Журнал событий</h3>
          <button onClick={loadLog} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }} title="Обновить">
            <Icons.RefreshCw size={14} />
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginBottom: 18, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span>Живой · обновл. каждые 30 с</span>
          {logLoading && <span style={{ color: 'var(--gold)' }}>↻</span>}
        </div>
        {log.length === 0 && !logLoading ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Событий нет</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px 28px', maxHeight: 320, overflowY: 'auto' }}>
            {log.map(e => (
              <div key={e.id} style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 2, background: e.color, borderRadius: 1, flexShrink: 0, minHeight: 40 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {e.time ? new Date(e.time).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.desc}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: e.color, opacity: 0.7, display: 'flex', alignItems: 'center' }}>
                      {e.type === 'courier'   && <Icons.Truck     size={11} />}
                      {e.type === 'warehouse' && <Icons.Warehouse size={11} />}
                      {e.type === 'user'      && <Icons.User      size={11} />}
                    </span>
                    {e.actor}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Map */}
      <Card padding={0} style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 1 }}>Склады · Мониторинг</h3>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
              {warehouses.length} складов · {warehouses.filter(w => w.load_percent >= 90).length} критичных
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {[{ color: '#12B76A', label: '< 70%' }, { color: '#F79009', label: '70–90%' }, { color: '#F04438', label: '> 90%' }].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                {label}
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <div ref={whMapRef} style={{ height: 520, width: '100%' }} />
          <button
            onClick={() => whMapRef.current?.requestFullscreen?.()}
            title="Во весь экран"
            style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 1000, background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '6px 10px', fontSize: 12, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
          >
            <Icons.Bolt size={13} /> Во весь экран
          </button>
        </div>
      </Card>

      <style>{`
        @keyframes pulse {
          0%   { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
