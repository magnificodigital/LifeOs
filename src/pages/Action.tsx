import { useState } from 'react'
import { Sun, Columns3, CalendarDays } from 'lucide-react'
import { clsx } from 'clsx'
import Today from './Today'
import Kanban from './Kanban'
import Agenda from './Agenda'

/** ACTION — a execução: o dia gamificado, o Kanban de tarefas e a Agenda da semana. */
export default function Action() {
  const [tab, setTab] = useState<'hoje' | 'quadro' | 'agenda'>('hoje')
  return (
    <div>
      <div className="mb-5 inline-flex rounded-xl border border-white/10 p-1">
        {(
          [
            { k: 'hoje', label: 'Hoje', icon: Sun },
            { k: 'quadro', label: 'Kanban', icon: Columns3 },
            { k: 'agenda', label: 'Agenda', icon: CalendarDays },
          ] as const
        ).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={clsx(
              'flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition',
              tab === t.k ? 'bg-white/10 text-white' : 'text-ink-400 hover:text-ink-100',
            )}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>
      {tab === 'hoje' && <Today />}
      {tab === 'quadro' && <Kanban />}
      {tab === 'agenda' && <Agenda />}
    </div>
  )
}
