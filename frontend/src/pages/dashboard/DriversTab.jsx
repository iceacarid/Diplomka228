/* eslint-disable no-empty, react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { Icons } from '../../components/Icons'
import { Card, Btn, Field, Select, Modal, PageHeader, StatusPill, Alert, Loading, Empty } from '../../components/ui'

const AVAIL_MAP = {
  available: { bg: 'rgba(18,183,106,0.14)', fg: 'var(--green)', label: 'Доступен' },
  busy:      { bg: 'rgba(240,68,56,0.14)',  fg: 'var(--red)',   label: 'Занят' },
}

const TYPE_MAP = {
  staff:  { bg: 'rgba(46,144,250,0.14)',  fg: 'var(--blue)',  label: 'Штатный' },
  hired:  { bg: 'rgba(122,90,248,0.14)',  fg: 'var(--violet)', label: 'Наёмный' },
}

export default function DriversTab() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search,      setSearch]      = useState('')
  const [filterAvail, setFilterAvail] = useState('all')
  const [filterType,  setFilterType]  = useState('all')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/drivers')
      setDrivers(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const q = search.toLowerCase()
  const visible = drivers.filter(d => {
    if (q && !`${d.name} ${d.phone} ${d.license_number}`.toLowerCase().includes(q)) return false
    if (filterAvail !== 'all' && String(d.is_available) !== filterAvail) return false
    if (filterType  !== 'all' && d.type !== filterType) return false
    return true
  })

  const handleDelete = async (id) => {
    if (!confirm('Удалить водителя?')) return
    try {
      await api.delete(`/drivers/${id}`)
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка')
    }
  }

  return (
    <div style={{ padding: '0 0 40px' }}>
      <PageHeader
        eyebrow="Персонал"
        title="Водители"
        action={
          <Btn icon={<Icons.Plus size={14} />} onClick={() => { setEditing(null); setShowForm(true) }}>
            Добавить водителя
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
              placeholder="Поиск по имени, телефону, правам..."
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: 13, fontFamily: 'var(--font-body)', flex: 1 }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>✕</button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['all','Все'], ['true','Доступен'], ['false','Занят']].map(([v, l]) => (
              <button key={v} onClick={() => setFilterAvail(v)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer', border: filterAvail === v ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)', background: filterAvail === v ? 'rgba(240,165,0,0.12)' : 'transparent', color: filterAvail === v ? 'var(--gold)' : 'rgba(255,255,255,0.5)' }}>{l}</button>
            ))}
            <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', alignSelf: 'stretch' }} />
            {[['all','Все типы'], ['staff','Штатный'], ['hired','Наёмный']].map(([v, l]) => (
              <button key={v} onClick={() => setFilterType(v)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer', border: filterType === v ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)', background: filterType === v ? 'rgba(240,165,0,0.12)' : 'transparent', color: filterType === v ? 'var(--gold)' : 'rgba(255,255,255,0.5)' }}>{l}</button>
            ))}
          </div>
          {(search || filterAvail !== 'all' || filterType !== 'all') && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
              {visible.length} из {drivers.length}
            </div>
          )}
        </Card>

        {loading ? (
          <Loading />
        ) : visible.length === 0 ? (
          <Empty text={drivers.length === 0 ? 'Водителей пока нет' : 'Ничего не найдено'} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {visible.map((d) => (
              <Card key={d.id} padding={20} hover>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 0.5, marginBottom: 4 }}>{d.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{d.phone}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                      Права: {d.license_number}
                    </div>
                  </div>
                  <StatusPill status={d.is_available ? 'available' : 'busy'} map={AVAIL_MAP} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <StatusPill status={d.type} map={TYPE_MAP} />
                </div>
                <div style={{ display: 'flex', gap: 10, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <button
                    onClick={() => { setEditing(d); setShowForm(true) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', transition: 'color 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
                  >
                    <Icons.Edit size={14} /> Изменить
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', transition: 'color 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--red)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
                  >
                    <Icons.Trash size={14} /> Удалить
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <DriverForm initial={editing} onClose={() => setShowForm(false)} onSaved={load} />

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
    is_available: initial?.is_available ?? true,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

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
    <Modal onClose={onClose} title={initial ? 'Изменить водителя' : 'Новый водитель'} maxWidth={440}>
      {error && <Alert type="error">{error}</Alert>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="ФИО" required value={form.name} onChange={set('name')} />
        <Field label="Телефон" required value={form.phone} onChange={set('phone')} />
        <Field label="Номер прав" required value={form.license_number} onChange={set('license_number')} />
        <Select label="Тип" value={form.type} onChange={set('type')}>
          <option value="staff">Штатный</option>
          <option value="hired">Наёмный</option>
        </Select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)' }}>
          <input
            type="checkbox"
            checked={form.is_available}
            onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))}
            style={{ accentColor: 'var(--gold)', width: 16, height: 16 }}
          />
          Доступен
        </label>
        <Btn type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
          {loading ? 'Сохраняем...' : 'Сохранить'}
        </Btn>
      </form>
    </Modal>
  )
}
