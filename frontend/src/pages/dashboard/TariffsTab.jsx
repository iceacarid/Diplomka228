/* eslint-disable no-empty, react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { Icons } from '../../components/Icons'
import { Card, Btn, Field, Modal, PageHeader, Loading, Empty } from '../../components/ui'

export default function TariffsTab() {
  const [tariff, setTariff]         = useState(null)
  const [cargoTypes, setCargoTypes] = useState([])
  const [loading, setLoading]       = useState(true)
  const [showCargo, setShowCargo]   = useState(false)
  const [editCargo, setEditCargo]   = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [t, c] = await Promise.all([api.get('/tariffs'), api.get('/cargo-types')])
      const list = Array.isArray(t.data) ? t.data : []
      setTariff(list[0] ?? null)
      setCargoTypes(Array.isArray(c.data) ? c.data : [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const deleteCargo = async (id) => {
    if (!confirm('Удалить тип груза?')) return
    await api.delete(`/cargo-types/${id}`)
    load()
  }

  const label = (text, color = 'rgba(255,255,255,0.35)') => (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color, fontFamily: 'var(--font-body)' }}>{text}</span>
  )

  return (
    <div style={{ padding: '0 0 40px' }}>
      <PageHeader
        eyebrow="Ценообразование"
        title="Тарифы и типы груза"
        action={
          <Btn kind="ghost" icon={<Icons.Plus size={14} />} onClick={() => { setEditCargo(null); setShowCargo(true) }}>
            Тип груза
          </Btn>
        }
      />

      <div style={{ padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        {loading ? <Loading /> : (
          <>
            {/* Единый тариф */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>
                Базовый тариф
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 18, lineHeight: 1.6 }}>
                Формула: <span style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.6)' }}>
                  (расстояние × цена/км + вес × коэф_веса + объём × коэф_объёма) × коэф_типа_груза
                </span>
              </div>
              {tariff ? (
                <TariffInlineEdit tariff={tariff} onSaved={t => setTariff(t)} label={label} />
              ) : (
                <Empty text="Тариф не найден" />
              )}
            </div>

            {/* Типы груза */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>
                Типы груза и коэффициенты
              </div>
              {cargoTypes.length === 0 ? <Empty text="Типов груза нет" /> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                  {cargoTypes.map(ct => {
                    const IconComp = Icons[ct.icon]
                    return (
                      <Card key={ct.id} padding={18} hover>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                          <div style={{ color: 'var(--gold)', marginTop: 2 }}>
                            {IconComp ? <IconComp size={20} /> : <Icons.Package size={20} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 3 }}>{ct.label}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{ct.description}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <div>
                            {label('Коэффициент')}
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: ct.coefficient > 1.5 ? 'var(--red)' : ct.coefficient > 1.2 ? '#F79009' : 'var(--gold)', marginTop: 3 }}>
                              × {ct.coefficient}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <ActionBtn icon={<Icons.Edit size={13} />} onClick={() => { setEditCargo(ct); setShowCargo(true) }}>Изм.</ActionBtn>
                            <ActionBtn icon={<Icons.Trash size={13} />} danger onClick={() => deleteCargo(ct.id)}>Удал.</ActionBtn>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showCargo && <CargoForm initial={editCargo} onClose={() => setShowCargo(false)} onSaved={() => { setShowCargo(false); load() }} />}
    </div>
  )
}

