// MANAGER cabinet — assigns orders, manages drivers, sees ops queue

const MANAGER_QUEUE = [
  { id: 'FE-2901', client: 'ООО "Северный Хлеб"', from: 'Москва', to: 'Уфа', kg: 3100, status: 'new', priority: 'high', received: '5 мин назад' },
  { id: 'FE-2902', client: 'ИП Иванов А.С.', from: 'СПб', to: 'Тула', kg: 800, status: 'new', priority: 'normal', received: '12 мин назад' },
  { id: 'FE-2891', client: 'Lumière', from: 'Москва', to: 'Казань', kg: 5400, status: 'transit', priority: 'normal', received: '2 часа назад' },
  { id: 'FE-2898', client: 'Молочный Берёзка', from: 'Тверь', to: 'Воронеж', kg: 12000, status: 'inwork', priority: 'high', received: '1 час назад' },
  { id: 'FE-2887', client: 'ТД Атлант', from: 'Москва', to: 'Саратов', kg: 4500, status: 'inwork', priority: 'normal', received: '4 часа назад' },
];

const DRIVERS = [
  { name: 'Сергей Морозов', truck: 'Volvo FH · М456ОР77', status: 'busy', loc: 'Н. Новгород', orders: 14 },
  { name: 'Алексей Лебедев', truck: 'Scania R · К782НХ78', status: 'free', loc: 'Москва', orders: 22 },
  { name: 'Дмитрий Орлов', truck: 'MAN TGX · Е123АВ50', status: 'busy', loc: 'Воронеж', orders: 18 },
  { name: 'Иван Сафронов', truck: 'Газель · О456ВВ77', status: 'free', loc: 'Москва', orders: 31 },
];

function PriorityDot({ p }) {
  const c = p === 'high' ? 'var(--danger)' : 'var(--gold)';
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }}/>;
}

function ManagerDashboard() {
  return (
    <div style={{ padding: 36, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <StatTile icon={<Icon.Bell/>} label="Новых заявок" value="12" sub="за последний час: 3" trend="+8"/>
        <StatTile icon={<Icon.Truck/>} label="В работе" value="47" sub="32 в пути · 15 загрузка" trend="+5"/>
        <StatTile icon={<Icon.Users/>} label="Свободных машин" value="18" sub="из 65 активных" trend="—"/>
        <StatTile icon={<Icon.TrendingUp/>} label="Выручка за день" value="₽ 1.2M" sub="план: ₽ 1.0M" trend="+18%"/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18 }}>
        {/* Queue */}
        <Card padding={0}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 1 }}>Очередь заявок</h3>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>Требуют распределения · Сортировка по приоритету</div>
            </div>
            <Btn kind="ghost" icon={<Icon.Filter/>} size="sm">Фильтр</Btn>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {MANAGER_QUEUE.map((o, i) => (
              <div key={i} style={{
                padding: '16px 24px', display: 'grid',
                gridTemplateColumns: '8px 90px 1.4fr 1fr 80px auto auto',
                gap: 16, alignItems: 'center',
                borderBottom: i < MANAGER_QUEUE.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <PriorityDot p={o.priority}/>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>{o.id}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{o.client}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{o.received}</div>
                </div>
                <div style={{ fontSize: 13 }}>{o.from} <span style={{ color: 'rgba(255,255,255,0.3)' }}>→</span> {o.to}</div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{o.kg.toLocaleString('ru')} кг</span>
                <StatusPill status={o.status}/>
                {o.status === 'new' ? <Btn size="sm">Назначить</Btn> : <Btn kind="ghost" size="sm" icon={<Icon.Eye/>}>Открыть</Btn>}
              </div>
            ))}
          </div>
        </Card>

        {/* Drivers */}
        <Card padding={0}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 1 }}>Водители</h3>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>В смене сегодня</div>
            </div>
            <Btn kind="ghost" size="sm">Все</Btn>
          </div>
          <div>
            {DRIVERS.map((d, i) => (
              <div key={i} style={{
                padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: i < DRIVERS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)',
                  position: 'relative', flexShrink: 0,
                }}>
                  <Icon.User size={18}/>
                  <span style={{
                    position: 'absolute', bottom: -1, right: -1, width: 11, height: 11,
                    borderRadius: '50%', background: d.status === 'free' ? 'var(--success)' : 'var(--warning)',
                    border: '2px solid var(--navy-2)',
                  }}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.truck}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 90 }}>
                  <div style={{ fontSize: 12, color: d.status === 'free' ? 'var(--success)' : 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>{d.loc}</div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', marginTop: 2, whiteSpace: 'nowrap' }}>{d.orders} рейсов</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Map placeholder */}
      <Card padding={0} style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 1 }}>Карта операций</h3>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>47 машин в пути · 1 200+ городов</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn kind="ghost" size="sm">Все</Btn>
            <Btn kind="ghost" size="sm">В пути</Btn>
            <Btn kind="ghost" size="sm">Загрузка</Btn>
            <Btn size="sm" icon={<Icon.Pin/>}>Открыть</Btn>
          </div>
        </div>
        <div style={{
          height: 280, position: 'relative',
          background: 'radial-gradient(ellipse at center, var(--navy-3), var(--navy)) ',
          backgroundImage: `linear-gradient(rgba(240,165,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(240,165,0,0.04) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Fake pins */}
          {[
            { l: '20%', t: '50%', label: 'МСК · 12' },
            { l: '12%', t: '40%', label: 'СПБ · 5' },
            { l: '34%', t: '52%', label: 'НН · 3' },
            { l: '46%', t: '58%', label: 'КЗН · 4' },
            { l: '24%', t: '70%', label: 'РСТ · 6' },
            { l: '60%', t: '54%', label: 'ЕКБ · 8' },
            { l: '78%', t: '60%', label: 'НВС · 2' },
          ].map((p, i) => (
            <div key={i} style={{ position: 'absolute', left: p.l, top: p.t, transform: 'translate(-50%, -50%)' }}>
              <div style={{
                width: 14, height: 14, borderRadius: '50%', background: 'var(--gold)',
                boxShadow: '0 0 0 6px rgba(240,165,0,0.18)', position: 'relative',
              }}/>
              <div style={{
                position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)',
                fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--gold)',
                background: 'var(--navy-2)', padding: '3px 7px', borderRadius: 3, whiteSpace: 'nowrap',
                border: '1px solid var(--gold-line)',
              }}>{p.label}</div>
            </div>
          ))}
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, opacity: 0.5 }}>
            <Icon.Map size={42} style={{ color: 'rgba(240,165,0,0.5)' }}/>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)', marginTop: 8, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Демо · Карта операций</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

window.ManagerDashboard = ManagerDashboard;
