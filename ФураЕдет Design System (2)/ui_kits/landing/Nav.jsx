function Nav() {
  const links = [
    ['#services', 'Возможности'],
    ['#why', 'Почему мы'],
    ['#fleet', 'Автопарк'],
    ['#process', 'Как работаем'],
    ['#testimonials', 'Отзывы'],
  ];
  const linkStyle = {
    padding: '8px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)',
    transition: 'color 0.2s var(--ease-out)',
  };
  return (
    <nav className="r-nav" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(10,22,40,0.94)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', height: 68, padding: '0 48px',
    }}>
      <div className="wm" style={{ fontSize: 26, display: 'flex', flexDirection: 'column' }}>
        <span>ФУРА<span className="accent">ЕДЕТ</span></span>
        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.32em', color: 'rgba(240,165,0,0.55)', marginTop: 3, fontFamily: 'var(--font-body)' }}>LOGISTICS</span>
      </div>
      <div className="r-nav__links" style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
        {links.map(([href, label]) => (
          <a key={href} href={href} style={linkStyle}
            onMouseEnter={e => e.target.style.color = '#fff'}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.45)'}>
            {label}
          </a>
        ))}
      </div>
      <div className="r-nav__cta" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <a href="FuraEdet - Cabinet.html" className="r-nav__login" style={{
          padding: '9px 20px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)',
          border: '1px solid rgba(255,255,255,0.14)', borderRadius: 2,
        }}>Войти</a>
        <a href="FuraEdet - Cabinet.html" style={{
          padding: '9px 22px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--navy)', background: 'var(--gold)',
          borderRadius: 2,
        }}>Регистрация</a>
      </div>
    </nav>
  );
}

window.Nav = Nav;
