import { useState } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

export default function ProfileTab() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [passwords, setPasswords] = useState({ old_password: '', new_password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [twoFaLoading, setTwoFaLoading] = useState(false)

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
      const { data } = await api.patch('/auth/me', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      updateUser(data)
    } catch {}
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

  const inp = 'w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Профиль</h2>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm">{success}</div>}

      {/* Avatar */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-4 flex items-center gap-4">
        <img src={user?.avatar_url} alt="avatar" className="w-16 h-16 rounded-full object-cover border" />
        <div>
          <p className="font-semibold">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <p className="text-xs text-blue-600 capitalize">{user?.role}</p>
          <label className="mt-2 block text-sm text-blue-600 cursor-pointer hover:underline">
            Сменить фото
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
        <h3 className="font-semibold mb-4">Личные данные</h3>
        <form onSubmit={handleProfile} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inp} />
          </div>
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
        <h3 className="font-semibold mb-4">Смена пароля</h3>
        <form onSubmit={handlePassword} className="space-y-3">
          <input type="password" value={passwords.old_password}
            onChange={(e) => setPasswords({ ...passwords, old_password: e.target.value })}
            placeholder="Текущий пароль" className={inp} />
          <input type="password" value={passwords.new_password}
            onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
            placeholder="Новый пароль" className={inp} />
          <input type="password" value={passwords.confirm}
            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            placeholder="Повторите пароль" className={inp} />
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
            Сменить пароль
          </button>
        </form>
      </div>

      {/* 2FA */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold mb-2">Двухфакторная аутентификация</h3>
        <p className="text-sm text-gray-500 mb-4">
          {user?.two_factor_enabled
            ? '2FA включена. При входе будет отправляться код на email.'
            : '2FA выключена. Включите для дополнительной защиты аккаунта.'}
        </p>
        <button onClick={handleToggle2FA} disabled={twoFaLoading}
          className={`px-6 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition ${
            user?.two_factor_enabled
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}>
          {twoFaLoading ? '...' : user?.two_factor_enabled ? 'Отключить 2FA' : 'Включить 2FA'}
        </button>
      </div>
    </div>
  )
}
