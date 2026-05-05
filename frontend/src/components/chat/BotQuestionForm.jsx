import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Icons } from '../Icons'

const TIME_SLOTS = ['09:00–12:00', '12:00–15:00', '15:00–18:00', 'Точное время']

const CARGO_TYPE_MAP = {
  general:              { emoji: '📦', label: 'Общий груз' },
  fragile:              { emoji: '🍷', label: 'Хрупкий груз' },
  flammable:            { emoji: '🔥', label: 'Воспламеняемый' },
  perishable:           { emoji: '🥩', label: 'Скоропортящийся' },
  hazardous:            { emoji: '⚠️', label: 'Опасный груз (ADR)' },
  oversized:            { emoji: '📏', label: 'Негабаритный' },
  temperature_controlled: { emoji: '❄️', label: 'Температурный режим' },
  other:                { emoji: '📋', label: 'Другое' },
}

const PACKAGING_OPTIONS = [
  { value: '',        label: 'Не нужна' },
  { value: 'pallets', label: 'Паллетирование' },
  { value: 'stretch', label: 'Стрейч-пленка' },
  { value: 'crate',   label: 'Жесткая обрешетка' },
]

// ── Phone mask ─────────────────────────────────────────────────────────────
function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '')
  const d = digits.startsWith('7') || digits.startsWith('8') ? digits.slice(1) : digits
  let out = '+7'
  if (d.length > 0) out += ' (' + d.slice(0, 3)
  if (d.length >= 3) out += ') ' + d.slice(3, 6)
  if (d.length >= 6) out += '-' + d.slice(6, 8)
  if (d.length >= 8) out += '-' + d.slice(8, 10)
  return out
}

function phoneHandler(setter) {
  return e => setter(formatPhone(e.target.value))
}

// ── Today string for min date ──────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().split('T')[0]
}

// ── Locked field ───────────────────────────────────────────────────────────
function LockedField({ label, value, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 5, fontWeight: 500 }}>
          {label}
        </label>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 6, padding: '9px 12px',
      }}>
        {children ?? <span style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{value || '—'}</span>}
        <Icons.Lock size={12} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
      </div>
    </div>
  )
}

