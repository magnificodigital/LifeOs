import { useState } from 'react'
import { Plus, Trash2, Mic, Quote, Brain, Lightbulb } from 'lucide-react'
import { clsx } from 'clsx'
import { useStore } from '@/lib/store'
import type { Note } from '@/lib/types'
import { Card, Fade, PageHeader } from '@/components/ui'

const KINDS: { key: Note['kind']; label: string; icon: typeof Quote }[] = [
  { key: 'pensamento', label: 'Pensamento', icon: Brain },
  { key: 'frase', label: 'Frase', icon: Quote },
  { key: 'ideia', label: 'Ideia', icon: Lightbulb },
]

/**
 * Notas — capture pensamentos e frases num toque (David Allen: tire da cabeça,
 * a mente serve para ter ideias, não para guardá-las). O STARK pode usar isto.
 */
export default function Notes() {
  const { notes, addNote, removeNote } = useStore()
  const [text, setText] = useState('')
  const [kind, setKind] = useState<Note['kind']>('pensamento')
  const [listening, setListening] = useState(false)

  const startVoice = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SR) return alert('Reconhecimento de voz não suportado neste navegador.')
    const rec = new SR()
    rec.lang = 'pt-BR'
    rec.onresult = (e: any) => setText((t) => (t ? t + ' ' : '') + e.results[0][0].transcript)
    rec.onend = () => setListening(false)
    setListening(true)
    rec.start()
  }

  const save = () => {
    if (!text.trim()) return
    addNote({ text: text.trim(), kind })
    setText('')
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-accent-soft">Ferramenta</p>
      <PageHeader title="Notas" subtitle="Pensamentos, frases e ideias soltas. Capture rápido — a mente serve para criar, não para guardar." />

      <Fade>
        <Card className="mb-5">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {KINDS.map((k) => (
              <button
                key={k.key}
                onClick={() => setKind(k.key)}
                className={clsx(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition',
                  kind === k.key ? 'bg-accent/15 text-accent-soft' : 'bg-white/5 text-ink-400 hover:text-ink-100',
                )}
              >
                <k.icon size={13} /> {k.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <textarea
              className="input min-h-[70px]"
              placeholder="Escreva ou dite..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save()
              }}
            />
            <div className="flex flex-col gap-2">
              <button className={clsx('btn-outline shrink-0', listening && 'border-red-400/40 text-red-300')} onClick={startVoice} title="Ditar">
                <Mic size={16} />
              </button>
              <button className="btn-primary shrink-0 flex-1" onClick={save} disabled={!text.trim()}>
                <Plus size={16} />
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-ink-600">Dica: Ctrl/Cmd + Enter salva.</p>
        </Card>
      </Fade>

      {notes.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-500">Nada capturado ainda. Registre o primeiro pensamento.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {notes.map((n, i) => {
            const K = KINDS.find((k) => k.key === n.kind) ?? KINDS[0]
            return (
              <Fade key={n.id} delay={i * 0.03}>
                <Card hover className="group">
                  <div className="flex items-start justify-between gap-2">
                    <span className="chip bg-white/5 text-ink-400">
                      <K.icon size={12} /> {K.label}
                    </span>
                    <button onClick={() => removeNote(n.id)} className="text-ink-700 opacity-0 transition group-hover:opacity-100 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className={clsx('mt-2 text-ink-100', n.kind === 'frase' && 'italic text-ink-200')}>
                    {n.kind === 'frase' ? `"${n.text}"` : n.text}
                  </p>
                  <p className="mt-2 text-[11px] text-ink-600">{fmt(n.createdAt)}</p>
                </Card>
              </Fade>
            )
          })}
        </div>
      )}
    </div>
  )
}
