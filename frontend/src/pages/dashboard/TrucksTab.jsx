/* eslint-disable no-empty, react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { Icons } from '../../components/Icons'
import { Card, Btn, Field, Select, Modal, PageHeader, StatusPill, Alert, Loading, Empty } from '../../components/ui'

const TRUCK_STATUS_MAP = {
  available:   { bg: 'rgba(18,183,106,0.14)',  fg: 'var(--green)', label: 'Свободен' },
  in_transit:  { bg: 'rgba(240,165,0,0.14)',   fg: 'var(--gold)',  label: 'В рейсе' },
  maintenance: { bg: 'rgba(240,68,56,0.14)',   fg: 'var(--red)',   label: 'На ремонте' },
}

export default function TrucksTab() {
  const [trucks,  setTrucks]  = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing] = useState(null)
  const [search,       setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

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

  const q = search.toLowerCase()
  const visible = trucks.filter(t => {
    if (q && !`${t.plate_number} ${t.brand} ${t.model} ${t.driver_name || ''}`.toLowerCase().includes(q)) return false
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    return true
  })

  const handleDelete = async (id) => {
    if (!confirm('Удалить транспорт?')) return
    try {
      await api.delete(`/trucks/${id}`)
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка')
    }
  }

  return (
    <div style={{ padding: '0 0 40px' }}>
      <PageHeader
        eyebrow="Парк"
        title="Транспорт"
        action={
          <Btn icon={<Icons.Plus size={14} />} onClick={() => { setEditing(null); setShowForm(true) }}>
            Добавить транспорт
          </Btn>
        }
      />

      <div style={{ padding: '0 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Search + filters */}
        <Card padding={14} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
            <Icons.Search size={14} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по номеру, марке, модели, водителю..."
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: 13, fontFamily: 'var(--font-body)', flex: 1 }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>✕</button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['all','Все'], ['available','Свободен'], ['in_transit','В рейсе'], ['maintenance','Ремонт']].map(([v, l]) => (
              <button key={v} onClick={() => setFilterStatus(v)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer', border: filterStatus === v ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)', background: filterStatus === v ? 'rgba(240,165,0,0.12)' : 'transparent', color: filterStatus === v ? 'var(--gold)' : 'rgba(255,255,255,0.5)' }}>{l}</button>
            ))}
          </div>
          {(search || filterStatus !== 'all') && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
              {visible.length} из {trucks.length}
            </div>
          )}
        </Card>

        {loading ? (
          <Loading />
        ) : visible.length === 0 ? (
          <Empty text={trucks.length === 0 ? 'Транспорта пока нет' : 'Ничего не найдено'} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {visible.map((t) => (
              <Card key={t.id} padding={20} hover>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 0.5, marginBottom: 4 }}>
                      {t.brand} {t.model}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--gold)', marginBottom: 4 }}>
                      {t.plate_number}
                    </div>
                  </div>
                  <StatusPill status={t.status} map={TRUCK_STATUS_MAP} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                    Грузоподъёмность: <span style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-mono)' }}>{t.capacity_weight.toLocaleString('ru')} кг</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                    Объём: <span style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-mono)' }}>{t.capacity_volume} м³</span>
                  </div>
                  {t.driver_name && (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                      Водитель: <span style={{ color: 'rgba(255,255,255,0.85)' }}>{t.driver_name}</span>
                    </div>
                  )}
                  {(t.height_m || t.width_m || t.length_m) && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                      {[t.height_m && `В: ${t.height_m}м`, t.width_m && `Ш: ${t.width_m}м`, t.length_m && `Д: ${t.length_m}м`].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => { setEditing(t); setShowForm(true) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', transition: 'color 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
                    >
                      <Icons.Edit size={14} /> Изменить
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', transition: 'color 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--red)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
                    >
                      <Icons.Trash size={14} /> Удалить
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

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
    height_m:     initial?.height_m     || '',
    width_m:      initial?.width_m      || '',
    length_m:     initial?.length_m     || '',
    mass_kg:      initial?.mass_kg      || '',
    axle_load_kg: initial?.axle_load_kg || '',
    status: initial?.status || 'available',
    driver_id: initial?.driver_id || '',
    is_company_owned: initial?.is_company_owned ?? true,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        capacity_weight: parseInt(form.capacity_weight),
        capacity_volume: parseFloat(form.capacity_volume),
        height_m:     form.height_m     ? parseFloat(form.height_m)     : null,
        width_m:      form.width_m      ? parseFloat(form.width_m)      : null,
        length_m:     form.length_m     ? parseFloat(form.length_m)     : null,
        mass_kg:      form.mass_kg      ? parseInt(form.mass_kg)        : null,
        axle_load_kg: form.axle_load_kg ? parseInt(form.axle_load_kg)   : null,
        driver_id: form.driver_id || null,
      }
      if (initial) await api.put(`/trucks/${initial.id}`, payload)
      else await api.post('/trucks', payload)
      onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка')
    }
    setLoading(false)
  }

  return (
    <Modal onClose={onClose} title={initial ? 'Изменить транспорт' : 'Новый транспорт'} maxWidth={460}>
      {error && <Alert type="error">{error}</Alert>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Госномер" required value={form.plate_number} onChange={set('plate_number')} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Марка" required value={form.brand} onChange={set('brand')} />
          <Field label="Модель" required value={form.model} onChange={set('model')} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Грузоподъёмность (т)" type="number" step="0.1" required value={form.capacity_weight} onChange={set('capacity_weight')} />
          <Field label="Объём (м³)" type="number" step="0.1" required value={form.capacity_volume} onChange={set('capacity_volume')} />
        </div>

        {/* Габариты для маршрута */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
            Габариты фуры (для построения маршрутов)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <Field label="Высота (м)" type="number" step="0.01" placeholder="4.0"  value={form.height_m}  onChange={set('height_m')} />
            <Field label="Ширина (м)"  type="number" step="0.01" placeholder="2.55" value={form.width_m}   onChange={set('width_m')} />
            <Field label="Длина (м)"   type="number" step="0.01" placeholder="16.5" value={form.length_m}  onChange={set('length_m')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <Field label="Масса без груза (кг)" type="number" placeholder="7500" value={form.mass_kg}      onChange={set('mass_kg')} />
            <Field label="Нагрузка на ось (кг)" type="number" placeholder="11500" value={form.axle_load_kg} onChange={set('axle_load_kg')} />
          </div>
        </div>

        <Select label="Статус" value={form.status} onChange={set('status')}>
          <option value="available">Свободен</option>
          <option value="in_transit">В рейсе</option>
          <option value="maintenance">На ремонте</option>
        </Select>
        <Select label="Водитель" value={form.driver_id} onChange={set('driver_id')}>
          <option value="">— Без водителя —</option>
          {drivers.filter((d) => d.is_available).map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </Select>
        <Btn type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
          {loading ? 'Сохраняем...' : 'Сохранить'}
        </Btn>
      </form>
    </Modal>
  )
}
