import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Icons } from '../Icons'
import api from '../../api/axios'

const CargoIcon = {
  general:               () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  fragile:               () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a5 5 0 0 1 5 5c0 3-2 5-5 8-3-3-5-5-5-8a5 5 0 0 1 5-5z"/><path d="M8 20h8"/><path d="M12 15v5"/></svg>,
  flammable:             () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></svg>,
  perishable:            () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>,
  hazardous:             () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  oversized:             () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>,
  temperature_controlled:() => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/></svg>,
  other:                 () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h4"/></svg>,
}

const CARGO_TYPE_MAP = {
  general:               { label: 'Общий груз',          color: '#F0A500' },
  fragile:               { label: 'Хрупкий груз',        color: '#818CF8' },
  flammable:             { label: 'Воспламеняемый',      color: '#F04438' },
  perishable:            { label: 'Скоропортящийся',     color: '#12B76A' },
  hazardous:             { label: 'Опасный груз (ADR)',  color: '#F59E0B' },
  oversized:             { label: 'Негабаритный',        color: '#8B5CF6' },
  temperature_controlled:{ label: 'Температурный режим', color: '#06B6D4' },
  other:                 { label: 'Другое',              color: 'rgba(255,255,255,0.5)' },
}

const PACKAGING_MAP = {
  '':       'Не нужна',
  pallets:  'Паллетирование',
  stretch:  'Стрейч-пленка',
  crate:    'Жесткая обрешетка',
}

const TIME_SLOTS = ['09:00–12:00', '12:00–15:00', '15:00–18:00', 'Точное время']

// ── Row in card ────────────────────────────────────────────────────────────
function Row({ label, value, editing, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{label}</span>
      {editing && children
        ? children
        : <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{value || '—'}</span>
      }
    </div>
  )
}

// ── Cargo info card ─────────────────────────────────────────────────────────
function CargoInfoCard({ cargoText, cargoInfo, CargoIco }) {
  const color = cargoInfo?.color || '#F0A500'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 9, border: `1px solid ${color}40`, background: `${color}0d`, padding: '14px 16px', marginBottom: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}18`, border: `1.5px solid ${color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color }}>
        <CargoIco s={24} />
      </div>
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color, marginBottom: 3 }}>Тип груза</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{cargoText}</div>
      </div>
    </div>
  )
}

// ── Section header ─────────────────────────────────────────────────────────
function Section({ icon, title, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon}{title}
      </div>
      {children}
    </div>
  )
}

const INP = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 4, padding: '4px 8px', color: '#fff', fontSize: 12,
  fontFamily: 'var(--font-body)', outline: 'none', width: '100%', boxSizing: 'border-box',
}

