/* eslint-disable no-empty */
import { useState } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { Icons } from '../components/Icons'
import OrdersTab from './dashboard/OrdersTab'
import DriversTab from './dashboard/DriversTab'
import TrucksTab from './dashboard/TrucksTab'
import ProfileTab from './dashboard/ProfileTab'
import AiTab from './dashboard/AiTab'
import TariffsTab from './dashboard/TariffsTab'
import UsersTab from './dashboard/UsersTab'
import ClientHome from './dashboard/ClientHome'
import ClientOrders from './dashboard/ClientOrders'
import ClientNewOrder from './dashboard/ClientNewOrder'
import ClientSupport from './dashboard/ClientSupport'
import ClientChats from './dashboard/ClientChats'
import ManagerChats from './dashboard/ManagerChats'
import ManagerHome from './dashboard/ManagerHome'
import AdminHome from './dashboard/AdminHome'
import AdminAppeals from './dashboard/AdminAppeals'
import AdminCouriers from './dashboard/AdminCouriers'
import WarehousesTab from './dashboard/WarehousesTab'
import AcceptedOrdersTab from './dashboard/AcceptedOrdersTab'
import CourierDashboard from './dashboard/CourierDashboard'
import WarehouseDashboard from './dashboard/WarehouseDashboard'
import DriverDashboard from './dashboard/DriverDashboard'
import KeeperHome from './dashboard/KeeperHome'
import KeeperOrders from './dashboard/KeeperOrders'
import KeeperHistory from './dashboard/KeeperHistory'
import BlockedScreen from '../components/BlockedScreen'

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

const ROLE_LABEL = {
  client:           'CLIENT',
  manager:          'MANAGER',
  admin:            'ADMIN',
  courier:          'COURIER',
  warehouse_keeper: 'КЛАДОВЩИК',
  driver:           'ВОДИТЕЛЬ',
}

const STAFF_NAV = [
  { to: '/dashboard',         label: 'Сводка',          icon: 'Home',     roles: ['manager', 'admin'], end: true },
  { to: '/dashboard/orders',          label: 'Заказы',           icon: 'Package',  roles: ['client', 'manager', 'admin'] },
  { to: '/dashboard/accepted-orders', label: 'Принятые заказы',  icon: 'Check',    roles: ['manager', 'admin'] },
  { to: '/dashboard/drivers',         label: 'Водители',         icon: 'User',     roles: ['manager', 'admin'] },
  { to: '/dashboard/trucks',  label: 'Транспорт',      icon: 'Truck',    roles: ['manager', 'admin'] },
  { to: '/dashboard/tariffs', label: 'Тарифы',         icon: 'Wallet',   roles: ['admin'] },
  { to: '/dashboard/users',   label: 'Пользователи',   icon: 'Users',    roles: ['manager', 'admin'] },
  { to: '/dashboard/chats',    label: 'Чаты',           icon: 'Chat',     roles: ['manager', 'admin'] },
  { to: '/dashboard/warehouses',label: 'Склады',          icon: 'Boxes',    roles: ['manager', 'admin'] },
  { to: '/dashboard/appeals',  label: 'Апелляции',      icon: 'LifeBuoy', roles: ['admin'] },
  { to: '/dashboard/couriers', label: 'Курьеры',         icon: 'User',     roles: ['manager', 'admin'] },
  { to: '/dashboard/ai',      label: 'AI Оптимизация', icon: 'Sparkles', roles: ['manager', 'admin'] },
  { to: '/dashboard/profile', label: 'Профиль',        icon: 'Settings', roles: ['client', 'manager', 'admin'] },
]

const CLIENT_NAV = [
  { to: '/dashboard',             label: 'Сводка',       icon: 'Home',     end: true },
  { to: '/dashboard/my-orders',   label: 'Мои заявки',   icon: 'Package'  },
  { to: '/dashboard/new-order',   label: 'Новая заявка', icon: 'Plus'     },
  { to: '/dashboard/profile',     label: 'Профиль',      icon: 'Settings' },
  { to: '/dashboard/support',     label: 'Поддержка',    icon: 'LifeBuoy' },
  { to: '/dashboard/chats',       label: 'Чаты',         icon: 'Chat'     },
]

const COURIER_NAV = [
  { to: '/dashboard',         label: 'Мои заказы', icon: 'Package', end: true },
  { to: '/dashboard/profile', label: 'Профиль',    icon: 'Settings' },
]

const KEEPER_NAV = [
  { to: '/dashboard',                    label: 'Сводка',          icon: 'Home',    end: true },
  { to: '/dashboard/warehouse-orders',   label: 'Заказы склада',   icon: 'Package' },
  { to: '/dashboard/operations',         label: 'Приёмка / Рейсы', icon: 'Boxes'   },
  { to: '/dashboard/history',            label: 'История склада',  icon: 'Clock'   },
  { to: '/dashboard/profile',            label: 'Профиль',         icon: 'Settings' },
]

