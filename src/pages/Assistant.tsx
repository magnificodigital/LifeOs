import { useEffect, useRef, useState } from 'react'
import { Send, Bot, User, Sparkles, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import { useStore } from '@/lib/store'
import { answer, ceoBriefing, type MentorContext } from '@/lib/ai/mentor'
import { chatWithLLM } from '@/lib/ai/provider'
import { Card, Fade, PageHeader } from '@/components/ui'
import { todayISO } from '@/lib/utils'

const SUGGESTIONS = [
  'O que devo fazer hoje?',
  'No que devo focar?',
  'Vale começar outro projeto?',
  'O que está atrasando minha vida?',
  'Onde estou desperdiçando tempo?',
  'Como posso ganhar mais dinheiro?',
  'O que posso delegar?',
]

export default function Assistant() {
  const store = useStore()
  const { chat, pushChat, clearChat, ai } = store
  const ctx: MentorContext = {
    goals: store.goals,
    metas: store.metas,
    tasks: store.tasks,
    projects: store.projects,
    ideas: store.ideas,
    logs: store.logs,
    today: todayISO(),
  }
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const briefing = ceoBriefing(ctx)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat, thinking])

  const send = async (text: string) => {
    const q = text.trim()
    if (!q) return
    pushChat({ role: 'user', content: q })
    setInput('')
    setThinking(true)
    // Tenta o LLM configurado; cai para o motor local determinístico.
    const remote = await chatWithLLM(q, ctx, ai)
    const reply = remote ?? answer(q, ctx)
    setThinking(false)
    pushChat({ role: 'assistant', content: reply })
  }

  return (
    <div>
      <PageHeader
        title="STARK"
        subtitle="Seu conselheiro pessoal. Ele lê toda a sua vida e responde como um CEO faria — nunca um chatbot genérico."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr,300px]">
        {/* Chat */}
        <Fade>
          <Card className="flex h-[65vh] flex-col !p-0">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent-soft">
                  <Bot size={15} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">STARK</p>
                  <p className="text-[10px] text-ink-500">
                    {ai.provider === 'local' ? 'Conselheiro estratégico' : `Conectado: ${ai.provider}`}
                  </p>
                </div>
              </div>
              {chat.length > 0 && (
                <button className="btn-ghost !px-2 !py-1 text-xs" onClick={clearChat}>
                  <Trash2 size={13} /> Limpar
                </button>
              )}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {chat.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center text-sm text-ink-500">
                  <Sparkles size={22} className="mb-2 text-accent-soft" />
                  Pergunte-me qualquer coisa sobre foco, dinheiro, hábitos ou prioridades.
                  <br />
                  Eu decido com base em todos os seus dados.
                </div>
              )}
              {chat.map((m) => (
                <div key={m.id} className={clsx('flex gap-2.5', m.role === 'user' && 'flex-row-reverse')}>
                  <div
                    className={clsx(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                      m.role === 'assistant' ? 'bg-accent/15 text-accent-soft' : 'bg-white/10 text-ink-300',
                    )}
                  >
                    {m.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                  </div>
                  <div
                    className={clsx(
                      'max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                      m.role === 'assistant' ? 'bg-white/[0.04] text-ink-200' : 'bg-accent text-white',
                    )}
                    dangerouslySetInnerHTML={{ __html: renderMd(m.content) }}
                  />
                </div>
              ))}
              {thinking && (
                <div className="flex gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent-soft">
                    <Bot size={14} />
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
                    <span className="inline-flex gap-1">
                      <Dot /> <Dot d={0.15} /> <Dot d={0.3} />
                    </span>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="border-t border-white/5 p-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.slice(0, 4).map((s) => (
                  <button key={s} className="chip bg-white/5 text-ink-400 hover:bg-white/10" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  send(input)
                }}
              >
                <input
                  className="input"
                  placeholder="Pergunte ao seu mentor..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button className="btn-primary shrink-0" type="submit" disabled={!input.trim()}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          </Card>
        </Fade>

        {/* Modo CEO lateral */}
        <Fade delay={0.05}>
          <Card className="h-fit">
            <p className="section-title mb-3 flex items-center gap-1.5">
              <Sparkles size={13} className="text-accent-soft" /> Modo CEO
            </p>
            <div className="space-y-3 text-sm">
              <CeoItem q="Única tarefa 80/20" a={briefing.oneThing} />
              <CeoItem q="Eliminar" a={briefing.eliminate} />
              <CeoItem q="Automatizar" a={briefing.automate} />
              <CeoItem q="Delegar" a={briefing.delegate} />
              <CeoItem q="Ignorar" a={briefing.ignore} />
            </div>
          </Card>
        </Fade>
      </div>
    </div>
  )
}

function CeoItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3">
      <p className="mb-0.5 text-xs font-semibold text-accent-soft">{q}</p>
      <p className="text-sm leading-snug text-ink-300">{a}</p>
    </div>
  )
}

function Dot({ d = 0 }: { d?: number }) {
  return <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400" style={{ animationDelay: `${d}s` }} />
}

/** Mini-render de markdown (negrito + quebras) — seguro para o nosso conteúdo. */
function renderMd(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/\n/g, '<br/>')
}