// ══════════════════════════════════════════════════════════════════════════
export function FormSubmissionCard({ msg, chatId, onUpdate }) {
  const { user }        = useAuth()
  const isManager       = user?.role === 'manager' || user?.role === 'admin'
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  const orig = msg.metadata ?? {}
  const [m, setM] = useState({ ...orig })
  const set = k => e => setM(prev => ({ ...prev, [k]: e.target.value }))

  const cargoInfo  = CARGO_TYPE_MAP[m.cargo_type] ?? { label: m.cargo_type || '—' }
  const CargoIco   = CargoIcon[m.cargo_type] ?? CargoIcon.other
  const cargoText  = m.cargo_type === 'other' && m.cargo_type_custom ? m.cargo_type_custom : cargoInfo.label

  const loaderPickup = m.loaders_pickup === 'yes'
    ? `Да${m.loaders_pickup_floor ? `, ${m.loaders_pickup_floor} эт.` : ''}${m.loaders_pickup_lift ? ', лифт есть' : ''}`
    : 'Нет'

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      await api.patch(`/chats/${chatId}/messages/${msg.id}`, { metadata: m })
      onUpdate?.(msg.id, m)
      setEditing(false)
    } catch {
      setError('Ошибка сохранения')
    }
    setSaving(false)
  }

  const handleCancel = () => { setM({ ...orig }); setEditing(false); setError('') }

  const time = new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  const date = new Date(msg.created_at).toLocaleDateString('ru-RU')

  return (
    <div style={{
      background:   'rgba(255,255,255,0.03)',
      border:       '1px solid rgba(240,165,0,0.2)',
      borderRadius: 10,
      overflow:     'hidden',
      width:        '100%',
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(240,165,0,0.07)',
        borderBottom: '1px solid rgba(240,165,0,0.15)',
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icons.Package size={14} style={{ color: 'var(--gold)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--gold)' }}>
            ФОРМА ЗАЯВКИ
          </span>
        </div>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
          {date} {time}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px' }}>

        {/* Блок 1: Забор */}
        <Section icon={<Icons.Warehouse size={11} />} title="ЗАБОР ГРУЗА">
          <Row label="Адрес" value={m.origin_address} />
          <Row label="Дата забора" value={m.pickup_date} editing={editing}>
            <input type="date" value={m.pickup_date} onChange={set('pickup_date')} style={INP} />
          </Row>
          <Row label="Время" value={m.pickup_time} editing={editing}>
            <select value={m.pickup_time} onChange={set('pickup_time')} style={{ ...INP, cursor: 'pointer' }}>
              {TIME_SLOTS.map(t => <option key={t} value={t} style={{ background: '#12122a' }}>{t}</option>)}
            </select>
          </Row>
          <Row label="Контакт" value={`${m.pickup_name || '—'}, ${m.pickup_phone || '—'}`} editing={editing}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <input value={m.pickup_name  || ''} onChange={set('pickup_name')}  placeholder="Имя"     style={INP} />
              <input value={m.pickup_phone || ''} onChange={set('pickup_phone')} placeholder="Телефон" style={INP} />
            </div>
          </Row>
        </Section>

        {/* Блок 2: Доставка */}
        <Section icon={<Icons.Truck size={11} />} title="ДОСТАВКА">
          <Row label="Адрес" value={m.dest_address} />
          <Row label="Контакт" value={`${m.delivery_name || '—'}, ${m.delivery_phone || '—'}`} editing={editing}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <input value={m.delivery_name  || ''} onChange={set('delivery_name')}  placeholder="Имя"     style={INP} />
              <input value={m.delivery_phone || ''} onChange={set('delivery_phone')} placeholder="Телефон" style={INP} />
            </div>
          </Row>
        </Section>

        {/* Блок 3: Груз */}
        <Section icon={<Icons.Package size={11} />} title="ХАРАКТЕРИСТИКИ ГРУЗА">
          <CargoInfoCard cargoText={cargoText} cargoInfo={cargoInfo} CargoIco={CargoIco} />
          <Row label="Вес" value={m.weight ? `${m.weight} кг` : null} />
          <Row label="Объём" value={m.volume ? `${m.volume} м³` : null} />
          {m.cargo_description && (
            <Row label="Описание" value={m.cargo_description} editing={editing}>
              <input value={m.cargo_description || ''} onChange={set('cargo_description')} style={INP} />
            </Row>
          )}
        </Section>

        {/* Блок 4: Доп. услуги */}
        <Section icon={<Icons.Settings size={11} />} title="ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ">
          <Row label="Грузчики (погрузка)" value={loaderPickup} editing={editing}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <select value={m.loaders_pickup} onChange={set('loaders_pickup')} style={{ ...INP, cursor: 'pointer' }}>
                <option value="no"  style={{ background: '#12122a' }}>Нет</option>
                <option value="yes" style={{ background: '#12122a' }}>Да</option>
              </select>
              {m.loaders_pickup === 'yes' && (
                <input value={m.loaders_pickup_floor || ''} onChange={set('loaders_pickup_floor')} placeholder="Этаж" style={INP} />
              )}
            </div>
          </Row>
          <Row
            label="Грузчики (выгрузка)"
            value={m.loaders_delivery === 'yes' ? 'Да' : 'Нет'}
            editing={editing}
          >
            <select value={m.loaders_delivery} onChange={set('loaders_delivery')} style={{ ...INP, cursor: 'pointer' }}>
              <option value="no"  style={{ background: '#12122a' }}>Нет</option>
              <option value="yes" style={{ background: '#12122a' }}>Да</option>
            </select>
          </Row>
          <Row label="Упаковка" value={PACKAGING_MAP[m.packaging] || 'Не нужна'} editing={editing}>
            <select value={m.packaging || ''} onChange={set('packaging')} style={{ ...INP, cursor: 'pointer' }}>
              {Object.entries(PACKAGING_MAP).map(([v, l]) => (
                <option key={v} value={v} style={{ background: '#12122a' }}>{l}</option>
              ))}
            </select>
          </Row>
          {(m.comment || editing) && (
            <Row label="Комментарий" value={m.comment} editing={editing}>
              <textarea value={m.comment || ''} onChange={set('comment')} rows={2} style={{ ...INP, resize: 'vertical' }} />
            </Row>
          )}
        </Section>

        {error && <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 8 }}>{error}</div>}

        {/* Manager actions */}
        {isManager && (
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {editing ? (
              <>
                <button onClick={handleSave} disabled={saving} style={{
                  flex: 1, padding: '7px 0', borderRadius: 6, border: 'none',
                  background: saving ? 'rgba(18,183,106,0.3)' : 'rgba(18,183,106,0.15)',
                  color: '#12B76A', fontSize: 11, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
                  letterSpacing: '0.08em', fontFamily: 'var(--font-body)',
                }}>
                  {saving ? 'Сохранение...' : '✓ Сохранить'}
                </button>
                <button onClick={handleCancel} style={{
                  padding: '7px 14px', borderRadius: 6, border: 'none',
                  background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
                  fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}>
                  Отмена
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)',
                fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}>
                <Icons.Edit size={12} /> Редактировать
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
