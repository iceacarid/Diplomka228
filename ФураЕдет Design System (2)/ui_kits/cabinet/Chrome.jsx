// Shared chrome — Sidebar, Topbar, Card, Pill, Button, Field, Table

const StatusPill = ({ status }) => {
  const map = {
    'new': { bg: 'rgba(123,180,255,0.14)', fg: 'var(--info)', label: 'Новая' },
    'inwork': { bg: 'rgba(240,165,0,0.14)', fg: 'var(--warning)', label: 'В работе' },
    'transit': { bg: 'rgba(240,165,0,0.14)', fg: 'var(--warning)', label: 'В пути' },
    'delivered': { bg: 'rgba(52,199,89,0.14)', fg: 'var(--success)', label: 'Доставлено' },
    'cancelled': { bg: 'rgba(255,107,107,0.14)', fg: 'var(--danger)', label: 'Отменено' },
    'pending': { bg: 'rgba(255,255,255,0.06)', fg: 'rgba(255,255,255,0.55)', label: 'Ожидает' },
    'active': { bg: 'rgba(52,199,89,0.14)', fg: 'var(--success)', label: 'Активен' },
    'blocked': { bg: 'rgba(255,107,107,0.14)', fg: 'var(--danger)', label: 'Заблокирован' },
  };
  const s = map[status] || map['pending'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
      borderRadius: 999, background: s.bg, color: s.fg,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      fontFamily: 'var(--font-body)',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.fg }} />
      {s.label}
    </span>
  );
};

const RolePill = ({ role }) => {
  const map = {
    client: { bg: 'rgba(123,180,255,0.14)', fg: '#7BB4FF', label: 'Клиент' },
    manager: { bg: 'rgba(240,165,0,0.14)', fg: 'var(--gold)', label: 'Менеджер' },
    admin: { bg: 'rgba(255,107,107,0.14)', fg: '#FF8A8A', label: 'Админ' },
  };
  const s = map[role] || map.client;
  return (
    <span style={{
      padding: '3px 9px', borderRadius: 4, background: s.bg, color: s.fg,
      fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
    }}>{s.label}</span>
  );
};

