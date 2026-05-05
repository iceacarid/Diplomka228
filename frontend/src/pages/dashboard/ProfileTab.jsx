/* eslint-disable no-empty */
import { useState } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { Icons } from '../../components/Icons'
import { Card, Btn, Field, PageHeader, Alert, RolePill } from '../../components/ui'

export default function ProfileTab({ compact = false }) {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [passwords, setPasswords] = useState({ old_password: '', new_password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [twoFaLoading, setTwoFaLoading] = useState(false)
  const [showPass, setShowPass] = useState({ old: false, new: false, confirm: false })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setP = (k) => (e) => setPasswords((f) => ({ ...f, [k]: e.target.value }))

  const handleProfile = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)
    try {
      const { data } = await api.patch('/auth/me', form)
      updateUser(data)
      setSuccess('Профиль обновлён')
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка')
    }
    setLoading(false)
  }

  const handlePassword = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (passwords.new_password !== passwords.confirm) { setError('Пароли не совпадают'); return }
    setLoading(true)
    try {
      await api.patch('/auth/me', {
        old_password: passwords.old_password,
        new_password: passwords.new_password,
      })
      setSuccess('Пароль изменён')
      setPasswords({ old_password: '', new_password: '', confirm: '' })
    } catch (err) {
      const errs = err.response?.data
      setError(errs?.old_password?.[0] || errs?.new_password?.[0] || 'Ошибка')
    }
    setLoading(false)
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const fd = new FormData()
    fd.append('avatar', file)
    try {
      const { data } = await api.patch('/auth/me', fd, {
        headers: { 'Content-Type': undefined },
      })
      updateUser(data)
    } catch (err) {
      setError(err?.response?.data?.message || 'Ошибка загрузки аватара')
    }
  }

  const handleToggle2FA = async () => {
    const action = user?.two_factor_enabled ? 'disable' : 'enable'
    setTwoFaLoading(true)
    try {
      const { data } = await api.post('/auth/2fa/request', { action })
      alert(data.message)
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка')
    }
    setTwoFaLoading(false)
  }

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'

  return (
    <div style={{ padding: compact ? 0 : '0 0 40px' }}>
      {!compact && <PageHeader eyebrow="Аккаунт" title="Профиль" />}

      <div style={{ padding: compact ? 0 : '0 32px', maxWidth: compact ? '100%' : 600, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <Card padding={22}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="avatar"
                  style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }}
                />
              ) : (
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'var(--gold)', color: 'var(--navy)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 1,
                }}>
                  {initials}
                </div>
              )}
              <label style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, background: 'var(--navy-3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Icons.Edit size={11} style={{ color: 'rgba(255,255,255,0.7)' }} />
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </label>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 0.5, marginBottom: 4 }}>{user?.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{user?.email}</div>
              <RolePill role={user?.role} />
            </div>
          </div>
        </Card>

        <Card padding={22}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>
            Данные
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 0.5, marginBottom: 16 }}>Личные данные</h3>
          <form onSubmit={handleProfile} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Имя" value={form.name} onChange={set('name')} />
            <Field label="Телефон" value={form.phone} onChange={set('phone')} />
            <div>
              <Btn type="submit" disabled={loading}>
                {loading ? 'Сохраняем...' : 'Сохранить'}
              </Btn>
            </div>
          </form>
        </Card>

        <Card padding={22}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>
            Безопасность
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 0.5, marginBottom: 16 }}>Смена пароля</h3>
          <form onSubmit={handlePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <PasswordField label="Текущий пароль" value={passwords.old_password} onChange={setP('old_password')} show={showPass.old} onToggle={() => setShowPass((s) => ({ ...s, old: !s.old }))} />
            <PasswordField label="Новый пароль" value={passwords.new_password} onChange={setP('new_password')} show={showPass.new} onToggle={() => setShowPass((s) => ({ ...s, new: !s.new }))} />
            <PasswordField label="Повторите пароль" value={passwords.confirm} onChange={setP('confirm')} show={showPass.confirm} onToggle={() => setShowPass((s) => ({ ...s, confirm: !s.confirm }))} />
            <div>
              <Btn type="submit" disabled={loading}>Сменить пароль</Btn>
            </div>
          </form>
        </Card>

        <Card padding={22}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>
            2FA
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 0.5, marginBottom: 8 }}>Двухфакторная аутентификация</h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 16 }}>
            {user?.two_factor_enabled
              ? '2FA включена. При входе будет отправляться код на email.'
              : '2FA выключена. Включите для дополнительной защиты аккаунта.'}
          </p>
          <Btn
            kind={user?.two_factor_enabled ? 'danger' : 'ghost'}
            onClick={handleToggle2FA}
            disabled={twoFaLoading}
            icon={<Icons.Shield size={14} />}
          >
            {twoFaLoading ? '...' : user?.two_factor_enabled ? 'Отключить 2FA' : 'Включить 2FA'}
          </Btn>
        </Card>
      </div>
    </div>
  )
}

function PasswordField({ label, value, onChange, show, onToggle }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)' }}>
        {label}
      </span>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          style={{
            background: 'var(--navy-3)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'white', padding: '11px 40px 11px 13px', borderRadius: 6, fontSize: 13,
            fontWeight: 500, fontFamily: 'var(--font-body)', outline: 'none', width: '100%',
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex' }}
        >
          {show ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
        </button>
      </div>
    </label>
  )
}
