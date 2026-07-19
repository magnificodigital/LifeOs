import { useState } from 'react'
import { MessageSquare, Settings, BookOpen } from 'lucide-react'
import { clsx } from 'clsx'
import { PRINCIPLES } from '@/lib/principles'
import Assistant from './Assistant'
import Connections from './Connections'
import { Card, Fade, PageHeader } from '@/components/ui'

type Tab = 'conversa' | 'conexoes' | 'principios'

export default function Stark() {
  const [tab, setTab] = useState<Tab>('conversa')
  return (
    <div>
      <div className="mb-5 inline-flex flex-wrap rounded-xl border border-white/10 p-1">
        {(
          [
            { k: 'conversa', label: 'Conversa', icon: MessageSquare },
            { k: 'conexoes', label: 'Conexões', icon: Settings },
            { k: 'principios', label: 'Princípios', icon: BookOpen },
          ] as const
        ).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={clsx(
              'flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition',
              tab === t.k ? 'bg-white/10 text-white' : 'text-ink-400 hover:text-ink-100',
            )}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'conversa' && <Assistant />}
      {tab === 'conexoes' && <Connections />}
      {tab === 'principios' && <StarkPrinciples />}
    </div>
  )
}

function StarkPrinciples() {
  return (
    <div>
      <PageHeader
        title="Os princípios do STARK"
        subtitle="O STARK pensa a partir destes pensadores. São a alma do LifeOS — cada um molda uma parte concreta do app."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {PRINCIPLES.map((p, i) => (
          <Fade key={p.author} delay={i * 0.04}>
            <Card hover className="h-full">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{p.emoji}</span>
                <div>
                  <p className="font-semibold text-white">{p.author}</p>
                  <p className="text-xs text-ink-500">{p.work}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-ink-200">{p.idea}</p>
              <div className="mt-3 rounded-xl bg-white/[0.03] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-soft">No LifeOS</p>
                <p className="mt-0.5 text-sm text-ink-300">{p.inApp}</p>
              </div>
            </Card>
          </Fade>
        ))}
      </div>
    </div>
  )
}
