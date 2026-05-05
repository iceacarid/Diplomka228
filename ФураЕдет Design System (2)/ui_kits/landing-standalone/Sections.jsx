// Multiple sections of the landing: Ticker, Stats, Services, Why, Fleet, Process, Testimonials, CTA

function Ticker() {
  const items = ['МОСКВА → КАЗАНЬ', 'СПБ → НОВОСИБИРСК', 'ЕКАТЕРИНБУРГ → СОЧИ', 'РОСТОВ → ВЛАДИВОСТОК',
    'КРАСНОДАР → УФА', 'ВОРОНЕЖ → ИРКУТСК', 'НИЖНИЙ НОВГОРОД → САМАРА', 'ОМСК → ТЮМЕНЬ'];
  const all = [...items, ...items, ...items];
  return (
    <div style={{
      background: 'var(--gold)', color: 'var(--navy)', padding: '14px 0',
      overflow: 'hidden', whiteSpace: 'nowrap', position: 'relative',
    }}>
      <div style={{ display: 'inline-flex', gap: 56, animation: 'ticker 60s linear infinite' }}>
        {all.map((t, i) => (
          <span key={i} style={{
            fontFamily: 'var(--font-display)', fontSize: 17, letterSpacing: 2,
            display: 'inline-flex', alignItems: 'center', gap: 22,
          }}>{t} <Icon.Truck size={16}/></span>
        ))}
      </div>
    </div>
  );
}

function SectionTag({ children }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.25em',
      textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 22,
    }}>
      <span style={{ width: 32, height: 1, background: 'var(--gold)' }}/>
      {children}
    </div>
  );
}

function Stats() {
  const data = [
    { v: '25M+',    l: 'Километров пройдено' },
    { v: '14 000',  l: 'Довольных клиентов' },
    { v: '99%',     l: 'Доставок в срок' },
    { v: '12 лет',  l: 'На рынке логистики' },
  ];
  return (
    <section style={{ background: '#e8e6e0', borderTop: '1px solid rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
        {data.map((s, i) => (
          <div key={i} style={{
            padding: '52px 44px',
            borderRight: i < 3 ? '1px solid rgba(0,0,0,0.08)' : 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.22em', color: 'var(--gold)',
            }}>0{i+1}</div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 56, lineHeight: 0.95,
              letterSpacing: 1, color: 'var(--navy)', textTransform: 'uppercase',
            }}>{s.v}</div>
            <div style={{
              fontSize: 13, fontWeight: 400, color: 'rgba(10,22,40,0.6)',
              marginTop: 2,
            }}>{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ServiceCard({ num, icon, title, desc, items }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? 'var(--navy)' : 'white',
        border: hover ? '1px solid var(--navy)' : '1px solid rgba(10,22,40,0.08)',
        borderRadius: 8, padding: 38, position: 'relative',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.35s var(--ease-out)', cursor: 'pointer',
        color: hover ? 'white' : 'var(--navy)',
      }}>
      <div style={{
        position: 'absolute', top: 22, right: 28, fontFamily: 'var(--font-display)',
        fontSize: 64, color: hover ? 'var(--gold)' : 'rgba(10,22,40,0.06)', letterSpacing: 1,
        transition: 'color 0.35s',
      }}>{num}</div>
      <div style={{
        width: 52, height: 52, borderRadius: 8,
        background: hover ? 'rgba(240,165,0,0.18)' : 'rgba(10,22,40,0.05)',
        color: hover ? 'var(--gold)' : 'var(--navy)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28,
        transition: 'all 0.35s',
      }}>{icon}</div>
      <h3 style={{
        fontFamily: 'var(--font-display)', fontSize: 26, letterSpacing: 1, marginBottom: 12,
        color: hover ? 'white' : 'var(--navy)', transition: 'color 0.35s',
      }}>{title}</h3>
      <p style={{
        fontSize: 13, lineHeight: 1.65,
        color: hover ? 'rgba(255,255,255,0.6)' : 'rgba(10,22,40,0.55)',
        marginBottom: 22, fontWeight: 300, transition: 'color 0.35s',
      }}>{desc}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {items.map((it, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 12,
            color: hover ? 'rgba(255,255,255,0.85)' : 'rgba(10,22,40,0.75)',
            transition: 'color 0.35s',
          }}>
            <Icon.Check size={14} style={{ color: 'var(--gold)' }}/> {it}
          </div>
        ))}
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700,
        letterSpacing: '0.16em', textTransform: 'uppercase',
        color: hover ? 'var(--gold)' : 'rgba(10,22,40,0.55)',
        transition: 'color 0.25s',
      }}>
        Подробнее <Icon.Arrow size={14}/>
      </div>
    </div>
  );
}

