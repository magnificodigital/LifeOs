import { useState } from 'react'
import { Plus, Trash2, Star, ChevronLeft, ChevronRight, Link2 } from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { TASK_COLUMNS, type Task, type TaskStatus } from '@/lib/types'
import { todayISO } from '@/lib/utils'

const COL_ACCENT: Record<TaskStatus, string> = {
  backlog: 'text-ink-400',
  hoje: 'text-accent-soft',
  fazendo: 'text-amber-300',
  feito: 'text-emerald-300',
}

/**
 * Kanban — visão clara das tarefas em colunas. Arraste para mover, ou use as
 * setas. Captura rápida no topo: escreva e Enter. (David Allen: tire da cabeça.)
 */
export default function Kanban() {
  const { tasks, metas, projects, addTask, moveTask, toggleTask, setOneThing, removeTask } = useStore()
  const [title, setTitle] = useState('')
  const [drag, setDrag] = useState<string | null>(null)

  const metaTitle = (id?: string) => metas.find((m) => m.id === id)?.title
  const projTitle = (id?: string) => projects.find((p) => p.id === id)?.title

  const add = () => {
    if (!title.trim()) return
    addTask({ title: title.trim(), status: 'hoje', date: todayISO() })
    setTitle('')
  }

  const move = (t: Task, dir: -1 | 1) => {
    const order: TaskStatus[] = ['backlog', 'hoje', 'fazendo', 'feito']
    const idx = order.indexOf(t.status)
    const next = order[Math.min(order.length - 1, Math.max(0, idx + dir))]
    moveTask(t.id, next)
  }

  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-accent-soft">Action · Quadro</p>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Kanban</h1>
          <p className="mt-1 text-sm text-ink-400">Arraste as tarefas entre as colunas. Simples e visual.</p>
        </div>
      </div>

      {/* Captura rápida */}
      <form
        className="mb-5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <input className="input" placeholder="Nova tarefa (Enter para adicionar)..." value={title} onChange={(e) => setTitle(e.target.value)} />
        <button className="btn-primary shrink-0" type="submit" disabled={!title.trim()}>
          <Plus size={16} /> Adicionar
        </button>
      </form>

      <div className="grid gap-3 md:grid-cols-4">
        {TASK_COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col.key)
          return (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (drag) moveTask(drag, col.key)
                setDrag(null)
              }}
              className="flex flex-col rounded-2xl border border-white/5 bg-ink-900/40 p-2.5"
            >
              <div className="mb-2 flex items-center justify-between px-1.5">
                <span className={clsx('text-xs font-semibold uppercase tracking-wide', COL_ACCENT[col.key])}>{col.label}</span>
                <span className="text-xs text-ink-600">{items.length}</span>
              </div>
              <div className="flex min-h-[60px] flex-col gap-2">
                {items.map((t) => (
                  <motion.div
                    layout
                    key={t.id}
                    draggable
                    onDragStart={() => setDrag(t.id)}
                    onDragEnd={() => setDrag(null)}
                    className={clsx(
                      'group cursor-grab rounded-xl border p-2.5 active:cursor-grabbing',
                      t.isOneThing ? 'border-amber-400/30 bg-amber-400/[0.06]' : 'border-white/5 bg-ink-900',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={clsx('text-sm', t.status === 'feito' ? 'text-ink-500 line-through' : 'text-ink-100')}>{t.title}</p>
                      <button onClick={() => removeTask(t.id)} className="text-ink-700 opacity-0 transition group-hover:opacity-100 hover:text-red-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {(projTitle(t.projectId) || metaTitle(t.metaId)) && (
                      <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-ink-600">
                        <Link2 size={10} className="shrink-0" /> {projTitle(t.projectId) ?? metaTitle(t.metaId)}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button onClick={() => move(t, -1)} disabled={t.status === 'backlog'} className="rounded-md p-1 text-ink-500 hover:bg-white/5 hover:text-ink-200 disabled:opacity-20">
                          <ChevronLeft size={14} />
                        </button>
                        <button onClick={() => move(t, 1)} disabled={t.status === 'feito'} className="rounded-md p-1 text-ink-500 hover:bg-white/5 hover:text-ink-200 disabled:opacity-20">
                          <ChevronRight size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => setOneThing(t.id)}
                        title="Marcar como a One Thing (80/20)"
                        className={clsx('rounded-md p-1', t.isOneThing ? 'text-amber-300' : 'text-ink-600 hover:text-amber-300')}
                      >
                        <Star size={13} fill={t.isOneThing ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    {col.key === 'feito' && (
                      <button onClick={() => toggleTask(t.id)} className="mt-1 text-[11px] text-ink-600 hover:text-ink-300">
                        reabrir
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
