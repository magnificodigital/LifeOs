import { useState } from 'react'
import { Target, FolderKanban, Lightbulb } from 'lucide-react'
import { clsx } from 'clsx'
import Goals from './Goals'
import Projects from './Projects'
import Ideas from './Ideas'

type Tab = 'objetivos' | 'projetos' | 'ideias'

/**
 * PLAN — o pilar do planejamento: onde você decide o QUE fazer e em QUE ORDEM.
 * Reúne Objetivos (o destino + plano de ação), Projetos & Decisões (por onde
 * começar) e o Banco de Ideias (o que ainda não vale executar).
 */
export default function Plan() {
  const [tab, setTab] = useState<Tab>('objetivos')
  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-accent-soft">Plan · Planejar</p>
      <div className="mb-6 inline-flex flex-wrap rounded-xl border border-white/10 p-1">
        {(
          [
            { k: 'objetivos', label: 'Objetivos', icon: Target },
            { k: 'projetos', label: 'Projetos & Decisões', icon: FolderKanban },
            { k: 'ideias', label: 'Banco de Ideias', icon: Lightbulb },
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

      {tab === 'objetivos' && <Goals />}
      {tab === 'projetos' && <Projects />}
      {tab === 'ideias' && <Ideas />}
    </div>
  )
}
