import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Icons } from '../Icons'

const TIME_SLOTS = ['09:00–12:00', '12:00–15:00', '15:00–18:00', 'Точное время']

const CargoIcon = {
  general:               (s=13) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  fragile:               (s=13) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a5 5 0 0 1 5 5c0 3-2 5-5 8-3-3-5-5-5-8a5 5 0 0 1 5-5z"/><path d="M8 20h8"/><path d="M12 15v5"/></svg>,
  flammable:             (s=13) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></svg>,
  perishable:            (s=13) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>,
  hazardous:             (s=13) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  oversized:             (s=13) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>,
  temperature_controlled:(s=13) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/></svg>,
  other:                 (s=13) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h4"/></svg>,
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

// ── Cargo info card ────────────────────────────────────────────────────────
function CargoInfoCard({ cargoText, cargoInfo, CargoIco }) {
  const color = cargoInfo?.color || '#F0A500'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      borderRadius: 9, border: `1px solid ${color}40`,
      background: `${color}0d`, padding: '14px 16px', marginBottom: 10,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 12,
        background: `${color}18`, border: `1.5px solid ${color}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, color,
      }}>
        <CargoIco s={26} />
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color, marginBottom: 3 }}>
          Тип груза
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{cargoText}</div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
        <Icons.Lock size={10} /> зафиксировано
      </div>
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
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const cargoType  = orderData?.cargo_type
  const cargoInfo  = CARGO_TYPE_MAP[cargoType] ?? { label: cargoType || 'Не указан' }
  const CargoIco   = CargoIcon[cargoType] ?? CargoIcon.general
  const cargoText  = cargoType === 'other' && orderData?.cargo_type_custom
    ? orderData.cargo_type_custom
    : cargoInfo.label

  const [pickupDate,  setPickupDate]  = useState('')
  const [pickupTime,  setPickupTime]  = useState('09:00–12:00')
  const [pickupTimeX, setPickupTimeX] = useState('')
  const [pickupName,  setPickupName]  = useState('')
  const [pickupPhone, setPickupPhone] = useState('')

  const [deliveryName,  setDeliveryName]  = useState('')
  const [deliveryPhone, setDeliveryPhone] = useState('')

  const [cargoDesc,    setCargoDesc]    = useState(orderData?.cargo_description || '')
  const [loaderLoad,    setLoaderLoad]    = useState('no')
  const [loadFloor,     setLoadFloor]     = useState('')
  const [loadLift,      setLoadLift]      = useState(false)
  const [loaderUnload,  setLoaderUnload]  = useState('no')
  const [unloadFloor,   setUnloadFloor]   = useState('')
  const [unloadLift,    setUnloadLift]    = useState(false)
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
      loaders_delivery:       loaderUnload,
      loaders_delivery_floor: loaderUnload === 'yes' ? unloadFloor : '',
      loaders_delivery_lift:  loaderUnload === 'yes' ? unloadLift  : false,
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
        <CargoInfoCard cargoText={cargoText} cargoInfo={cargoInfo} CargoIco={CargoIco} />

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
          {loaderUnload === 'yes' && (
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
              <input value={unloadFloor} onChange={e => setUnloadFloor(e.target.value)} placeholder="Этаж" style={INP} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.55)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={unloadLift} onChange={e => setUnloadLift(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
                Есть лифт
              </label>
            </div>
          )}
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
