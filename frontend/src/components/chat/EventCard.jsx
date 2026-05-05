const EVENT_CONFIG = {
  order_confirmed: {
    color:  '#12B76A',
    bg:     'rgba(18,183,106,0.08)',
    border: 'rgba(18,183,106,0.35)',
    left:   '#12B76A',
    title:  'Заявка подтверждена',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#12B76A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    iconBg: 'rgba(18,183,106,0.15)',
    iconBorder: 'rgba(18,183,106,0.35)',
  },
  chat_archived: {
    color:  '#F59E0B',
    bg:     'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.35)',
    left:   '#F59E0B',
    title:  'Чат закрыт',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    iconBg: 'rgba(245,158,11,0.15)',
    iconBorder: 'rgba(245,158,11,0.35)',
  },
  chat_unarchived: {
    color:  '#12B76A',
    bg:     'rgba(18,183,106,0.08)',
    border: 'rgba(18,183,106,0.35)',
    left:   '#12B76A',
    title:  'Чат разблокирован',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#12B76A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
      </svg>
    ),
    iconBg: 'rgba(18,183,106,0.15)',
    iconBorder: 'rgba(18,183,106,0.35)',
  },
  appeal_submitted: {
    color:  '#818CF8',
    bg:     'rgba(129,140,248,0.08)',
    border: 'rgba(129,140,248,0.35)',
    left:   '#818CF8',
    title:  'Апелляция подана',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
    iconBg: 'rgba(129,140,248,0.15)',
    iconBorder: 'rgba(129,140,248,0.35)',
  },
}

export function EventCard({ msg }) {
  const event = msg.metadata?.event
  const cfg   = EVENT_CONFIG[event]
  if (!cfg) return null

  const managerName = msg.metadata?.manager_name
  const time = new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
      <div style={{
        maxWidth:     520,
        width:        '100%',
        background:   cfg.bg,
        border:       `1px solid ${cfg.border}`,
        borderLeft:   `4px solid ${cfg.left}`,
        borderRadius: 12,
        padding:      '14px 16px',
        boxShadow:    `0 2px 10px ${cfg.bg}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width:          30,
            height:         30,
            borderRadius:   '50%',
            background:     cfg.iconBg,
            border:         `1px solid ${cfg.iconBorder}`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
          }}>
            {cfg.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>
              {cfg.title}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2, lineHeight: 1.45 }}>
              {msg.body}
            </div>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', alignSelf: 'flex-end', flexShrink: 0 }}>
            {time}
          </div>
        </div>
      </div>
    </div>
  )
}