function Services() {
  return (
    <section id="services" style={{ padding: '120px 80px', background: '#f5f3ee' }}>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase',
        color: 'var(--gold)', marginBottom: 14,
      }}>Возможности</div>
      <h2 style={{
        fontFamily: 'var(--font-display)', fontSize: 64, letterSpacing: 2,
        lineHeight: 1, marginBottom: 16, color: 'var(--navy)',
      }}>
        Что мы <span style={{ color: 'var(--gold)' }}>делаем</span>
      </h2>
      <p style={{
        fontSize: 15, lineHeight: 1.6, color: 'rgba(10,22,40,0.55)',
        maxWidth: 540, marginBottom: 60, fontWeight: 300,
      }}>
        Полный цикл логистических услуг. От планирования маршрута до подписи в накладной получателя.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
        <ServiceCard num="01" icon={<Icon.Truck size={26}/>} title="Грузоперевозки"
          desc="По всей России и СНГ. Любой вес, любой объём, любая срочность."
          items={['Сборные грузы от 1 кг', 'Полные фуры до 20 тонн', 'Экспресс-доставка день в день']} />
        <ServiceCard num="02" icon={<Icon.Refrigerator size={26}/>} title="Рефрижераторы"
          desc="Перевозка скоропортящихся и температурных грузов с контролем условий."
          items={['Режим от -25°C до +25°C', 'Контроль температуры онлайн', 'Сертификация для пищевых']} />
        <ServiceCard num="03" icon={<Icon.Boxes size={26}/>} title="Складское хранение"
          desc="Современные склады класса A в крупнейших городах России."
          items={['Кросс-докинг', 'Комплектация заказов', 'Ответственное хранение']} />
      </div>
    </section>
  );
}

