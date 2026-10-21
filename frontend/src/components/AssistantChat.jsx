import { useEffect, useRef, useState } from 'react'
import { Bot, Calculator, Loader2, MessageSquarePlus, SendHorizontal, Sparkles, User } from 'lucide-react'
import PageHeader from './PageHeader'
import { Badge, Button, Card, EmptyState, Notice, Textarea } from './ui'
import useAssistant from '../hooks/useAssistant'
import { ASSISTANT_SUGGESTIONS } from '../constants/assistant'
import { parseReply } from '../utils/assistantChat'

const Segments = ({ segments }) =>
  segments.map((segment, index) =>
    segment.bold
      ? <strong key={index} className="font-semibold text-slate-900">{segment.text}</strong>
      : <span key={index}>{segment.text}</span>
  )

const ReplyText = ({ text }) => (
  <div className="space-y-3 text-sm leading-relaxed text-slate-700">
    {parseReply(text).map((block, index) => {
      if (block.type === 'heading') {
        return <p key={index} className="font-bold text-slate-900"><Segments segments={block.segments} /></p>
      }
      if (block.type === 'list') {
        const List = block.ordered ? 'ol' : 'ul'
        return (
          <List key={index} className={`space-y-1.5 pl-5 ${block.ordered ? 'list-decimal' : 'list-disc'}`}>
            {block.items.map((item, itemIndex) => <li key={itemIndex}><Segments segments={item} /></li>)}
          </List>
        )
      }
      return (
        <p key={index}>
          {block.lines.map((line, lineIndex) => (
            <span key={lineIndex} className="block"><Segments segments={line} /></span>
          ))}
        </p>
      )
    })}
  </div>
)

const AssistantMessage = ({ message }) => (
  <div className="flex items-start gap-3">
    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
      <Bot className="h-4 w-4" />
    </div>
    <Card tone={message.error ? 'rose' : 'white'} padding="sm" className="min-w-0 flex-1 space-y-3">
      <ReplyText text={message.content} />
      {message.toolsUsed?.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-500">Calculado com:</span>
          {message.toolsUsed.map((tool) => <Badge key={tool} tone="sky" Icon={Calculator}>{tool}</Badge>)}
        </div>
      )}
    </Card>
  </div>
)

const UserMessage = ({ message }) => (
  <div className="flex items-start justify-end gap-3">
    <Card tone="indigo" padding="sm" className="max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap">
      {message.content}
    </Card>
    <div className="mt-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 sm:flex">
      <User className="h-4 w-4" />
    </div>
  </div>
)

export default function AssistantChat() {
  const { status, loadingStatus, statusError, messages, sending, send, reset } = useAssistant()
  const [draft, setDraft] = useState('')
  const endRef = useRef(null)

  const enabled = Boolean(status?.enabled)
  const remaining = status?.remainingToday ?? 0
  const blocked = !enabled || remaining <= 0

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' })
  }, [messages, sending])

  const submit = (text) => {
    if (blocked || sending || !text.trim()) return
    send(text)
    setDraft('')
  }

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit(draft)
    }
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        Icon={Bot}
        title="Assistente IA"
        description="Pergunte sobre preços, margens, taxas e fluxo de caixa. As contas usam os dados do seu negócio."
      >
        {messages.length > 0 && (
          <Button variant="secondary" Icon={MessageSquarePlus} onClick={reset} disabled={sending}>
            Nova conversa
          </Button>
        )}
      </PageHeader>

      {statusError && <Notice tone="rose">{statusError}</Notice>}
      {!loadingStatus && status && !enabled && (
        <Notice tone="amber" title="Assistente desativado">
          O assistente de IA ainda não foi ativado neste ambiente. As demais telas funcionam normalmente.
        </Notice>
      )}

      <div data-tour="assistant-conversation" className="space-y-4">
        {messages.length === 0 ? (
          <Card padding="lg">
            <EmptyState
              Icon={Sparkles}
              loading={loadingStatus}
              title="Seu consultor financeiro"
              description="Ele analisa seus produtos, custos, taxas e vendas e explica o que melhorar. Comece por uma pergunta:"
            />
            <div data-tour="assistant-suggestions" className="mt-4 grid gap-2 sm:grid-cols-2">
              {ASSISTANT_SUGGESTIONS.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="soft"
                  fullWidth
                  disabled={blocked}
                  onClick={() => submit(suggestion)}
                  className="justify-start text-left"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </Card>
        ) : (
          messages.map((message) => message.role === 'user'
            ? <UserMessage key={message.id} message={message} />
            : <AssistantMessage key={message.id} message={message} />)
        )}
        {sending && (
          <div role="status" className="flex items-center gap-2 pl-11 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analisando seus dados...
          </div>
        )}
        <div ref={endRef} />
      </div>

      <Card data-tour="assistant-composer" padding="sm" className="space-y-2">
        <label htmlFor="assistant-question" className="sr-only">Sua pergunta</label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Textarea
            id="assistant-question"
            rows={2}
            maxLength={4000}
            placeholder="Ex.: o desconto de 10% no Açaí 500ml ainda dá lucro?"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            disabled={blocked || sending}
            className="flex-1"
          />
          <Button
            Icon={SendHorizontal}
            onClick={() => submit(draft)}
            loading={sending}
            disabled={blocked || !draft.trim()}
            className="w-full sm:w-auto"
          >
            Perguntar
          </Button>
        </div>
        <p className="text-[11px] text-slate-500">
          {enabled ? `${remaining} ${remaining === 1 ? 'pergunta restante' : 'perguntas restantes'} hoje · ` : ''}
          Respostas geradas por IA a partir dos seus dados. Confira os valores antes de decidir.
        </p>
      </Card>
    </div>
  )
}
