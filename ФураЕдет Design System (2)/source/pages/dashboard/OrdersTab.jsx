import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

const STATUS_LABELS = {
  draft: 'Черновик', pending: 'На рассмотрении', in_progress: 'В работе',
  shipped: 'В пути', delivered: 'Доставлено', rejected: 'Отклонено',
}
const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600', pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700', shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700',
}

export default function OrdersTab() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState(null)
  const [trackInput, setTrackInput] = useState('')
  const [trackResult, setTrackResult] = useState(null)

  const loadOrders = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/orders')
      setOrders(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadOrders() }, [])

  const handleTrack = async () => {
    try {
      const { data } = await api.get(`/orders/track/${trackInput}`)
      setTrackResult(data)
    } catch { setTrackResult(null); alert('Заказ не найден') }
  }

  const handleAccept = async (id) => {
    await api.post(`/orders/${id}/accept`)
    loadOrders()
    setSelected(null)
  }

  const handleReject = async (id) => {
    const reason = prompt('Причина отклонения:')
    if (!reason) return
    await api.post(`/orders/${id}/reject`, { rejection_reason: reason })
    loadOrders()
    setSelected(null)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Заказы</h2>
        {user?.role === 'client' && (
          <button onClick={() => setShowCreate(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
            + Новый заказ
          </button>
        )}
      </div>

      {/* Трекинг */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex gap-3">
        <input
          value={trackInput}
          onChange={(e) => setTrackInput(e.target.value)}
          placeholder="Трекинг-номер (FE-XXXXXX)"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={handleTrack} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition">
          Отследить
        </button>
      </div>

      {trackResult && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border-l-4 border-blue-500">
          <p className="font-semibold">{trackResult.tracking_id}</p>
          <p className="text-sm text-gray-500">{trackResult.origin_address} → {trackResult.dest_address}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[trackResult.status]}`}>
            {STATUS_LABELS[trackResult.status]}
          </span>
        </div>
      )}

      {/* Список заказов */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Загрузка...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Заказов пока нет</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Трекинг</th>
                <th className="px-4 py-3 text-left">Маршрут</th>
                <th className="px-4 py-3 text-left">Груз</th>
                <th className="px-4 py-3 text-left">Цена</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Дата</th>
                {user?.role !== 'client' && <th className="px-4 py-3 text-left">Клиент</th>}
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold text-blue-700">{order.tracking_id}</td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="truncate text-gray-700">{order.origin_address}</p>
                    <p className="truncate text-gray-400">→ {order.dest_address}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{order.weight} кг</p>
                    <p className="text-gray-400">{order.volume} м³</p>
                  </td>
                  <td className="px-4 py-3 font-semibold">{Number(order.price).toLocaleString('ru')} ₽</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{new Date(order.created_at).toLocaleDateString('ru')}</td>
                  {user?.role !== 'client' && <td className="px-4 py-3 text-gray-600">{order.client_name}</td>}
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(order)}
                      className="text-blue-600 hover:underline text-xs">
                      Детали
                    </button>
                    {user?.role !== 'client' && order.status === 'pending' && (
                      <div className="flex gap-2 mt-1">
                        <button onClick={() => handleAccept(order.id)}
                          className="text-green-600 hover:underline text-xs">Принять</button>
                        <button onClick={() => handleReject(order.id)}
                          className="text-red-600 hover:underline text-xs">Отклонить</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Детали заказа */}
      {selected && (
        <Modal onClose={() => setSelected(null)} title={`Заказ ${selected.tracking_id}`}>
          <div className="space-y-2 text-sm">
            <InfoRow label="Статус" value={<span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[selected.status]}`}>{STATUS_LABELS[selected.status]}</span>} />
            <InfoRow label="Отправление" value={selected.origin_address} />
            <InfoRow label="Доставка" value={selected.dest_address} />
            <InfoRow label="Вес" value={`${selected.weight} кг`} />
            <InfoRow label="Объём" value={`${selected.volume} м³`} />
            <InfoRow label="Тип груза" value={selected.cargo_type} />
            <InfoRow label="Стоимость" value={`${Number(selected.price).toLocaleString('ru')} ₽`} />
            {selected.driver_name && <InfoRow label="Водитель" value={selected.driver_name} />}
            {selected.truck_plate && <InfoRow label="Транспорт" value={selected.truck_plate} />}
            {selected.rejection_reason && <InfoRow label="Причина отклонения" value={selected.rejection_reason} />}
          </div>
        </Modal>
      )}

      {/* Создание заказа */}
      {showCreate && (
        <CreateOrderModal onClose={() => setShowCreate(false)} onCreated={loadOrders} />
      )}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function Modal({ onClose, title, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function CreateOrderModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    origin_address: '', dest_address: '', weight: '', volume: '',
    cargo_type: 'general', cargo_description: '', price: '',
  })
  const [calculating, setCalculating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const calcPrice = async () => {
    if (!form.origin_address || !form.dest_address || !form.weight || !form.volume) return
    setCalculating(true)
    try {
      const { data } = await api.post('/calculator', {
        origin: form.origin_address, destination: form.dest_address,
        weight: parseFloat(form.weight), volume: parseFloat(form.volume),
      })
      setForm((f) => ({ ...f, price: String(data.price) }))
    } catch {}
    setCalculating(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/orders', { ...form, weight: parseFloat(form.weight), volume: parseFloat(form.volume), price: parseFloat(form.price) })
      onCreated()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка')
    }
    setLoading(false)
  }

  return (
    <Modal onClose={onClose} title="Новый заказ">
      {error && <div className="bg-red-50 text-red-700 rounded px-3 py-2 text-sm mb-3">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        <input required value={form.origin_address} onChange={(e) => setForm({ ...form, origin_address: e.target.value })}
          placeholder="Адрес отправления" className="input" />
        <input required value={form.dest_address} onChange={(e) => setForm({ ...form, dest_address: e.target.value })}
          placeholder="Адрес доставки" className="input" />
        <div className="flex gap-2">
          <input required type="number" min="0" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })}
            placeholder="Вес (кг)" className="input flex-1" />
          <input required type="number" min="0" step="0.1" value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })}
            placeholder="Объём (м³)" className="input flex-1" />
        </div>
        <select value={form.cargo_type} onChange={(e) => setForm({ ...form, cargo_type: e.target.value })} className="input">
          <option value="general">Обычный груз</option>
          <option value="fragile">Хрупкое</option>
          <option value="flammable">Огнеопасное</option>
          <option value="perishable">Скоропортящееся</option>
          <option value="hazardous">Опасное</option>
          <option value="oversized">Негабаритное</option>
          <option value="temperature_controlled">Температурный режим</option>
          <option value="other">Другое</option>
        </select>
        <textarea value={form.cargo_description} onChange={(e) => setForm({ ...form, cargo_description: e.target.value })}
          placeholder="Описание груза" rows={2} className="input" />
        <div className="flex gap-2 items-end">
          <input required type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="Стоимость (₽)" className="input flex-1" />
          <button type="button" onClick={calcPrice} disabled={calculating}
            className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-lg text-xs whitespace-nowrap">
            {calculating ? '...' : 'Рассчитать'}
          </button>
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Создаём...' : 'Создать заказ'}
        </button>
      </form>
    </Modal>
  )
}
