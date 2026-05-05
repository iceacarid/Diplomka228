import { Icons } from '../Icons'

const STATUS_STYLE = {
  active:   { color: '#12B76A', label: 'Активен' },
  archived: { color: 'rgba(255,255,255,0.3)', label: 'Архив' },
}

// Pulse animation injected once
if (typeof document !== 'undefined' && !document.getElementById('flagged-pulse-style')) {
  const s = document.createElement('style')
  s.id = 'flagged-pulse-style'
  s.textContent = `
    @keyframes flagPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(251,191,36,0.5); }
      50%       { box-shadow: 0 0 0 5px rgba(251,191,36,0); }
    }
    .chat-flagged-icon { animation: flagPulse 1.8s ease-in-out infinite; }
  `
  document.head.appendChild(s)
}

export function ChatListItem({ chat, isActive, onClick }) {
  const ss       = STATUS_STYLE[chat.status] ?? STATUS_STYLE.active
  const isArch   = chat.status === 'archived'
  const isFlagged = !!chat.flagged
  const unread   = chat.unread_count ?? 0

  return (
    <div
      onClick={onClick}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          12,
        padding:      '12px 16px',
        cursor:       'pointer',
        background:   isActive
          ? 'rgba(240,165,0,0.08)'
          : isFlagged
            ? 'rgba(251,191,36,0.06)'
            : 'transparent',
        borderLeft:   isActive
          ? '2px solid var(--gold)'
          : isFlagged
            ? '3px solid #FBBF24'
            : '2px solid transparent',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        transition:   'background 0.15s',
        opacity:      isArch && !isFlagged ? 0.6 : 1,
        position:     'relative',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = isFlagged ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.03)' }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isFlagged ? 'rgba(251,191,36,0.06)' : 'transparent' }}
    >
      {/* Иконка */}
      <div
        className={isFlagged ? 'chat-flagged-icon' : undefined}
        style={{
          width:          38,
          height:         38,
          borderRadius:   '50%',
          background:     isFlagged
            ? 'rgba(251,191,36,0.18)'
            : isArch
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(240,165,0,0.1)',
          border:         isFlagged ? '1px solid rgba(251,191,36,0.5)' : 'none',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          color:          isFlagged ? '#FBBF24' : isArch ? 'rgba(255,255,255,0.3)' : 'var(--gold)',
          flexShrink:     0,
        }}
      >
        {isFlagged ? <Icons.Bell size={17} /> : <Icons.Chat size={17} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
            color: isFlagged ? '#FBBF24' : isArch ? 'rgba(255,255,255,0.5)' : 'var(--gold)',
          }}>
            {chat.order?.tracking_id ?? `#${chat.order_id}`}
          </span>
          {isFlagged && (
            <span style={{
              fontSize: 8, letterSpacing: '0.08em', fontWeight: 700,
              color: '#FBBF24',
              background: 'rgba(251,191,36,0.12)',
              border: '1px solid rgba(251,191,36,0.35)',
              borderRadius: 3, padding: '1px 5px',
              whiteSpace: 'nowrap',
            }}>
              ТРЕБУЕТ ВНИМАНИЯ
            </span>
          )}
          {isArch && !isFlagged && (
            <span style={{ fontSize: 8, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, padding: '1px 5px' }}>
              АРХИВ
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: isFlagged ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {chat.manager ? `Менеджер: ${chat.manager.name}` : 'Ожидает менеджера'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: isFlagged ? '#FBBF24' : ss.color }}>
          {isFlagged ? 'Разблокирован' : ss.label}
        </span>
        {unread > 0 && (
          <span style={{
            background:     isFlagged ? '#FBBF24' : 'var(--gold)',
            color:          'var(--navy)',
            borderRadius:   '50%',
            width:          18, height: 18,
            display:        'flex', alignItems: 'center', justifyContent: 'center',
            fontSize:       9, fontWeight: 700,
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </div>
    </div>
  )
}
