import { useState } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import OrdersTab from './dashboard/OrdersTab'
import DriversTab from './dashboard/DriversTab'
import TrucksTab from './dashboard/TrucksTab'
import ProfileTab from './dashboard/ProfileTab'
import AiTab from './dashboard/AiTab'
import TariffsTab from './dashboard/TariffsTab'
import UsersTab from './dashboard/UsersTab'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch {}
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/dashboard/orders', label: 'Заказы', icon: '📦', roles: ['client', 'manager', 'admin'] },
    { to: '/dashboard/drivers', label: 'Водители', icon: '🧑‍✈️', roles: ['manager', 'admin'] },
    { to: '/dashboard/trucks', label: 'Транспорт', icon: '🚚', roles: ['manager', 'admin'] },
    { to: '/dashboard/tariffs', label: 'Тарифы', icon: '💰', roles: ['admin'] },
    { to: '/dashboard/users', label: 'Пользователи', icon: '👥', roles: ['manager', 'admin'] },
    { to: '/dashboard/ai', label: 'AI Оптимизация', icon: '🤖', roles: ['manager', 'admin'] },
    { to: '/dashboard/profile', label: 'Профиль', icon: '👤', roles: ['client', 'manager', 'admin'] },
  ].filter((item) => item.roles.includes(user?.role))

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`bg-blue-900 text-white flex flex-col transition-all duration-200 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="flex items-center justify-between p-4 border-b border-blue-700">
          {sidebarOpen && <span className="font-bold text-lg">ФураЕдет</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-blue-300 hover:text-white p-1">
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* User info */}
        {sidebarOpen && (
          <div className="px-4 py-3 border-b border-blue-700">
            <div className="flex items-center gap-3">
              <img src={user?.avatar_url || '/default-avatar.png'} alt="avatar"
                className="w-9 h-9 rounded-full object-cover bg-blue-700" />
              <div className="overflow-hidden">
                <p className="font-semibold text-sm truncate">{user?.name}</p>
                <p className="text-blue-300 text-xs capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm
                 ${isActive ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`
              }>
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-blue-700">
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-blue-200 hover:bg-blue-800 hover:text-white transition text-sm">
            <span className="text-lg">🚪</span>
            {sidebarOpen && <span>Выйти</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="orders" element={<OrdersTab />} />
          <Route path="drivers" element={<DriversTab />} />
          <Route path="trucks" element={<TrucksTab />} />
          <Route path="tariffs" element={<TariffsTab />} />
          <Route path="users" element={<UsersTab />} />
          <Route path="ai" element={<AiTab />} />
          <Route path="profile" element={<ProfileTab />} />
          <Route index element={<OrdersTab />} />
        </Routes>
      </main>
    </div>
  )
}
