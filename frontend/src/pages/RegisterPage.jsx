/* eslint-disable no-empty */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', name: '', phone: '', password: '', password_confirm: '' })

  const formatPhone = (raw) => {
    const digits = raw.replace(/\D/g, '')
    const d = digits.startsWith('7') || digits.startsWith('8') ? digits.slice(1) : digits
    let out = '+7'
    if (d.length > 0) out += ' (' + d.slice(0, 3)
    if (d.length >= 3) out += ') ' + d.slice(3, 6)
    if (d.length >= 6) out += '-' + d.slice(6, 8)
    if (d.length >= 8) out += '-' + d.slice(8, 10)
    return out
  }
  const [showPass, setShowPass] = useState(false)
  const [showPass2, setShowPass2] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    if (!form.name.trim() || form.name.trim().length < 2) {
      setError('Введите имя (минимум 2 символа)')
      return
    }
    if (form.phone) {
      const digits = form.phone.replace(/\D/g, '')
      if (digits.length < 10 || digits.length > 11) {
        setError('Введите корректный номер телефона (+7 XXX XXX-XX-XX)')
        return
      }
    }
    if (form.password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов')
      return
    }
    if (form.password !== form.password_confirm) { setError('Пароли не совпадают'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', {
        email: form.email, name: form.name, phone: form.phone, password: form.password,
      })
      login(data.user, data.token)
      navigate('/dashboard')
    } catch (err) {
      const errs = err.response?.data?.errors
      if (errs) {
        setFieldErrors(errs)
        // общая ошибка только если нет конкретных полей
        const nonFieldErrs = Object.entries(errs)
          .filter(([k]) => !['email','name','phone','password'].includes(k))
          .flatMap(([,v]) => v)
        if (nonFieldErrs.length) setError(nonFieldErrs.join('. '))
      } else {
        setError(err.response?.data?.error || 'Ошибка регистрации')
      }
    } finally {
      setLoading(false)
    }
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
            {/* Icon */}
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5z" stroke="var(--gold)" strokeWidth="2"/>
                <path d="M3 21v-1a9 9 0 0 1 18 0v1" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 9h6m-3-3v6" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', letterSpacing: '1px', color: 'var(--navy)', marginBottom: '6px' }}>
              РЕГИСТРАЦИЯ
            </h1>
            <p style={{ color: 'var(--gray3)', fontSize: '14px', marginBottom: '28px' }}>
              Создайте аккаунт для доступа к платформе
            </p>

            {/* Error */}
            {error && (
              <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', color: 'var(--red)', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="var(--red)" strokeWidth="2"/><path d="M12 8v4m0 4h.01" stroke="var(--red)" strokeWidth="2" strokeLinecap="round"/></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleRegister}>
              {/* Name + Phone row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '0' }}>
                <AuthInput label="Имя" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Иван Иванов"
                  icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>} />
                <AuthInput label="Телефон" value={form.phone} onChange={(v) => setForm({ ...form, phone: formatPhone(v) })} placeholder="+7 (999) 000-00-00" required={false}
                  icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" stroke="currentColor" strokeWidth="1.8"/></svg>} />
              </div>

              <AuthInput label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="you@example.com"
                icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="m2 8 10 6 10-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>} />
              {fieldErrors.email && <div style={{ color: 'var(--red)', fontSize: 11, marginTop: -8, marginBottom: 8 }}>{fieldErrors.email[0]}</div>}

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
                {fieldErrors.password && fieldErrors.password.map((e, i) => (
                  <div key={i} style={{ color: 'var(--red)', fontSize: 11, marginTop: 4 }}>{e}</div>
                ))}
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