function Why() {
  const items = [
    ['01', 'Собственный автопарк 200+ единиц', 'Все автомобили оснащены GPS и проходят ежемесячный техосмотр.'],
    ['02', 'AI-оптимизация маршрутов',          'Искусственный интеллект планирует маршруты, снижая затраты до 30%.'],
    ['03', 'Страхование каждого груза',         '100% покрытие рисков при транспортировке. Выплата за 3 дня.'],
    ['04', 'Личный менеджер 24/7',              'Выделенный менеджер всегда на связи. Среднее время ответа — 4 минуты.'],
  ];
  return (
    <section id="why" style={{ background: 'var(--navy)', display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 600 }}>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img src="https://images.unsplash.com/photo-1580674684081-7617fbf3d745?q=80&w=1200&fit=crop" alt="Склад"
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(20%)', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 55%, var(--navy) 100%)' }} />
      </div>
      <div style={{ padding: '88px 80px 88px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>Почему ФураЕдет</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 64, lineHeight: 0.9, textTransform: 'uppercase', marginBottom: 44, letterSpacing: 2 }}>
          Надёжность —<br/>наш <span style={{ color: 'var(--gold)' }}>стандарт.</span>
        </h2>
        <div>
          {items.map(([num, title, desc], i) => (
            <div key={num} style={{
              display: 'flex', alignItems: 'flex-start', gap: 18, padding: '20px 0',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              borderTop: i === 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.12em', paddingTop: 3, flexShrink: 0 }}>{num}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55, fontWeight: 300 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Fleet() {
  const fleet = [
    { id: 'fleetTrucks',  num: '01 / ФУРЫ',           name: 'До 20 тонн', desc: 'Магистральные фуры для крупных партий. КАМАЗ, МАЗ, Volvo.', payload: '20 Т',  img: (window.__resources && window.__resources.fleetTrucks)  || 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=1400&fit=crop' },
    { id: 'fleetMid',     num: '02 / СРЕДНИЙ ТОННАЖ', name: 'До 5 тонн',  desc: 'Региональная доставка средних партий. Гибкий график, быстрое оформление.', payload: '5 Т',  img: (window.__resources && window.__resources.fleetMid)     || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1400&fit=crop' },
    { id: 'fleetVan',     num: '03 / МИНИВЭНЫ',       name: 'Минивэны',   desc: 'Срочные городские доставки. Express-формат, день в день.', payload: '1.5 Т', img: (window.__resources && window.__resources.fleetVan)     || 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1400&fit=crop' },
  ];
  const [active, setActive] = React.useState(0);

  return (
    <section id="fleet" style={{ background: 'var(--navy)', overflow: 'hidden', display: 'flex', minHeight: 640, position: 'relative' }}>
      <div style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '88px 64px 88px 80px', position: 'relative', zIndex: 2 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'block', width: 28, height: 2, background: 'var(--gold)' }} />
          Наш автопарк
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 76, lineHeight: 0.9, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 52 }}>
          Сила в<br/><span style={{ color: 'var(--gold)' }}>Движении</span>
        </h2>
        <div>
          {fleet.map((cat, i) => (
            <div key={i}
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 22, padding: '24px 0',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                borderBottom: i === fleet.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                cursor: 'pointer', position: 'relative',
                paddingLeft: active === i ? 18 : 0,
                transition: 'padding 0.35s var(--ease-out)',
              }}>
              {active === i && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--gold)' }} />}
              <div style={{
                width: 90, height: 60, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
                border: active === i ? '1.5px solid var(--gold)' : '1.5px solid rgba(255,255,255,0.1)',
                transition: 'border 0.35s',
              }}>
                <img src={cat.img} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: active === i ? 'grayscale(0%)' : 'grayscale(60%)', transition: 'filter 0.35s' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', color: active === i ? 'var(--gold)' : 'rgba(255,255,255,0.25)', marginBottom: 4, transition: 'color 0.3s' }}>{cat.num}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 1, textTransform: 'uppercase', color: active === i ? 'white' : 'rgba(255,255,255,0.4)', transition: 'color 0.3s' }}>{cat.name}</div>
                {active === i && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6, lineHeight: 1.55, fontWeight: 300 }}>{cat.desc}</div>}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 1, color: active === i ? 'var(--gold)' : 'rgba(255,255,255,0.14)', flexShrink: 0, transition: 'color 0.3s' }}>{cat.payload}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: '0 0 50%', position: 'relative', overflow: 'hidden' }}>
        {fleet.map((cat, i) => (
          <img key={i} src={cat.img} alt={cat.name}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              opacity: active === i ? 1 : 0,
              transform: active === i ? 'scale(1)' : 'scale(1.05)',
              transition: 'opacity 0.6s var(--ease-out), transform 0.8s var(--ease-out)',
            }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, var(--navy) 0%, rgba(10,22,40,0.3) 35%, transparent 60%)', zIndex: 1, pointerEvents: 'none' }} />
      </div>
    </section>
  );
}

function Process() {
  const steps = [
    { n: '01', t: 'Заявка', d: 'Заполните форму на сайте или позвоните. Менеджер свяжется в течение 5 минут.' },
    { n: '02', t: 'Расчёт', d: 'Получите детальное коммерческое предложение с разбивкой стоимости.' },
    { n: '03', t: 'Договор', d: 'Подписываем договор онлайн через ЭДО. Никаких бумажек и ожиданий.' },
    { n: '04', t: 'Перевозка', d: 'Отслеживайте груз в личном кабинете на интерактивной карте.' },
    { n: '05', t: 'Доставка', d: 'Получаете груз и закрывающие документы. Платите по факту.' },
  ];
  return (
    <section id="process" style={{ padding: '120px 80px', background: 'var(--navy-2)', position: 'relative' }}>
      <SectionTag>Как это работает</SectionTag>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 64, letterSpacing: 2, lineHeight: 1, marginBottom: 80 }}>
        От заявки до <span style={{ color: 'var(--gold)' }}>доставки</span>
      </h2>
      <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 32, left: '8%', right: '8%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(240,165,0,0.4), transparent)' }} />
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1, position: 'relative', padding: '0 16px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: 'var(--navy)',
              border: '2px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--gold)', letterSpacing: 1,
              margin: '0 auto 24px', position: 'relative', zIndex: 2,
            }}>{s.n}</div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1, textAlign: 'center', marginBottom: 12 }}>{s.t}</h4>
            <p style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.45)', textAlign: 'center', fontWeight: 300 }}>{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const reviews = [
    {
      q: 'Возим продукцию из Подмосковья в 40 регионов. За 3 года ни одного срыва. Личный кабинет — пушка, всё прозрачно.',
      a: 'Алексей Петров', r: 'Логист, ООО «Северный Хлеб»',
    },
    {
      q: 'Перешли с нескольких подрядчиков на одного. Сэкономили 18% на доставке и убрали половину головной боли.',
      a: 'Мария Иванова', r: 'CEO, бренд одежды Lumière',
    },
    {
      q: 'Рефрижераторы реально держат температуру. Молочка приезжает свежая, претензий от ритейла больше нет.',
      a: 'Дмитрий Соколов', r: 'Директор, молочный комбинат «Берёзка»',
    },
  ];
  return (
    <section id="testimonials" style={{ padding: '120px 80px', background: 'var(--navy)' }}>
      <SectionTag>Клиенты</SectionTag>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 64, letterSpacing: 2, lineHeight: 1, marginBottom: 60 }}>
        Нам <span style={{ color: 'var(--gold)' }}>доверяют</span>
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
        {reviews.map((r, i) => (
          <div key={i} style={{
            background: 'var(--navy-2)', padding: 38, borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 64, color: 'var(--gold)', lineHeight: 0.6, marginBottom: 6 }}>"</div>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: 'rgba(255,255,255,0.85)', flex: 1, marginBottom: 24, fontWeight: 300 }}>{r.q}</p>
            <div style={{ paddingTop: 22, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, letterSpacing: 0.5 }}>{r.a}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{r.r}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section style={{ padding: '120px 80px', background: 'var(--navy-2)', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(240,165,0,0.12), transparent 70%)',
      }} />
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
        <SectionTag>Готовы начать?</SectionTag>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(56px, 7vw, 96px)',
          letterSpacing: 2, lineHeight: 0.95, marginBottom: 28,
        }}>
          Поехали<span style={{ color: 'var(--gold)' }}>.</span>
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.65, color: 'rgba(255,255,255,0.55)', marginBottom: 40, fontWeight: 300, maxWidth: 540, margin: '0 auto 40px' }}>
          Зарегистрируйтесь за минуту и получите первую перевозку со скидкой 10%. Без обязательств, без подписок.
        </p>
        <div style={{ display: 'inline-flex', gap: 12 }}>
          <a href="#" style={{
            padding: '17px 36px', background: 'var(--gold)', color: 'var(--navy)', fontWeight: 700,
            fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: 2,
            display: 'inline-flex', alignItems: 'center', gap: 10,
          }}>Зарегистрироваться <Icon.Arrow size={14}/></a>
          <a href="tel:+74950000000" style={{
            padding: '16px 36px', color: 'rgba(255,255,255,0.85)', fontWeight: 700,
            fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 2,
            display: 'inline-flex', alignItems: 'center', gap: 10,
          }}><Icon.Phone size={14}/> +7 495 000-00-00</a>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Ticker, Stats, Services, Why, Fleet, Process, Testimonials, CTA });
