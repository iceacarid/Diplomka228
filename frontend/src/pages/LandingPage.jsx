import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const [calc, setCalc] = useState({ from: '', to: '', kg: '', m3: '' })
  const [calcResult, setCalcResult] = useState(null)
  const [calcLoading, setCalcLoading] = useState(false)
  const [fleetActive, setFleetActive] = useState(0)

  const fleet = [
    { num: '01 / ФУРЫ', name: 'До 20 тонн', desc: 'Магистральные фуры для крупных партий. КАМАЗ, МАЗ, Volvo.', payload: '20 Т', img: '/img/truck-heavy.jpg' },
    { num: '02 / СРЕДНИЙ ТОННАЖ', name: 'До 5 тонн', desc: 'Региональная доставка средних партий. Гибкий график, быстрое оформление.', payload: '5 Т', img: '/img/truck-medium.jpg' },
    { num: '03 / МИНИВЭНЫ', name: 'Минивэны', desc: 'Срочные городские доставки. Express-формат, день в день.', payload: '1.5 Т', img: '/img/van.jpg' },
  ]

  const handleCalc = async (e) => {
    e.preventDefault()
    if (!calc.from || !calc.to || !calc.kg || !calc.m3) return
    setCalcLoading(true)
    try {
      const { data } = await api.post('/calculator', {
        origin: calc.from, destination: calc.to,
        weight: parseFloat(calc.kg), volume: parseFloat(calc.m3),
      })
      setCalcResult(data)
    } catch {
      setCalcResult({ price: '—', distance_km: '—' })
    }
    setCalcLoading(false)
  }

  const tickerItems = ['МОСКВА → КАЗАНЬ', 'СПБ → НОВОСИБИРСК', 'ЕКАТЕРИНБУРГ → СОЧИ', 'РОСТОВ → ВЛАДИВОСТОК', 'КРАСНОДАР → УФА', 'ВОРОНЕЖ → ИРКУТСК', 'НИЖНИЙ НОВГОРОД → САМАРА', 'ОМСК → ТЮМЕНЬ']

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--navy)', color: 'var(--white)', minHeight: '100vh' }}>

      {/* NAV */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background:'rgba(10,22,40,0.97)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', height:68, padding:'0 48px' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:28, letterSpacing:3, flexShrink:0, display:'flex', flexDirection:'column', lineHeight:1 }}>
          ФУРА<span style={{ color:'var(--gold)' }}>ЕДЕТ</span>
          <span style={{ fontSize:8, fontWeight:700, letterSpacing:'0.3em', textTransform:'uppercase', color:'rgba(240,165,0,0.55)', marginTop:2 }}>Logistics</span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:4, flex:1, justifyContent:'center' }}>
          {['Возможности','Почему мы','Автопарк','Как работаем','Отзывы'].map((label, i) => (
            <a key={label} href={`#${['services','why','fleet','process','testimonials'][i]}`}
              style={{ padding:'8px 15px', fontSize:11, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'rgba(255,255,255,0.42)', textDecoration:'none', transition:'color 0.2s' }}
              onMouseEnter={e => e.target.style.color='#fff'}
              onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.42)'}>
              {label}
            </a>
          ))}
          <Link to="/track"
            style={{ padding:'8px 15px', fontSize:11, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'rgba(240,165,0,0.7)', textDecoration:'none', transition:'color 0.2s', display:'flex', alignItems:'center', gap:5 }}
            onMouseEnter={e => e.currentTarget.style.color='var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.color='rgba(240,165,0,0.7)'}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            Отследить
          </Link>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          {isAuthenticated ? (
            <Link to="/dashboard" style={{ padding:'9px 22px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--navy)', background:'var(--gold)', border:'none', borderRadius:2, cursor:'pointer', textDecoration:'none' }}>
              Кабинет
            </Link>
          ) : (
            <>
              <Link to="/login" style={{ padding:'9px 20px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.55)', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:2, textDecoration:'none' }}>
                Войти
              </Link>
              <Link to="/register" style={{ padding:'9px 22px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--navy)', background:'var(--gold)', border:'none', borderRadius:2, textDecoration:'none' }}>
                Регистрация
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position:'relative', overflow:'hidden', minHeight:'100vh', display:'flex', flexDirection:'column', paddingTop:68 }}>
        <div style={{ position:'absolute', inset:0, background:"url('/img/hero-bg.jpg') center/cover no-repeat", opacity:0.08 }} />
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(240,165,0,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(240,165,0,0.03) 1px,transparent 1px)', backgroundSize:'80px 80px', pointerEvents:'none' }} />

        <div style={{ flex:1, display:'flex', alignItems:'center', padding:'80px 80px 60px', position:'relative', zIndex:2, gap:56 }}>
          {/* Left */}
          <div style={{ flex:1 }} className="animate-in">
            <div style={{ display:'inline-flex', alignItems:'center', gap:10, fontSize:10, fontWeight:700, letterSpacing:'0.25em', textTransform:'uppercase', color:'var(--gold)', marginBottom:32, border:'1px solid rgba(240,165,0,0.25)', padding:'9px 16px', borderRadius:2 }}>
              <span style={{ width:6, height:6, background:'var(--gold)', borderRadius:'50%', display:'block' }} />
              Логистика нового поколения
            </div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(64px,8vw,108px)', lineHeight:0.88, letterSpacing:3, textTransform:'uppercase', marginBottom:28 }}>
              <span style={{ WebkitTextStroke:'2px rgba(255,255,255,0.7)', color:'transparent' }}>Логистика</span><br />
              Вашего <span style={{ color:'var(--gold)' }}>Бизнеса.</span>
            </h1>
            <p style={{ fontSize:15, lineHeight:1.75, color:'rgba(255,255,255,0.45)', maxWidth:400, marginBottom:44, fontWeight:300, borderLeft:'2px solid var(--gold)', paddingLeft:16 }}>
              Скорость, надёжность и масштаб. Мы не просто везём грузы — мы ускоряем ваш бизнес по всей России.
            </p>
            <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:52 }}>
              <Link to="/register" style={{ padding:'15px 32px', background:'var(--gold)', color:'var(--navy)', fontWeight:700, fontSize:12, letterSpacing:'0.1em', textTransform:'uppercase', borderRadius:2, textDecoration:'none', transition:'all 0.2s', display:'inline-block' }}>
                Начать работу →
              </Link>
              <a href="#services" style={{ padding:'14px 32px', background:'transparent', color:'rgba(255,255,255,0.7)', fontWeight:600, fontSize:12, letterSpacing:'0.1em', textTransform:'uppercase', border:'1px solid rgba(255,255,255,0.15)', borderRadius:2, textDecoration:'none' }}>
                Узнать больше
              </a>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:28, paddingTop:32, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
              {[['25M+','КМ пройдено'],['14K','Клиентов'],['99%','Вовремя'],['24/7','Поддержка']].map(([val, lbl], i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:28 }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:34, letterSpacing:1, lineHeight:1 }}>{val}</div>
                    <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginTop:3 }}>{lbl}</div>
                  </div>
                  {i < 3 && <div style={{ width:1, height:36, background:'rgba(255,255,255,0.08)' }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Calc widget */}
          <div style={{ flexShrink:0 }}>
            <div style={{ background:'var(--navy2)', borderRadius:16, padding:'44px 44px 40px', border:'2px solid rgba(255,255,255,0.07)', width:520, transform:'rotate(2.5deg)', transition:'transform 0.45s cubic-bezier(0.34,1.56,0.64,1),border-color 0.35s,box-shadow 0.35s', boxShadow:'20px 20px 60px rgba(0,0,0,0.55)' }}
              onMouseEnter={e => { e.currentTarget.style.transform='rotate(0deg)'; e.currentTarget.style.borderColor='var(--gold)'; e.currentTarget.style.boxShadow='0 0 0 1px var(--gold),0 0 60px rgba(240,165,0,0.2),24px 24px 48px rgba(0,0,0,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.transform='rotate(2.5deg)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow='20px 20px 60px rgba(0,0,0,0.55)' }}>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--gold)', marginBottom:6 }}>Онлайн-калькулятор</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:42, letterSpacing:1, marginBottom:28, lineHeight:1 }}>
                Быстрый <span style={{ color:'var(--gold)' }}>расчёт</span>
              </div>
              <form onSubmit={handleCalc}>
                <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:10 }}>
                  <SuggestField label="Откуда" placeholder="Начните вводить город или адрес" value={calc.from} onChange={v => setCalc({...calc, from:v})} />
                  <SuggestField label="Куда" placeholder="Начните вводить город или адрес" value={calc.to} onChange={v => setCalc({...calc, to:v})} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                  <CalcField label="Вес, кг" placeholder="5000" type="number" value={calc.kg} onChange={v => setCalc({...calc, kg:v})} />
                  <CalcField label="Объём, м³" placeholder="20" type="number" value={calc.m3} onChange={v => setCalc({...calc, m3:v})} />
                </div>
                <div style={{ height:1, background:'rgba(255,255,255,0.07)', margin:'18px 0 14px' }} />
                <button type="submit" disabled={calcLoading} style={{ width:'100%', padding:'15px 0', background:'var(--gold)', color:'var(--navy)', fontWeight:700, fontSize:12, letterSpacing:'0.1em', textTransform:'uppercase', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'var(--font-body)' }}>
                  {calcLoading ? 'Считаем...' : 'Рассчитать стоимость →'}
                </button>
              </form>
              {calcResult && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:16, paddingTop:14, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
                  <div>
                    <div style={{ fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(255,255,255,0.28)', fontWeight:700, marginBottom:3 }}>Ориентировочная цена</div>
                    {calcResult.distance_km && calcResult.distance_km !== '—' && (
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>{calcResult.distance_km} км · ~{calcResult.estimated_delivery_days} дн.</div>
                    )}
                  </div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:32, color:'var(--gold)', letterSpacing:1, flexShrink:0 }}>
                    {typeof calcResult.price === 'number' ? `${Number(calcResult.price).toLocaleString('ru')} ₽` : calcResult.price}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom feature bar */}
        <div style={{ position:'relative', zIndex:2, borderTop:'1px solid rgba(255,255,255,0.05)', display:'grid', gridTemplateColumns:'repeat(3,1fr)' }}>
          {[
            { title:'GPS-мониторинг', desc:'Отслеживание в реальном времени', icon: (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" stroke="var(--gold)" strokeWidth="2"/>
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" stroke="var(--gold)" strokeWidth="1.5" strokeDasharray="2 2"/>
                <circle cx="12" cy="12" r="9" stroke="var(--gold)" strokeWidth="1.2" opacity=".3"/>
              </svg>
            )},
            { title:'Страхование грузов', desc:'Полное покрытие рисков', icon: (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path d="M12 3L4 7v6c0 4.418 3.582 8 8 8s8-3.582 8-8V7l-8-4z" stroke="var(--gold)" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M9 12l2 2 4-4" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )},
            { title:'Экспресс-доставка', desc:'День в день по России', icon: (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path d="M13 2L4.5 13H12l-1 9L20.5 11H13L14 2z" stroke="var(--gold)" strokeWidth="2" strokeLinejoin="round"/>
              </svg>
            )},
          ].map(({ title, desc, icon }) => (
            <div key={title} style={{ padding:'20px 40px', display:'flex', alignItems:'center', gap:14, borderRight:'1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width:36, height:36, borderRadius:6, background:'rgba(240,165,0,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{icon}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', lineHeight:1.4 }}>
                <strong style={{ display:'block', color:'rgba(255,255,255,0.85)', fontSize:12, fontWeight:700, marginBottom:1 }}>{title}</strong>
                {desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TICKER */}
      <div style={{ background:'var(--gold)', overflow:'hidden', padding:'13px 0' }}>
        <div style={{ display:'flex', animation:'ticker 30s linear infinite', whiteSpace:'nowrap' }}>
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} style={{ fontFamily:'var(--font-display)', fontSize:15, letterSpacing:2, color:'var(--navy)', padding:'0 28px', display:'inline-flex', alignItems:'center', gap:20 }}>
              {item} <span style={{ fontSize:7, opacity:0.5 }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div style={{ background:'var(--off)', display:'grid', gridTemplateColumns:'repeat(4,1fr)' }}>
        {[['25M+','Километров пройдено'],['14 000','Довольных клиентов'],['99%','Доставок в срок'],['12 лет','На рынке логистики']].map(([num, label]) => (
          <div key={label} style={{ padding:'52px 48px', borderRight:'1px solid var(--gray1)', position:'relative', overflow:'hidden' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:110, color:'rgba(10,22,40,0.04)', position:'absolute', top:-10, right:-8, lineHeight:1, pointerEvents:'none' }}>{num.split(' ')[0]}</div>
            <div style={{ width:28, height:3, background:'var(--gold)', marginBottom:16 }} />
            <div style={{ fontFamily:'var(--font-display)', fontSize:72, color:'var(--navy)', letterSpacing:1, lineHeight:1, marginBottom:8 }}>{num}</div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--gray2)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* SERVICES */}
      <section id="services" style={{ background:'var(--white)', padding:80 }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--gold)', marginBottom:12 }}>Наши возможности</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:56, color:'var(--navy)', letterSpacing:1, textTransform:'uppercase', marginBottom:48 }}>Услуги компании</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {[
            { title:'Автоперевозки', desc:'Надёжные грузоперевозки от двери до двери. Полный и сборный груз, FTL и LTL по России и СНГ.', icon: (
              <svg width="28" height="28" fill="none" viewBox="0 0 32 32">
                <rect x="2" y="10" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M22 14h4l4 5v5h-8V14z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <circle cx="8" cy="26" r="3" stroke="currentColor" strokeWidth="2"/>
                <circle cx="24" cy="26" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M5 10V7h14v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )},
            { title:'Рефрижераторы', desc:'Температурный режим от -25°C до +25°C. Идеально для продуктов питания и медикаментов.', icon: (
              <svg width="28" height="28" fill="none" viewBox="0 0 32 32">
                <rect x="4" y="4" width="24" height="24" rx="3" stroke="currentColor" strokeWidth="2"/>
                <line x1="16" y1="4" x2="16" y2="28" stroke="currentColor" strokeWidth="2"/>
                <line x1="4" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
                <path d="M16 9v5M13 11l3-2 3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 23v-5M13 21l3 2 3-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 16h5M11 13l-2 3 2 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 16h-5M21 13l2 3-2 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )},
            { title:'Негабаритные грузы', desc:'Перевозка крупногабаритных и тяжеловесных грузов с разрешениями и сопровождением.', icon: (
              <svg width="28" height="28" fill="none" viewBox="0 0 32 32">
                <path d="M4 22V10l12-6 12 6v12l-12 6-12-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M4 10l12 6M28 10l-12 6M16 16v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M10 7l6 3 6-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
              </svg>
            )},
            { title:'Складская логистика', desc:'Безопасное хранение на собственных складах с системой управления запасами.', icon: (
              <svg width="28" height="28" fill="none" viewBox="0 0 32 32">
                <path d="M4 14L16 6l12 8v16H4V14z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <rect x="12" y="20" width="8" height="10" stroke="currentColor" strokeWidth="1.8"/>
                <rect x="7" y="16" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="20" y="16" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            )},
            { title:'AI-оптимизация', desc:'Искусственный интеллект планирует маршруты, снижая затраты до 30%.', icon: (
              <svg width="28" height="28" fill="none" viewBox="0 0 32 32">
                <rect x="8" y="8" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                <circle cx="20" cy="12" r="1.5" fill="currentColor"/>
                <circle cx="12" cy="20" r="1.5" fill="currentColor"/>
                <circle cx="20" cy="20" r="1.5" fill="currentColor"/>
                <circle cx="16" cy="16" r="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 4v4M24 4v4M8 24v4M24 24v4M4 8h4M4 24h4M24 8h4M24 24h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )},
            { title:'GPS-мониторинг', desc:'Отслеживание груза в реальном времени. Уведомления на каждом этапе доставки.', icon: (
              <svg width="28" height="28" fill="none" viewBox="0 0 32 32">
                <path d="M16 3C11.03 3 7 7.03 7 12c0 7 9 17 9 17s9-10 9-17c0-4.97-4.03-9-9-9z" stroke="currentColor" strokeWidth="2"/>
                <circle cx="16" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M10 27c-3 .5-5 1.5-5 2.5s4 2 11 2 11-1 11-2-2-2-5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
              </svg>
            )},
          ].map(({ title, desc, icon }) => (
            <div key={title}
              style={{ background:'var(--off)', borderRadius:20, padding:32, cursor:'pointer', border:'1px solid transparent', transition:'all 0.3s' }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.background='var(--navy)'; el.style.transform='translateY(-4px)'; el.style.boxShadow='0 12px 40px rgba(10,22,40,0.25)'; el.querySelectorAll('svg')[0].style.color='var(--gold)'; el.querySelectorAll('.srv-title')[0].style.color='var(--white)'; el.querySelectorAll('.srv-desc')[0].style.color='rgba(255,255,255,0.45)'; el.querySelectorAll('.srv-icon-wrap')[0].style.background='rgba(240,165,0,0.12)' }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.background='var(--off)'; el.style.transform='none'; el.style.boxShadow='none'; el.querySelectorAll('svg')[0].style.color='var(--navy)'; el.querySelectorAll('.srv-title')[0].style.color='var(--navy)'; el.querySelectorAll('.srv-desc')[0].style.color='var(--gray3)'; el.querySelectorAll('.srv-icon-wrap')[0].style.background='var(--white)' }}>
              <div className="srv-icon-wrap" style={{ width:56, height:56, background:'var(--white)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20, color:'var(--navy)', transition:'background 0.3s', flexShrink:0 }}>{icon}</div>
              <div className="srv-title" style={{ fontFamily:'var(--font-display)', fontSize:26, color:'var(--navy)', textTransform:'uppercase', marginBottom:12, letterSpacing:0.5, transition:'color 0.3s' }}>{title}</div>
              <div className="srv-desc" style={{ fontSize:14, color:'var(--gray3)', lineHeight:1.6, transition:'color 0.3s' }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WHY */}
      <section id="why" style={{ background:'var(--navy)', display:'grid', gridTemplateColumns:'1fr 1fr', minHeight:520 }}>
        <div style={{ position:'relative', overflow:'hidden' }}>
          <img src="/img/warehouse.jpg" alt="Склад" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'grayscale(20%)', display:'block' }} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right,transparent 60%,var(--navy) 100%)' }} />
        </div>
        <div style={{ padding:'72px 72px 72px 52px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--gold)', marginBottom:12 }}>Почему ФураЕдет</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:58, lineHeight:0.9, textTransform:'uppercase', color:'var(--white)', marginBottom:40 }}>
            Надёжность —<br />наш <em style={{ fontStyle:'normal', color:'var(--gold)' }}>стандарт.</em>
          </div>
          <div>
            {[['01','Собственный автопарк 200+ единиц','Все автомобили оснащены GPS и проходят ежемесячный техосмотр.'],['02','AI-оптимизация маршрутов','Искусственный интеллект планирует маршруты, снижая затраты до 30%.'],['03','Страхование каждого груза','100% покрытие рисков при транспортировке. Выплата за 3 дня.'],['04','Личный менеджер 24/7','Выделенный менеджер всегда на связи. Среднее время ответа — 4 минуты.']].map(([num, title, desc]) => (
              <div key={num} style={{ display:'flex', alignItems:'flex-start', gap:16, padding:'18px 0', borderBottom:'1px solid rgba(255,255,255,0.07)', borderTop: num==='01' ? '1px solid rgba(255,255,255,0.07)':undefined }}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:10, fontWeight:600, color:'var(--gold)', letterSpacing:'0.1em', paddingTop:2, flexShrink:0 }}>{num}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--white)', marginBottom:2 }}>{title}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', lineHeight:1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FLEET */}
      <section id="fleet" style={{ background:'var(--navy)', overflow:'hidden', display:'flex', minHeight:600, position:'relative' }}>
        <div style={{ flex:'0 0 50%', display:'flex', flexDirection:'column', justifyContent:'center', padding:'80px 64px 80px 80px', position:'relative', zIndex:2 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--gold)', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ display:'block', width:24, height:2, background:'var(--gold)' }} />
            Наш автопарк
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:68, lineHeight:0.9, letterSpacing:2, textTransform:'uppercase', color:'var(--white)', marginBottom:48 }}>
            Сила в<br /><em style={{ fontStyle:'normal', color:'var(--gold)' }}>Движении</em>
          </div>
          <div>
            {fleet.map((cat, i) => (
              <div key={i}
                style={{ display:'flex', alignItems:'center', gap:20, padding:'22px 0', borderTop:'1px solid rgba(255,255,255,0.07)', cursor:'pointer', position:'relative', paddingLeft: fleetActive===i ? 8:0, transition:'padding-left 0.35s' }}
                onMouseEnter={() => setFleetActive(i)}
                onClick={() => setFleetActive(i)}>
                {fleetActive===i && <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:'var(--gold)' }} />}
                <div style={{ width:84, height:56, borderRadius:10, overflow:'hidden', flexShrink:0, border: fleetActive===i ? '1.5px solid var(--gold)':'1.5px solid rgba(255,255,255,0.08)', transition:'border-color 0.3s' }}>
                  <img src={cat.img} alt={cat.name} style={{ width:'100%', height:'100%', objectFit:'cover', filter: fleetActive===i ? 'grayscale(0%)':'grayscale(60%)', transition:'filter 0.35s' }} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:10, fontWeight:600, letterSpacing:'0.12em', color: fleetActive===i ? 'var(--gold)':'rgba(255,255,255,0.2)', marginBottom:3, transition:'color 0.3s' }}>{cat.num}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:26, letterSpacing:1, textTransform:'uppercase', color: fleetActive===i ? 'var(--white)':'rgba(255,255,255,0.4)', transition:'color 0.3s', lineHeight:1 }}>{cat.name}</div>
                  {fleetActive===i && <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:5, lineHeight:1.5 }}>{cat.desc}</div>}
                </div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:20, letterSpacing:1, color: fleetActive===i ? 'var(--gold)':'rgba(255,255,255,0.12)', flexShrink:0, transition:'color 0.3s' }}>{cat.payload}</div>
              </div>
            ))}
            {fleet[0] && <div style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }} />}
          </div>
        </div>
        <div style={{ flex:'0 0 50%', position:'relative', overflow:'hidden' }}>
          {fleet.map((cat, i) => (
            <img key={i} src={cat.img} alt={cat.name}
              style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity: fleetActive===i ? 1:0, transform: fleetActive===i ? 'scale(1)':'scale(1.05)', transition:'opacity 0.55s, transform 0.55s' }} />
          ))}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, var(--navy) 0%, rgba(10,22,40,0.3) 35%, transparent 60%)', zIndex:1, pointerEvents:'none' }} />
        </div>
      </section>

      {/* PROCESS */}
      <section id="process" style={{ background:'var(--navy2)', padding:'120px 80px', position:'relative' }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--gold)', marginBottom:14, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ width:32, height:1, background:'var(--gold)', display:'block' }}/>
          Как это работает
        </div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:64, letterSpacing:2, lineHeight:1, marginBottom:80, color:'var(--white)' }}>
          От заявки до <span style={{ color:'var(--gold)' }}>доставки</span>
        </div>
        <div style={{ display:'flex', gap:0, position:'relative' }}>
          <div style={{ position:'absolute', top:32, left:'8%', right:'8%', height:1, background:'linear-gradient(90deg,transparent,rgba(240,165,0,0.4),transparent)', pointerEvents:'none' }} />
          {[
            ['01','Заявка','Заполните форму на сайте или позвоните. Менеджер свяжется в течение 5 минут.'],
            ['02','Расчёт','Получите детальное коммерческое предложение с разбивкой стоимости.'],
            ['03','Договор','Подписываем договор онлайн через ЭДО. Никаких бумажек и ожиданий.'],
            ['04','Перевозка','Отслеживайте груз в личном кабинете на интерактивной карте.'],
            ['05','Доставка','Получаете груз и закрывающие документы. Платите по факту.'],
          ].map(([n, t, d]) => (
            <div key={n} style={{ flex:1, position:'relative', padding:'0 16px' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--navy)', border:'2px solid var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:22, color:'var(--gold)', letterSpacing:1, margin:'0 auto 24px', position:'relative', zIndex:2 }}>{n}</div>
              <h4 style={{ fontFamily:'var(--font-display)', fontSize:22, letterSpacing:1, textAlign:'center', marginBottom:12, color:'var(--white)' }}>{t}</h4>
              <p style={{ fontSize:12, lineHeight:1.6, color:'rgba(255,255,255,0.45)', textAlign:'center', fontWeight:300 }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" style={{ background:'var(--white)', padding:'100px 80px' }}>
        <div style={{ marginBottom:56 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--gold)', marginBottom:10 }}>Отзывы клиентов</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:64, color:'var(--navy)', textTransform:'uppercase', letterSpacing:1, lineHeight:0.9 }}>Нам доверяют<br />компании</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
          {[['А','Алексей Морозов','CEO, ТехноЛоджик','Самая быстрая обработка заявок в нашей практике. ФураЕдет изменила правила игры для нашего бизнеса.'],['М','Мария Соколова','Директор по логистике, RetailGroup','Работаем 3 года. Ни одного срыва сроков. AI-планирование реально снизило наши расходы на 25%.'],['И','Иван Петров','Владелец, СтройМаркет','Отличный сервис для строительных грузов. Негабаритные перевозки организуют без лишних вопросов.']].map(([avatar, name, role, text]) => (
            <div key={name} style={{ background:'var(--off)', borderRadius:12, padding:32, position:'relative', overflow:'hidden', transition:'transform 0.2s', cursor:'default' }}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform='none'}>
              <div style={{ position:'absolute', top:-20, right:12, fontFamily:'var(--font-display)', fontSize:140, color:'var(--navy)', opacity:0.04, lineHeight:1, pointerEvents:'none' }}>"</div>
              <div style={{ display:'flex', gap:3, marginBottom:20, color:'var(--gold)', fontSize:16 }}>★★★★★</div>
              <p style={{ fontSize:14, color:'var(--gray3)', lineHeight:1.75, marginBottom:28, fontStyle:'italic' }}>«{text}»</p>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:8, background:'var(--navy)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:18, color:'var(--gold)', flexShrink:0 }}>{avatar}</div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--navy)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{name}</div>
                  <div style={{ fontSize:10, color:'var(--gray2)', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', marginTop:2 }}>{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background:'var(--navy)', padding:'120px 80px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontFamily:'var(--font-display)', fontSize:300, letterSpacing:8, color:'rgba(255,255,255,0.015)', whiteSpace:'nowrap', pointerEvents:'none' }}>ФУРАЕДЕТ</div>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--gold)', marginBottom:24, position:'relative' }}>Готовы к сотрудничеству?</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(60px,8vw,100px)', color:'var(--white)', textTransform:'uppercase', letterSpacing:3, lineHeight:0.88, marginBottom:28, position:'relative' }}>
          Доверьте грузы<br /><em style={{ fontStyle:'normal', WebkitTextStroke:'2px var(--gold)', color:'transparent' }}>профессионалам</em>
        </div>
        <p style={{ color:'rgba(255,255,255,0.35)', fontSize:15, marginBottom:48, maxWidth:380, marginLeft:'auto', marginRight:'auto', position:'relative', lineHeight:1.7 }}>
          Зарегистрируйтесь за 2 минуты и получите первый расчёт бесплатно
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', position:'relative' }}>
          <Link to="/register" style={{ padding:'15px 40px', background:'var(--gold)', color:'var(--navy)', fontWeight:700, fontSize:12, letterSpacing:'0.1em', textTransform:'uppercase', border:'none', borderRadius:2, textDecoration:'none' }}>
            Начать бесплатно →
          </Link>
          <Link to="/login" style={{ padding:'14px 40px', background:'transparent', color:'rgba(255,255,255,0.7)', fontWeight:600, fontSize:12, letterSpacing:'0.1em', textTransform:'uppercase', border:'1px solid rgba(255,255,255,0.15)', borderRadius:2, textDecoration:'none' }}>
            Уже есть аккаунт
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background:'#060D1A', padding:'80px 80px 40px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1.5fr', gap:48, marginBottom:64 }}>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:40, letterSpacing:3, color:'var(--white)', marginBottom:14 }}>ФУРА<span style={{ color:'var(--gold)' }}>ЕДЕТ</span></div>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.3)', lineHeight:1.7, marginBottom:24, maxWidth:260 }}>Логистическая платформа нового поколения для управления грузоперевозками по России.</p>
          </div>
          <div>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,0.2)', marginBottom:20 }}>Компания</div>
            {['О нас','Автопарк','Вакансии','Партнёрам'].map(l => (
              <div key={l} style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:10, cursor:'pointer' }}>{l}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,0.2)', marginBottom:20 }}>Услуги</div>
            {['Автоперевозки','Рефрижераторы','Негабариты','Склады'].map(l => (
              <div key={l} style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:10, cursor:'pointer' }}>{l}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,0.2)', marginBottom:20 }}>Контакты</div>
            {[
              { lbl:'Телефон', val:'+7 (800) 555-35-35', icon:(
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.58.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.01L6.6 10.8z" stroke="var(--gold)" strokeWidth="1.8"/></svg>
              )},
              { lbl:'Email', val:'info@furaedet.ru', icon:(
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="3" stroke="var(--gold)" strokeWidth="1.8"/><path d="m2 8 10 6 10-6" stroke="var(--gold)" strokeWidth="1.8" strokeLinejoin="round"/></svg>
              )},
              { lbl:'Адрес', val:'Москва, ул. Логистов, 1', icon:(
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="var(--gold)" strokeWidth="1.8"/><circle cx="12" cy="9" r="2.5" stroke="var(--gold)" strokeWidth="1.8"/></svg>
              )},
            ].map(({ icon, lbl, val }) => (
              <div key={lbl} style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:14 }}>
                <span style={{ flexShrink:0, marginTop:3, display:'flex' }}>{icon}</span>
                <div>
                  <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.2)', marginBottom:2 }}>{lbl}</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', fontWeight:500 }}>{val}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:28, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.18)', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' }}>© 2025 ФураЕдет. Все права защищены.</div>
          <div style={{ display:'flex', gap:24 }}>
            {['Политика конфиденциальности','Условия использования'].map(l => (
              <span key={l} style={{ fontSize:10, color:'rgba(255,255,255,0.18)', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer' }}>{l}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

const calcInputStyle = {
  background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)',
  color:'var(--white)', padding:'13px 14px', borderRadius:6, fontSize:13,
  fontWeight:600, fontFamily:'var(--font-body)', width:'100%', outline:'none',
  boxSizing:'border-box', transition:'border 0.2s,background 0.2s',
}

function CalcField({ label, placeholder, type='text', value, onChange }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(255,255,255,0.28)' }}>{label}</div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={calcInputStyle}
        onFocus={e => { e.target.style.borderColor='var(--gold)'; e.target.style.background='rgba(255,255,255,0.08)' }}
        onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.09)'; e.target.style.background='rgba(255,255,255,0.05)' }}
      />
    </div>
  )
}

function SuggestField({ label, placeholder, value, onChange }) {
  const [items, setItems] = useState([])
  const [open, setOpen]   = useState(false)
  const [busy, setBusy]   = useState(false)
  const timer = useRef(null)
  const wrap  = useRef(null)

  useEffect(() => {
    const close = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const handleInput = (val) => {
    onChange(val)
    clearTimeout(timer.current)
    if (val.length < 2) { setItems([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      setBusy(true)
      try {
        const { data } = await api.get('/suggest', { params: { q: val } })
        const list = Array.isArray(data) ? data : []
        setItems(list)
        setOpen(list.length > 0)
      } catch { setItems([]) }
      finally { setBusy(false) }
    }, 280)
  }

  const pick = (item) => { onChange(item.name); setItems([]); setOpen(false) }

  return (
    <div ref={wrap} style={{ position:'relative' }}>
      <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(255,255,255,0.28)', marginBottom:4 }}>{label}</div>
      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'rgba(240,165,0,0.45)', pointerEvents:'none', display:'flex' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>
        </span>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          autoComplete="off"
          onChange={e => handleInput(e.target.value)}
          onFocus={e => { e.target.style.borderColor='var(--gold)'; e.target.style.background='rgba(255,255,255,0.08)'; if (items.length > 0) setOpen(true) }}
          onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.09)'; e.target.style.background='rgba(255,255,255,0.05)' }}
          style={{ ...calcInputStyle, paddingLeft:34, paddingRight: busy ? 32 : 14 }}
        />
        {busy && (
          <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', display:'flex' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation:'spin 0.8s linear infinite' }}>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5"/>
              <path d="M12 3a9 9 0 0 1 9 9" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </span>
        )}
      </div>
      {open && items.length > 0 && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:1000, background:'#0f0f28', border:'1px solid rgba(240,165,0,0.25)', borderRadius:8, maxHeight:220, overflowY:'auto', boxShadow:'0 16px 48px rgba(0,0,0,0.65)' }}>
          {items.map((s, i) => (
            <div key={i} onMouseDown={() => pick(s)}
              style={{ padding:'10px 14px', fontSize:13, color:'rgba(255,255,255,0.75)', cursor:'pointer', borderBottom: i < items.length-1 ? '1px solid rgba(255,255,255,0.05)':'none', display:'flex', alignItems:'center', gap:8, transition:'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(240,165,0,0.09)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" style={{ color:'rgba(240,165,0,0.45)', flexShrink:0 }}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