function Sidebar({ items, activeId, onSelect, role, user, mobileOpen, onMobileClose }) {
  return (
    <React.Fragment>
      {mobileOpen && (
        <div className="r-sidebar-backdrop" onClick={onMobileClose} style={{
          display: 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99,
        }}/>
      )}
    <aside className={"r-sidebar" + (mobileOpen ? " r-sidebar--open" : "")} style={{
      width: 240, background: 'var(--navy-2)', borderRight: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0,
    }}>
      <div style={{ padding: '24px 22px 22px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="wm" style={{ fontSize: 22, color: 'white', display: 'flex', flexDirection: 'column' }}>
          <span>ФУРА<span className="accent">ЕДЕТ</span></span>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.32em', color: 'rgba(240,165,0,0.55)', marginTop: 3, fontFamily: 'var(--font-body)' }}>
            {role === 'admin' ? 'ADMIN' : role === 'manager' ? 'MANAGER' : 'CLIENT'}
          </span>
        </div>
      </div>
      <nav style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {items.map(it => it.divider ? (
          <div key={it.id} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', padding: '16px 12px 8px' }}>{it.divider}</div>
        ) : (
          <button key={it.id} onClick={() => onSelect(it.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              background: activeId === it.id ? 'rgba(240,165,0,0.1)' : 'transparent',
              color: activeId === it.id ? 'var(--gold)' : 'rgba(255,255,255,0.65)',
              border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, textAlign: 'left',
              fontFamily: 'var(--font-body)', position: 'relative',
              borderLeft: activeId === it.id ? '2px solid var(--gold)' : '2px solid transparent',
              transition: 'all 0.15s var(--ease-out)',
            }}
            onMouseEnter={e => { if (activeId !== it.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={e => { if (activeId !== it.id) e.currentTarget.style.background = 'transparent'; }}>
            {React.cloneElement(it.icon, { size: 17 })}
            <span style={{ flex: 1 }}>{it.label}</span>
            {it.badge && (
              <span style={{
                background: 'var(--gold)', color: 'var(--navy)',
                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)',
              }}>{it.badge}</span>
            )}
          </button>
        ))}
      </nav>
      <div style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: 'var(--gold)', color: 'var(--navy)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: 1,
        }}>{user.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>{user.email}</div>
        </div>
        <button title="Выйти" style={{
          background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer', padding: 6, borderRadius: 4,
        }}><Icon.Logout size={16}/></button>
      </div>
    </aside>
    </React.Fragment>
  );
}

function Topbar({ title, subtitle, role, onRoleChange, action, onMenu }) {
  const [search, setSearch] = React.useState('');
  return (
    <header className="r-topbar" style={{
      padding: '20px 36px', borderBottom: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', alignItems: 'center', gap: 28, background: 'var(--navy)',
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      <button onClick={onMenu} className="r-menu-btn" aria-label="Меню" style={{
        display: 'none', background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.06)',
        color: 'rgba(255,255,255,0.85)', width: 38, height: 38, borderRadius: 6, cursor: 'pointer',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <div className="r-topbar__title" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)' }}>{subtitle}</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: 1, marginTop: 2 }}>{title}</h1>
      </div>
      <div className="r-search" style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
        background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, width: 280,
      }}>
        <Icon.Search size={15} style={{ color: 'rgba(255,255,255,0.4)' }}/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск…"
          style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', flex: 1, fontSize: 13, fontFamily: 'var(--font-body)' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.3)', padding: '2px 6px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3 }}>⌘K</span>
      </div>
      {/* Role switcher (demo only) */}
      <div className="r-roles" style={{ display: 'flex', background: 'var(--navy-2)', borderRadius: 6, padding: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
        {['client', 'manager', 'admin'].map(r => (
          <button key={r} onClick={() => onRoleChange(r)} style={{
            padding: '7px 14px', background: role === r ? 'var(--gold)' : 'transparent',
            color: role === r ? 'var(--navy)' : 'rgba(255,255,255,0.55)',
            border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', fontFamily: 'var(--font-body)', cursor: 'pointer',
          }}>{r === 'client' ? 'Клиент' : r === 'manager' ? 'Менеджер' : 'Админ'}</button>
        ))}
      </div>
      <button style={{
        position: 'relative', background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.06)',
        color: 'rgba(255,255,255,0.65)', width: 38, height: 38, borderRadius: 6, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon.Bell size={16}/>
        <span style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, background: 'var(--gold)', borderRadius: '50%', border: '2px solid var(--navy-2)' }}/>
      </button>
      {action}
    </header>
  );
}

function Card({ children, style, hover, onClick, padding = 24 }) {
  const [h, setH] = React.useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => hover && setH(true)} onMouseLeave={() => setH(false)}
      style={{
        background: 'var(--navy-2)',
        border: h ? '1px solid var(--gold-line)' : '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8, padding, cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s var(--ease-out)',
        ...style,
      }}>{children}</div>
  );
}

function StatTile({ label, value, sub, trend, icon }) {
  return (
    <Card padding={22}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 6, background: 'rgba(240,165,0,0.1)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {React.cloneElement(icon, { size: 18 })}
        </div>
        {trend && (
          <span style={{ fontSize: 11, fontWeight: 700, color: trend.startsWith('+') ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-mono)' }}>{trend}</span>
        )}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, letterSpacing: 1, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>{sub}</div>}
    </Card>
  );
}

function Btn({ children, kind = 'primary', icon, onClick, size = 'md', style }) {
  const sizes = {
    sm: { padding: '7px 14px', fontSize: 11 },
    md: { padding: '10px 20px', fontSize: 11 },
    lg: { padding: '14px 28px', fontSize: 12 },
  };
  const kinds = {
    primary: { background: 'var(--gold)', color: 'var(--navy)', border: 'none' },
    ghost: { background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' },
    danger: { background: 'rgba(255,107,107,0.12)', color: 'var(--danger)', border: '1px solid rgba(255,107,107,0.3)' },
  };
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700,
      letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 6,
      fontFamily: 'var(--font-body)', cursor: 'pointer', whiteSpace: 'nowrap',
      ...sizes[size], ...kinds[kind], ...style,
    }}>{icon && React.cloneElement(icon, { size: 14 })}{children}</button>
  );
}

function Field({ label, ...rest }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>{label}</span>
      <input {...rest} style={{
        background: 'var(--navy-3)', border: '1px solid rgba(255,255,255,0.08)',
        color: 'white', padding: '11px 13px', borderRadius: 6, fontSize: 13, fontWeight: 500,
        fontFamily: 'var(--font-body)', outline: 'none',
      }} />
    </label>
  );
}

function DataTable({ columns, rows, onRowClick }) {
  return (
    <Card padding={0}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {columns.map((c, i) => (
              <th key={i} style={{
                textAlign: 'left', padding: '14px 20px',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)',
              }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} onClick={() => onRowClick && onRowClick(r)}
              style={{ borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: onRowClick ? 'pointer' : 'default' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {r.map((cell, j) => (
                <td key={j} style={{ padding: '14px 20px', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

Object.assign(window, { Sidebar, Topbar, Card, StatTile, Btn, Field, DataTable, StatusPill, RolePill });
