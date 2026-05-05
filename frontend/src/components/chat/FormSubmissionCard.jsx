import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Icons } from '../Icons'
import api from '../../api/axios'

const CARGO_TYPE_MAP = {
  general:               { emoji: '📦', label: 'Общий груз' },
  fragile:               { emoji: '🍷', label: 'Хрупкий груз' },
  flammable:             { emoji: '🔥', label: 'Воспламеняемый' },
  perishable:            { emoji: '🥩', label: 'Скоропортящийся' },
  hazardous:             { emoji: '⚠️',  label: 'Опасный груз (ADR)' },
  oversized:             { emoji: '📏', label: 'Негабаритный' },
  temperature_controlled:{ emoji: '❄️',  label: 'Температурный режим' },
  other:                 { emoji: '📋', label: 'Другое' },
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

// ── Section header ─────────────────────────────────────────────────────────
function Section({ emoji, title, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{emoji}</span>{title}
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

  const cargoInfo  = CARGO_TYPE_MAP[m.cargo_type] ?? { emoji: '📦', label: m.cargo_type || '—' }
  const cargoLabel = m.cargo_type === 'other' && m.cargo_type_custom
    ? `${cargoInfo.emoji} ${m.cargo_type_custom}`
    : `${cargoInfo.emoji} ${cargoInfo.label}`

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
      maxWidth:     520,
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
        <Section emoji="🏭" title="ЗАБОР ГРУЗА">
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
        <Section emoji="🚚" title="ДОСТАВКА">
          <Row label="Адрес" value={m.dest_address} />
          <Row label="Контакт" value={`${m.delivery_name || '—'}, ${m.delivery_phone || '—'}`} editing={editing}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <input value={m.delivery_name  || ''} onChange={set('delivery_name')}  placeholder="Имя"     style={INP} />
              <input value={m.delivery_phone || ''} onChange={set('delivery_phone')} placeholder="Телефон" style={INP} />
            </div>
          </Row>
        </Section>

        {/* Блок 3: Груз */}
        <Section emoji="📦" title="ХАРАКТЕРИСТИКИ ГРУЗА">
          <Row label="Тип груза" value={cargoLabel} />
          <Row label="Вес" value={m.weight ? `${m.weight} кг` : null} />
          <Row label="Объём" value={m.volume ? `${m.volume} м³` : null} />
          {m.cargo_description && (
            <Row label="Описание" value={m.cargo_description} editing={editing}>
              <input value={m.cargo_description || ''} onChange={set('cargo_description')} style={INP} />
            </Row>
          )}
        </Section>

        {/* Блок 4: Доп. услуги */}
        <Section emoji="🔧" title="ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ">
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
