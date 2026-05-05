import { useState, useEffect } from 'react'
import api from '../../api/axios'

export default function TariffsTab() {
  const [tariffs, setTariffs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = async () => {
    setLoading(true)
    try { const { data } = await api.get('/tariffs'); setTariffs(data) } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Удалить тариф?')) return
    await api.delete(`/tariffs/${id}`)
    load()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Тарифы</h2>
        <button onClick={() => { setEditing(null); setShowForm(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          + Добавить тариф
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Загрузка...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tariffs.map((t) => (
            <div key={t.id} className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-2">{t.name}</h3>
              <p className="text-sm text-gray-500">{t.price_per_km} ₽/км</p>
              <p className="text-sm text-gray-500">Коэф. веса: {t.weight_coef}</p>
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
        <TariffForm initial={editing} onClose={() => setShowForm(false)} onSaved={load} />
      )}
    </div>
  )
}

function TariffForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    price_per_km: initial?.price_per_km || '',
    weight_coef: initial?.weight_coef || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (initial) await api.put(`/tariffs/${initial.id}`, form)
      else await api.post('/tariffs', form)
      onSaved()
      onClose()
    } catch {}
    setLoading(false)
  }

  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between mb-4">
          <h3 className="font-bold text-lg">{initial ? 'Изменить тариф' : 'Новый тариф'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Название" className={inp} />
          <input required type="number" step="0.01" value={form.price_per_km} onChange={(e) => setForm({ ...form, price_per_km: e.target.value })} placeholder="Цена за км (₽)" className={inp} />
          <input required type="number" step="0.01" value={form.weight_coef} onChange={(e) => setForm({ ...form, weight_coef: e.target.value })} placeholder="Коэффициент веса" className={inp} />
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </form>
      </div>
    </div>
  )
}
