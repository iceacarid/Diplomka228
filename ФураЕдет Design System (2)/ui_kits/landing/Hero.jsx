function CalcField({ label, placeholder, type = 'text', value, onChange }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)' }}>{label}</span>
      <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          background: focus ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
          border: focus ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.09)',
          color: 'white', padding: '13px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600,
          fontFamily: 'var(--font-body)', outline: 'none', transition: 'all 0.2s var(--ease-out)',
        }} />
    </div>
  );
}

function Hero() {
  const [c, setC] = React.useState({ from: 'Москва', to: 'Казань', kg: '5000', m3: '20' });
  const [hover, setHover] = React.useState(false);
  const [result, setResult] = React.useState({ price: 84500, distance: 819, days: 2 });

  const fakeCalc = (e) => {
    e.preventDefault();
    if (!c.from || !c.to || !c.kg || !c.m3) return;
    const km = 600 + Math.floor(Math.random() * 700);
    const price = Math.round(km * 60 + parseFloat(c.kg) * 5);
    setResult({ price, distance: km, days: Math.ceil(km / 450) });
  };

  return (
    <section className="r-hero" style={{
      position: 'relative', overflow: 'hidden', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', paddingTop: 68,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: "url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2000')",
        backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.09,
      }} />
      <div className="grid-bg" />

      <div className="r-hero__row" style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '80px 80px 60px', gap: 56, position: 'relative', zIndex: 2 }}>
        {/* LEFT */}
        <div style={{ flex: 1 }} className="fade-in r-hero__left">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)',
            marginBottom: 32, border: '1px solid var(--gold-line)', padding: '9px 16px', borderRadius: 2,
          }}>
            <span style={{ width: 6, height: 6, background: 'var(--gold)', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
            Логистика нового поколения
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(64px,8vw,108px)', lineHeight: 0.88,
            letterSpacing: 3, textTransform: 'uppercase', marginBottom: 28,
          }}>
            <span style={{ WebkitTextStroke: '2px rgba(255,255,255,0.7)', color: 'transparent' }}>Логистика</span><br />
            Вашего <span style={{ color: 'var(--gold)' }}>Бизнеса.</span>
          </h1>
          <p style={{
            fontSize: 15, lineHeight: 1.75, color: 'rgba(255,255,255,0.5)',
            maxWidth: 420, marginBottom: 44, fontWeight: 300,
            borderLeft: '2px solid var(--gold)', paddingLeft: 16,
          }}>
            Скорость, надёжность и масштаб. Мы не просто везём грузы — мы ускоряем ваш бизнес по всей России.
          </p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 52 }}>
            <a href="FuraEdet - Cabinet.html" style={{
              padding: '15px 32px', background: 'var(--gold)', color: 'var(--navy)', fontWeight: 700,
              fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 2,
              display: 'inline-flex', alignItems: 'center', gap: 10,
            }}>Начать работу <Icon.Arrow size={14}/></a>
            <a href="#services" style={{
              padding: '14px 32px', color: 'rgba(255,255,255,0.7)', fontWeight: 600,
              fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 2,
            }}>Узнать больше</a>
          </div>
          <div className="r-hero__stats" style={{
            display: 'flex', alignItems: 'center', gap: 28, paddingTop: 32,
            borderTop: '1px solid rgba(255,255,255,0.07)',
          }}>
            {[['25M+', 'км пройдено'], ['14K', 'клиентов'], ['99%', 'вовремя'], ['24/7', 'поддержка']].map(([v, l], i) => (
              <React.Fragment key={i}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, letterSpacing: 1, lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)', marginTop: 4 }}>{l}</div>
                </div>
                {i < 3 && <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.08)' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* CALC CARD */}
        <div className="r-hero__calc" style={{ flexShrink: 0 }}>
          <form onSubmit={fakeCalc}
            onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
            className="r-hero__calc-form"
            style={{
              background: 'var(--navy-2)', borderRadius: 14, padding: '40px 40px 32px',
              border: hover ? '2px solid var(--gold)' : '2px solid rgba(255,255,255,0.07)',
              width: 420, transform: hover ? 'rotate(0deg)' : 'rotate(3deg)',
              transition: 'all 0.45s var(--ease-pop)',
              boxShadow: hover ? 'var(--shadow-gold), 24px 24px 48px rgba(0,0,0,0.4)' : 'var(--shadow-hero)',
            }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6 }}>Онлайн-калькулятор</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, letterSpacing: 1, marginBottom: 28, lineHeight: 1 }}>
              Быстрый <span style={{ color: 'var(--gold)' }}>расчёт</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <CalcField label="Откуда" placeholder="Москва" value={c.from} onChange={v => setC({ ...c, from: v })} />
              <CalcField label="Куда" placeholder="Казань" value={c.to} onChange={v => setC({ ...c, to: v })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <CalcField label="Вес, кг" placeholder="5000" type="number" value={c.kg} onChange={v => setC({ ...c, kg: v })} />
              <CalcField label="Объём, м³" placeholder="20" type="number" value={c.m3} onChange={v => setC({ ...c, m3: v })} />
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '16px 0 12px' }} />
            <button type="submit" style={{
              width: '100%', padding: 14, background: 'var(--gold)', color: 'var(--navy)',
              fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
              border: 'none', borderRadius: 6, fontFamily: 'var(--font-body)',
            }}>Рассчитать стоимость</button>
            {result && (
              <div style={{ textAlign: 'center', paddingTop: 22 }}>
                <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)', marginBottom: 6, fontWeight: 700 }}>Ориентировочная цена</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, color: 'var(--gold)', letterSpacing: 2, lineHeight: 1 }}>
                  {Number(result.price).toLocaleString('ru')} ₽
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                  {result.distance} км · ~{result.days} дн.
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Bottom feature bar */}
      <div className="r-hero__feat" style={{ position: 'relative', zIndex: 2, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
        {[
          { icon: <Icon.Pin size={20}/>, t: 'GPS-мониторинг', d: 'Отслеживание в реальном времени' },
          { icon: <Icon.Shield size={20}/>, t: 'Страхование грузов', d: 'Полное покрытие рисков' },
          { icon: <Icon.Bolt size={20}/>, t: 'Экспресс-доставка', d: 'День в день по России' },
        ].map(({ icon, t, d }, i) => (
          <div key={i} style={{ padding: '20px 40px', display: 'flex', alignItems: 'center', gap: 14, borderRight: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div style={{ width: 38, height: 38, borderRadius: 6, background: 'rgba(240,165,0,0.1)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
              <strong style={{ display: 'block', color: 'rgba(255,255,255,0.92)', fontSize: 12, fontWeight: 700, marginBottom: 1 }}>{t}</strong>
              {d}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

window.Hero = Hero;
