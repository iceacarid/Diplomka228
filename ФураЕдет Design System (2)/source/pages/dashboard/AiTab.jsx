import { useState, useEffect } from 'react'
import api from '../../api/axios'

export default function AiTab() {
  const [trucks, setTrucks] = useState([])
  const [orders, setOrders] = useState([])
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState('')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/trucks'), api.get('/orders?status=in_progress'), api.get('/ai/history')])
      .then(([t, o, h]) => {
        setTrucks(t.data.filter((tr) => tr.status === 'available'))
        setOrders(o.data)
        setHistory(h.data)
      })
      .catch(() => {})
  }, [])

  const handleOptimize = async () => {
    if (!trucks.length || !orders.length) {
      alert('Нет доступных машин или активных заказов')
      return
    }
    setLoading(true)
    setResult('')
    try {
      const { data } = await api.post('/ai/optimize', { trucks, orders, prompt })
      setResult(data.recommendation)
      setHistory((prev) => [{ id: data.request_id, request_text: `Транспорт: ${trucks.length}, Заказы: ${orders.length}`, response_text: data.recommendation, created_at: new Date().toISOString() }, ...prev.slice(0, 9)])
    } catch (err) {
      setResult('Ошибка: ' + (err.response?.data?.error || err.message))
    }
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">AI-оптимизация загрузки</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Свободных машин</p>
          <p className="text-3xl font-bold text-blue-700">{trucks.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Активных заказов</p>
          <p className="text-3xl font-bold text-orange-600">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Запросов к AI</p>
          <p className="text-3xl font-bold text-green-700">{history.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
        <h3 className="font-semibold mb-3">Дополнительные требования</h3>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Например: учитывайте хрупкие грузы, минимизируйте пробег..."
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
        />
        <button onClick={handleOptimize} disabled={loading}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
          {loading ? '⏳ Анализируем...' : '🤖 Оптимизировать'}
        </button>
      </div>

      {result && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <h3 className="font-semibold mb-3">Рекомендация AI</h3>
          <div className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-wrap text-gray-700">{result}</div>
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-3">История запросов</h3>
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h.id} className="border border-gray-100 rounded-lg p-3 text-sm">
                <div className="flex justify-between text-gray-400 text-xs mb-1">
                  <span>{h.request_text}</span>
                  <span>{new Date(h.created_at).toLocaleString('ru')}</span>
                </div>
                <p className="text-gray-600 line-clamp-2">{h.response_text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
