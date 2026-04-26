import { useState, useEffect } from 'react'
import api from '../../api/axios'

const STATUS_LABELS = { available: 'Свободен', in_transit: 'В рейсе', maintenance: 'На ремонте' }
const STATUS_COLORS = {
  available: 'bg-green-100 text-green-700',
  in_transit: 'bg-blue-100 text-blue-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
}

export default function TrucksTab() {
  const [trucks, setTrucks] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [t, d] = await Promise.all([api.get('/trucks'), api.get('/drivers')])
      setTrucks(t.data)
      setDrivers(d.data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Удалить транспорт?')) return
    try { await api.delete(`/trucks/${id}`); load() } catch (err) {
      alert(err.response?.data?.error || 'Ошибка')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Транспорт</h2>
        <button onClick={() => { setEditing(null); setShowForm(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          + Добавить транспорт
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Загрузка...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {trucks.map((t) => (
            <div key={t.id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{t.brand} {t.model}</h3>
                  <p className="text-sm font-mono text-blue-700">{t.plate_number}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status]}`}>
                  {STATUS_LABELS[t.status]}
                </span>
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <p>Грузоподъёмность: {t.capacity_weight.toLocaleString('ru')} кг</p>
                <p>Объём: {t.capacity_volume} м³</p>
                {t.driver_name && <p>Водитель: {t.driver_name}</p>}
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { setEditing(t); setShowForm(true) }}
                  className="text-sm text-blue-600 hover:underline">Изменить</button>
                <button onClick={() => handleDelete(t.id)}
                  className="text-sm text-red-600 hover:underline">Удалить</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <TruckForm initial={editing} drivers={drivers} onClose={() => setShowForm(false)} onSaved={load} />
      )}
    </div>
  )
}

function TruckForm({ initial, drivers, onClose, onSaved }) {
  const [form, setForm] = useState({
    plate_number: initial?.plate_number || '',
    brand: initial?.brand || '',
    model: initial?.model || '',
    capacity_weight: initial?.capacity_weight || '',
    capacity_volume: initial?.capacity_volume || '',
    status: initial?.status || 'available',
    driver_id: initial?.driver_id || '',
    is_company_owned: initial?.is_company_owned ?? true,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = { ...form, capacity_weight: parseInt(form.capacity_weight), capacity_volume: parseFloat(form.capacity_volume), driver_id: form.driver_id || null }
      if (initial) await api.put(`/trucks/${initial.id}`, payload)
      else await api.post('/trucks', payload)
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка')
    }
    setLoading(false)
  }

  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between mb-4">
          <h3 className="font-bold text-lg">{initial ? 'Изменить транспорт' : 'Новый транспорт'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        {error && <div className="bg-red-50 text-red-700 rounded px-3 py-2 text-sm mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <input required value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} placeholder="Госномер" className={inp} />
          <div className="flex gap-2">
            <input required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Марка" className={`${inp} flex-1`} />
            <input required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Модель" className={`${inp} flex-1`} />
          </div>
          <div className="flex gap-2">
            <input required type="number" value={form.capacity_weight} onChange={(e) => setForm({ ...form, capacity_weight: e.target.value })} placeholder="Груз (кг)" className={`${inp} flex-1`} />
            <input required type="number" step="0.1" value={form.capacity_volume} onChange={(e) => setForm({ ...form, capacity_volume: e.target.value })} placeholder="Объём (м³)" className={`${inp} flex-1`} />
          </div>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inp}>
            <option value="available">Свободен</option>
            <option value="in_transit">В рейсе</option>
            <option value="maintenance">На ремонте</option>
          </select>
          <select value={form.driver_id} onChange={(e) => setForm({ ...form, driver_id: e.target.value })} className={inp}>
            <option value="">— Без водителя —</option>
            {drivers.filter((d) => d.is_available).map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </form>
      </div>
    </div>
  )
}
