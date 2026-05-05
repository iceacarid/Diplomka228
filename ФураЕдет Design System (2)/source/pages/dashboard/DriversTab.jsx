import { useState, useEffect } from 'react'
import api from '../../api/axios'

export default function DriversTab() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = async () => {
    setLoading(true)
    try { const { data } = await api.get('/drivers'); setDrivers(data) } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Удалить водителя?')) return
    try { await api.delete(`/drivers/${id}`); load() } catch (err) {
      alert(err.response?.data?.error || 'Ошибка')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Водители</h2>
        <button onClick={() => { setEditing(null); setShowForm(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          + Добавить водителя
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Загрузка...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {drivers.map((d) => (
            <div key={d.id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">{d.name}</h3>
                  <p className="text-sm text-gray-500">{d.phone}</p>
                  <p className="text-sm text-gray-500">Права: {d.license_number}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${d.type === 'staff' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {d.type === 'staff' ? 'Штатный' : 'Наёмный'}
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${d.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {d.is_available ? 'Доступен' : 'Занят'}
                </span>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { setEditing(d); setShowForm(true) }}
                  className="text-sm text-blue-600 hover:underline">Изменить</button>
                <button onClick={() => handleDelete(d.id)}
                  className="text-sm text-red-600 hover:underline">Удалить</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <DriverForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={load}
        />
      )}
    </div>
  )
}

function DriverForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    phone: initial?.phone || '',
    license_number: initial?.license_number || '',
    type: initial?.type || 'staff',
    personal_car: initial?.personal_car || '',
    insurance_num: initial?.insurance_num || '',
    is_available: initial?.is_available ?? true,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (initial) await api.put(`/drivers/${initial.id}`, form)
      else await api.post('/drivers', form)
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between mb-4">
          <h3 className="font-bold text-lg">{initial ? 'Изменить водителя' : 'Новый водитель'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        {error && <div className="bg-red-50 text-red-700 rounded px-3 py-2 text-sm mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="ФИО" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Телефон" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input required value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })}
            placeholder="Номер прав" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="staff">Штатный</option>
            <option value="hired">Наёмный</option>
          </select>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_available}
              onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
            Доступен
          </label>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </form>
      </div>
    </div>
  )
}
