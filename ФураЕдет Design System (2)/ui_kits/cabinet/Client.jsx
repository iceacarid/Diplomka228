// CLIENT cabinet — client sees their own orders + place new + invoices

const CLIENT_ORDERS = [
  { id: 'FE-2891', from: 'Москва', to: 'Казань', date: '24.04.26', kg: 5400, price: 84500, status: 'transit', truck: 'Фура · М456ОР77' },
  { id: 'FE-2884', from: 'СПб',     to: 'Сочи',   date: '22.04.26', kg: 1200, price: 67800, status: 'delivered', truck: 'Малотоннажный · К782НХ78' },
  { id: 'FE-2871', from: 'Москва', to: 'Краснодар', date: '20.04.26', kg: 8200, price: 124000, status: 'delivered', truck: 'Фура · Е123АВ50' },
  { id: 'FE-2865', from: 'Тверь',  to: 'Ростов', date: '18.04.26', kg: 600,  price: 28900, status: 'cancelled', truck: '—' },
  { id: 'FE-2901', from: 'Москва', to: 'Уфа',    date: '25.04.26', kg: 3100, price: 56200, status: 'new', truck: 'Назначается' },
];

function ClientDashboard() {
  return (
    <div style={{ padding: 36, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <StatTile icon={<Icon.Package/>} label="Активных заявок" value="3" sub="2 в пути · 1 новая" trend="+2"/>
        <StatTile icon={<Icon.Check/>} label="Доставлено в этом месяце" value="14" sub="из них 14 в срок" trend="+4"/>
        <StatTile icon={<Icon.Wallet/>} label="Расходы за месяц" value="₽ 487k" sub="на 12% меньше плана" trend="-12%"/>
        <StatTile icon={<Icon.Map/>} label="Текущий пробег" value="2 187 км" sub="по 3 активным" trend="—"/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
        {/* Active shipment tracker */}
        <Card padding={28}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 }}>Активная доставка</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 1 }}>FE-2891 · Москва → Казань</h3>
            </div>
            <StatusPill status="transit"/>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>МСК</div>
            <div style={{ flex: 1, position: 'relative', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: 4, width: '62%', background: 'var(--gold)', borderRadius: 2 }}/>
              <div style={{
                position: 'absolute', left: '62%', top: '50%', transform: 'translate(-50%, -50%)',
                width: 28, height: 28, borderRadius: '50%', background: 'var(--gold)', color: 'var(--navy)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon.Truck size={14}/></div>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>КЗН</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, padding: '18px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {[
              ['Текущая позиция', 'Нижний Новгород', 'var(--gold)'],
              ['Пройдено', '512 км', 'white'],
              ['Осталось', '307 км · ~5ч', 'white'],
              ['Прибытие', '24.04 · 19:30', 'white'],
            ].map(([l, v, c], i) => (
              <div key={i}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{l}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: c, letterSpacing: 0.5 }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}><Icon.User size={20}/></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Сергей Морозов</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>Водитель · М456ОР77 · Volvo FH</div>
            </div>
            <Btn kind="ghost" icon={<Icon.Phone/>} size="sm">Позвонить</Btn>
            <Btn icon={<Icon.Map/>} size="sm">На карте</Btn>
          </div>
        </Card>

        {/* Quick order */}
        <Card padding={26}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 1, marginBottom: 4 }}>
            Быстрая <span style={{ color: 'var(--gold)' }}>заявка</span>
          </h3>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 20, fontWeight: 300 }}>Менеджер свяжется в течение 15 минут</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Field label="Откуда" placeholder="Москва, Каширское ш. 60"/>
            <Field label="Куда" placeholder="Казань, Кремлёвская 12"/>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Вес, кг" placeholder="5000"/>
              <Field label="Объём, м³" placeholder="20"/>
            </div>
            <div style={{ height: 8 }}/>
            <Btn icon={<Icon.Plus/>} style={{ width: '100%', justifyContent: 'center' }}>Создать заявку</Btn>
          </div>
        </Card>
      </div>

      {/* Orders */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 26, letterSpacing: 1 }}>Мои заявки</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn kind="ghost" icon={<Icon.Filter/>} size="sm">Фильтр</Btn>
            <Btn icon={<Icon.Plus/>} size="sm">Новая заявка</Btn>
          </div>
        </div>
        <DataTable
          columns={['№ Заявки', 'Маршрут', 'Дата', 'Вес', 'Машина', 'Сумма', 'Статус']}
          rows={CLIENT_ORDERS.map(o => [
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontWeight: 600 }}>{o.id}</span>,
            <span style={{ fontWeight: 500 }}>{o.from} <span style={{ color: 'rgba(255,255,255,0.3)' }}>→</span> {o.to}</span>,
            <span style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.7)' }}>{o.date}</span>,
            <span style={{ fontFamily: 'var(--font-mono)' }}>{o.kg.toLocaleString('ru')} кг</span>,
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{o.truck}</span>,
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--gold)' }}>₽ {o.price.toLocaleString('ru')}</span>,
            <StatusPill status={o.status}/>,
          ])} />
      </div>
    </div>
  );
}

window.ClientDashboard = ClientDashboard;
