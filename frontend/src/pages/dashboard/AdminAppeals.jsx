import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { Icons } from '../../components/Icons'


const STATUS_FILTERS = [
  { value: '',         label: 'Все' },
  { value: 'pending',  label: 'На рассмотрении' },
  { value: 'reviewed', label: 'Рассмотрены' },
]

const STATUS_BADGE = {
  pending:  { label: 'На рассмотрении', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  reviewed: { label: 'Рассмотрено',     color: '#12B76A', bg: 'rgba(18,183,106,0.1)',  border: 'rgba(18,183,106,0.25)' },
}

export default function AdminAppeals() {
  const navigate               = useNavigate()
  const [appeals, setAppeals]  = useState([])
  const [loading, setLoading]  = useState(true)
  const [filter,  setFilter]   = useState('')
  const [search,  setSearch]   = useState('')
  const [sortBy,  setSortBy]   = useState('newest')
  const [marking, setMarking]       = useState(null)
  const [unarchiving, setUnarchive] = useState(null)
  const [unarchived, setUnarchived] = useState(new Set())

  const load = useCallback(() => {
    setLoading(true)
    const params = filter ? `?status=${filter}` : ''
    api.get(`/appeals${params}`)
      .then(({ data }) => setAppeals(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  const markReviewed = async (appeal) => {
    setMarking(appeal.id)
    try {
      const { data } = await api.patch(`/appeals/${appeal.id}`)
      setAppeals(prev => prev.map(a => a.id === appeal.id ? data : a))
    } catch {}
    finally { setMarking(null) }
  }

  const openChat = (appeal) => {
    navigate('/dashboard/chats', { state: { activeChatId: appeal.chat_id } })
  }

  const unarchiveChat = async (appeal) => {
    setUnarchive(appeal.chat_id)
    try {
      await api.post(`/chats/${appeal.chat_id}/unarchive`)
      setUnarchived(prev => new Set([...prev, appeal.chat_id]))
    } catch {}
    finally { setUnarchive(null) }
  }

  const q = search.toLowerCase()
  const visible = appeals
    .filter(a => {
      if (!q) return true
      return `${a.client_name} ${a.client_email} ${a.tracking_id ?? ''} ${a.body}`.toLowerCase().includes(q)
    })
    .sort((a, b) => sortBy === 'newest'
      ? new Date(b.created_at) - new Date(a.created_at)
      : new Date(a.created_at) - new Date(b.created_at)
    )

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
            <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
          </svg>
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1, margin: 0 }}>
            <span style={{ color: 'var(--gold)' }}>Апелляции</span>
          </h2>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
            Жалобы клиентов на закрытые чаты
          </div>
        </div>
        <button
          onClick={load}
          style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '7px 14px', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
        >
          Обновить
        </button>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 220, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '8px 12px' }}>
          <Icons.Search size={14} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по клиенту, email, трекингу, тексту..."
            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: 13, fontFamily: 'var(--font-body)', flex: 1 }}
          />
          {search && <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>✕</button>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {STATUS_FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', cursor: 'pointer', background: filter === f.value ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.05)', color: filter === f.value ? '#818CF8' : 'rgba(255,255,255,0.45)' }}>
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{ background: 'var(--navy-2)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)', padding: '6px 10px', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-body)', cursor: 'pointer', outline: 'none' }}
        >
          <option value="newest">Сначала новые</option>
          <option value="oldest">Сначала старые</option>
        </select>
        {search && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
            {visible.length} из {appeals.length}
          </div>
        )}
      </div>

      {loading && (
        <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
          Загрузка...
        </div>
      )}

      {!loading && appeals.length === 0 && (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.08)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
            </svg>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Апелляций нет</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visible.map(appeal => {
          const badge = STATUS_BADGE[appeal.status] ?? STATUS_BADGE.pending
          const date  = new Date(appeal.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })

          return (
            <div key={appeal.id} style={{
              background:   'var(--navy-2)',
              border:       '1px solid rgba(129,140,248,0.15)',
              borderLeft:   '4px solid rgba(129,140,248,0.5)',
              borderRadius: 10,
              padding:      '16px 18px',
            }}>
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                      {appeal.client_name}
                    </span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
                      {appeal.client_email}
                    </span>
                    {appeal.tracking_id && (
                      <span style={{
                        fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
                        color: 'var(--gold)', background: 'rgba(240,165,0,0.1)',
                        border: '1px solid rgba(240,165,0,0.2)', borderRadius: 4, padding: '1px 6px',
                      }}>
                        {appeal.tracking_id}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{date}</div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
                  color: badge.color, background: badge.bg,
                  border: `1px solid ${badge.border}`,
                  borderRadius: 5, padding: '3px 9px', whiteSpace: 'nowrap',
                }}>
                  {badge.label}
                </span>
              </div>

              {/* Body */}
              <div style={{
                background:   'rgba(129,140,248,0.06)',
                border:       '1px solid rgba(129,140,248,0.1)',
                borderRadius: 7,
                padding:      '10px 12px',
                fontSize:     13,
                color:        'rgba(255,255,255,0.75)',
                lineHeight:   1.6,
                whiteSpace:   'pre-wrap',
                marginBottom: 12,
              }}>
                {appeal.body}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => openChat(appeal)}
                  style={{
                    padding:    '7px 14px', borderRadius: 6,
                    background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.3)',
                    color:      'var(--gold)', fontSize: 12, fontWeight: 600,
                    cursor:     'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <Icons.Chat size={13} /> Открыть чат
                </button>

                {/* Разблокировать чат */}
                {unarchived.has(appeal.chat_id) ? (
                  <span style={{
                    padding: '7px 14px', borderRadius: 6, fontSize: 12,
                    color: '#12B76A', display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <Icons.Check size={13} /> Чат разблокирован
                  </span>
                ) : (
                  <button
                    onClick={() => unarchiveChat(appeal)}
                    disabled={unarchiving === appeal.chat_id}
                    style={{
                      padding:    '7px 14px', borderRadius: 6,
                      background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.3)',
                      color:      '#818CF8', fontSize: 12, fontWeight: 600,
                      cursor:     unarchiving === appeal.chat_id ? 'wait' : 'pointer',
                      display:    'flex', alignItems: 'center', gap: 6,
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                    </svg>
                    {unarchiving === appeal.chat_id ? 'Разблокировка...' : 'Разблокировать чат'}
                  </button>
                )}

                {appeal.status === 'pending' && (
                  <button
                    onClick={() => markReviewed(appeal)}
                    disabled={marking === appeal.id}
                    style={{
                      padding:    '7px 14px', borderRadius: 6,
                      background: 'rgba(18,183,106,0.1)', border: '1px solid rgba(18,183,106,0.3)',
                      color:      '#12B76A', fontSize: 12, fontWeight: 600,
                      cursor:     marking === appeal.id ? 'wait' : 'pointer',
                      display:    'flex', alignItems: 'center', gap: 6,
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <Icons.Check size={13} />
                    {marking === appeal.id ? 'Обработка...' : 'Отметить рассмотренной'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
