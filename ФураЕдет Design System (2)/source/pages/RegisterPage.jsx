import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ email: '', name: '', phone: '', password: '', password_confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [showPass2, setShowPass2] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.password_confirm) { setError('Пароли не совпадают'); return }
    setLoading(true)
    try {
      await api.post('/auth/register', {
        email: form.email, name: form.name, phone: form.phone, password: form.password,
      })
      setStep(2)
      startResendTimer()
    } catch (err) {
      const errs = err.response?.data?.errors
      if (errs) setError(Object.values(errs).flat().join('. '))
      else setError(err.response?.data?.error || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/verify-email', {
        email: form.email, code: otpCode, purpose: 'registration',
      })
      login(data.user, data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Неверный код')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    try {
      await api.post('/auth/resend-otp', { email: form.email, purpose: 'registration' })
      startResendTimer()
    } catch {}
  }

  const startResendTimer = () => {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown(prev => { if (prev <= 1) { clearInterval(interval); return 0 } return prev - 1 })
    }, 1000)
  }

  const pwStrength = (pw) => {
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[a-z]/.test(pw)) score++
    if (/\d/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    return score
  }
  const strength = pwStrength(form.password)
  const strengthLabel = ['', 'Слабый', 'Слабый', 'Средний', 'Хороший', 'Надёжный'][strength]
  const strengthColor = ['', '#F04438', '#F04438', '#F0A500', '#12B76A', '#12B76A'][strength]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'var(--font-body)' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

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
          {/* Gold accent */}
          <div style={{ height: '4px', background: 'linear-gradient(90deg, var(--gold), var(--gold2))' }} />

          <div style={{ padding: '40px 40px 44px' }}>
            {/* Step indicator */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {[1, 2].map(s => (
                <div key={s} style={{ height: '3px', flex: 1, borderRadius: '2px', background: s <= step ? 'var(--gold)' : 'var(--gray1)', transition: 'background .3s' }} />
              ))}
            </div>

            {/* Icon */}
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              {step === 1 ? (
                <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5z" stroke="var(--gold)" strokeWidth="2"/>
                  <path d="M3 21v-1a9 9 0 0 1 18 0v1" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16 9h6m-3-3v6" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
                  <rect x="2" y="4" width="20" height="16" rx="3" stroke="var(--gold)" strokeWidth="2"/>
                  <path d="m2 8 10 6 10-6" stroke="var(--gold)" strokeWidth="2" strokeLinejoin="round"/>
                  <circle cx="18" cy="18" r="5" fill="var(--navy)" stroke="var(--gold)" strokeWidth="1.5"/>
                  <path d="m16 18 1.5 1.5L20 16" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', letterSpacing: '1px', color: 'var(--navy)', marginBottom: '6px' }}>
              {step === 1 ? 'РЕГИСТРАЦИЯ' : 'ПОДТВЕРЖДЕНИЕ EMAIL'}
            </h1>
            <p style={{ color: 'var(--gray3)', fontSize: '14px', marginBottom: '28px' }}>
              {step === 1
                ? 'Создайте аккаунт для доступа к платформе'
                : <>Код отправлен на <strong style={{ color: 'var(--navy)' }}>{form.email}</strong></>}
            </p>

            {/* Error */}
            {error && (
              <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', color: 'var(--red)', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="var(--red)" strokeWidth="2"/><path d="M12 8v4m0 4h.01" stroke="var(--red)" strokeWidth="2" strokeLinecap="round"/></svg>
                {error}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleRegister}>
                {/* Name + Email row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '0' }}>
                  <AuthInput label="Имя" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Иван Иванов"
                    icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>} />
                  <AuthInput label="Телефон" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+7 999 000-00-00" required={false}
                    icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" stroke="currentColor" strokeWidth="1.8"/></svg>} />
                </div>

                <AuthInput label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="you@example.com"
                  icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="m2 8 10 6 10-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>} />

                {/* Password */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--navy)', marginBottom: '6px' }}>Пароль</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray2)', display: 'flex' }}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    </span>
                    <input type={showPass ? 'text' : 'password'} required value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Минимум 8 символов" style={inputStyle} />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={eyeBtn}>
                      {showPass ? eyeOff : eyeOn}
                    </button>
                  </div>
                  {form.password && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[1,2,3,4,5].map(i => (
                          <div key={i} style={{ height: '3px', flex: 1, borderRadius: '2px', background: i <= strength ? strengthColor : 'var(--gray1)', transition: 'all .2s' }} />
                        ))}
                      </div>
                      <p style={{ fontSize: '12px', color: strengthColor, marginTop: '4px' }}>{strengthLabel}</p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--navy)', marginBottom: '6px' }}>Повторите пароль</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray2)', display: 'flex' }}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    </span>
                    <input type={showPass2 ? 'text' : 'password'} required value={form.password_confirm}
                      onChange={(e) => setForm({ ...form, password_confirm: e.target.value })}
                      placeholder="••••••••"
                      style={{ ...inputStyle, borderColor: form.password_confirm && form.password !== form.password_confirm ? 'var(--red)' : 'var(--gray1)' }} />
                    <button type="button" onClick={() => setShowPass2(!showPass2)} style={eyeBtn}>
                      {showPass2 ? eyeOff : eyeOn}
                    </button>
                  </div>
                  {form.password_confirm && form.password !== form.password_confirm && (
                    <p style={{ fontSize: '12px', color: 'var(--red)', marginTop: '4px' }}>Пароли не совпадают</p>
                  )}
                </div>

                <button type="submit" disabled={loading} style={btnPrimary(loading)}>
                  {loading ? <Spinner /> : 'ЗАРЕГИСТРИРОВАТЬСЯ'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--gray3)', marginTop: '20px' }}>
                  Уже есть аккаунт?{' '}
                  <Link to="/login" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: '600' }}>Войти</Link>
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerify}>
                <OtpInput value={otpCode} onChange={setOtpCode} />

                <button type="submit" disabled={loading} style={{ ...btnPrimary(loading), marginTop: '24px' }}>
                  {loading ? <Spinner /> : 'ПОДТВЕРДИТЬ'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button type="button" onClick={handleResend} disabled={resendCooldown > 0}
                    style={{ background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', color: resendCooldown > 0 ? 'var(--gray2)' : 'var(--gold)', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: '500' }}>
                    {resendCooldown > 0 ? `Отправить повторно (${resendCooldown}с)` : 'Отправить код повторно'}
                  </button>
                </div>

                <button type="button" onClick={() => { setStep(1); setOtpCode(''); setError('') }}
                  style={{ width: '100%', marginTop: '10px', padding: '12px', background: 'none', border: '1.5px solid var(--gray1)', borderRadius: '12px', cursor: 'pointer', color: 'var(--gray3)', fontSize: '14px', fontFamily: 'var(--font-body)' }}>
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

/* ─── Shared helpers ─── */

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

function AuthInput({ label, type = 'text', value, onChange, placeholder, icon, required = true }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--navy)', marginBottom: '6px' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray2)', display: 'flex' }}>{icon}</span>
        <input type={type} required={required} value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...inputStyle, borderColor: focused ? 'var(--navy)' : 'var(--gray1)' }} />
      </div>
    </div>
  )
}

function OtpInput({ value, onChange }) {
  const digits = [0,1,2,3,4,5]
  const chars = value.padEnd(6, ' ')
  return (
    <div>
      <p style={{ fontSize: '13px', color: 'var(--gray3)', marginBottom: '16px', textAlign: 'center' }}>
        Введите 6-значный код из письма
      </p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        {digits.map(i => (
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
              width: '52px', height: '60px', textAlign: 'center',
              fontSize: '24px', fontFamily: 'var(--font-mono)', fontWeight: '600',
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
