export function RejectionCard({ msg }) {
  const reason      = msg.body
  const managerName = msg.metadata?.manager_name ?? 'Менеджер'
  const time        = new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{
      display:       'flex',
      justifyContent:'center',
      marginBottom:  14,
    }}>
      <div style={{
        maxWidth:     560,
        width:        '100%',
        background:   'rgba(220,38,38,0.08)',
        border:       '1px solid rgba(220,38,38,0.35)',
        borderLeft:   '4px solid #dc2626',
        borderRadius: 12,
        padding:      '16px 18px',
        boxShadow:    '0 2px 12px rgba(220,38,38,0.12)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width:        32,
            height:       32,
            borderRadius: '50%',
            background:   'rgba(220,38,38,0.2)',
            border:       '1px solid rgba(220,38,38,0.4)',
            display:      'flex',
            alignItems:   'center',
            justifyContent:'center',
            flexShrink:   0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', letterSpacing: '0.03em' }}>
              Заявка отклонена
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
              {managerName}
            </div>
          </div>
        </div>

        {/* Reason */}
        <div style={{
          background:   'rgba(220,38,38,0.06)',
          border:       '1px solid rgba(220,38,38,0.15)',
          borderRadius: 8,
          padding:      '10px 12px',
          fontSize:     13,
          color:        'rgba(255,255,255,0.8)',
          lineHeight:   1.6,
          whiteSpace:   'pre-wrap',
        }}>
          {reason}
        </div>

        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 8, textAlign: 'right' }}>
          {time}
        </div>

        {/* Контактная информация */}
        <div style={{
          marginTop:    12,
          paddingTop:   12,
          borderTop:    '1px solid rgba(220,38,38,0.15)',
          fontSize:     12,
          color:        'rgba(255,255,255,0.45)',
          lineHeight:   1.65,
        }}>
          Для уточнения деталей и причины отмены заявки, пожалуйста, свяжитесь с нами по телефону:{' '}
          <a href="tel:+79123456789" style={{ color: '#ef4444', textDecoration: 'none', fontWeight: 600 }}>
            +7 912 345-67-89
          </a>
        </div>
      </div>
    </div>
  )
}
