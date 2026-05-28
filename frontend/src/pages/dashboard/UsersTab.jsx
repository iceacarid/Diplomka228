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
  blocked:  { bg: 'rgba(240,68,56,0.22)',  fg: '#ff4444',      label: 'Заблокирован' },
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

  const [courierModal, setCourierModal]         = useState(null)
  const [warehouses,   setWarehouses]           = useState([])
  const [selectedWh,   setSelectedWh]           = useState('')
  const [whLoading,    setWhLoading]            = useState(false)
  const [courierAssigning, setCourierAssigning] = useState(false)

  const [blockModal,  setBlockModal]  = useState(null) // { user }
  const [blockReason, setBlockReason] = useState('')
  const [blockBusy,   setBlockBusy]   = useState(false)

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
    if (role === 'courier' || role === 'warehouse_keeper') {
      setSelectedWh('')
      if (warehouses.length === 0) {
        setWhLoading(true)
        try {
          const { data } = await api.get('/warehouses')
          setWarehouses(Array.isArray(data) ? data : [])
        } catch {}
        setWhLoading(false)
      }
      setCourierModal({ userId: id, role })
      return
    }
    try {
      await api.post(`/users/${id}/change-role`, { role })
      if (id === me?.id) {
        const { data } = await api.get('/auth/me')
        updateUser(data)
      } else {
        load()
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка')
    }
  }

  const confirmCourier = async () => {
    if (!selectedWh || !courierModal) return
    setCourierAssigning(true)
    try {
      await api.post(`/users/${courierModal.userId}/change-role`, { role: courierModal.role || 'courier', warehouse_id: selectedWh })
      setCourierModal(null)
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка назначения')
    }
    setCourierAssigning(false)
  }

  const openBlockModal = (u) => {
    setBlockReason('')
    setBlockModal({ user: u })
  }

  const handleBlock = async () => {
    if (!blockModal) return
    setBlockBusy(true)
    try {
      await api.post(`/users/${blockModal.user.id}/block`, { reason: blockReason || null })
      setBlockModal(null)
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка блокировки')
    }
    setBlockBusy(false)
  }

  const handleUnblock = async (u) => {
    try {
      await api.post(`/users/${u.id}/unblock`)
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка разблокировки')
    }
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
                          background: u.is_blocked ? 'rgba(240,68,56,0.35)' : 'var(--gold)',
                          color: u.is_blocked ? '#ff6b6b' : 'var(--navy)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: 0.5, flexShrink: 0,
                        }}>
                          {u.is_blocked
                            ? <Icons.Lock size={13} />
                            : (u.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?')
                          }
                        </div>
                        <div>
                          <span style={{ fontWeight: 500 }}>{u.name}</span>
                          {u.is_blocked && u.block_reason && (
                            <div style={{ fontSize: 10, color: '#ff6b6b', marginTop: 1, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {u.block_reason}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                      {u.email}
                    </td>
                    <td style={tdStyle}>
                      <RolePill role={u.role} />
                    </td>
                    <td style={tdStyle}>
                      <StatusPill
                        status={u.is_blocked ? 'blocked' : (u.is_active ? 'active' : 'inactive')}
                        map={USER_STATUS_MAP}
                      />
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      {new Date(u.created_at).toLocaleDateString('ru')}
                    </td>
                    {me?.role === 'admin' && u.id !== me.id && (
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeRole(u.id, e.target.value)}
                            style={{
                              background: 'var(--navy-3)', border: '1px solid rgba(255,255,255,0.08)',
                              color: 'white', padding: '6px 10px', borderRadius: 4, fontSize: 11,
                              fontFamily: 'var(--font-body)', cursor: 'pointer', outline: 'none',
                            }}
                          >
                            <option value="client">Клиент</option>
                            <option value="manager">Менеджер</option>
                            <option value="admin">Администратор</option>
                            <option value="courier">Курьер</option>
                            <option value="warehouse_keeper">Кладовщик</option>
                            <option value="driver">Водитель фуры</option>
                          </select>
                          {u.is_blocked ? (
                            <button
                              onClick={() => handleUnblock(u)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 4, border: '1px solid rgba(18,183,106,0.4)', background: 'rgba(18,183,106,0.1)', color: 'var(--green)', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)' }}
                            >
                              <Icons.Check size={11} /> Разблокировать
                            </button>
                          ) : (
                            <button
                              onClick={() => openBlockModal(u)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 4, border: '1px solid rgba(240,68,56,0.4)', background: 'rgba(240,68,56,0.08)', color: 'var(--red)', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)' }}
                            >
                              <Icons.Lock size={11} /> Заблокировать
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {/* Block reason modal */}
      {blockModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setBlockModal(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--navy-2)', border: '1px solid rgba(240,68,56,0.25)', borderRadius: 14, padding: 24, width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(240,68,56,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icons.Lock size={16} style={{ color: 'var(--red)' }} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--red)', fontFamily: 'var(--font-body)' }}>Блокировка аккаунта</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'white', marginTop: 2 }}>{blockModal.user.name}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              Пользователь потеряет доступ ко всем функциям системы. Сможет подать апелляцию только один раз.
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 6, fontFamily: 'var(--font-body)' }}>Причина блокировки (необязательно)</div>
              <textarea
                value={blockReason}
                onChange={e => setBlockReason(e.target.value)}
                placeholder="Опишите причину блокировки..."
                rows={3}
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 12px', color: 'white', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setBlockModal(null)}
                style={{ flex: 1, padding: '11px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              >
                Отмена
              </button>
              <button
                onClick={handleBlock}
                disabled={blockBusy}
                style={{ flex: 2, padding: '11px', borderRadius: 9, border: 'none', background: blockBusy ? 'rgba(240,68,56,0.3)' : 'rgba(240,68,56,0.8)', color: 'white', fontSize: 13, fontWeight: 700, cursor: blockBusy ? 'wait' : 'pointer', fontFamily: 'var(--font-body)' }}
              >
                {blockBusy ? 'Блокируем...' : 'Заблокировать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Courier warehouse picker modal */}
      {courierModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setCourierModal(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 24, width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: 'var(--font-body)' }}>Назначение роли</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'white', marginTop: 4 }}>
                {courierModal?.role === 'warehouse_keeper' ? 'Выберите склад для кладовщика' : 'Выберите склад для курьера'}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
                {courierModal?.role === 'warehouse_keeper'
                  ? 'Кладовщик будет закреплён за выбранным складом и сможет управлять его грузами.'
                  : 'Курьер будет закреплён за выбранным складом. Ему будут доступны только заказы из этого региона.'}
              </div>
            </div>

            {whLoading ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Загрузка складов...</div>
            ) : warehouses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                Нет складов. Сначала создайте склад в разделе «Склады».
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                {warehouses.map(wh => (
                  <label
                    key={wh.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '12px 14px', borderRadius: 9, cursor: 'pointer',
                      background: selectedWh === String(wh.id) ? 'rgba(240,165,0,0.1)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedWh === String(wh.id) ? 'rgba(240,165,0,0.35)' : 'rgba(255,255,255,0.07)'}`,
                    }}
                  >
                    <input
                      type="radio"
                      name="warehouse"
                      value={wh.id}
                      checked={selectedWh === String(wh.id)}
                      onChange={() => setSelectedWh(String(wh.id))}
                      style={{ accentColor: 'var(--gold)', marginTop: 2, flexShrink: 0 }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: selectedWh === String(wh.id) ? 'var(--gold)' : 'white' }}>{wh.name}</div>
                      {wh.address && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{wh.address}</div>}
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                        Загрузка: {wh.load_percent}% · {wh.current_load}/{wh.total_capacity} т
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setCourierModal(null)}
                style={{ flex: 1, padding: '11px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              >
                Отмена
              </button>
              <button
                onClick={confirmCourier}
                disabled={!selectedWh || courierAssigning || warehouses.length === 0}
                style={{ flex: 2, padding: '11px', borderRadius: 9, border: 'none', background: (!selectedWh || courierAssigning) ? 'rgba(255,255,255,0.08)' : 'var(--gold)', color: (!selectedWh || courierAssigning) ? 'rgba(255,255,255,0.3)' : 'var(--navy)', fontSize: 13, fontWeight: 700, cursor: (!selectedWh || courierAssigning) ? 'default' : 'pointer', fontFamily: 'var(--font-body)' }}
              >
                {courierAssigning ? 'Назначаем...' : 'Назначить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
