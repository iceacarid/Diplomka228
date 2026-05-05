import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../api/axios'

export function useChatPolling(chatId, enabled = true) {
  const [messages, setMessages]   = useState([])
  const [canWrite, setCanWrite]   = useState(false)
  const [chatMeta, setChatMeta]   = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const lastIdRef                 = useRef(0)
  const timerRef                  = useRef(null)

  const fetchInitial = useCallback(async () => {
    if (!chatId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/chats/${chatId}`)
      const d   = res.data
      setMessages(d.messages || [])
      setCanWrite(d.can_write)
      setChatMeta({ id: d.id, status: d.status, tracking_id: d.tracking_id, order_status: d.order_status, order_data: d.order_data, has_appeal: d.has_appeal })
      if (d.messages?.length) {
        lastIdRef.current = d.messages[d.messages.length - 1].id
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Ошибка загрузки чата')
    } finally {
      setLoading(false)
    }
  }, [chatId])

  const poll = useCallback(async () => {
    if (!chatId || !lastIdRef.current) return
    try {
      const res = await api.get(`/chats/${chatId}/messages?after=${lastIdRef.current}`)
      if (res.data?.length) {
        setMessages(prev => [...prev, ...res.data])
        lastIdRef.current = res.data[res.data.length - 1].id
      }
    } catch {
      // silent — не рвём polling при временных ошибках
    }
  }, [chatId])

  useEffect(() => {
    if (!chatId || !enabled) return
    fetchInitial()
    timerRef.current = setInterval(poll, 3000)
    return () => clearInterval(timerRef.current)
  }, [chatId, enabled, fetchInitial, poll])

  const send = useCallback(async (body, metadata = null) => {
    const payload = metadata ? { body, metadata } : { body }
    const res = await api.post(`/chats/${chatId}/messages`, payload)
    setMessages(prev => [...prev, res.data])
    lastIdRef.current = res.data.id
    return res.data
  }, [chatId])

  const updateMessage = useCallback(async (messageId, metadata) => {
    const res = await api.patch(`/chats/${chatId}/messages/${messageId}`, { metadata })
    setMessages(prev => prev.map(m => m.id === messageId ? res.data : m))
    return res.data
  }, [chatId])

  const refresh = useCallback(() => fetchInitial(), [fetchInitial])

  const confirmOrder = useCallback(async () => {
    await api.post(`/chats/${chatId}/confirm`)
    await fetchInitial()
  }, [chatId, fetchInitial])

  const archiveChat = useCallback(async () => {
    await api.post(`/chats/${chatId}/archive`)
    await fetchInitial()
  }, [chatId, fetchInitial])

  const submitAppeal = useCallback(async (body) => {
    const res = await api.post(`/chats/${chatId}/appeal`, { body })
    await fetchInitial()
    return res.data
  }, [chatId, fetchInitial])

  const reschedulePickup = useCallback(async (orderId, pickupDate, pickupTime) => {
    await api.post(`/orders/${orderId}/reschedule-confirm`, {
      pickup_date: pickupDate,
      pickup_time: pickupTime || undefined,
    })
    await fetchInitial()
  }, [fetchInitial])

  return { messages, canWrite, chatMeta, loading, error, send, updateMessage, refresh, confirmOrder, archiveChat, submitAppeal, reschedulePickup }
}