// ── Block wrapper ──────────────────────────────────────────────────────────
function Block({ title, subtitle, children }) {
  return (
    <div style={{ borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ padding: '10px 14px', background: 'rgba(240,165,0,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--gold)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  )
}

// ── Yes/No ─────────────────────────────────────────────────────────────────
function YesNo({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {['yes', 'no'].map(v => (
        <button key={v} type="button" onClick={() => onChange(v)} style={{
          padding: '6px 18px', borderRadius: 5, border: 'none',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          background: value === v ? (v === 'yes' ? 'rgba(18,183,106,0.2)' : 'rgba(240,68,56,0.15)') : 'rgba(255,255,255,0.05)',
          color: value === v ? (v === 'yes' ? '#12B76A' : 'var(--red)') : 'rgba(255,255,255,0.45)',
          transition: 'all 0.15s',
        }}>{v === 'yes' ? 'Да' : 'Нет'}</button>
      ))}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
const INP = {
  width: '100%', background: 'var(--navy-3, #12122a)',
  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6,
  padding: '9px 12px', color: '#fff', fontSize: 13,
  fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box',
}

const LBL = {
  display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.45)',
  marginBottom: 5, fontWeight: 500,
}

// ══════════════════════════════════════════════════════════════════════════
export function BotQuestionForm({ onSubmit, disabled, orderData, chatId }) {
  const { user }   = useAuth()
  const storageKey = `chat_form_sent_${chatId}`
  const [sent, setSent]       = useState(() => !!localStorage.getItem(storageKey))
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const cargoInfo = CARGO_TYPE_MAP[orderData?.cargo_type] ?? { emoji: '📦', label: orderData?.cargo_type || 'Не указан' }
  const cargoLabel = orderData?.cargo_type === 'other' && orderData?.cargo_type_custom
    ? `${cargoInfo.emoji} ${orderData.cargo_type_custom}`
    : `${cargoInfo.emoji} ${cargoInfo.label}`

  const [pickupDate,  setPickupDate]  = useState('')
  const [pickupTime,  setPickupTime]  = useState('09:00–12:00')
  const [pickupTimeX, setPickupTimeX] = useState('')
  const [pickupName,  setPickupName]  = useState('')
  const [pickupPhone, setPickupPhone] = useState('')

  const [deliveryName,  setDeliveryName]  = useState('')
  const [deliveryPhone, setDeliveryPhone] = useState('')

  const [cargoDesc,    setCargoDesc]    = useState(orderData?.cargo_description || '')
  const [loaderLoad,   setLoaderLoad]   = useState('no')
  const [loadFloor,    setLoadFloor]    = useState('')
  const [loadLift,     setLoadLift]     = useState(false)
  const [loaderUnload, setLoaderUnload] = useState('no')
  const [packaging,    setPackaging]    = useState('')
  const [comment,      setComment]      = useState('')

  const fillMyData = () => {
    setPickupName(user?.name   || '')
    setPickupPhone(formatPhone(user?.phone || ''))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!pickupDate || !pickupName || !pickupPhone || !deliveryName || !deliveryPhone) {
      setError('Заполните обязательные поля (*)'); return
    }
    setError(''); setLoading(true)

    const time = pickupTime === 'Точное время' ? (pickupTimeX || 'уточнить') : pickupTime
    const pkg  = PACKAGING_OPTIONS.find(p => p.value === packaging)?.label || 'Не нужна'
    const loaderL = loaderLoad === 'yes'
      ? `Да (${loadFloor ? loadFloor + ' эт.' : 'этаж не указан'}, лифт: ${loadLift ? 'есть' : 'нет'})`
      : 'Нет'

    const metadata = {
      pickup_date:          pickupDate,
      pickup_time:          time,
      pickup_name:          pickupName,
      pickup_phone:         pickupPhone,
      delivery_name:        deliveryName,
      delivery_phone:       deliveryPhone,
      cargo_description:    cargoDesc,
      loaders_pickup:       loaderLoad,
      loaders_pickup_floor: loaderLoad === 'yes' ? loadFloor : '',
      loaders_pickup_lift:  loaderLoad === 'yes' ? loadLift  : false,
      loaders_delivery:     loaderUnload,
      packaging,
      comment,
      // snapshot данных из заявки (для документа)
      origin_address:    orderData?.origin_address   || '',
      dest_address:      orderData?.dest_address     || '',
      weight:            orderData?.weight           || null,
      volume:            orderData?.volume           || null,
      cargo_type:        orderData?.cargo_type       || '',
      cargo_type_custom: orderData?.cargo_type_custom || '',
    }

    try {
      await onSubmit('', metadata)
      localStorage.setItem(storageKey, '1')
      setSent(true)
    } catch {
      setError('Ошибка отправки. Попробуйте ещё раз.')
    }
    setLoading(false)
  }

  // ── Sent state ─────────────────────────────────────────────────────────
  if (sent) {
    return (
      <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(18,183,106,0.08)', border: '1px solid rgba(18,183,106,0.2)', borderRadius: 8, fontSize: 12, color: '#12B76A', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icons.Check size={14} /> Данные отправлены. Менеджер свяжется с вами.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>

      {/* ── Блок 1: Забор ── */}
      <Block title="БЛОК 1 · ЗАБОР ГРУЗА" subtitle="Откуда забираем">
        <LockedField label="Адрес отправления" value={orderData?.origin_address} />

        <div style={{ marginBottom: 10 }}>
          <label style={LBL}>Желаемая дата забора <span style={{ color: 'var(--red)' }}>*</span></label>
          <input
            type="date"
            value={pickupDate}
            min={todayISO()}
            onChange={e => setPickupDate(e.target.value)}
            style={{ ...INP, colorScheme: 'dark' }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={LBL}>Удобное время</label>
          <select
            value={pickupTime}
            onChange={e => setPickupTime(e.target.value)}
            style={{ ...INP, cursor: 'pointer', appearance: 'auto' }}
          >
            {TIME_SLOTS.map(t => (
              <option key={t} value={t} style={{ background: '#12122a', color: '#fff' }}>{t}</option>
            ))}
          </select>
          {pickupTime === 'Точное время' && (
            <input
              type="time"
              value={pickupTimeX}
              onChange={e => setPickupTimeX(e.target.value)}
              style={{ ...INP, marginTop: 6, colorScheme: 'dark' }}
            />
          )}
        </div>

        <div style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
            <label style={{ ...LBL, marginBottom: 0 }}>Контакт на месте забора <span style={{ color: 'var(--red)' }}>*</span></label>
            <button type="button" onClick={fillMyData} style={{
              fontSize: 10, background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.2)',
              borderRadius: 4, color: 'var(--gold)', padding: '3px 9px', cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>Я сам</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input value={pickupName}  onChange={e => setPickupName(e.target.value)}  placeholder="Имя" style={INP} />
            <input
              value={pickupPhone}
              onChange={phoneHandler(setPickupPhone)}
              placeholder="+7 (999) 000-00-00"
              type="tel"
              maxLength={18}
              style={INP}
            />
          </div>
        </div>
      </Block>

      {/* ── Блок 2: Доставка ── */}
      <Block title="БЛОК 2 · ДОСТАВКА" subtitle="Куда везём">
        <LockedField label="Адрес доставки" value={orderData?.dest_address} />

        <div>
          <label style={{ ...LBL, marginBottom: 5 }}>Контакт получателя <span style={{ color: 'var(--red)' }}>*</span></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input value={deliveryName}  onChange={e => setDeliveryName(e.target.value)}  placeholder="Имя" style={INP} />
            <input
              value={deliveryPhone}
              onChange={phoneHandler(setDeliveryPhone)}
              placeholder="+7 (999) 000-00-00"
              type="tel"
              maxLength={18}
              style={INP}
            />
          </div>
        </div>
      </Block>

      {/* ── Блок 3: Характеристики ── */}
      <Block title="БЛОК 3 · ХАРАКТЕРИСТИКИ ГРУЗА">
        {/* Тип груза — только отображение */}
        <LockedField label="Тип груза">
          <span style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{cargoLabel}</span>
        </LockedField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <LockedField label="Вес" value={orderData?.weight ? `${orderData.weight} кг` : null} />
          <LockedField label="Объём" value={orderData?.volume ? `${orderData.volume} м³` : null} />
        </div>

        <div>
          <label style={LBL}>Краткое описание груза</label>
          <input
            value={cargoDesc}
            onChange={e => setCargoDesc(e.target.value)}
            placeholder="Стройматериалы, автозапчасти, мебель..."
            style={INP}
          />
        </div>
      </Block>

      {/* ── Блок 4: Доп. услуги ── */}
      <Block title="БЛОК 4 · ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ">
        <div style={{ marginBottom: 12 }}>
          <label style={LBL}>Нужны грузчики на загрузке?</label>
          <YesNo value={loaderLoad} onChange={setLoaderLoad} />
          {loaderLoad === 'yes' && (
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
              <input value={loadFloor} onChange={e => setLoadFloor(e.target.value)} placeholder="Этаж" style={INP} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.55)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={loadLift} onChange={e => setLoadLift(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
                Есть лифт
              </label>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={LBL}>Нужны грузчики на выгрузке?</label>
          <YesNo value={loaderUnload} onChange={setLoaderUnload} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={LBL}>Дополнительная упаковка</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PACKAGING_OPTIONS.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => setPackaging(value)} style={{
                padding: '6px 12px', borderRadius: 5, border: 'none', fontSize: 11,
                cursor: 'pointer', fontWeight: 600,
                background: packaging === value ? 'rgba(240,165,0,0.15)' : 'rgba(255,255,255,0.05)',
                color: packaging === value ? 'var(--gold)' : 'rgba(255,255,255,0.45)',
                transition: 'all 0.15s',
              }}>{label}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={LBL}>Комментарий к заказу</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Пропускной режим, нюансы проезда, КПП..."
            rows={3}
            style={{ ...INP, resize: 'vertical', lineHeight: 1.5 }}
          />
        </div>
      </Block>

      {error && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 10 }}>{error}</div>}

      <button type="submit" disabled={disabled || loading} style={{
        width: '100%', padding: 12,
        background: disabled || loading ? 'rgba(240,165,0,0.4)' : 'var(--gold)',
        color: 'var(--navy)', border: 'none', borderRadius: 8,
        fontWeight: 700, fontSize: 13, letterSpacing: '0.08em',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-body)', transition: 'opacity 0.15s',
      }}>
        {loading ? 'Отправка...' : 'Отправить данные менеджеру'}
      </button>
    </form>
  )
}
