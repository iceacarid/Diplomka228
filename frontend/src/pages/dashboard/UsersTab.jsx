/* eslint-disable no-empty, react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { Icons } from '../../components/Icons'
import { Card, PageHeader, StatusPill, RolePill, Loading, Empty } from '../../components/ui'

const ROLE_ORDER = { admin: 0, manager: 1, courier: 2, client: 3 }

const USER_STATUS_MAP = {
  active:   { bg: 'rgba(18,183,106,0.14)', fg: 'var(--green)', label: 'Активен' },
  inactive: { bg: 'rgba(240,68,56,0.14)',  fg: 'var(--red)',   label: 'Неактивен' },
}

const thStyle = { textAlign: 'left', padding: '14px 20px', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)' }
const tdStyle = { padding: '14px 20px', fontSize: 13, color: 'rgba(255,255,255,0.85)' }

export default function UsersTab() {
  const { user: me, updateUser } = useAuth()
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,     setSearch]     = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [sortBy,     setSortBy]     = useState('date_desc')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/users')
      setUsers(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const q = search.toLowerCase()
  const visible = users
    .filter(u => {
      if (q && !`${u.name} ${u.email}`.toLowerCase().includes(q)) return false
      if (filterRole !== 'all' && u.role !== filterRole) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'date_desc')  return new Date(b.created_at) - new Date(a.created_at)
      if (sortBy === 'date_asc')   return new Date(a.created_at) - new Date(b.created_at)
      if (sortBy === 'alpha_asc')  return a.name.localeCompare(b.name, 'ru')
      if (sortBy === 'alpha_desc') return b.name.localeCompare(a.name, 'ru')
      if (sortBy === 'role')       return (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9)
      return 0
    })

  const handleChangeRole = async (id, role) => {
    try {
      await api.post(`/users/${id}/change-role`, { role })
      if (id === me?.id) {
        // Own role changed — refresh from server so redirect fires immediately
        const { data } = await api.get('/auth/me')
        updateUser(data)
      } else {
        load()
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить пользователя?')) return
    try {
      await api.delete(`/users/${id}`)
      load()
    } catch {}
  }

  return (
    <div style={{ padding: '0 0 40px' }}>
      <PageHeader eyebrow="Управление" title="Пользователи" />

      <div style={{ padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Search + filters */}
        <Card padding={14} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 220 }}>
            <Icons.Search size={14} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по имени или email..."
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: 13, fontFamily: 'var(--font-body)', flex: 1 }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>✕</button>
            )}
          </div>

          {/* Role filter */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['all','Все'], ['admin','Админ'], ['manager','Менеджер'], ['courier','Курьер'], ['client','Клиент']].map(([v, l]) => (
              <button key={v} onClick={() => setFilterRole(v)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer', border: filterRole === v ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)', background: filterRole === v ? 'rgba(240,165,0,0.12)' : 'transparent', color: filterRole === v ? 'var(--gold)' : 'rgba(255,255,255,0.5)' }}>{l}</button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ background: 'var(--navy-3)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', padding: '6px 10px', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-body)', cursor: 'pointer', outline: 'none' }}
          >
            <option value="date_desc">Сначала новые</option>
            <option value="date_asc">Сначала старые</option>
            <option value="alpha_asc">А → Я</option>
            <option value="alpha_desc">Я → А</option>
            <option value="role">По роли</option>
          </select>

          {(search || filterRole !== 'all') && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
              {visible.length} из {users.length}
            </div>
          )}
        </Card>

        {loading ? (
          <Loading />
        ) : visible.length === 0 ? (
          <Empty text={users.length === 0 ? 'Пользователей нет' : 'Ничего не найдено'} />
        ) : (
          <Card padding={0}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th style={thStyle}>Пользователь</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Роль</th>
                  <th style={thStyle}>Статус</th>
                  <th style={thStyle}>Дата</th>
                  {me?.role === 'admin' && <th style={thStyle}></th>}
                </tr>
              </thead>
              <tbody>
                {visible.map((u, i) => (
                  <tr
                    key={u.id}
                    style={{ borderBottom: i < visible.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%',
                          background: 'var(--gold)', color: 'var(--navy)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: 0.5, flexShrink: 0,
                        }}>
                          {u.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                        </div>
                        <span style={{ fontWeight: 500 }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                      {u.email}
                    </td>
                    <td style={tdStyle}>
                      <RolePill role={u.role} />
                    </td>
                    <td style={tdStyle}>
                      <StatusPill status={u.is_active ? 'active' : 'inactive'} map={USER_STATUS_MAP} />
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      {new Date(u.created_at).toLocaleDateString('ru')}
                    </td>
                    {me?.role === 'admin' && u.id !== me.id && (
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          style={{
                            background: 'var(--navy-3)', border: '1px solid rgba(255,255,255,0.08)',
                            color: 'white', padding: '6px 10px', borderRadius: 4, fontSize: 11,
                            fontFamily: 'var(--font-body)', cursor: 'pointer', marginRight: 8, outline: 'none',
                          }}
                        >
                          <option value="client">Клиент</option>
                          <option value="manager">Менеджер</option>
                          <option value="admin">Администратор</option>
                          <option value="courier">Курьер</option>
                        </select>
                        <button
                          onClick={() => handleDelete(u.id)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.06em' }}
                        >
                          Удалить
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  )
}