const DRIVER_NAV = [
  { to: '/dashboard',         label: 'Мои рейсы', icon: 'Truck',   end: true },
  { to: '/dashboard/profile', label: 'Профиль',   icon: 'Settings' },
]

function SidebarLink({ item }) {
  const [hovered, setHovered] = useState(false)
  const IconComp = Icons[item.icon]
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        background: isActive ? 'rgba(240,165,0,0.10)' : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        color: isActive ? 'var(--gold)' : 'rgba(255,255,255,0.65)',
        textDecoration: 'none',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 500,
        fontFamily: 'var(--font-body)',
        borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
        transition: 'all 0.15s var(--ease-out)',
      })}
    >
      {IconComp && <IconComp size={17} />}
      <span>{item.label}</span>
    </NavLink>
  )
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [logoutHover, setLogoutHover] = useState(false)

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch {}
    logout()
    navigate('/login')
  }

  if (user?.is_blocked) return <BlockedScreen />

  const role = user?.role
  const isClient  = role === 'client'
  const isCourier = role === 'courier'
  const isKeeper  = role === 'warehouse_keeper'
  const isDriver  = role === 'driver'
  const isStaff   = !isClient && !isCourier && !isKeeper && !isDriver

  const navItems = isClient  ? CLIENT_NAV
    : isCourier ? COURIER_NAV
    : isKeeper  ? KEEPER_NAV
    : isDriver  ? DRIVER_NAV
    : STAFF_NAV.filter(item => item.roles.includes(role))

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--navy)', overflow: 'hidden' }}>
      <aside style={{
        width: 240,
        background: 'var(--navy-2)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
      }}>
        <div style={{ padding: '24px 22px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <a href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'white', letterSpacing: '0.1em', cursor: 'pointer' }}>
              ФУРА<span style={{ color: 'var(--gold)' }}>ЕДЕТ</span>
            </div>
          </a>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.32em', color: 'rgba(240,165,0,0.55)', marginTop: 3, fontFamily: 'var(--font-body)', textTransform: 'uppercase' }}>
            {ROLE_LABEL[user?.role] || 'CLIENT'}
          </div>
        </div>

        <nav style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {navItems.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </nav>

        <div style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--gold)', color: 'var(--navy)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: 1, flexShrink: 0,
          }}>
            {getInitials(user?.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Выйти"
            onMouseEnter={() => setLogoutHover(true)}
            onMouseLeave={() => setLogoutHover(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: logoutHover ? 'var(--red)' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 4,
              display: 'flex',
              transition: 'color 0.15s',
            }}
          >
            <Icons.Logout size={16} />
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', background: 'var(--navy)' }}>
        <Routes>
          {isClient ? (
            <>
              <Route path="my-orders"  element={<ClientOrders />} />
              <Route path="new-order"  element={<ClientNewOrder />} />
              <Route path="profile"    element={<ProfileTab />} />
              <Route path="support"    element={<ClientSupport />} />
              <Route path="chats"      element={<ClientChats />} />
              <Route index             element={<ClientHome />} />
            </>
          ) : isCourier ? (
            <>
              <Route path="profile" element={<ProfileTab />} />
              <Route index          element={<CourierDashboard />} />
            </>
          ) : isKeeper ? (
            <>
              <Route path="profile"            element={<ProfileTab />} />
              <Route path="warehouse-orders"   element={<KeeperOrders />} />
              <Route path="operations"         element={<WarehouseDashboard />} />
              <Route path="history"            element={<KeeperHistory />} />
              <Route index                     element={<KeeperHome />} />
            </>
          ) : isDriver ? (
            <>
              <Route path="profile" element={<ProfileTab />} />
              <Route index          element={<DriverDashboard />} />
            </>
          ) : (
            <>
              <Route path="orders"  element={<OrdersTab />} />
              <Route path="drivers" element={<DriversTab />} />
              <Route path="trucks"  element={<TrucksTab />} />
              <Route path="tariffs" element={<TariffsTab />} />
              <Route path="users"   element={<UsersTab />} />
              <Route path="chats"   element={<ManagerChats />} />
              <Route path="warehouses"      element={<WarehousesTab />} />
              <Route path="accepted-orders" element={<AcceptedOrdersTab />} />
              <Route path="appeals"  element={<AdminAppeals />} />
              <Route path="couriers" element={<AdminCouriers />} />
              <Route path="ai"      element={<AiTab />} />
              <Route path="profile" element={<ProfileTab />} />
              <Route index element={
                role === 'manager' ? <ManagerHome /> : <AdminHome />
              } />
            </>
          )}
        </Routes>
      </main>
    </div>
  )
}
