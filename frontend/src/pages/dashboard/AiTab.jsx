import { useState, useEffect, useRef } from 'react'
import api from '../../api/axios'
import { Icons } from '../../components/Icons'
import { Card, Btn, Modal, Alert, PageHeader } from '../../components/ui'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcLoad(truck, draftIds, orders) {
  const assigned = orders.filter(o => draftIds.includes(o.id))
  const w = assigned.reduce((s, o) => s + Number(o.weight || 0), 0)
  const v = assigned.reduce((s, o) => s + Number(o.volume || 0), 0)
  const wCap = Number(truck.capacity_weight) || 1
  const vCap = Number(truck.capacity_volume) || 0
  return {
    w, v,
    wPct:  (w / wCap) * 100,
    vPct:  vCap > 0 ? (v / vCap) * 100 : 0,
    wOver: w > wCap,
    vOver: vCap > 0 && v > vCap,
    wRem:  wCap - w,
    vRem:  vCap > 0 ? vCap - v : null,
    wCap, vCap,
    count: assigned.length,
  }
}

function fmtNum(n) {
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

function shortAddr(addr) {
  return addr?.split(',')[0]?.trim() ?? addr ?? ''
}

// ─── LoadBar ─────────────────────────────────────────────────────────────────

function LoadBar({ label, pct, rem, unit, visible = true }) {
  if (!visible) return null
  const over = pct > 100
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginBottom: 4,
        fontSize: 11, fontFamily: 'var(--font-mono)',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        <span style={{ color: over ? '#f04438' : 'rgba(255,255,255,0.6)' }}>
          {Math.round(pct)}%
          {over
            ? ' · перегруз!'
            : rem != null
              ? ` · ост. ${fmtNum(rem)} ${unit}`
              : ''}
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(pct, 100)}%`,
          borderRadius: 3,
          background: over ? '#f04438' : 'var(--gold)',
          transition: 'width 0.25s ease, background 0.2s',
        }} />
      </div>
    </div>
  )
}

// ─── CargoCard ────────────────────────────────────────────────────────────────

function CargoCard({ order, onClick, onRemove }) {
  const date = order.created_at
    ? new Date(order.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
    : ''

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--navy-3)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 7,
        padding: '11px 13px',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = 'rgba(240,165,0,0.3)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
    >
      {onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove() }}
          style={{
            position: 'absolute', top: 7, right: 7,
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 2,
            lineHeight: 1,
          }}
        >
          <Icons.X size={11} />
        </button>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gold)' }}>
          {order.tracking_id}
        </span>
        {date && (
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
            {date}
          </span>
        )}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 5, lineHeight: 1.35 }}>
        {shortAddr(order.origin_address)} → {shortAddr(order.dest_address)}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono)' }}>
          {order.weight} т
        </span>
        {Number(order.volume) > 0 && (
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono)' }}>
            {order.volume} м³
          </span>
        )}
        {order.cargo_type && (
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-mono)' }}>
            {order.cargo_type}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── TruckCard ────────────────────────────────────────────────────────────────

function TruckCard({ truck, load, assignedOrders, onRemoveOrder, justification }) {
  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, letterSpacing: 0.4, marginBottom: 2 }}>
            {truck.brand} {truck.model}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
            {truck.plate_number}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 2 }}>
            {truck.driver_name || '—'}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
            до {truck.capacity_weight} т
            {truck.capacity_volume > 0 ? ` / ${truck.capacity_volume} м³` : ''}
          </div>
        </div>
      </div>

      <LoadBar label="Вес" pct={load.wPct} rem={load.wRem} unit="т" />
      <LoadBar label="Объём" pct={load.vPct} rem={load.vRem} unit="м³" visible={truck.capacity_volume > 0} />

      {justification && (
        <div style={{
          margin: '10px 0 2px',
          padding: '8px 11px',
          background: 'rgba(240,165,0,0.06)',
          border: '1px solid rgba(240,165,0,0.14)',
          borderRadius: 5,
          fontSize: 11,
          color: 'rgba(240,165,0,0.85)',
          lineHeight: 1.55,
        }}>
          💡 {justification}
        </div>
      )}

      {assignedOrders.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 12 }}>
          <div style={{
            fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em',
            color: 'rgba(255,255,255,0.3)', marginBottom: 8,
          }}>
            Назначено ({assignedOrders.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {assignedOrders.map(o => (
              <CargoCard key={o.id} order={o} onRemove={() => onRemoveOrder(o.id)} />
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── AssignModal ──────────────────────────────────────────────────────────────

function AssignModal({ order, trucks, draft, orders, onAssign, onClose }) {
  return (
    <Modal onClose={onClose} title="Назначить фуру" maxWidth={540}>
      <div style={{
        marginBottom: 18, padding: '10px 13px',
        background: 'var(--navy-3)', borderRadius: 6,
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gold)', marginBottom: 3 }}>
          {order.tracking_id}
        </div>
        <div style={{ fontSize: 13, marginBottom: 3 }}>
          {shortAddr(order.origin_address)} → {shortAddr(order.dest_address)}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
          {order.weight} т{Number(order.volume) > 0 ? ` / ${order.volume} м³` : ''}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {trucks.map(truck => {
          const curIds = draft[truck.id] || []
          const alreadyHere = curIds.includes(order.id)
          const previewIds = alreadyHere ? curIds : [...curIds, order.id]
          const load = calcLoad(truck, previewIds, orders)
          const blocked = load.wOver || load.vOver

          return (
            <div key={truck.id} style={{
              padding: '14px 16px',
              background: 'var(--navy-3)',
              border: `1px solid ${blocked ? 'rgba(240,68,56,0.3)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 7,
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', marginBottom: 12,
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                    {truck.brand} {truck.model}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                    {truck.plate_number}{truck.driver_name ? ` · ${truck.driver_name}` : ''}
                  </div>
                </div>
                <Btn
                  size="sm"
                  kind={blocked ? 'danger' : alreadyHere ? 'ghost' : 'primary'}
                  disabled={blocked || alreadyHere}
                  onClick={() => !blocked && !alreadyHere && onAssign(truck.id)}
                >
                  {blocked ? 'Перегруз' : alreadyHere ? 'Назначен' : 'Назначить'}
                </Btn>
              </div>

              <LoadBar label="Вес (с грузом)" pct={load.wPct} rem={load.wRem} unit="т" />
              <LoadBar
                label="Объём (с грузом)" pct={load.vPct} rem={load.vRem} unit="м³"
                visible={truck.capacity_volume > 0}
              />
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

// ─── ColLabel ─────────────────────────────────────────────────────────────────

function ColLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.2em',
      textTransform: 'uppercase', color: 'var(--gold)',
      marginBottom: 14, fontFamily: 'var(--font-body)',
    }}>
      {children}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AiTab() {
  const [trucks, setTrucks]               = useState([])
  const [orders, setOrders]               = useState([])
  const [draft, setDraft]                 = useState({})     // {truckId: orderId[]}
  const [justifications, setJustifications] = useState({})  // {truckId: string}
  const [isAiDraft, setIsAiDraft]         = useState(false)
  const [loading, setLoading]             = useState(false)
  const [applying, setApplying]           = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [error, setError]                 = useState('')
  const [success, setSuccess]             = useState('')

  // Keep ref so loadData can read current draft without stale closure
  const draftRef = useRef(draft)
  useEffect(() => { draftRef.current = draft }, [draft])

  // Persist draft across tab switches
  useEffect(() => {
    sessionStorage.setItem('ai_draft', JSON.stringify(draft))
  }, [draft])
  useEffect(() => {
    sessionStorage.setItem('ai_just', JSON.stringify(justifications))
  }, [justifications])

  const loadData = async () => {
    try {
      const [t, o] = await Promise.all([
        api.get('/trucks'),
        api.get('/orders?status=in_progress'),
      ])
      // Load all trucks; right column filters to available + those in draft
      setTrucks(prev => {
        const fresh     = t.data
        const freshIds  = new Set(fresh.map(tr => tr.id))
        const curDraft  = draftRef.current
        // Preserve trucks that have draft orders but are no longer in the fresh list
        const preserved = prev.filter(tr =>
          (curDraft[tr.id] || []).length > 0 && !freshIds.has(tr.id)
        )
        return [...fresh, ...preserved]
      })
      setOrders(o.data.filter(ord => !ord.truck_id))
    } catch {
      // silent
    }
  }

  useEffect(() => {
    // Restore draft from sessionStorage on mount (survives tab switches)
    try {
      const savedDraft = sessionStorage.getItem('ai_draft')
      const savedJust  = sessionStorage.getItem('ai_just')
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft)
        if (Object.values(parsed).some(ids => ids.length > 0)) {
          setDraft(parsed)
          setIsAiDraft(true)
        }
      }
      if (savedJust) setJustifications(JSON.parse(savedJust))
    } catch { /* ignore corrupt storage */ }
    loadData()
  }, [])

  // Derived
  const assignedIds  = new Set(Object.values(draft).flat())
  const unassigned   = orders.filter(o => !assignedIds.has(o.id))
  const hasDraft     = Object.values(draft).some(ids => ids.length > 0)

  // Trucks to show: available ones + any truck that has draft orders (stays until plan applied)
  const trucksToShow = trucks.filter(tr =>
    tr.status === 'available' || (draft[tr.id] || []).length > 0
  )

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAiPlan = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const { data } = await api.post('/ai/distribution-plan')
      const newDraft = {}
      const newJust  = {}
      ;(data.plan || []).forEach(item => {
        const existing = newDraft[item.truck_id] || []
        const incoming = (item.orders || []).map(o => o.id)
        newDraft[item.truck_id] = [...new Set([...existing, ...incoming])]
        if (item.justification) newJust[item.truck_id] = item.justification
      })
      setDraft(newDraft)
      setJustifications(newJust)
      setIsAiDraft(true)
      if (!Object.values(newDraft).some(ids => ids.length > 0)) {
        setError('AI не смог распределить заказы — попробуйте назначить вручную.')
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка AI запроса')
    }
    setLoading(false)
  }

  const handleManualAssign = (truckId) => {
    const orderId = selectedOrder.id
    setDraft(d => {
      const next = {}
      // Remove this order from any truck in draft
      for (const [tid, ids] of Object.entries(d)) {
        next[tid] = ids.filter(id => id !== orderId)
      }
      next[truckId] = [...(next[truckId] || []), orderId]
      return next
    })
    setSelectedOrder(null)
    setIsAiDraft(false)
  }

  const handleRemove = (truckId, orderId) => {
    setDraft(d => ({
      ...d,
      [truckId]: (d[truckId] || []).filter(id => id !== orderId),
    }))
    setIsAiDraft(false)
  }

  const handleApply = async () => {
    const assignments = Object.entries(draft)
      .filter(([, ids]) => ids.length > 0)
      .map(([truckId, orderIds]) => ({
        truck_id: Number(truckId),
        order_ids: orderIds,
      }))

    setApplying(true)
    setError('')
    try {
      await api.post('/ai/apply-plan', { assignments })
      setSuccess('Plan applied — trucks dispatched.')
      sessionStorage.removeItem('ai_draft')
      sessionStorage.removeItem('ai_just')
      setDraft({})
      setJustifications({})
      setIsAiDraft(false)
      await loadData()
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка применения плана')
    }
    setApplying(false)
  }

  const handleReset = () => {
    sessionStorage.removeItem('ai_draft')
    sessionStorage.removeItem('ai_just')
    setDraft({})
    setJustifications({})
    setIsAiDraft(false)
    setError('')
    setSuccess('')
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '0 0 60px' }}>
      <PageHeader eyebrow="Искусственный интеллект" title="Распределение заказов" />

      {/* Toolbar */}
      <div style={{ padding: '0 32px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Btn
          icon={<Icons.Sparkles size={14} />}
          onClick={handleAiPlan}
          disabled={loading || applying || orders.length === 0 || trucksToShow.length === 0}
        >
          {loading ? 'GigaChat думает…' : 'Получить план AI'}
        </Btn>

        {hasDraft && (
          <>
            <Btn
              kind="primary"
              icon={<Icons.Check size={14} />}
              onClick={handleApply}
              disabled={applying || loading}
            >
              {applying ? 'Применяем…' : 'Утвердить план'}
            </Btn>
            <Btn
              kind="ghost"
              icon={<Icons.X size={14} />}
              onClick={handleReset}
              disabled={applying}
            >
              Сбросить рекомендации
            </Btn>
          </>
        )}

        {isAiDraft && !hasDraft && (
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-body)' }}>
            AI не нашёл подходящих назначений
          </span>
        )}
      </div>

      {/* Alerts */}
      <div style={{ padding: '0 32px', marginBottom: error || success ? 16 : 0 }}>
        {error   && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}
      </div>

      {/* Two-column layout */}
      <div style={{
        padding: '0 32px',
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: 20,
        alignItems: 'start',
      }}>

        {/* Left — unassigned cargos */}
        <div>
          <ColLabel>Грузы · {unassigned.length} нераспред.</ColLabel>
          {unassigned.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
              {orders.length === 0 ? 'Нет заказов в работе' : 'Все грузы распределены'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {unassigned.map(o => (
                <CargoCard
                  key={o.id}
                  order={o}
                  onClick={() => { setSelectedOrder(o); setError(''); setSuccess('') }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right — trucks */}
        <div>
          <ColLabel>Фуры · {trucksToShow.filter(t => t.status === 'available').length} доступно</ColLabel>
          {trucksToShow.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
              Нет доступных фур
            </div>
          ) : (
            trucksToShow.map(truck => {
              const draftIds = draft[truck.id] || []
              const load     = calcLoad(truck, draftIds, orders)
              const assigned = orders.filter(o => draftIds.includes(o.id))
              return (
                <TruckCard
                  key={truck.id}
                  truck={truck}
                  load={load}
                  assignedOrders={assigned}
                  onRemoveOrder={ordId => handleRemove(truck.id, ordId)}
                  justification={justifications[truck.id]}
                />
              )
            })
          )}
        </div>
      </div>

      {/* Manual assign modal */}
      {selectedOrder && (
        <AssignModal
          order={selectedOrder}
          trucks={trucks}
          draft={draft}
          orders={orders}
          onAssign={handleManualAssign}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  )
}
