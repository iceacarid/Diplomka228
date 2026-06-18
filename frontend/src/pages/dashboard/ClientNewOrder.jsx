/* eslint-disable no-empty */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { Icons } from '../../components/Icons'
import { Card, Btn, Field } from '../../components/ui'
import AddressField from '../../components/AddressField'
import MapPickerModal from '../../components/MapPickerModal'

function debounce(fn, delay) {
  let t
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay) }
}

export default function ClientNewOrder() {
  const navigate = useNavigate()
  const [cargoTypes, setCargoTypes] = useState([])
  const [form, setForm] = useState({
    origin_address: '',
    dest_address:   '',
    weight:         '',
    volume:         '',
    cargo_type:        'general',
    cargo_type_custom: '',
    cargo_description: '',
  })
  const [calc, setCalc]         = useState(null)
  const [calcLoading, setCalcL] = useState(false)
  const [submitting, setSubmit] = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    api.get('/cargo-types').then(({ data }) => setCargoTypes(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  const set = k => v => setForm(f => ({ ...f, [k]: typeof v === 'string' ? v : v.target.value }))

  const doCalc = useCallback(
    debounce(async (origin, destination, weight, volume, cargo_type) => {
      if (!origin || !destination || !weight) return
      setCalcL(true)
      setCalc(null)
      try {
        const { data } = await api.post('/calculator', {
          origin: origin,
          destination: destination,
          weight: parseFloat(weight),
          volume: parseFloat(volume) || 0,
          cargo_type: cargo_type || 'general',
        })
        setCalc(data)
      } catch {}
      setCalcL(false)
    }, 700),
    []
  )

  useEffect(() => {
    doCalc(form.origin_address, form.dest_address, form.weight, form.volume, form.cargo_type)
  }, [form.origin_address, form.dest_address, form.weight, form.volume, form.cargo_type])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.origin_address || !form.dest_address || !form.weight || !form.cargo_type) {
      setError('Заполните откуда, куда, вес и тип груза')
      return
    }
    if (!calc) {
      setError('Дождитесь расчёта стоимости')
      return
    }
    setSubmit(true)
    setError('')
    try {
      const { data: order } = await api.post('/orders', {
        ...form,
        weight: parseFloat(form.weight),
        volume: parseFloat(form.volume) || 0,
        price:  calc.price,
      })
      navigate('/dashboard/chats', { state: { activeChatId: order.chat_id } })
    } catch (err) {
      setError(err?.response?.data?.message || 'Ошибка при создании заявки')
    }
    setSubmit(false)
  }

  const [mapPicker, setMapPicker] = useState(null)

  const selectedType = cargoTypes.find(t => t.slug === form.cargo_type)
  const canSubmit = form.origin_address && form.dest_address && form.weight && form.cargo_type && calc

  return (
    <>
    <div style={{ padding: 36 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, letterSpacing: 1, marginBottom: 28 }}>
        Новая <span style={{ color: 'var(--gold)' }}>заявка</span>
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="new-order-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* LEFT: маршрут + груз + расчёт */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
            <Card padding={24}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>Маршрут</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <AddressField label="Откуда" value={form.origin_address} onChange={set('origin_address')} placeholder="Москва, Каширское ш. 60" />
                  <Btn kind="ghost" size="sm" type="button" onClick={() => setMapPicker('origin_address')} icon={<Icons.Pin size={13} />}>
                    Выбрать на карте
                  </Btn>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <AddressField label="Куда" value={form.dest_address} onChange={set('dest_address')} placeholder="Казань, Кремлёвская 12" />
                  <Btn kind="ghost" size="sm" type="button" onClick={() => setMapPicker('dest_address')} icon={<Icons.Pin size={13} />}>
                    Выбрать на карте
                  </Btn>
                </div>
              </div>
            </Card>

            <Card padding={24}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>Груз</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <Field label="Вес, кг"   type="number" placeholder="5000" value={form.weight} onChange={set('weight')} />
                <Field label="Объём, м³" type="number" placeholder="20"   value={form.volume} onChange={set('volume')} />
              </div>
              <Field label="Описание груза" placeholder="Промышленное оборудование, хрупкое" value={form.cargo_description} onChange={set('cargo_description')} />
            </Card>

          </div>

          {/* RIGHT: тип груза + кнопки */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
            <Card padding={24} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>Тип груза</div>
              {cargoTypes.length === 0 ? (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Загрузка...</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                  {[...cargoTypes].sort((a, b) => a.slug === 'other' ? 1 : b.slug === 'other' ? -1 : 0).map(ct => {
                    const IconComp = Icons[ct.icon]
                    const active   = form.cargo_type === ct.slug
                    return (
                      <button
                        key={ct.slug}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, cargo_type: ct.slug, cargo_type_custom: '' }))}
                        style={{
                          padding: '14px 12px',
                          borderRadius: 8,
                          border: active ? '1.5px solid var(--gold)' : '1.5px solid rgba(255,255,255,0.07)',
                          background: active ? 'rgba(240,165,0,0.08)' : 'var(--navy-3)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        <div style={{ color: active ? 'var(--gold)' : 'rgba(255,255,255,0.3)' }}>
                          {IconComp ? <IconComp size={18} /> : <Icons.Package size={18} />}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: active ? 'white' : 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-body)', lineHeight: 1.3 }}>
                          {ct.label}
                        </div>
                        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: active ? 'var(--gold)' : 'rgba(255,255,255,0.25)', fontWeight: 700 }}>
                          × {ct.coefficient}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {form.cargo_type === 'other' && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontFamily: 'var(--font-body)' }}>
                    Укажите тип груза
                  </div>
                  <input
                    value={form.cargo_type_custom || ''}
                    onChange={e => setForm(f => ({ ...f, cargo_type_custom: e.target.value }))}
                    placeholder="Например: строительные материалы, металлопрокат..."
                    style={{
                      width: '100%',
                      background: 'var(--navy-3)',
                      border: '1px solid rgba(240,165,0,0.3)',
                      color: 'white',
                      padding: '11px 13px',
                      borderRadius: 6,
                      fontSize: 13,
                      fontFamily: 'var(--font-body)',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {(calcLoading || calc) && (
                <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: calcLoading ? 'rgba(255,255,255,0.3)' : 'var(--gold)', marginBottom: 14 }}>
                    {calcLoading ? 'Считаем маршрут...' : 'Предварительный расчёт'}
                  </div>
                  {calcLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[1,2].map(i => <div key={i} style={{ height: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 4, animation: 'pulse 1.4s ease-in-out infinite' }} />)}
                    </div>
                  ) : calc && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 14 }}>
                        {[
                          ['Итого', `₽ ${Number(calc.price).toLocaleString('ru')}`, 'var(--gold)'],
                          ['Расстояние', `${calc.distance_km} км`, 'white'],
                          ['Срок', `${calc.estimated_delivery_days} дн.`, 'white'],
                          ['Тип груза', `${calc.cargo_type_label} ×${calc.cargo_type_coef}`, 'rgba(255,255,255,0.55)'],
                        ].map(([l, v, c]) => (
                          <div key={l}>
                            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{l}</div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: c, letterSpacing: 0.4 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)' }}>
                        Базовая цена: ₽ {Number(calc.base_price).toLocaleString('ru')} × {calc.cargo_type_coef} = ₽ {Number(calc.price).toLocaleString('ru')}
                      </div>
                    </>
                  )}
                </div>
              )}
            </Card>

          </div>

        </div>

        {error && (
          <div style={{ fontSize: 12, color: 'var(--red)', padding: '10px 14px', background: 'rgba(240,68,56,0.08)', borderRadius: 6, border: '1px solid rgba(240,68,56,0.2)', marginTop: 16 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
          <Btn kind="ghost" onClick={() => navigate('/dashboard/my-orders')} type="button">Отмена</Btn>
          <Btn type="submit" disabled={submitting || !canSubmit} icon={<Icons.Plus size={14} />}>
            {submitting ? 'Создаём...' : 'Создать заявку'}
          </Btn>
        </div>
      </form>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 768px) {
          .new-order-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>

    {mapPicker && (
      <MapPickerModal
        title={mapPicker === 'origin_address' ? 'Откуда' : 'Куда'}
        onClose={() => setMapPicker(null)}
        onSelect={(addr) => { setForm(f => ({ ...f, [mapPicker]: addr })); setMapPicker(null) }}
      />
    )}
    </>
  )
}

