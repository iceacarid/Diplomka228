import { useRef, useState } from 'react'

export function AppealModal({ trackingId, onClose, onSubmit }) {
  const textRef           = useRef(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    const body = textRef.current?.value?.trim()
    if (!body) { setError('Опишите ситуацию.'); return }
    setError(null)
    setLoading(true)
    try {
      await onSubmit(body)
      onClose()
    } catch (e) {
      setError(e?.response?.data?.error || 'Ошибка отправки.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position:       'fixed', inset: 0,
      background:     'rgba(0,0,0,0.65)',
      display:        'flex', alignItems: 'center', justifyContent: 'center',
      zIndex:         1000,
      backdropFilter: 'blur(3px)',
    }}>
      <div style={{
        background:   'var(--navy-2)',
        border:       '1px solid rgba(129,140,248,0.3)',
        borderTop:    '3px solid #818CF8',
        borderRadius: 14,
        padding:      '28px 28px 24px',
        width:        460,
        maxWidth:     'calc(100vw - 32px)',
        boxShadow:    '0 8px 40px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
              <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#818CF8', fontFamily: 'var(--font-display)', letterSpacing: 0.5 }}>
              Апелляция
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              {trackingId} · Администратор рассмотрит ситуацию
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 10, lineHeight: 1.55 }}>
          Опишите, почему вы не согласны с закрытием чата. Приложите все детали ситуации.
        </div>

        <textarea
          ref={textRef}
          rows={5}
          placeholder="Опишите ситуацию подробно..."
          style={{
            width:        '100%',
            resize:       'vertical',
            borderRadius: 8,
            padding:      '10px 12px',
            background:   'rgba(255,255,255,0.04)',
            color:        '#fff',
            border:       '1px solid rgba(255,255,255,0.1)',
            fontSize:     13,
            fontFamily:   'var(--font-body)',
            outline:      'none',
            lineHeight:   1.5,
            boxSizing:    'border-box',
          }}
        />

        {error && (
          <div style={{ fontSize: 11, color: '#ef4444', marginTop: 8 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding:      '9px 18px', borderRadius: 7,
              background:   'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color:        'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding:    '9px 20px', borderRadius: 7,
              background: loading ? 'rgba(129,140,248,0.4)' : 'rgba(129,140,248,0.85)',
              border:     'none', color: '#fff',
              fontSize:   13, fontWeight: 700,
              cursor:     loading ? 'wait' : 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            {loading ? 'Отправка...' : 'Подать апелляцию'}
          </button>
        </div>
      </div>
    </div>
  )
}
