import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: email, 2: otp + new pass
  const [email, setEmail] = useState('')
  const [form, setForm] = useState({ code: '', new_password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [showPass2, setShowPass2] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpCode, setOtpCode] = useState('')

  const handleRequest = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/password-reset', { email })
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (e) => {
    e.preventDefault()
    setError('')
    if (form.new_password !== form.confirm) { setError('Пароли не совпадают'); return }
    setLoading(true)
    try {
      await api.post('/auth/password-reset/confirm', {
        email, code: otpCode, new_password: form.new_password,
      })
      navigate('/login')
    } catch (err) {
      const errs = err.response?.data?.errors
      if (errs) setError(Object.values(errs).flat().join('. '))
      else setError(err.response?.data?.error || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'var(--font-body)' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--navy)', letterSpacing: '2px' }}>
              ФУРА<span style={{ color: 'var(--gold)' }}>ЕДЕТ</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: '24px', boxShadow: '0 8px 48px rgba(10,22,40,0.10)', overflow: 'hidden' }}>
          <div style={{ height: '4px', background: 'linear-gradient(90deg, var(--gold), var(--gold2))' }} />

          <div style={{ padding: '40px 40px 44px' }}>
            {/* Step bar */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {[1, 2].map(s => (
                <div key={s} style={{ height: '3px', flex: 1, borderRadius: '2px', background: s <= step ? 'var(--gold)' : 'var(--gray1)', transition: 'background .3s' }} />
              ))}
            </div>

            {/* Icon */}
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              {step === 1 ? (
                <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="var(--gold)" strokeWidth="2"/>
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 15v2" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="19" cy="5" r="4" fill="var(--gold)" fillOpacity=".2" stroke="var(--gold)" strokeWidth="1.5"/>
                  <path d="M19 4v1.5l1 1" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="var(--gold)" strokeWidth="2"/>
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M9 16l2 2 4-4" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', letterSpacing: '1px', color: 'var(--navy)', marginBottom: '6px' }}>
              {step === 1 ? 'ВОССТАНОВЛЕНИЕ\nПАРОЛЯ' : 'НОВЫЙ ПАРОЛЬ'}
            </h1>
            <p style={{ color: 'var(--gray3)', fontSize: '14px', marginBottom: '28px', lineHeight: '1.5' }}>
              {step === 1
                ? 'Введите email — мы отправим код для сброса пароля'
                : <>Код отправлен на <strong style={{ color: 'var(--navy)' }}>{email}</strong></>}
            </p>

            {/* Error */}
            {error && (
              <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', color: 'var(--red)', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="var(--red)" strokeWidth="2"/><path d="M12 8v4m0 4h.01" stroke="var(--red)" strokeWidth="2" strokeLinecap="round"/></svg>
                {error}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleRequest}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--navy)', marginBottom: '6px' }}>Email</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray2)', display: 'flex' }}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="m2 8 10 6 10-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                    </span>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com" style={inputStyle} />
                  </div>
                </div>

                <button type="submit" disabled={loading} style={btnPrimary(loading)}>
                  {loading ? <Spinner /> : 'ОТПРАВИТЬ КОД'}
                </button>

                <Link to="/login" style={{ display: 'block', textAlign: 'center', marginTop: '16px', fontSize: '14px', color: 'var(--gray3)', textDecoration: 'none' }}>
                  ← Назад к входу
                </Link>
              </form>
            ) : (
              <form onSubmit={handleConfirm}>
                <OtpInput value={otpCode} onChange={setOtpCode} />

                {/* New password */}
                <div style={{ marginTop: '24px', marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--navy)', marginBottom: '6px' }}>Новый пароль</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray2)', display: 'flex' }}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    </span>
                    <input type={showPass ? 'text' : 'password'} required value={form.new_password}
                      onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                      placeholder="Минимум 8 символов" style={inputStyle} />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={eyeBtn}>
                      {showPass ? eyeOff : eyeOn}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--navy)', marginBottom: '6px' }}>Повторите пароль</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray2)', display: 'flex' }}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    </span>
                    <input type={showPass2 ? 'text' : 'password'} required value={form.confirm}
                      onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                      placeholder="••••••••"
                      style={{ ...inputStyle, borderColor: form.confirm && form.new_password !== form.confirm ? 'var(--red)' : 'var(--gray1)' }} />
                    <button type="button" onClick={() => setShowPass2(!showPass2)} style={eyeBtn}>
                      {showPass2 ? eyeOff : eyeOn}
                    </button>
                  </div>
                  {form.confirm && form.new_password !== form.confirm && (
                    <p style={{ fontSize: '12px', color: 'var(--red)', marginTop: '4px' }}>Пароли не совпадают</p>
                  )}
                </div>

                <button type="submit" disabled={loading} style={btnPrimary(loading)}>
                  {loading ? <Spinner /> : 'СОХРАНИТЬ ПАРОЛЬ'}
                </button>

                <button type="button" onClick={() => { setStep(1); setOtpCode(''); setError('') }}
                  style={{ width: '100%', marginTop: '12px', padding: '12px', background: 'none', border: '1.5px solid var(--gray1)', borderRadius: '12px', cursor: 'pointer', color: 'var(--gray3)', fontSize: '14px', fontFamily: 'var(--font-body)' }}>
                  ← Назад
                </button>
              </form>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--gray2)', marginTop: '24px' }}>
          © 2024 ФураЕдет. Все права защищены.
        </p>
      </div>
    </div>
  )
}

/* ─── Shared ─── */

const inputStyle = {
  width: '100%', border: '1.5px solid var(--gray1)', borderRadius: '12px',
  padding: '12px 44px', fontSize: '15px', fontFamily: 'var(--font-body)',
  color: 'var(--navy)', outline: 'none', transition: 'border-color .2s',
  background: '#fff', boxSizing: 'border-box',
}

const eyeBtn = {
  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray2)', display: 'flex',
}

const eyeOn = <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
const eyeOff = <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>

function OtpInput({ value, onChange }) {
  const chars = value.padEnd(6, ' ')
  return (
    <div>
      <p style={{ fontSize: '13px', color: 'var(--gray3)', marginBottom: '16px', textAlign: 'center' }}>
        Введите 6-значный код из письма
      </p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        {[0,1,2,3,4,5].map(i => (
          <input key={i} type="text" inputMode="numeric" maxLength={1}
            value={chars[i] === ' ' ? '' : chars[i]}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '')
              const arr = value.padEnd(6, ' ').split('')
              arr[i] = val.slice(-1) || ' '
              onChange(arr.join('').trimEnd())
              if (val && e.target.nextElementSibling) e.target.nextElementSibling.focus()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !chars[i]?.trim() && e.target.previousElementSibling)
                e.target.previousElementSibling.focus()
            }}
            style={{
              width: '48px', height: '56px', textAlign: 'center',
              fontSize: '22px', fontFamily: 'var(--font-mono)', fontWeight: '600',
              border: `1.5px solid ${chars[i]?.trim() ? 'var(--navy)' : 'var(--gray1)'}`,
              borderRadius: '12px', color: 'var(--navy)', outline: 'none',
              background: chars[i]?.trim() ? 'var(--gold-dim)' : '#fff', transition: 'all .15s',
            }} />
        ))}
      </div>
    </div>
  )
}

function btnPrimary(loading) {
  return {
    width: '100%', padding: '14px', background: loading ? 'var(--navy3)' : 'var(--navy)',
    color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700',
    letterSpacing: '1.5px', cursor: loading ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', transition: 'background .2s',
  }
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}
