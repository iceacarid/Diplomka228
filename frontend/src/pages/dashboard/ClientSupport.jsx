import { Card } from '../../components/ui'
import { Icons } from '../../components/Icons'

export default function ClientSupport() {
  return (
    <div style={{ padding: 36, maxWidth: 560 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, letterSpacing: 1, marginBottom: 28 }}>
        Под<span style={{ color: 'var(--gold)' }}>держка</span>
      </h2>
      <Card padding={48} style={{ textAlign: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.1)', marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
          <Icons.Phone size={52} />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 10, letterSpacing: 1 }}>
          Скоро
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
          Раздел поддержки находится в разработке.<br />
          По вопросам обращайтесь к менеджеру.
        </div>
      </Card>
    </div>
  )
}
