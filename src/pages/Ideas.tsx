import { useMemo, useState } from 'react'
import { Plus, Mic, Trash2, Sparkles, Check, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useStore } from '@/lib/store'
import type { Idea } from '@/lib/types'
import { analyzeIdea, type MentorContext } from '@/lib/ai/mentor'
import { Card, Fade, PageHeader, Empty } from '@/components/ui'
import { todayISO } from '@/lib/utils'

export default function Ideas() {
  const { goals, metas, tasks, projects, ideas, logs, addIdea, updateIdea, removeIdea } = useStore()
  const ctx: MentorContext = { goals, metas, tasks, projects, ideas, logs, today: todayISO() }
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [analyzing, setAnalyzing] = useState<Idea | null>(null)
  const [listening, setListening] = useState(false)

  // Ditado por voz (Web Speech API, quando disponível no navegador).
  const startVoice = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SR) return alert('Reconhecimento de voz não suportado neste navegador.')
    const rec = new SR()
    rec.lang = 'pt-BR'
    rec.onresult = (e: any) => setTitle((t) => (t ? t + ' ' : '') + e.results[0][0].transcript)
    rec.onend = () => setListening(false)
    setListening(true)
    rec.start()
  }

  const grouped = useMemo(() => {
    return {
      novo: ideas.filter((i) => i.status === 'novo'),
      avaliada: ideas.filter((i) => i.status === 'avaliada' || i.status === 'aprovada'),
      descartada: ideas.filter((i) => i.status === 'descartada'),
    }
  }, [ideas])

  return (
    <div>
      <PageHeader
        title="Banco de Ideias"
        subtitle="Toda ideia entra aqui primeiro. A IA nunca deixa você começar por impulso — ela analisa a troca antes."
      />

      <Fade>
        <Card className="mb-5">
          <div className="grid gap-2">
            <div className="flex gap-2">
              <input className="input" placeholder="Registre uma ideia..." value={title} onChange={(e) => setTitle(e.target.value)} />
              <button
                className={clsx('btn-outline shrink-0', listening && 'border-red-400/40 text-red-300')}
                onClick={startVoice}
                title="Ditar por voz"
              >
                <Mic size={16} />
              </button>
            </div>
            <textarea className="input min-h-[60px]" placeholder="Detalhes (modelo de negócio, potencial...)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <button
              className="btn-primary"
              disabled={!title.trim()}
              onClick={() => {
                addIdea({ title: title.trim(), notes: notes.trim() || undefined })
                setTitle('')
                setNotes('')
              }}
            >
              <Plus size={16} /> Guardar no banco
            </button>
          </div>
        </Card>
      </Fade>

      <div className="grid gap-4 md:grid-cols-3">
        <Column title="Novas" hint="Aguardando avaliação da IA">
          {grouped.novo.length === 0 ? (
            <Empty>Nenhuma ideia nova.</Empty>
          ) : (
            grouped.novo.map((i) => (
              <IdeaCard key={i.id} idea={i} onAnalyze={() => setAnalyzing(i)} onRemove={() => removeIdea(i.id)} />
            ))
          )}
        </Column>
        <Column title="Avaliadas" hint="Potencial estimado pela IA">
          {grouped.avaliada.length === 0 ? (
            <Empty>Nada avaliado ainda.</Empty>
          ) : (
            grouped.avaliada.map((i) => (
              <IdeaCard key={i.id} idea={i} onAnalyze={() => setAnalyzing(i)} onRemove={() => removeIdea(i.id)} />
            ))
          )}
        </Column>
        <Column title="Descartadas" hint="Fora do foco — por ora">
          {grouped.descartada.length === 0 ? (
            <Empty>Nada descartado.</Empty>
          ) : (
            grouped.descartada.map((i) => (
              <IdeaCard key={i.id} idea={i} onAnalyze={() => setAnalyzing(i)} onRemove={() => removeIdea(i.id)} />
            ))
          )}
        </Column>
      </div>

      {/* Modal de análise anti-distração */}
      {analyzing && (
        <AnalysisModal
          idea={analyzing}
          ctx={ctx}
          onClose={() => setAnalyzing(null)}
          onApprove={(potential) => {
            updateIdea(analyzing.id, { status: 'aprovada', potential })
            setAnalyzing(null)
          }}
          onEvaluate={(potential) => {
            updateIdea(analyzing.id, { status: 'avaliada', potential })
            setAnalyzing(null)
          }}
          onDiscard={() => {
            updateIdea(analyzing.id, { status: 'descartada' })
            setAnalyzing(null)
          }}
        />
      )}
    </div>
  )
}

function Column({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-ink-600">{hint}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function IdeaCard({ idea, onAnalyze, onRemove }: { idea: Idea; onAnalyze: () => void; onRemove: () => void }) {
  return (
    <div className="group card card-hover p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-ink-100">{idea.title}</p>
        <button onClick={onRemove} className="text-ink-700 opacity-0 transition group-hover:opacity-100 hover:text-red-400">
          <Trash2 size={13} />
        </button>
      </div>
      {idea.notes && <p className="mt-1 line-clamp-2 text-xs text-ink-500">{idea.notes}</p>}
      <div className="mt-2.5 flex items-center justify-between">
        {idea.potential !== undefined ? (
          <span className="chip bg-accent/10 text-accent-soft">Potencial {idea.potential}</span>
        ) : (
          <span className="chip bg-white/5 text-ink-500">Não avaliada</span>
        )}
        <button className="text-xs font-medium text-accent-soft hover:underline" onClick={onAnalyze}>
          Analisar →
        </button>
      </div>
    </div>
  )
}

function AnalysisModal({
  idea,
  ctx,
  onClose,
  onApprove,
  onEvaluate,
  onDiscard,
}: {
  idea: Idea
  ctx: MentorContext
  onClose: () => void
  onApprove: (potential: number) => void
  onEvaluate: (potential: number) => void
  onDiscard: () => void
}) {
  const analysis = useMemo(() => analyzeIdea(idea, ctx), [idea, ctx])
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <Card className="max-w-lg" >
        <div onClick={(e) => e.stopPropagation()}>
          <div className="mb-1 flex items-center gap-2 text-accent-soft">
            <Sparkles size={16} />
            <p className="section-title !text-accent-soft">Análise anti-distração</p>
          </div>
          <h3 className="text-lg font-semibold text-white">{idea.title}</h3>

          <div className="my-4 flex items-center gap-4 rounded-xl bg-white/[0.03] p-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{analysis.potential}</p>
              <p className="text-[10px] uppercase tracking-wide text-ink-500">Potencial</p>
            </div>
            <p className="flex-1 text-sm text-ink-300">{analysis.verdict}</p>
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">A IA pergunta</p>
          <ul className="space-y-1.5 text-sm text-ink-300">
            {analysis.questions.map((q, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-accent-soft">?</span>
                {q}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => onEvaluate(analysis.potential)}>
              Guardar avaliação
            </button>
            <button className="btn-outline" onClick={() => onApprove(analysis.potential)}>
              <Check size={15} /> Aprovar p/ incubação
            </button>
            <button className="btn-ghost text-red-300 hover:bg-red-400/10" onClick={onDiscard}>
              <X size={15} /> Descartar
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
