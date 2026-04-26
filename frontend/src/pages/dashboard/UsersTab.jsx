import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

const ROLE_LABELS = { client: 'Клиент', manager: 'Менеджер', admin: 'Администратор' }
const ROLE_COLORS = {
  client: 'bg-gray-100 text-gray-700',
  manager: 'bg-blue-100 text-blue-700',
  admin: 'bg-purple-100 text-purple-700',
}

export default function UsersTab() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const { data } = await api.get('/users'); setUsers(data) } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleChangeRole = async (id, role) => {
    try { await api.post(`/users/${id}/change-role`, { role }); load() } catch (err) {
      alert(err.response?.data?.error || 'Ошибка')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить пользователя?')) return
    try { await api.delete(`/users/${id}`); load() } catch {}
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Пользователи</h2>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Загрузка...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Пользователь</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Роль</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Дата</th>
                {me?.role === 'admin' && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${ROLE_COLORS[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString('ru')}</td>
                  {me?.role === 'admin' && u.id !== me.id && (
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1 mr-2">
                        <option value="client">Клиент</option>
                        <option value="manager">Менеджер</option>
                        <option value="admin">Администратор</option>
                      </select>
                      <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:underline text-xs">Удалить</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
