// ADMIN cabinet — system-wide oversight, users, finances, fleet config

const USERS = [
  { name: 'Алексей Петров', email: 'a.petrov@khleb.ru', role: 'client', orders: 142, since: '2022-08', status: 'active' },
  { name: 'Мария Иванова', email: 'm.ivanova@lumiere.ru', role: 'client', orders: 87, since: '2023-04', status: 'active' },
  { name: 'Сергей Морозов', email: 's.morozov@furaedet.ru', role: 'manager', orders: 312, since: '2021-03', status: 'active' },
  { name: 'Дмитрий Соколов', email: 'sokolov@bereza.com', role: 'client', orders: 56, since: '2024-01', status: 'active' },
  { name: 'Игорь Захаров', email: 'i.zakharov@furaedet.ru', role: 'admin', orders: 0, since: '2020-01', status: 'active' },
  { name: 'Елена Кузнецова', email: 'e.kuz@furaedet.ru', role: 'manager', orders: 198, since: '2022-11', status: 'active' },
  { name: 'Тестовый Аккаунт', email: 'test@old.ru', role: 'client', orders: 2, since: '2025-12', status: 'blocked' },
];

function MiniSpark() {
  // Tiny SVG sparkline
  const pts = [22, 30, 28, 38, 34, 42, 40, 52, 48, 60, 58, 70, 64, 75];
  const w = 220, h = 50, max = 80;
  const path = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  const area = path + ` L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sg)"/>
      <path d={path} fill="none" stroke="var(--gold)" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}

function AdminDashboard() {
  return (
    <div style={{ padding: 36, display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Top row: 4 KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <StatTile icon={<Icon.Users/>} label="Всего клиентов" value="14 387" sub="+ 218 за неделю" trend="+1.5%"/>
        <StatTile icon={<Icon.Truck/>} label="Парк машин" value="2 450" sub="2 187 в строю" trend="—"/>
        <StatTile icon={<Icon.Wallet/>} label="Выручка за месяц" value="₽ 142M" sub="план: ₽ 130M" trend="+9.2%"/>
        <StatTile icon={<Icon.TrendingUp/>} label="Конверсия заявок" value="87%" sub="из них 99.4% в срок" trend="+0.4%"/>
      </div>

      {/* Revenue + System health */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18 }}>
        <Card padding={26}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 }}>Финансы</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 1 }}>Выручка · последние 14 дней</h3>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['7Д','14Д','30Д','90Д'].map((p, i) => (
                <button key={i} style={{
                  padding: '6px 12px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                  background: i === 1 ? 'var(--gold)' : 'transparent', color: i === 1 ? 'var(--navy)' : 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-body)', cursor: 'pointer',
                }}>{p}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Сумма</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, color: 'var(--gold)', letterSpacing: 1, lineHeight: 1 }}>₽ 67.8M</div>
            </div>
            <div style={{ paddingBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--success)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>+ ₽ 5.2M</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>vs. предыдущий период</div>
            </div>
          </div>
          {/* big chart */}
          <BigChart/>
        </Card>

        <Card padding={26}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1, marginBottom: 18 }}>Состояние системы</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              ['API сервис', 'Все системы', 'ok', '99.99%'],
              ['База данных', '4 реплики · OK', 'ok', '12 ms'],
              ['Платежи (Тинькофф)', 'Стабильно', 'ok', '100%'],
              ['SMS-шлюз', 'Деградация', 'warn', '94%'],
              ['Карты Yandex', 'Стабильно', 'ok', '99.8%'],
            ].map(([t, d, s, v], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--navy-3)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s === 'ok' ? 'var(--success)' : 'var(--warning)' }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{t}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{d}</div>
                </div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: s === 'ok' ? 'var(--success)' : 'var(--warning)', fontWeight: 700 }}>{v}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Users + audit log */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
        <Card padding={0}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 1 }}>Пользователи</h3>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>14 387 · 318 заблокировано</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn kind="ghost" size="sm" icon={<Icon.Filter/>}>Фильтр</Btn>
              <Btn size="sm" icon={<Icon.Plus/>}>Добавить</Btn>
            </div>
          </div>
          <DataTable
            columns={['Имя', 'Роль', 'Email', 'Заявок', 'Статус', '']}
            rows={USERS.map(u => [
              <span style={{ fontWeight: 500 }}>{u.name}</span>,
              <RolePill role={u.role}/>,
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{u.email}</span>,
              <span style={{ fontFamily: 'var(--font-mono)' }}>{u.orders}</span>,
              <StatusPill status={u.status}/>,
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}><Icon.Edit size={14}/></button>
                <button style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}><Icon.Trash size={14}/></button>
              </div>,
            ])} />
        </Card>

        <Card padding={26}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1, marginBottom: 4 }}>Журнал событий</h3>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginBottom: 18 }}>Последние 24 часа</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { t: 'Новый клиент', d: 'ИП Сидоров А.В. зарегистрирован', time: '12:42', c: 'var(--success)' },
              { t: 'Изменение тарифа', d: 'Базовый: ₽ 60/км → ₽ 65/км', time: '11:18', c: 'var(--gold)' },
              { t: 'Блокировка', d: 'test@old.ru заблокирован', time: '09:33', c: 'var(--danger)' },
              { t: 'Назначение', d: 'Кузнецова Е. → старший менеджер', time: '08:50', c: 'var(--info)' },
              { t: 'Резервная копия', d: 'БД: успешно (4.2 GB)', time: '03:00', c: 'var(--success)' },
            ].map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 2, background: e.c, borderRadius: 1, flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.t}</div>
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
  );
}

function BigChart() {
  // Bar chart with revenue per day
  const data = [3.2, 4.1, 3.8, 5.2, 4.9, 6.1, 5.6, 6.8, 6.2, 7.4, 6.9, 7.8, 7.4, 9.1];
  const max = 10;
  const labels = ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'];
  return (
    <div>
      <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', gap: 8, padding: '10px 0' }}>
        {data.map((v, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: '100%', height: `${(v / max) * 100}%`,
              background: i === data.length - 1 ? 'var(--gold)' : 'rgba(240,165,0,0.35)',
              borderRadius: '4px 4px 0 0', position: 'relative',
            }}>
              {i === data.length - 1 && (
                <div style={{
                  position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--gold)', color: 'var(--navy)', padding: '3px 8px', borderRadius: 3,
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
                }}>₽ {v}M</div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {labels.map((l, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)' }}>{l}</div>
        ))}
      </div>
    </div>
  );
}

window.AdminDashboard = AdminDashboard;
