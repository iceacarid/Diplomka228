import { BotQuestionForm } from './BotQuestionForm'
import { FormSubmissionCard } from './FormSubmissionCard'
import { RejectionCard } from './RejectionCard'
import { EventCard } from './EventCard'
import { useAuth } from '../../context/AuthContext'

const ROLE_CONFIG = {
  bot: {
    bubble: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' },
    text:   { color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' },
    label:  null,
  },
  admin: {
    bubble: { background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)', borderLeft: '3px solid #dc2626' },
    text:   { color: 'rgba(255,255,255,0.9)' },
    label:  { text: 'АДМИНИСТРАТОР', color: '#dc2626' },
  },
  manager: {
    bubble: { background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' },
    text:   { color: 'rgba(255,255,255,0.9)' },
    label:  null,
  },
  client: {
    bubble: { background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.2)' },
    text:   { color: 'rgba(255,255,255,0.9)' },
    label:  null,
  },
}

export function MessageBubble({ msg, isArchived, canWrite, onFormSubmit, onFormUpdate, orderData, chatId }) {
  const { user }  = useAuth()
  const cfg       = ROLE_CONFIG[msg.sender_role] ?? ROLE_CONFIG.client
  const isBot     = msg.sender_role === 'bot'
  const isMine    = msg.is_mine
  const showForm  = msg.type === 'bot_greeting' && canWrite && !isArchived && user?.role === 'client'
  const isFormCard = msg.type === 'form_submission'

  const time = new Date(msg.created_at).toLocaleTimeString('ru-RU', {
    hour: '2-digit', minute: '2-digit',
  })

  if (msg.metadata?.event === 'order_rejected') {
    return <RejectionCard msg={msg} />
  }

  const EVENT_TYPES = ['order_confirmed', 'chat_archived', 'appeal_submitted', 'chat_unarchived']
  if (EVENT_TYPES.includes(msg.metadata?.event)) {
    return <EventCard msg={msg} />
  }

  // form_submission — показываем карточку без обычного bubble
  if (isFormCard) {
    return (
      <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
        <FormSubmissionCard msg={msg} chatId={chatId} onUpdate={onFormUpdate} />
      </div>
    )
  }

  return (
    <div style={{
      display:        'flex',
      justifyContent: isBot ? 'center' : isMine ? 'flex-end' : 'flex-start',
      marginBottom:   10,
      opacity:        isArchived ? 0.65 : 1,
    }}>
      <div style={{
        maxWidth:     isBot ? '92%' : '72%',
        padding:      '9px 13px',
        borderRadius: 10,
        fontSize:     13,
        lineHeight:   1.55,
        wordBreak:    'break-word',
        ...cfg.bubble,
        ...cfg.text,
      }}>
        {cfg.label && (
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: cfg.label.color, marginBottom: 5 }}>
            {cfg.label.text}
          </div>
        )}
        {!isMine && !isBot && msg.sender_name && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
            {msg.sender_name}
          </div>
        )}
        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.body}</div>
        {showForm && (
          <BotQuestionForm
            onSubmit={onFormSubmit}
            disabled={!canWrite}
            orderData={orderData}
            chatId={chatId}
          />
        )}
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 5, textAlign: 'right' }}>
          {time}
        </div>
      </div>
    </div>
  )
}