function TariffInlineEdit({ tariff, onSaved, label }) {
  const [form, setForm]     = useState({
    price_per_km: tariff.price_per_km,
    weight_coef:  tariff.weight_coef,
    volume_coef:  tariff.volume_coef,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.patch(`/tariffs/${tariff.id}`, form)
      onSaved(res.data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {}
    setSaving(false)
  }

  return (
    <Card padding={24} style={{ maxWidth: 520 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 0.5, marginBottom: 20, color: 'white' }}>
        {tariff.name}
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div>
            {label('Цена за км (₽)')}
            <input
              type="number" step="0.01" min="0" required
              value={form.price_per_km}
              onChange={set('price_per_km')}
              style={inputStyle}
            />
          </div>
          <div>
            {label('Коэф. веса (₽/кг)')}
            <input
              type="number" step="0.01" min="0" required
              value={form.weight_coef}
              onChange={set('weight_coef')}
              style={inputStyle}
            />
          </div>
          <div>
            {label('Коэф. объёма (₽/м³)')}
            <input
              type="number" step="0.01" min="0" required
              value={form.volume_coef}
              onChange={set('volume_coef')}
              style={inputStyle}
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Btn type="submit" disabled={saving} icon={saving ? null : <Icons.Check size={14} />}>
            {saving ? 'Сохраняем...' : 'Сохранить'}
          </Btn>
          {saved && (
            <span style={{ fontSize: 12, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icons.Check size={13} /> Сохранено
            </span>
          )}
        </div>
      </form>
    </Card>
  )
}

const inputStyle = {
  width: '100%',
  marginTop: 6,
  background: 'var(--navy-3)',
  border: '1.5px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '8px 10px',
  color: 'white',
  fontFamily: 'var(--font-mono)',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
}

function ActionBtn({ children, icon, onClick, danger }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', transition: 'color 0.15s', color: hov ? (danger ? 'var(--red)' : 'white') : 'rgba(255,255,255,0.5)' }}
    >
      {icon} {children}
    </button>
  )
}

const ICON_OPTIONS = [
  'Package','Boxes','Truck','Shield','Bolt','Clock','Refrigerator','Lock',
  'Map','Sparkles','TrendingUp','Pin','Wallet','Bell','Check','Arrow',
  'Cpu','Calendar','Phone','Mail','Settings','LifeBuoy','Chat','Edit',
]

function CargoForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({
    label:       initial?.label       || '',
    description: initial?.description || '',
    coefficient: initial?.coefficient || '',
    icon:        initial?.icon        || 'Package',
  })
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      if (initial) await api.put(`/cargo-types/${initial.id}`, form)
      else         await api.post('/cargo-types', {
        ...form,
        slug: form.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now(),
      })
      onSaved()
    } catch {}
    setLoading(false)
  }

  const SelIcon = Icons[form.icon]

  return (
    <Modal onClose={onClose} title={initial ? 'Изменить тип груза' : 'Новый тип груза'} maxWidth={480}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10, fontFamily: 'var(--font-body)' }}>
            Иконка
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(240,165,0,0.1)', border: '1.5px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0 }}>
              {SelIcon ? <SelIcon size={22} /> : null}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>{form.icon}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6, maxHeight: 140, overflowY: 'auto', padding: 2 }}>
            {ICON_OPTIONS.map(name => {
              const Ic = Icons[name]
              const active = form.icon === name
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => setForm(f => ({ ...f, icon: name }))}
                  style={{
                    width: 36, height: 36,
                    borderRadius: 6,
                    border: active ? '1.5px solid var(--gold)' : '1.5px solid rgba(255,255,255,0.07)',
                    background: active ? 'rgba(240,165,0,0.1)' : 'var(--navy-3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    color: active ? 'var(--gold)' : 'rgba(255,255,255,0.4)',
                    transition: 'all 0.1s',
                  }}
                >
                  {Ic ? <Ic size={16} /> : null}
                </button>
              )
            })}
          </div>
        </div>

        <Field label="Название" required value={form.label} onChange={set('label')} placeholder="Например: Сыпучий груз" />
        <Field label="Описание" value={form.description} onChange={set('description')} placeholder="Краткое описание (необязательно)" />
        <div>
          <Field label="Множитель" type="number" step="0.001" min="0.1" max="10" required value={form.coefficient} onChange={set('coefficient')} placeholder="1.000" />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>
            1.0 = стандарт · 1.5 = +50% · 2.0 = +100%
          </div>
        </div>

        <Btn type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
          {loading ? 'Сохраняем...' : 'Сохранить'}
        </Btn>
      </form>
    </Modal>
  )
}
