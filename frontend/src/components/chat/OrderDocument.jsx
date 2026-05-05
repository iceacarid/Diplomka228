import { Icons } from '../Icons'

const CARGO_TYPE_MAP = {
  general:               'Общий груз',
  fragile:               'Хрупкий груз',
  flammable:             'Воспламеняемый',
  perishable:            'Скоропортящийся',
  hazardous:             'Опасный груз (ADR)',
  oversized:             'Негабаритный',
  temperature_controlled:'Температурный режим',
  other:                 'Другое',
}

const PACKAGING_MAP = {
  '':       'Не требуется',
  pallets:  'Паллетирование',
  stretch:  'Стрейч-пленка',
  crate:    'Жесткая обрешетка',
}

function DocRow({ label, value }) {
  return (
    <tr>
      <td style={{ padding: '6px 12px 6px 0', fontSize: 12, color: 'rgba(0,0,0,0.5)', width: 180, verticalAlign: 'top' }}>{label}</td>
      <td style={{ padding: '6px 0', fontSize: 12, color: '#000', fontWeight: 500 }}>{value || '—'}</td>
    </tr>
  )
}

function DocSection({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#333', textTransform: 'uppercase', borderBottom: '1px solid #ddd', paddingBottom: 4, marginBottom: 10 }}>
        {title}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>{children}</tbody></table>
    </div>
  )
}

export function OrderDocument({ chatMeta, formData, onClose }) {
  const m = formData ?? {}
  const today = new Date().toLocaleDateString('ru-RU')
  const trackingId = chatMeta?.tracking_id ?? '—'

  const cargoLabel = m.cargo_type === 'other' && m.cargo_type_custom
    ? m.cargo_type_custom
    : CARGO_TYPE_MAP[m.cargo_type] || m.cargo_type || '—'

  const loaderPickup = m.loaders_pickup === 'yes'
    ? `Да${m.loaders_pickup_floor ? `, ${m.loaders_pickup_floor} эт.` : ''}${m.loaders_pickup_lift ? ', лифт' : ''}`
    : 'Нет'

  return (
    <div style={{
      position:   'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)',
      display:    'flex', alignItems: 'center', justifyContent: 'center',
      padding:    20,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:   '#fff',
          borderRadius: 8,
          maxWidth:     700,
          width:        '100%',
          maxHeight:    '90vh',
          overflowY:    'auto',
          padding:      40,
          color:        '#000',
          fontFamily:   'Georgia, serif',
          position:     'relative',
        }}
      >
        {/* Кнопки управления */}
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }} className="no-print">
          <button
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 5, border: '1px solid #ccc', background: '#f5f5f5', fontSize: 12, cursor: 'pointer' }}
          >
            Распечатать
          </button>
          <button
            onClick={onClose}
            style={{ padding: '6px 10px', borderRadius: 5, border: '1px solid #ccc', background: '#f5f5f5', fontSize: 12, cursor: 'pointer' }}
          >
            <Icons.X size={14} />
          </button>
        </div>

        {/* Шапка */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>ФУРАЕДЕТ</div>
          <div style={{ fontSize: 11, color: '#666', letterSpacing: 1 }}>ТРАНСПОРТНО-ЛОГИСТИЧЕСКАЯ КОМПАНИЯ</div>
          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #333, transparent)', margin: '12px auto', maxWidth: 300 }} />
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
            ЗАЯВКА НА ПЕРЕВОЗКУ ГРУЗА
          </div>
          <div style={{ fontSize: 12, color: '#555' }}>
            № <strong>{trackingId}</strong> &nbsp;·&nbsp; Дата: {today}
          </div>
        </div>

        {/* Блоки */}
        <DocSection title="Забор груза">
          <DocRow label="Адрес отправления" value={m.origin_address} />
          <DocRow label="Дата забора" value={m.pickup_date} />
          <DocRow label="Время забора" value={m.pickup_time} />
          <DocRow label="Контактное лицо" value={m.pickup_name} />
          <DocRow label="Телефон" value={m.pickup_phone} />
        </DocSection>

        <DocSection title="Доставка груза">
          <DocRow label="Адрес доставки" value={m.dest_address} />
          <DocRow label="Контактное лицо" value={m.delivery_name} />
          <DocRow label="Телефон" value={m.delivery_phone} />
        </DocSection>

        <DocSection title="Характеристики груза">
          <DocRow label="Тип груза" value={cargoLabel} />
          <DocRow label="Вес" value={m.weight ? `${m.weight} кг` : null} />
          <DocRow label="Объём" value={m.volume ? `${m.volume} м³` : null} />
          {m.cargo_description && <DocRow label="Описание" value={m.cargo_description} />}
        </DocSection>

        <DocSection title="Дополнительные услуги">
          <DocRow label="Грузчики (погрузка)" value={loaderPickup} />
          <DocRow label="Грузчики (выгрузка)" value={m.loaders_delivery === 'yes' ? 'Да' : 'Нет'} />
          <DocRow label="Упаковка" value={PACKAGING_MAP[m.packaging] || 'Не требуется'} />
          {m.comment && <DocRow label="Комментарий" value={m.comment} />}
        </DocSection>

        {/* Подписи */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 40 }}>
          {[['Отправитель', m.pickup_name], ['Получатель', m.delivery_name]].map(([role, name]) => (
            <div key={role}>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{role}</div>
              <div style={{ borderBottom: '1px solid #999', height: 32, marginBottom: 4 }} />
              <div style={{ fontSize: 10, color: '#999' }}>{name || '____________________'} / подпись</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 10, color: '#aaa', borderTop: '1px solid #eee', paddingTop: 12 }}>
          Документ сформирован автоматически системой ФураЕдет
        </div>
      </div>

      <style>{`@media print { .no-print { display: none !important; } }`}</style>
    </div>
  )
}
