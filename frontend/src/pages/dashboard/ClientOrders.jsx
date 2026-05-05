/* eslint-disable no-empty */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { Icons } from '../../components/Icons'
import { Card, Btn, DataTable, StatusPill } from '../../components/ui'

const STATUS_MAP = {
  draft:            { bg: 'rgba(255,255,255,0.06)', fg: 'rgba(255,255,255,0.45)', label: 'Черновик' },
  pending:          { bg: 'rgba(240,165,0,0.14)',   fg: 'var(--gold)',            label: 'Новая' },
  in_progress:      { bg: 'rgba(247,144,9,0.14)',   fg: '#F79009',               label: 'В работе' },
  confirmed:        { bg: 'rgba(18,183,106,0.12)',  fg: '#12B76A',               label: 'Подтверждено' },
  courier_assigned: { bg: 'rgba(139,92,246,0.14)',  fg: '#8B5CF6',               label: 'Курьер назначен' },
  picked_up:        { bg: 'rgba(99,102,241,0.14)',  fg: '#6366F1',               label: 'Курьер в дороге' },
  at_warehouse:     { bg: 'rgba(20,184,166,0.14)',  fg: '#14B8A6',               label: 'Груз на складе' },
  shipped:          { bg: 'rgba(123,180,255,0.14)', fg: '#7BB4FF',               label: 'В пути' },
  delivered:        { bg: 'rgba(18,183,106,0.14)',  fg: '#12B76A',               label: 'Доставлено' },
  rejected:         { bg: 'rgba(240,68,56,0.14)',   fg: 'var(--red)',            label: 'Отменено' },
}

const STATUS_OPTIONS = [
  { value: '',                 label: 'Все статусы' },
  { value: 'pending',          label: 'Новая' },
  { value: 'in_progress',      label: 'В работе' },
  { value: 'confirmed',        label: 'Подтверждено' },
  { value: 'courier_assigned', label: 'Курьер назначен' },
  { value: 'picked_up',        label: 'Курьер в дороге' },
  { value: 'at_warehouse',     label: 'Груз на складе' },
  { value: 'shipped',          label: 'В пути' },
  { value: 'delivered',        label: 'Доставлено' },
  { value: 'rejected',         label: 'Отменено' },
  { value: 'draft',            label: 'Черновик' },
]

const selStyle = {
  background: 'var(--navy-3)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'white',
  padding: '10px 14px',
  borderRadius: 6,
  fontSize: 13,
  fontFamily: 'var(--font-body)',
  outline: 'none',
  cursor: 'pointer',
}

export default function ClientOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('desc')

  useEffect(() => {
    setLoading(true)
    api.get('/orders')
      .then(({ data }) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = orders
    .filter(o => {
      if (status && o.status !== status) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          o.tracking_id?.toLowerCase().includes(q) ||
          o.origin_address?.toLowerCase().includes(q) ||
          o.dest_address?.toLowerCase().includes(q)
        )
      }
      return true
    })
    .sort((a, b) => {
      const da = new Date(a.created_at), db = new Date(b.created_at)
      return sort === 'desc' ? db - da : da - db
    })

  const hasFilters = search || status

  return (
    <div style={{ padding: 36, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, letterSpacing: 1 }}>
          Мои <span style={{ color: 'var(--gold)' }}>заявки</span>
        </h2>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
          {filtered.length} из {orders.length}
        </span>
      </div>

      <Card padding={16}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>
              <Icons.Search size={15} />
            </div>
            <input
              placeholder="Поиск по номеру, маршруту..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: 'var(--navy-3)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'white',
                padding: '10px 12px 10px 38px',
                borderRadius: 6,
                fontSize: 13,
                fontFamily: 'var(--font-body)',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          <select value={status} onChange={e => setStatus(e.target.value)} style={selStyle}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <Btn
            kind="ghost"
            icon={<Icons.Calendar size={14} />}
            onClick={() => setSort(s => s === 'desc' ? 'asc' : 'desc')}
            size="sm"
          >
            {sort === 'desc' ? 'Сначала новые' : 'Сначала старые'}
          </Btn>

          {hasFilters && (
            <Btn kind="ghost" icon={<Icons.X size={14} />} onClick={() => { setSearch(''); setStatus('') }} size="sm">
              Сброс
            </Btn>
          )}
        </div>
      </Card>

      <Card padding={0}>
        {loading ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
            Загрузка...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
            {orders.length === 0 ? 'Заявок пока нет' : 'Ничего не найдено'}
          </div>
        ) : (
          <DataTable
            columns={['№ Заявки', 'Маршрут', 'Дата', 'Вес', 'Объём', 'Сумма', 'Статус', '']}
            rows={filtered.map(o => [
              <span key="id" style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontWeight: 600 }}>{o.tracking_id}</span>,
              <span key="route" style={{ fontWeight: 500 }}>
                {o.origin_address || '—'} <span style={{ color: 'rgba(255,255,255,0.3)' }}>→</span> {o.dest_address || '—'}
              </span>,
              <span key="date" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
                {o.created_at ? new Date(o.created_at).toLocaleDateString('ru') : '—'}
              </span>,
              <span key="weight" style={{ fontFamily: 'var(--font-mono)' }}>{(o.weight || 0).toLocaleString('ru')} кг</span>,
              <span key="vol" style={{ fontFamily: 'var(--font-mono)' }}>{o.volume ? `${o.volume} м³` : '—'}</span>,
              <span key="price" style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--gold)' }}>
                {o.price ? `₽ ${Number(o.price).toLocaleString('ru')}` : '—'}
              </span>,
              <StatusPill key="status" status={o.status} map={STATUS_MAP} />,
              o.chat_id
                ? <Btn
                    key="chat"
                    size="sm"
                    kind="ghost"
                    icon={<Icons.Chat size={13} />}
                    onClick={() => navigate('/dashboard/chats', { state: { activeChatId: o.chat_id } })}
                  >
                    Чат
                  </Btn>
                : <span key="chat" />,
            ])}
          />
        )}
      </Card>
    </div>
  )
}
