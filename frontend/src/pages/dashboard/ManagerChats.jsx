import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../../api/axios'
import { ChatListItem } from '../../components/chat/ChatListItem'
import { ChatWindow } from '../../components/chat/ChatWindow'
import { Icons } from '../../components/Icons'
import { Btn } from '../../components/ui'

const CHAT_STATUS_FILTERS = [
  { value: '',         label: 'Все' },
  { value: 'active',   label: 'Активные' },
  { value: 'archived', label: 'Архив' },
]

const ORDER_STATUS_OPTIONS = [
  { value: '',                 label: 'Любой статус заявки' },
  { value: 'pending',          label: 'Ожидает' },
  { value: 'in_progress',      label: 'В работе' },
  { value: 'confirmed',        label: 'Подтверждён' },
  { value: 'courier_assigned', label: 'Курьер назначен' },
  { value: 'picked_up',        label: 'Курьер в дороге' },
  { value: 'at_warehouse',     label: 'Груз на складе' },
  { value: 'shipped',          label: 'Отправлен' },
  { value: 'delivered',        label: 'Доставлен' },
  { value: 'rejected',         label: 'Отклонён' },
]

export default function ManagerChats() {
  const location                            = useLocation()
  const [chats, setChats]                   = useState([])
  const [activeChatId, setActive]           = useState(location.state?.activeChatId ?? null)
  const [loading, setLoading]               = useState(true)
  const [chatStatusFilter, setChatStatus]   = useState('')
  const [orderStatusFilter, setOrderStatus] = useState('')
  const [searchInput, setSearchInput]       = useState('')
  const [search, setSearch]                 = useState('')
  const debounceRef                         = useRef(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (chatStatusFilter)  params.set('status', chatStatusFilter)
    if (orderStatusFilter) params.set('order_status', orderStatusFilter)
    if (search)            params.set('search', search)

    api.get(`/chats?${params}`)
      .then(({ data }) => setChats(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [chatStatusFilter, orderStatusFilter, search])

  useEffect(() => { load() }, [load])

  const handleSearchChange = (value) => {
    setSearchInput(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(value.trim()), 300)
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearch('')
    clearTimeout(debounceRef.current)
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Сайдбар */}
      <div style={{
        width:         340,
        flexShrink:    0,
        borderRight:   '1px solid rgba(255,255,255,0.06)',
        display:       'flex',
        flexDirection: 'column',
        background:    'var(--navy-2)',
      }}>
        {/* Шапка */}
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1, marginBottom: 12 }}>
            <span style={{ color: 'var(--gold)' }}>Чаты</span>
          </h2>

          {/* Живой поиск */}
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <div style={{
              position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
            }}>
              <Icons.Search size={13} />
            </div>
            <input
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Номер заявки (FE-...)"
              style={{
                width:        '100%',
                background:   'rgba(255,255,255,0.05)',
                border:       '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                padding:      '7px 28px 7px 28px',
                color:        '#fff',
                fontSize:     12,
                fontFamily:   'var(--font-body)',
                outline:      'none',
                boxSizing:    'border-box',
              }}
            />
            {searchInput && (
              <button
                onClick={clearSearch}
                style={{
                  position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', padding: 2,
                }}
              >
                <Icons.X size={12} />
              </button>
            )}
          </div>

          {/* Фильтр по статусу заявки */}
          <select
            value={orderStatusFilter}
            onChange={e => setOrderStatus(e.target.value)}
            style={{
              width:        '100%',
              background:   'rgba(255,255,255,0.05)',
              border:       '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              padding:      '7px 10px',
              color:        orderStatusFilter ? '#fff' : 'rgba(255,255,255,0.4)',
              fontSize:     12,
              fontFamily:   'var(--font-body)',
              outline:      'none',
              marginBottom: 10,
              colorScheme:  'dark',
            }}
          >
            {ORDER_STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value} style={{ background: '#12122a' }}>{o.label}</option>
            ))}
          </select>

          {/* Фильтр по статусу чата */}
          <div style={{ display: 'flex', gap: 4 }}>
            {CHAT_STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setChatStatus(f.value)}
                style={{
                  flex:          1,
                  padding:       '5px 0',
                  borderRadius:  5,
                  border:        'none',
                  fontSize:      10,
                  fontWeight:    600,
                  letterSpacing: '0.06em',
                  cursor:        'pointer',
                  background:    chatStatusFilter === f.value ? 'rgba(240,165,0,0.15)' : 'rgba(255,255,255,0.04)',
                  color:         chatStatusFilter === f.value ? 'var(--gold)' : 'rgba(255,255,255,0.45)',
                  transition:    'all 0.15s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Список */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
              Загрузка...
            </div>
          )}
          {!loading && chats.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.1)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                <Icons.Chat size={36} />
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Чатов не найдено</div>
            </div>
          )}
          {chats.map(chat => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isActive={activeChatId === chat.id}
              onClick={() => setActive(chat.id)}
            />
          ))}
        </div>

        <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Btn kind="ghost" size="sm" onClick={load} style={{ width: '100%', justifyContent: 'center' }}>
            Обновить список
          </Btn>
        </div>
      </div>

      {/* Окно чата */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeChatId ? (
          <ChatWindow chatId={activeChatId} onClose={() => setActive(null)} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.2)' }}>
            <Icons.Chat size={48} />
            <div style={{ marginTop: 16, fontSize: 13, fontFamily: 'var(--font-display)', letterSpacing: 1 }}>
              Выберите чат
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
              Новые заявки без менеджера отображаются первыми
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
