import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { Icons } from '../../components/Icons'
import { Card, Btn, StatTile, DataTable, StatusPill, RolePill } from '../../components/ui'

const USER_STATUS_MAP = {
  active:  { bg: 'rgba(18,183,106,0.14)', fg: '#12B76A',      label: 'Активен' },
  blocked: { bg: 'rgba(240,68,56,0.14)',  fg: 'var(--red)',   label: 'Заблокирован' },
}

const CHART_DATA = [3.2, 4.1, 3.8, 5.2, 4.9, 6.1, 5.6, 6.8, 6.2, 7.4, 6.9, 7.8, 7.4, 9.1]
const CHART_LABELS = ['11','12','13','14','15','16','17','18','19','20','21','22','23','24']
const CHART_MAX = 10

const SYSTEM_HEALTH = [
  ['API сервис',          'Все системы',     'ok',   '99.99%'],
  ['База данных',         '4 реплики · OK',  'ok',   '12 ms'],
  ['Платежи (Тинькофф)', 'Стабильно',       'ok',   '100%'],
  ['SMS-шлюз',           'Деградация',      'warn', '94%'],
  ['Карты Yandex',       'Стабильно',       'ok',   '99.8%'],
]

const AUDIT_LOG = [
  { t: 'Новый клиент',      d: 'Пользователь зарегистрирован',  time: '12:42', c: '#12B76A' },
  { t: 'Изменение тарифа',  d: 'Базовый: ₽ 60/км → ₽ 65/км',  time: '11:18', c: 'var(--gold)' },
  { t: 'Блокировка',        d: 'Аккаунт заблокирован',          time: '09:33', c: 'var(--red)' },
  { t: 'Назначение',        d: 'Роль пользователя изменена',    time: '08:50', c: '#7BB4FF' },
  { t: 'Резервная копия',   d: 'БД: успешно (4.2 GB)',          time: '03:00', c: '#12B76A' },
]

export default function AdminHome() {
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])
  const [trucks, setTrucks] = useState([])

  useEffect(() => {
    api.get('/users').then(({ data }) => {
      const arr = Array.isArray(data) ? data : (data?.data || [])
      setUsers(arr)
    }).catch(() => {})
    api.get('/orders').then(({ data }) => setOrders(Array.isArray(data) ? data : [])).catch(() => {})
    api.get('/trucks').then(({ data }) => setTrucks(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  const delivered = orders.filter(o => o.status === 'delivered')
  const revenue = delivered.reduce((s, o) => s + (parseFloat(o.price) || 0), 0)
  const conversion = orders.length ? Math.round((delivered.length / orders.length) * 100) : 0
  const fmtRevenue = n => n >= 1000000 ? `₽ ${(n / 1000000).toFixed(1)}M` : `₽ ${Math.round(n / 1000)}k`

  return (
    <div style={{ padding: 36, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <StatTile icon={<Icons.Users size={20}/>} label="Всего клиентов" value={String(users.length)} sub="+ новых за неделю" trend="+1.5%" />
        <StatTile icon={<Icons.Truck size={20}/>} label="Парк машин" value={String(trucks.length)} sub={`${trucks.filter(t => t.status === 'available').length} в строю`} trend="—" />
        <StatTile icon={<Icons.Wallet size={20}/>} label="Выручка за месяц" value={fmtRevenue(revenue)} sub="по закрытым заявкам" trend="+9.2%" />
        <StatTile icon={<Icons.TrendingUp size={20}/>} label="Конверсия заявок" value={`${conversion}%`} sub="из них 99.4% в срок" trend="+0.4%" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18 }}>
        <Card padding={26}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 }}>Финансы</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 1 }}>Выручка · последние 14 дней</h3>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['7Д', '14Д', '30Д', '90Д'].map((p, i) => (
                <button key={i} style={{ padding: '6px 12px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', background: i === 1 ? 'var(--gold)' : 'transparent', color: i === 1 ? 'var(--navy)' : 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Сумма</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, color: 'var(--gold)', letterSpacing: 1, lineHeight: 1 }}>₽ 67.8M</div>
            </div>
            <div style={{ paddingBottom: 8 }}>
              <div style={{ fontSize: 11, color: '#12B76A', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>+ ₽ 5.2M</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>vs. предыдущий период</div>
            </div>
          </div>
          <div style={{ height: 160, display: 'flex', alignItems: 'flex-end', gap: 5 }}>
            {CHART_DATA.map((v, i) => (
              <div key={i} style={{ flex: 1, position: 'relative' }}>
                <div style={{ width: '100%', height: `${(v / CHART_MAX) * 160}px`, background: i === CHART_DATA.length - 1 ? 'var(--gold)' : 'rgba(240,165,0,0.28)', borderRadius: '3px 3px 0 0', minHeight: 4, position: 'relative' }}>
                  {i === CHART_DATA.length - 1 && (
                    <div style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', background: 'var(--gold)', color: 'var(--navy)', padding: '2px 6px', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      ₽ {v}M
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 5, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 8 }}>
            {CHART_LABELS.map((l, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)' }}>{l}</div>
            ))}
          </div>
        </Card>

        <Card padding={26}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1, marginBottom: 18 }}>Состояние системы</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SYSTEM_HEALTH.map(([t, d, s, v], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: 'var(--navy-3)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s === 'ok' ? '#12B76A' : '#F79009', flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{t}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{d}</div>
                </div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: s === 'ok' ? '#12B76A' : '#F79009', fontWeight: 700 }}>{v}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
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

        <Card padding={26}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1, marginBottom: 4 }}>Журнал событий</h3>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginBottom: 18 }}>Последние 24 часа</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {AUDIT_LOG.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 2, background: e.c, borderRadius: 1, flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.t}</div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', flexShrink: 0 }}>{e.time}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{e.d}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
