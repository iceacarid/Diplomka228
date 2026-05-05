import { useRef, useEffect, useState } from 'react'

const ORDER_STATUS_LABEL = {
  draft:            'Черновик',
  pending:          'На рассмотрении',
  in_progress:      'В работе',
  confirmed:        'Подтверждено',
  courier_assigned: 'Курьер назначен',
  picked_up:        'Курьер в дороге',
  at_warehouse:     'Груз на складе',
  missed_pickup:    '⚠ Пропущен забор',
  shipped:          'В пути',
  delivered:        'Доставлено',
  rejected:         'Отклонено',
}
import { useChatPolling } from '../../hooks/useChatPolling'
import { useAuth } from '../../context/AuthContext'
import { MessageBubble } from './MessageBubble'
import { OrderDocument } from './OrderDocument'
import { Icons } from '../Icons'

export function ChatWindow({ chatId, onClose }) {
  const { user }                        = useAuth()
  const bottomRef                       = useRef(null)
  const inputRef                        = useRef(null)
  const appealRef                       = useRef(null)
  const [sending, setSending]           = useState(false)
  const [inputError, setInputError]     = useState(null)
  const [actionLoading, setAction]      = useState(null)
  const [actionError, setActionError]   = useState(null)
  const [showAppealForm, setAppealForm]     = useState(false)
  const [appealLoading, setAppealLoad]      = useState(false)
  const [appealError, setAppealError]       = useState(null)
  const [showReschedule, setShowReschedule] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [rescheduleLoading, setReschLoad]   = useState(false)
  const [rescheduleError, setReschError]    = useState(null)

  const { messages, canWrite, chatMeta, loading, error, send, updateMessage, confirmOrder, archiveChat, submitAppeal, reschedulePickup } = useChatPolling(chatId, !!chatId)
  const [showDoc, setShowDoc] = useState(false)

  const isArchived    = chatMeta?.status === 'archived'
  const isConfirmed   = chatMeta?.order_status === 'confirmed'
  const isMissedPickup = chatMeta?.order_status === 'missed_pickup'
  const hasAppeal     = chatMeta?.has_appeal ?? false
  const formMsg       = messages.find(m => m.type === 'form_submission')
  const orderData     = chatMeta?.order_data ?? {}

  const canManage = user?.role === 'admin' || user?.role === 'manager'

  const handleConfirm = async () => {
    setAction('confirm'); setActionError(null)
    try { await confirmOrder() } catch (e) { setActionError(e?.response?.data?.error || 'Ошибка') }
    finally { setAction(null) }
  }

  const handleArchive = async () => {
    setAction('archive'); setActionError(null)
    try { await archiveChat() } catch (e) { setActionError(e?.response?.data?.error || 'Ошибка') }
    finally { setAction(null) }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = async () => {
    const body = inputRef.current?.value?.trim()
    if (!body) return
    setSending(true)
    setInputError(null)
    try {
      await send(body)
      inputRef.current.value = ''
    } catch (e) {
      setInputError(e?.response?.data?.error || 'Ошибка отправки')
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!chatId) return null

  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      height:        '100%',
      background:    'var(--navy)',
      borderRadius:  8,
      overflow:      'hidden',
      border:        '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Header */}
      <div style={{
        padding:      '14px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display:      'flex',
        alignItems:   'center',
        gap:          10,
        background:   'var(--navy-2)',
        flexShrink:   0,
      }}>
        <Icons.Chat size={16} style={{ color: 'var(--gold)', opacity: 0.7 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {chatMeta?.tracking_id ?? '—'}
          </div>
          {chatMeta?.order_status && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
              Заявка: {ORDER_STATUS_LABEL[chatMeta.order_status] ?? chatMeta.order_status}
            </div>
          )}
        </div>
        {isArchived && (
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.15em',
            color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3, padding: '2px 7px',
          }}>
            АРХИВ
          </span>
        )}
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}>
            <Icons.X size={16} />
          </button>
        )}
      </div>

      {/* Баннер подтверждения */}
      {isConfirmed && formMsg && (
        <div style={{ background: 'rgba(18,183,106,0.08)', borderBottom: '1px solid rgba(18,183,106,0.15)', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: '#12B76A', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icons.Check size={13} /> Заявка подтверждена
          </span>
          <button
            onClick={() => setShowDoc(true)}
            style={{ fontSize: 11, padding: '4px 12px', borderRadius: 5, border: '1px solid rgba(18,183,106,0.3)', background: 'rgba(18,183,106,0.1)', color: '#12B76A', cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Icons.Package size={12} /> Открыть документ
          </button>
        </div>
      )}

      {/* Сообщения */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>
        {loading && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: 24 }}>
            Загрузка...
          </div>
        )}
        {error && (
          <div style={{ textAlign: 'center', color: 'var(--red)', fontSize: 12, padding: 24 }}>
            {error}
          </div>
        )}
        {!loading && messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isArchived={isArchived}
            canWrite={canWrite}
            onFormSubmit={send}
            onFormUpdate={updateMessage}
            orderData={chatMeta?.order_data}
            chatId={chatId}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Тулбар менеджера */}
      {canManage && !isArchived && !loading && (
        <div style={{
          padding:    '8px 12px',
          borderTop:  '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.2)',
          display:    'flex',
          gap:        8,
          flexShrink: 0,
          alignItems: 'center',
        }}>
          {!isConfirmed && (
            <button
              onClick={handleConfirm}
              disabled={!!actionLoading}
              style={{
                padding:    '6px 14px', borderRadius: 6,
                background: actionLoading === 'confirm' ? 'rgba(18,183,106,0.3)' : 'rgba(18,183,106,0.15)',
                border:     '1px solid rgba(18,183,106,0.4)',
                color:      '#12B76A', fontSize: 12, fontWeight: 600,
                cursor:     actionLoading ? 'wait' : 'pointer',
                display:    'flex', alignItems: 'center', gap: 6,
                fontFamily: 'var(--font-body)',
              }}
            >
              <Icons.Check size={13} />
              {actionLoading === 'confirm' ? 'Подтверждение...' : 'Подтвердить заявку'}
            </button>
          )}
          <button
            onClick={handleArchive}
            disabled={!!actionLoading}
            style={{
              padding:    '6px 14px', borderRadius: 6,
              background: actionLoading === 'archive' ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.1)',
              border:     '1px solid rgba(245,158,11,0.35)',
              color:      '#F59E0B', fontSize: 12, fontWeight: 600,
              cursor:     actionLoading ? 'wait' : 'pointer',
              display:    'flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-body)',
            }}
          >
            <Icons.Lock size={13} />
            {actionLoading === 'archive' ? 'Закрытие...' : 'Закрыть чат'}
          </button>
          {isMissedPickup && (
            <button
              onClick={() => { setShowReschedule(true); setReschError(null) }}
              style={{
                padding:    '6px 14px', borderRadius: 6,
                background: 'rgba(240,68,56,0.12)',
                border:     '1px solid rgba(240,68,56,0.35)',
                color:      '#F04438', fontSize: 12, fontWeight: 600,
                cursor:     'pointer',
                display:    'flex', alignItems: 'center', gap: 6,
                fontFamily: 'var(--font-body)',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Назначить новую дату
            </button>
          )}
          {actionError && (
            <span style={{ fontSize: 11, color: '#ef4444', marginLeft: 4 }}>{actionError}</span>
          )}
        </div>
      )}

      {/* Ввод */}
      {canWrite ? (
        <div style={{
          padding:    '10px 12px',
          borderTop:  '1px solid rgba(255,255,255,0.06)',
          background: 'var(--navy-2)',
          flexShrink: 0,
        }}>
          {inputError && (
            <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 6 }}>{inputError}</div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              rows={2}
              placeholder="Написать сообщение... (Enter — отправить, Shift+Enter — перенос)"
              onKeyDown={handleKeyDown}
              style={{
                flex:       1,
                resize:     'none',
                borderRadius: 6,
                padding:    '9px 11px',
                background: 'rgba(255,255,255,0.05)',
                color:      '#fff',
                border:     '1px solid rgba(255,255,255,0.1)',
                fontSize:   13,
                fontFamily: 'var(--font-body)',
                outline:    'none',
                lineHeight: 1.5,
              }}
            />
            <button
              onClick={handleSend}
              disabled={sending}
              style={{
                padding:      '10px 16px',
                borderRadius: 6,
                background:   sending ? 'rgba(240,165,0,0.5)' : 'var(--gold)',
                color:        'var(--navy)',
                border:       'none',
                cursor:       sending ? 'wait' : 'pointer',
                fontWeight:   700,
                fontSize:     16,
                lineHeight:   1,
                flexShrink:   0,
                height:       54,
              }}
            >
              <Icons.Arrow size={16} />
            </button>
          </div>
        </div>
      ) : !loading && (
        <div style={{
          borderTop:  '1px solid rgba(255,255,255,0.06)',
          background: 'var(--navy-2)',
          flexShrink: 0,
        }}>
          {/* Уведомление "Чат закрыт" */}
          {isArchived && (
            <div style={{
              display:     'flex',
              alignItems:  'center',
              gap:         10,
              padding:     '12px 18px',
              borderBottom: hasAppeal || (user?.role === 'client' && !hasAppeal)
                ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(245,158,11,0.12)',
                border: '1px solid rgba(245,158,11,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icons.Lock size={13} style={{ color: '#F59E0B' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>Чат закрыт</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                  Переписка завершена. Новые сообщения недоступны.
                </div>
              </div>
            </div>
          )}

          {/* Блок апелляции для клиента */}
          {isArchived && user?.role === 'client' && (
            hasAppeal ? (
              <div style={{
                padding:    '12px 18px',
                display:    'flex', alignItems: 'center', gap: 8,
                fontSize:   12, color: '#818CF8',
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Апелляция подана — ожидайте ответа администратора
              </div>
            ) : !showAppealForm ? (
              /* Кнопка "Подать апелляцию" — на всю ширину */
              <button
                onClick={() => setAppealForm(true)}
                style={{
                  display:    'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width:      '100%', padding: '14px 18px',
                  background: 'rgba(129,140,248,0.08)',
                  border:     'none',
                  borderTop:  '1px solid rgba(129,140,248,0.18)',
                  color:      '#818CF8', fontSize: 13, fontWeight: 700,
                  cursor:     'pointer', fontFamily: 'var(--font-body)',
                  letterSpacing: '0.02em',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(129,140,248,0.14)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(129,140,248,0.08)'}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                  <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
                </svg>
                Подать апелляцию
              </button>
            ) : (
              /* Инлайн-форма апелляции */
              <div style={{ padding: '14px 18px' }}>
                {/* Предупреждение */}
                <div style={{
                  display:      'flex', gap: 10, alignItems: 'flex-start',
                  background:   'rgba(245,158,11,0.07)',
                  border:       '1px solid rgba(245,158,11,0.2)',
                  borderRadius: 8, padding: '10px 12px', marginBottom: 12,
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                    <strong style={{ color: '#F59E0B' }}>Внимание:</strong> апелляцию можно подать только один раз.
                    Пожалуйста, отнеситесь к этому серьёзно и подробно опишите вашу ситуацию.
                  </div>
                </div>

                <textarea
                  ref={appealRef}
                  rows={4}
                  placeholder="Подробно опишите ситуацию..."
                  style={{
                    width:        '100%', resize: 'vertical',
                    borderRadius: 8, padding: '10px 12px',
                    background:   'rgba(255,255,255,0.04)',
                    color:        '#fff',
                    border:       '1px solid rgba(129,140,248,0.25)',
                    fontSize:     13, fontFamily: 'var(--font-body)',
                    outline:      'none', lineHeight: 1.55, boxSizing: 'border-box',
                  }}
                />

                {appealError && (
                  <div style={{ fontSize: 11, color: '#ef4444', marginTop: 6 }}>{appealError}</div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => { setAppealForm(false); setAppealError(null) }}
                    disabled={appealLoading}
                    style={{
                      padding: '8px 16px', borderRadius: 7,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.55)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)',
                    }}
                  >
                    Отмена
                  </button>
                  <button
                    onClick={async () => {
                      const body = appealRef.current?.value?.trim()
                      if (!body) { setAppealError('Опишите ситуацию.'); return }
                      setAppealError(null); setAppealLoad(true)
                      try {
                        await submitAppeal(body)
                        setAppealForm(false)
                      } catch (e) {
                        setAppealError(e?.response?.data?.error || 'Ошибка отправки.')
                      } finally {
                        setAppealLoad(false)
                      }
                    }}
                    disabled={appealLoading}
                    style={{
                      padding:    '8px 20px', borderRadius: 7,
                      background: appealLoading ? 'rgba(129,140,248,0.4)' : 'rgba(129,140,248,0.85)',
                      border:     'none', color: '#fff',
                      fontSize:   13, fontWeight: 700,
                      cursor:     appealLoading ? 'wait' : 'pointer',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {appealLoading ? 'Отправка...' : 'Подать апелляцию'}
                  </button>
                </div>
              </div>
            )
          )}

          {/* Не клиент + архив */}
          {!(isArchived && user?.role === 'client') && (
            <div style={{ padding: '12px 18px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
              {isArchived ? '' : 'Нет доступа к отправке сообщений'}
            </div>
          )}
        </div>
      )}

      {showDoc && formMsg && (
        <OrderDocument
          chatMeta={chatMeta}
          formData={formMsg.metadata}
          onClose={() => setShowDoc(false)}
        />
      )}

      {/* Reschedule modal */}
      {showReschedule && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 16px',
        }} onClick={() => setShowReschedule(false)}>
          <div style={{
            background: '#1A1A35', borderRadius: 16, padding: '24px 22px',
            width: '100%', maxWidth: 460,
            border: '1px solid rgba(255,255,255,0.1)',
          }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Назначить новую дату</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  Заявка {chatMeta?.tracking_id}
                </div>
              </div>
              <button onClick={() => setShowReschedule(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4 }}>×</button>
            </div>

            {/* Order info */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10, padding: '12px 14px', marginBottom: 16,
              display: 'flex', flexDirection: 'column', gap: 7,
            }}>
              {[
                ['Статус',         ORDER_STATUS_LABEL[chatMeta?.order_status] ?? chatMeta?.order_status, '#F04438'],
                ['Отправление',    orderData.origin_address],
                ['Доставка',       orderData.dest_address],
                ['Вес',            orderData.weight ? `${orderData.weight} кг` : null],
                ['Объём',          orderData.volume ? `${orderData.volume} м³` : null],
                ['Тип груза',      orderData.cargo_type_custom || orderData.cargo_type],
                ['Стоимость',      orderData.price ? `${Number(orderData.price).toLocaleString('ru')} ₽` : null],
                ['Дата забора',    orderData.pickup_date ? `${orderData.pickup_date}${orderData.pickup_time ? ' ' + orderData.pickup_time : ''}` : 'Не указана', 'rgba(255,255,255,0.35)'],
                ['Причина',        orderData.courier_blocked_reason, '#F59E0B'],
              ].filter(([, v]) => v).map(([label, value, color]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', flexShrink: 0, paddingTop: 1 }}>
                    {label}
                  </span>
                  <span style={{ fontSize: 12, color: color ?? 'rgba(255,255,255,0.8)', textAlign: 'right', wordBreak: 'break-word' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Date + time pickers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>
                  Новая дата *
                </div>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={e => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 8, padding: '9px 11px', color: 'white', fontSize: 13,
                    outline: 'none', colorScheme: 'dark', fontFamily: 'var(--font-body)',
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>
                  Время
                </div>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={e => setRescheduleTime(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 8, padding: '9px 11px', color: 'white', fontSize: 13,
                    outline: 'none', colorScheme: 'dark', fontFamily: 'var(--font-body)',
                  }}
                />
              </div>
            </div>

            {rescheduleError && (
              <div style={{ fontSize: 12, color: '#F04438', marginBottom: 10 }}>{rescheduleError}</div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowReschedule(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 9,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: 'rgba(255,255,255,0.5)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >
                Отмена
              </button>
              <button
                disabled={!rescheduleDate || rescheduleLoading}
                onClick={async () => {
                  if (!rescheduleDate) return
                  setReschLoad(true); setReschError(null)
                  try {
                    await reschedulePickup(orderData.id, rescheduleDate, rescheduleTime)
                    setShowReschedule(false)
                    setRescheduleDate(''); setRescheduleTime('')
                  } catch (e) {
                    setReschError(e?.response?.data?.error || 'Ошибка подтверждения')
                  } finally {
                    setReschLoad(false)
                  }
                }}
                style={{
                  flex: 2, padding: '12px', borderRadius: 9, border: 'none',
                  background: (!rescheduleDate || rescheduleLoading) ? 'rgba(18,183,106,0.3)' : '#12B76A',
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: (!rescheduleDate || rescheduleLoading) ? 'default' : 'pointer',
                  fontFamily: 'var(--font-body)',
                  opacity: (!rescheduleDate || rescheduleLoading) ? 0.5 : 1,
                }}
              >
                {rescheduleLoading ? 'Подтверждение...' : 'Подтвердить перенос'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
