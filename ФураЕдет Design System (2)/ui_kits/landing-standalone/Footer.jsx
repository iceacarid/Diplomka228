function Footer() {
  const cols = [
    { t: 'Услуги', items: ['Грузоперевозки', 'Рефрижераторы', 'Складское хранение', 'Экспресс-доставка', 'Сборные грузы'] },
    { t: 'Компания', items: ['О нас', 'Автопарк', 'Карьера', 'Партнёры', 'Пресс-центр'] },
    { t: 'Помощь', items: ['Документы', 'Тарифы', 'FAQ', 'Контакты', 'Поддержка'] },
  ];
  return (
    <footer style={{ background: '#070F1B', color: 'rgba(255,255,255,0.45)', padding: '80px 80px 32px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.2fr', gap: 60, marginBottom: 60 }}>
        <div>
          <div className="wm" style={{ fontSize: 28, marginBottom: 18, color: 'white' }}>
            ФУРА<span className="accent">ЕДЕТ</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.7, fontWeight: 300, maxWidth: 280, marginBottom: 24 }}>
            Логистическая компания нового поколения. Перевозим грузы по всей России с 2014 года.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)' }}>
            <Icon.Dot size={10} style={{ color: '#3FCF8E' }}/> Все системы работают
          </div>
        </div>
        {cols.map((c, i) => (
          <div key={i}>
            <h5 style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 22 }}>{c.t}</h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11 }}>
              {c.items.map((x, j) => (
                <li key={j}><a href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 400 }}>{x}</a></li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h5 style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 22 }}>Контакты</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <a href="tel:+74950000000" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'white', fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1 }}>
              <Icon.Phone size={16}/> +7 495 000-00-00
            </a>
            <a href="mailto:hi@furaedet.ru" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
              <Icon.Mail size={14}/> hi@furaedet.ru
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
              <Icon.Pin size={14}/> Москва, Ленинский 6
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
              <Icon.Clock size={14}/> 24/7 поддержка
            </div>
          </div>
        </div>
      </div>
      <div style={{
        paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)',
      }}>
        <div>© 2026 ФУРАЕДЕТ · ИНН 7707083893 · ОГРН 1027700132195</div>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="#" style={{ color: 'rgba(255,255,255,0.3)' }}>Политика конфиденциальности</a>
          <a href="#" style={{ color: 'rgba(255,255,255,0.3)' }}>Публичная оферта</a>
        </div>
      </div>
    </footer>
  );
}

window.Footer = Footer;
