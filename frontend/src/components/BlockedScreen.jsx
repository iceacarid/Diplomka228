import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Icons } from './Icons'
import api from '../api/axios'

export default function BlockedScreen() {
  const { user, logout } = useAuth()

  const [body,       setBody]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(user?.has_block_appeal ?? false)
  const [error,      setError]      = useState('')

  const handleSubmit = async () => {
    if (body.trim().length < 10) {
      setError('Апелляция должна содержать минимум 10 символов.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await api.post('/users/block-appeal', { body: body.trim() })
      setSubmitted(true)
    } catch (err) {
      const msg = err.response?.data?.error
      if (err.response?.status === 409) {
        setSubmitted(true)
      } else {
        setError(msg || 'Ошибка при отправке. Попробуйте позже.')
      }
    }
    setSubmitting(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--navy)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: 'var(--navy-2)',
        border: '1px solid rgba(240,68,56,0.25)',
        borderRadius: 16,
        padding: '32px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {/* Icon + title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(240,68,56,0.12)',
            border: '1px solid rgba(240,68,56,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icons.Lock size={26} style={{ color: '#F04438' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#F04438', marginBottom: 8 }}>
              Аккаунт заблокирован
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 6 }}>
              Доступ ограничен
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              Ваш аккаунт был заблокирован администратором. Вы не можете пользоваться сервисом до снятия блокировки.
            </div>
          </div>
        </div>

        {/* Block reason */}
        {user?.block_reason && (
          <div style={{
            background: 'rgba(240,68,56,0.08)',
            border: '1px solid rgba(240,68,56,0.2)',
            borderRadius: 10,
            padding: '12px 14px',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F04438', marginBottom: 6 }}>
              Причина блокировки
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
              {user.block_reason}
            </div>
          </div>
        )}

        {/* Appeal section */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>
            Апелляция на снятие блокировки
          </div>

          {/* One-time warning */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            background: 'rgba(240,165,0,0.08)',
            border: '1px solid rgba(240,165,0,0.2)',
            borderRadius: 8, padding: '10px 12px',
            marginBottom: 14,
          }}>
            <Icons.Shield size={13} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 11, color: 'rgba(240,165,0,0.85)', lineHeight: 1.55 }}>
              <strong>Апелляцию можно подать только один раз.</strong> Внимательно опишите ситуацию — повторная подача невозможна.
            </div>
          </div>

          {submitted ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(18,183,106,0.1)',
              border: '1px solid rgba(18,183,106,0.25)',
              borderRadius: 10, padding: '14px 16px',
            }}>
              <Icons.Check size={16} style={{ color: 'var(--green)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', marginBottom: 2 }}>
                  Апелляция подана
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                  Ваша апелляция передана администратору. Ожидайте решения. Повторная подача невозможна.
                </div>
              </div>
            </div>
          ) : (
            <>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Объясните, почему блокировка должна быть снята. Минимум 10 символов..."
                rows={4}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 9, padding: '12px 14px',
                  color: 'white', fontSize: 13,
                  fontFamily: 'var(--font-body)',
                  outline: 'none', resize: 'vertical',
                  lineHeight: 1.6,
                }}
              />
              {error && (
                <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 6 }}>{error}</div>
              )}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  marginTop: 10, width: '100%',
                  padding: '13px', borderRadius: 10, border: 'none',
                  background: submitting ? 'rgba(240,165,0,0.3)' : 'var(--gold)',
                  color: submitting ? 'rgba(255,255,255,0.4)' : 'var(--navy)',
                  fontSize: 14, fontWeight: 700,
                  cursor: submitting ? 'wait' : 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {submitting ? 'Отправляем...' : 'Подать апелляцию'}
              </button>
            </>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={async () => { try { await api.post('/auth/logout') } catch {} logout() }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '11px', borderRadius: 9,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}
        >
          <Icons.Logout size={14} /> Выйти из аккаунта
        </button>
      </div>
    </div>
  )
}
