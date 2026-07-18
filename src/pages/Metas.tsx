import { useState } from 'react'
import { Plus, Trash2, Star, Link2, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'
import { useStore } from '@/lib/store'
import { HORIZONS, type MetaHorizon } from '@/lib/types'
import { Card, Fade, PageHeader, Empty } from '@/components/ui'
import { todayISO } from '@/lib/utils'

export default function Metas() {
  const { goals, metas, tasks, addMeta, toggleMeta, removeMeta, addTask, toggleTask, setOneThing, removeTask } =
    useStore()
  const today = todayISO()
  const todaysTasks = tasks.filter((t) => t.date === today)

  const [metaTitle, setMetaTitle] = useState('')
  const [metaHorizon, setMetaHorizon] = useState<MetaHorizon>('semanal')
  const [metaGoal, setMetaGoal] = useState('')

  const [taskTitle, setTaskTitle] = useState('')
  const [taskMeta, setTaskMeta] = useState('')

  const metaLabel = (id?: string) => metas.find((m) => m.id === id)?.title ?? '—'

  return (
    <div>
      <PageHeader
        title="Metas & Tarefas"
        subtitle="Tudo conectado: anual → trimestral → mensal → semanal → diária. Nenhuma tarefa existe sem uma meta."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Metas hierárquicas */}
        <Fade>
          <Card>
            <p className="section-title mb-3">Sistema de Metas</p>
            <div className="mb-4 grid gap-2">
              <input
                className="input"
                placeholder="Nova meta..."
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <select className="input" value={metaHorizon} onChange={(e) => setMetaHorizon(e.target.value as MetaHorizon)}>
                  {HORIZONS.map((h) => (
                    <option key={h.key} value={h.key}>
                      {h.label}
                    </option>
                  ))}
                </select>
                <select className="input" value={metaGoal} onChange={(e) => setMetaGoal(e.target.value)}>
                  <option value="">Vincular objetivo...</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="btn-primary"
                disabled={!metaTitle.trim()}
                onClick={() => {
                  addMeta({ title: metaTitle.trim(), horizon: metaHorizon, goalId: metaGoal || undefined })
                  setMetaTitle('')
                }}
              >
                <Plus size={16} /> Adicionar meta
              </button>
            </div>

            <div className="space-y-4">
              {HORIZONS.map((h) => {
                const items = metas.filter((m) => m.horizon === h.key)
                if (items.length === 0) return null
                return (
                  <div key={h.key}>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-500">{h.label}</p>
                    <div className="space-y-1.5">
                      {items.map((m) => (
                        <div key={m.id} className="group flex items-center gap-2.5 rounded-xl bg-white/[0.03] px-3 py-2">
                          <button onClick={() => toggleMeta(m.id)} className={clsx('flex h-4 w-4 items-center justify-center rounded border', m.done ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300' : 'border-white/20')}>
                            {m.done && '✓'}
                          </button>
                          <div className="flex-1">
                            <p className={clsx('text-sm', m.done ? 'text-ink-500 line-through' : 'text-ink-100')}>{m.title}</p>
                            {m.goalId && (
                              <p className="flex items-center gap-1 text-[11px] text-ink-600">
                                <Link2 size={10} /> {goals.find((g) => g.id === m.goalId)?.title}
                              </p>
                            )}
                          </div>
                          <button onClick={() => removeMeta(m.id)} className="text-ink-700 opacity-0 transition group-hover:opacity-100 hover:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </Fade>

        {/* Tarefas do dia */}
        <Fade delay={0.05}>
          <Card>
            <p className="section-title mb-3">Tarefas de hoje</p>

            {metas.length === 0 ? (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3 text-sm text-amber-100/90">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-300" />
                Crie uma meta antes. No LifeOS, toda tarefa precisa servir a uma meta — do contrário é só movimento.
              </div>
            ) : (
              <div className="mb-4 grid gap-2">
                <input className="input" placeholder="Nova tarefa..." value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                <select className="input" value={taskMeta} onChange={(e) => setTaskMeta(e.target.value)}>
                  <option value="">Vincular a uma meta (obrigatório)...</option>
                  {metas.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.horizon}] {m.title}
                    </option>
                  ))}
                </select>
                <button
                  className="btn-primary"
                  disabled={!taskTitle.trim() || !taskMeta}
                  onClick={() => {
                    addTask({ title: taskTitle.trim(), metaId: taskMeta, date: today })
                    setTaskTitle('')
                  }}
                >
                  <Plus size={16} /> Adicionar tarefa
                </button>
              </div>
            )}

            {todaysTasks.length === 0 ? (
              <Empty>Sem tarefas para hoje. Escolha a One Thing e proteja o bloco de Deep Work.</Empty>
            ) : (
              <div className="space-y-1.5">
                {todaysTasks.map((t) => (
                  <div
                    key={t.id}
                    className={clsx(
                      'group flex items-center gap-2.5 rounded-xl px-3 py-2.5',
                      t.isOneThing ? 'border border-accent/30 bg-accent/[0.07]' : 'bg-white/[0.03]',
                    )}
                  >
                    <button
                      onClick={() => toggleTask(t.id)}
                      className={clsx('flex h-5 w-5 items-center justify-center rounded-md border text-xs', t.done ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300' : 'border-white/20')}
                    >
                      {t.done && '✓'}
                    </button>
                    <div className="flex-1">
                      <p className={clsx('text-sm', t.done ? 'text-ink-500 line-through' : 'text-ink-100')}>{t.title}</p>
                      <p className="text-[11px] text-ink-600">↳ {metaLabel(t.metaId)}</p>
                    </div>
                    <button
                      onClick={() => setOneThing(t.id)}
                      title="Marcar como a One Thing (80/20)"
                      className={clsx('transition', t.isOneThing ? 'text-amber-300' : 'text-ink-700 opacity-0 group-hover:opacity-100 hover:text-amber-300')}
                    >
                      <Star size={16} fill={t.isOneThing ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={() => removeTask(t.id)} className="text-ink-700 opacity-0 transition group-hover:opacity-100 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-ink-600">
              ⭐ marca a <strong className="text-ink-400">One Thing</strong> — a única tarefa que produz 80% do resultado hoje.
            </p>
          </Card>
        </Fade>
      </div>
    </div>
  )
}
