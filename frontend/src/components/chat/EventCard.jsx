const SVG = (c, children) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)

const ICONS = {
  check:    (c) => SVG(c, <><polyline points="20 6 9 17 4 12"/></>),
  x:        (c) => SVG(c, <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>),
  lock:     (c) => SVG(c, <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>),
  unlock:   (c) => SVG(c, <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></>),
  bell:     (c) => SVG(c, <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>),
  user:     (c) => SVG(c, <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>),
  clock:    (c) => SVG(c, <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>),
  package:  (c) => SVG(c, <><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>),
  calendar: (c) => SVG(c, <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>),
  edit:     (c) => SVG(c, <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>),
  appeal:   (c) => SVG(c, <><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></>),
  info:     (c) => SVG(c, <><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>),
}

// color, bgOpacity, iconKey, title
// Colors matched exactly to STATUS_MAP in ClientOrders.jsx
const EVENT_CONFIG = {
  // Подтверждение заявки — confirmed: #12B76A
  order_confirmed: {
    color: '#12B76A', bg: 'rgba(18,183,106,0.13)', border: 'rgba(18,183,106,0.45)', left: '#12B76A',
    iconBg: 'rgba(18,183,106,0.22)', iconBorder: 'rgba(18,183,106,0.5)',
    title: 'Заявка подтверждена', icon: 'check',
    glow: '0 4px 20px rgba(18,183,106,0.15)',
  },
  // Отклонение — rejected: #F04438
  order_rejected: {
    color: '#F04438', bg: 'rgba(240,68,56,0.13)', border: 'rgba(240,68,56,0.45)', left: '#F04438',
    iconBg: 'rgba(240,68,56,0.22)', iconBorder: 'rgba(240,68,56,0.5)',
    title: 'Заявка отклонена', icon: 'x',
    glow: '0 4px 20px rgba(240,68,56,0.15)',
  },
  // Заявка создана — pending: #F0A500
  order_submitted: {
    color: '#F0A500', bg: 'rgba(240,165,0,0.12)', border: 'rgba(240,165,0,0.4)', left: '#F0A500',
    iconBg: 'rgba(240,165,0,0.2)', iconBorder: 'rgba(240,165,0,0.45)',
    title: 'Заявка создана', icon: 'package',
    glow: '0 4px 20px rgba(240,165,0,0.12)',
  },
  // Курьер назначен — courier_assigned: #8B5CF6
  courier_assigned_by_manager: {
    color: '#8B5CF6', bg: 'rgba(139,92,246,0.13)', border: 'rgba(139,92,246,0.45)', left: '#8B5CF6',
    iconBg: 'rgba(139,92,246,0.22)', iconBorder: 'rgba(139,92,246,0.5)',
    title: 'Назначен курьер', icon: 'user',
    glow: '0 4px 20px rgba(139,92,246,0.14)',
  },
  // Пропущен забор — missed_pickup: #F04438
  missed_pickup: {
    color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', left: '#F59E0B',
    iconBg: 'rgba(245,158,11,0.2)', iconBorder: 'rgba(245,158,11,0.45)',
    title: 'Срок забора истёк', icon: 'clock',
    glow: '0 4px 16px rgba(245,158,11,0.12)',
  },
  // Курьер заблокирован / запрос переноса
  courier_blocked: {
    color: '#F79009', bg: 'rgba(247,144,9,0.12)', border: 'rgba(247,144,9,0.4)', left: '#F79009',
    iconBg: 'rgba(247,144,9,0.2)', iconBorder: 'rgba(247,144,9,0.45)',
    title: 'Запрос на перенос', icon: 'bell',
    glow: '0 4px 16px rgba(247,144,9,0.12)',
  },
  // Перенос подтверждён — зелёный
  reschedule_confirmed: {
    color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.4)', left: '#10b981',
    iconBg: 'rgba(16,185,129,0.2)', iconBorder: 'rgba(16,185,129,0.45)',
    title: 'Перенос подтверждён', icon: 'calendar',
    glow: '0 4px 16px rgba(16,185,129,0.13)',
  },
  // Данные обновлены — accepted: #2E90FA
  form_edited: {
    color: '#2E90FA', bg: 'rgba(46,144,250,0.12)', border: 'rgba(46,144,250,0.4)', left: '#2E90FA',
    iconBg: 'rgba(46,144,250,0.2)', iconBorder: 'rgba(46,144,250,0.45)',
    title: 'Данные обновлены', icon: 'edit',
    glow: '0 4px 16px rgba(46,144,250,0.12)',
  },
  // Апелляция — #818CF8
  appeal_submitted: {
    color: '#818CF8', bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.4)', left: '#818CF8',
    iconBg: 'rgba(129,140,248,0.22)', iconBorder: 'rgba(129,140,248,0.5)',
    title: 'Апелляция подана', icon: 'appeal',
    glow: '0 4px 16px rgba(129,140,248,0.13)',
  },
  // Чат закрыт — amber
  chat_archived: {
    color: '#F59E0B', bg: 'rgba(245,158,11,0.11)', border: 'rgba(245,158,11,0.38)', left: '#F59E0B',
    iconBg: 'rgba(245,158,11,0.2)', iconBorder: 'rgba(245,158,11,0.42)',
    title: 'Чат закрыт', icon: 'lock',
    glow: '0 4px 14px rgba(245,158,11,0.10)',
  },
  // Чат разблокирован — green
  chat_unarchived: {
    color: '#12B76A', bg: 'rgba(18,183,106,0.11)', border: 'rgba(18,183,106,0.38)', left: '#12B76A',
    iconBg: 'rgba(18,183,106,0.2)', iconBorder: 'rgba(18,183,106,0.42)',
    title: 'Чат разблокирован', icon: 'unlock',
    glow: '0 4px 14px rgba(18,183,106,0.10)',
  },
}

// Нейтральные bot-сообщения без event — серый стиль
const FALLBACK = {
  color: '#94A3B8', bg: 'rgba(148,163,184,0.07)', border: 'rgba(148,163,184,0.22)', left: '#475569',
  iconBg: 'rgba(148,163,184,0.12)', iconBorder: 'rgba(148,163,184,0.25)',
  title: 'Уведомление', icon: 'info',
  glow: 'none',
}

export function EventCard({ msg }) {
  const event = msg.metadata?.event
  const c     = EVENT_CONFIG[event] ?? FALLBACK
  const time  = new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
      <div style={{
        maxWidth:     520,
        width:        '100%',
        background:   c.bg,
        border:       `1px solid ${c.border}`,
        borderLeft:   `4px solid ${c.left}`,
        borderRadius: 12,
        padding:      '14px 16px',
        boxShadow:    c.glow,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: c.iconBg, border: `1px solid ${c.iconBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {ICONS[c.icon]?.(c.color)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.color, letterSpacing: '0.01em' }}>
              {c.title}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3, lineHeight: 1.5, wordBreak: 'break-word' }}>
              {msg.body}
            </div>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', alignSelf: 'flex-end', flexShrink: 0, paddingBottom: 2 }}>
            {time}
          </div>
        </div>
      </div>
    </div>
  )
}
