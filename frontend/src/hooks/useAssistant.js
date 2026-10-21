import { useRef, useState } from 'react'
import assistantService from '../services/assistantService'
import { getApiErrorMessage } from '../services/apiError'
import { toApiHistory } from '../utils/assistantChat'
import useApiResource from './useApiResource'

export function useAssistant() {
  const { data: status, loading: loadingStatus, error: statusError, setData: setStatus } = useApiResource(
    () => assistantService.getStatus(), [],
    { errorMessage: 'Não foi possível verificar o assistente.' }
  )
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const nextId = useRef(1)

  const append = (message) => {
    const entry = { id: nextId.current++, ...message }
    setMessages((current) => [...current, entry])
    return entry
  }

  const send = async (text) => {
    const content = text.trim()
    if (!content || sending) return
    const question = { id: nextId.current++, role: 'user', content }
    const history = toApiHistory([...messages, question])
    setMessages((current) => [...current, question])
    setSending(true)
    try {
      const reply = await assistantService.sendMessage(history)
      append({ role: 'assistant', content: reply.reply, toolsUsed: reply.toolsUsed || [] })
      setStatus((current) => (current ? { ...current, remainingToday: reply.remainingToday } : current))
    } catch (err) {
      append({
        role: 'assistant',
        content: getApiErrorMessage(err, 'Não foi possível falar com o assistente agora.'),
        error: true
      })
    } finally {
      setSending(false)
    }
  }

  const reset = () => setMessages([])

  return { status, loadingStatus, statusError, messages, sending, send, reset }
}

export default useAssistant
