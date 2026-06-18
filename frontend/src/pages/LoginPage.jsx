import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [twoFactor, setTwoFactor] = useState(false)
  const [otpCode, setOtpCode] = useState('')

  // Push history entry when 2FA screen opens so browser back works correctly
  useEffect(() => {
    if (!twoFactor) return
    window.history.pushState({ step: '2fa' }, '')
    const onPop = () => { setTwoFactor(false); setError(''); setOtpCode('') }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [twoFactor])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      if (data.two_factor_required) {
        setTwoFactor(true)
      } else {
        login(data.user, data.token)
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/2fa/verify', { email: form.email, code: otpCode })
      login(data.user, data.token)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Неверный код')
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
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          boxShadow: '0 8px 48px rgba(10,22,40,0.10)',
          overflow: 'hidden',
        }}>
          {/* Gold accent strip */}
          <div style={{ height: '4px', background: 'linear-gradient(90deg, var(--gold), var(--gold2))' }} />

          <div style={{ padding: '40px 40px 44px' }}>
            {/* Icon */}
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px',
              background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '20px',
            }}>
              {twoFactor ? (
                <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="var(--gold)" strokeWidth="2"/>
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="16" r="1.5" fill="var(--gold)"/>
                </svg>
              ) : (
                <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="4" stroke="var(--gold)" strokeWidth="2"/>
                  <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </div>

            {/* Title */}
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', letterSpacing: '1px', color: 'var(--navy)', marginBottom: '6px' }}>
              {twoFactor ? 'ДВУХФАКТОРНАЯ\nАУТЕНТИФИКАЦИЯ' : 'ВХОД В СИСТЕМУ'}
            </h1>
            <p style={{ color: 'var(--gray3)', fontSize: '14px', marginBottom: '28px', lineHeight: '1.5' }}>
              {twoFactor
                ? <>Код отправлен на <strong style={{ color: 'var(--navy)' }}>{form.email}</strong></>
                : 'Введите данные вашего аккаунта'}
            </p>

            {/* Error */}
            {error && (
              <div style={{
                background: '#FFF0F0', border: '1px solid #FFCDD2', color: 'var(--red)',
                borderRadius: '10px', padding: '12px 16px', fontSize: '13px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="var(--red)" strokeWidth="2"/><path d="M12 8v4m0 4h.01" stroke="var(--red)" strokeWidth="2" strokeLinecap="round"/></svg>
                {error}
              </div>
            )}

            {!twoFactor ? (
              <form onSubmit={handleSubmit}>
                <AuthInput
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(v) => setForm({ ...form, email: v })}
                  placeholder="you@example.com"
                  icon={
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="m2 8 10 6 10-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                  }
                />

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--navy)' }}>Пароль</label>
                    <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--gold)', textDecoration: 'none', fontWeight: '500' }}>
                      Забыли пароль?
                    </Link>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray2)', display: 'flex' }}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    </span>
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      style={inputStyle}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray2)', display: 'flex' }}>
                      {showPass
                        ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                        : <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
                      }
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} style={btnPrimary(loading)}>
                  {loading ? <Spinner /> : 'ВОЙТИ'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--gray3)', marginTop: '20px' }}>
                  Нет аккаунта?{' '}
                  <Link to="/register" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: '600' }}>
                    Зарегистрироваться
                  </Link>
                </p>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit}>
                {/* OTP boxes */}
                <OtpInput value={otpCode} onChange={setOtpCode} />

                <button type="submit" disabled={loading} style={{ ...btnPrimary(loading), marginTop: '24px' }}>
                  {loading ? <Spinner /> : 'ПОДТВЕРДИТЬ'}
                </button>

                <button type="button" onClick={() => window.history.back()}
                  style={{ width: '100%', marginTop: '12px', padding: '12px', background: 'none', border: '1.5px solid var(--gray1)', borderRadius: '12px', cursor: 'pointer', color: 'var(--gray3)', fontSize: '14px', fontFamily: 'var(--font-body)', transition: 'border-color .2s' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--navy)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--gray1)'}
                >
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
  width: '100%',
  border: '1.5px solid var(--gray1)',
  borderRadius: '12px',
  padding: '12px 44px',
  fontSize: '15px',
  fontFamily: 'var(--font-body)',
  color: 'var(--navy)',
  outline: 'none',
  transition: 'border-color .2s',
  background: '#fff',
  boxSizing: 'border-box',
}

function AuthInput({ label, type = 'text', value, onChange, placeholder, icon }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--navy)', marginBottom: '6px' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray2)', display: 'flex' }}>
          {icon}
        </span>
        <input
          type={type}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ ...inputStyle, borderColor: focused ? 'var(--navy)' : 'var(--gray1)' }}
        />
      </div>
    </div>
  )
}

function OtpInput({ value, onChange }) {
  const containerRef = useRef(null)
  const digits = [0,1,2,3,4,5]
  const chars = value.padEnd(6, '')

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    onChange(pasted)
    const inputs = containerRef.current?.querySelectorAll('input')
    if (inputs) inputs[Math.min(pasted.length, 5)]?.focus()
  }

  return (
    <div>
      <p style={{ fontSize: '13px', color: 'var(--gray3)', marginBottom: '16px', textAlign: 'center' }}>
        Введите 6-значный код подтверждения
      </p>
      <div ref={containerRef} style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        {digits.map(i => (
          <input
            key={i}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={chars[i] === ' ' ? '' : chars[i]}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '')
              const arr = value.padEnd(6, '').split('')
              arr[i] = val.slice(-1)
              onChange(arr.join('').replace(/\s/g, ''))
              if (val && e.target.nextElementSibling) e.target.nextElementSibling.focus()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !chars[i] && e.target.previousElementSibling)
                e.target.previousElementSibling.focus()
            }}
            onPaste={handlePaste}
            style={{
              width: '48px', height: '56px', textAlign: 'center',
              fontSize: '22px', fontFamily: 'var(--font-mono)', fontWeight: '600',
              border: `1.5px solid ${chars[i] && chars[i] !== ' ' ? 'var(--navy)' : 'var(--gray1)'}`,
              borderRadius: '12px', color: 'var(--navy)', outline: 'none',
              background: chars[i] && chars[i] !== ' ' ? 'var(--gold-dim)' : '#fff',
              transition: 'all .15s',
            }}
          />
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
