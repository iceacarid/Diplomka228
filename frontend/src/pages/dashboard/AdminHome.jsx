import { useState, useEffect, useCallback } from 'react'
import api from '../../api/axios'
import { Icons } from '../../components/Icons'
import { Card, Btn, StatTile, DataTable, StatusPill, RolePill } from '../../components/ui'

const USER_STATUS_MAP = {
  active:  { bg: 'rgba(18,183,106,0.14)', fg: '#12B76A',    label: 'Активен' },
  blocked: { bg: 'rgba(240,68,56,0.14)',  fg: 'var(--red)', label: 'Заблокирован' },
}

const PERIOD_OPTIONS = [
  { label: '7Д',  value: 7 },
  { label: '14Д', value: 14 },
  { label: '30Д', value: 30 },
  { label: '90Д', value: 90 },
]

function fmtRevenue(n) {
  if (n >= 1_000_000) return `₽ ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `₽ ${Math.round(n / 1_000)}k`
  return `₽ ${Math.round(n)}`
}

function fmtGrowth(g) {
  if (g === null || g === undefined) return null
  return g >= 0 ? `+${g}%` : `${g}%`
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

function statusLabel(status) {
  return { ok: 'OK', warn: 'Предупреждение', error: 'Ошибка', critical: 'КРИТИЧНО', unknown: 'Нет данных' }[status] ?? status
}

function statusColor(status) {
  return { ok: '#12B76A', warn: '#F79009', error: 'var(--red)', critical: 'var(--red)', unknown: 'rgba(255,255,255,0.35)' }[status] ?? 'inherit'
}

export default function AdminHome() {
  const [users, setUsers]         = useState([])
  const [trucks, setTrucks]       = useState([])
  const [period, setPeriod]       = useState(14)
  const [stats, setStats]         = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [health, setHealth]       = useState(null)
  const [healthLoading, setHealthLoading] = useState(true)
  const [log, setLog]             = useState([])
  const [logLoading, setLogLoading] = useState(true)

  // Users + trucks
  useEffect(() => {
    api.get('/users').then(({ data }) => {
      setUsers(Array.isArray(data) ? data : (data?.data ?? []))
    }).catch(() => {})
    api.get('/trucks').then(({ data }) => {
      setTrucks(Array.isArray(data) ? data : [])
    }).catch(() => {})
  }, [])

  // Revenue stats
  const loadStats = useCallback((p) => {
    setStatsLoading(true)
    api.get(`/admin/stats?period=${p}`)
      .then(({ data }) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false))
  }, [])

  useEffect(() => { loadStats(period) }, [period, loadStats])

  // System health — каждые 60 сек
  const loadHealth = useCallback(() => {
    setHealthLoading(true)
    api.get('/admin/system-health')
      .then(({ data }) => setHealth(data))
      .catch(() => setHealth(null))
      .finally(() => setHealthLoading(false))
  }, [])

  useEffect(() => {
    loadHealth()
    const id = setInterval(loadHealth, 60_000)
    return () => clearInterval(id)
  }, [loadHealth])

  // Activity log — каждые 30 сек
  const loadLog = useCallback(() => {
    api.get('/admin/activity-log?limit=20')
      .then(({ data }) => setLog(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLogLoading(false))
  }, [])

  useEffect(() => {
    loadLog()
    const id = setInterval(loadLog, 30_000)
    return () => clearInterval(id)
  }, [loadLog])

  // ── derived ───────────────────────────────────────────────────────────────
  const totalRevenue  = stats?.total_revenue ?? 0
  const revenueGrowth = fmtGrowth(stats?.revenue_growth)
  const conversion    = stats?.conversion ?? 0
  const chartValues   = stats?.values ?? []
  const chartLabels   = stats?.labels ?? []
  const chartMax      = chartValues.length > 0 ? Math.max(...chartValues, 1) : 1

  const criticalServices = (health?.items ?? []).filter(i => i.status === 'critical' || i.status === 'error')
  const systemStatusOverall = criticalServices.length > 0 ? 'error'
    : (health?.items ?? []).some(i => i.status === 'warn') ? 'warn' : 'ok'

  return (
    <div style={{ padding: 36, display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── critical banner ───────────────────────────────────────────────── */}
      {criticalServices.length > 0 && (
        <div style={{
          background: 'rgba(240,68,56,0.12)', border: '1px solid rgba(240,68,56,0.4)',
          borderRadius: 8, padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
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

      {/* ── stat tiles ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <StatTile
          icon={<Icons.Users size={20}/>}
          label="Всего пользователей"
          value={String(users.length)}
          sub="зарегистрировано"
          trend="—"
        />
        <StatTile
          icon={<Icons.Truck size={20}/>}
          label="Парк машин"
          value={String(trucks.length)}
          sub={`${trucks.filter(t => t.status === 'available').length} доступно`}
          trend="—"
        />
        <StatTile
          icon={<Icons.Wallet size={20}/>}
          label={`Выручка · ${period}Д`}
          value={statsLoading ? '...' : fmtRevenue(totalRevenue)}
          sub="по доставленным заказам"
          trend={revenueGrowth ?? '—'}
        />
        <StatTile
          icon={<Icons.TrendingUp size={20}/>}
          label="Конверсия заявок"
          value={statsLoading ? '...' : `${conversion}%`}
          sub={stats ? `${stats.delivered_orders} из ${stats.total_orders}` : 'доставлено/создано'}
          trend="—"
        />
      </div>

      {/* ── chart + system health ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18 }}>

        {/* Chart */}
        <Card padding={26}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 }}>Финансы</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 1 }}>
                Выручка · последние {period} дней
              </h3>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {PERIOD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  style={{
                    padding: '6px 12px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.12em',
                    background: period === opt.value ? 'var(--gold)' : 'transparent',
                    color: period === opt.value ? 'var(--navy)' : 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontFamily: 'var(--font-body)', cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Сумма</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, color: 'var(--gold)', letterSpacing: 1, lineHeight: 1 }}>
                {statsLoading ? '—' : fmtRevenue(totalRevenue)}
              </div>
            </div>
            {revenueGrowth && (
              <div style={{ paddingBottom: 8 }}>
                <div style={{ fontSize: 11, color: parseFloat(stats?.revenue_growth) >= 0 ? '#12B76A' : 'var(--red)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {revenueGrowth}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>vs. предыдущий период</div>
              </div>
            )}
          </div>

          {statsLoading ? (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              Загрузка данных...
            </div>
          ) : chartValues.length === 0 ? (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              Нет данных за период
            </div>
          ) : (
            <>
              <div style={{ height: 160, display: 'flex', alignItems: 'flex-end', gap: 3 }}>
                {chartValues.map((v, i) => {
                  const isLast = i === chartValues.length - 1
                  const h = Math.max((v / chartMax) * 160, v > 0 ? 4 : 2)
                  return (
                    <div key={i} style={{ flex: 1, position: 'relative' }}>
                      <div style={{
                        width: '100%', height: `${h}px`,
                        background: isLast ? 'var(--gold)' : v > 0 ? 'rgba(240,165,0,0.32)' : 'rgba(255,255,255,0.06)',
                        borderRadius: '3px 3px 0 0', position: 'relative',
                      }}>
                        {isLast && v > 0 && (
                          <div style={{
                            position: 'absolute', top: -26, left: '50%', transform: 'translateX(-50%)',
                            background: 'var(--gold)', color: 'var(--navy)', padding: '2px 6px',
                            borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap',
                          }}>
                            {fmtRevenue(v)}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 3, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 8 }}>
                {chartLabels.map((l, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)' }}>{l}</div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* System Health */}
        <Card padding={26}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1 }}>Состояние системы</h3>
            <button
              onClick={loadHealth}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}
              title="Обновить"
            >
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
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', background: 'var(--navy-3)',
                  borderRadius: 6,
                  border: `1px solid ${item.status === 'critical' ? 'rgba(240,68,56,0.35)' : item.status === 'error' ? 'rgba(240,68,56,0.2)' : 'rgba(255,255,255,0.04)'}`,
                }}>
                  <StatusDot status={item.status} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.note}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: statusColor(item.status), fontWeight: 700, flexShrink: 0 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 14, fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
            Обновляется каждые 60 с
          </div>
        </Card>
      </div>

      {/* ── users table + activity log ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>

        {/* Users */}
        <Card padding={0}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 1 }}>Пользователи</h3>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                {users.length} всего
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn kind="ghost" size="sm" icon={<Icons.Filter size={14}/>}>Фильтр</Btn>
              <Btn size="sm" icon={<Icons.Plus size={14}/>}>Добавить</Btn>
            </div>
          </div>
          {users.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              Нет пользователей
            </div>
          ) : (
            <DataTable
              columns={['Имя', 'Роль', 'Email', 'Статус', '']}
              rows={users.slice(0, 8).map(u => [
                <span style={{ fontWeight: 500 }}>{u.name}</span>,
                <RolePill role={u.role} />,
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{u.email}</span>,
                <StatusPill status={u.status || 'active'} map={USER_STATUS_MAP} />,
                <div style={{ display: 'flex', gap: 4 }}>
                  <button style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}>
                    <Icons.Edit size={14}/>
                  </button>
                  <button style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}>
                    <Icons.Trash size={14}/>
                  </button>
                </div>,
              ])}
            />
          )}
        </Card>

        {/* Activity Log */}
        <Card padding={26}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1 }}>Журнал событий</h3>
            <button
              onClick={loadLog}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}
              title="Обновить"
            >
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 420, overflowY: 'auto' }}>
              {log.map(e => (
                <div key={e.id} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 2, background: e.color, borderRadius: 1, flexShrink: 0, minHeight: 40 }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.title}
                      </div>
                      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {e.time ? new Date(e.time).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.desc}
                    </div>
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
      </div>

      <style>{`
        @keyframes pulse {
          0%   { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
