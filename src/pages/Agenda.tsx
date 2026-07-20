import { useMemo, useState } from 'react'
import { Plus, Trash2, ChevronLeft, ChevronRight, CalendarDays, Clock, Video } from 'lucide-react'
import { clsx } from 'clsx'
import { useStore } from '@/lib/store'
import { todayISO, weekStart } from '@/lib/utils'

const DAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

/**
 * Agenda — calendário semanal de tarefas e reuniões. Tudo aqui são as mesmas
 * tarefas do Kanban/projetos, organizadas por dia e horário.
 */
export default function Agenda() {
  const { tasks, projects, addTask, toggleTask, removeTask, updateTask } = useStore()
  const today = todayISO()
  const [ws, setWs] = useState(weekStart(today))

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(ws, i)), [ws])

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(today)
  const [time, setTime] = useState('')
  const [kind, setKind] = useState<'tarefa' | 'reuniao'>('tarefa')
  const [projectId, setProjectId] = useState('')

  const add = () => {
    if (!title.trim()) return
    addTask({
      title: title.trim(),
      date,
      time: time || undefined,
      kind,
      projectId: projectId || undefined,
      status: 'hoje',
    })
    setTitle('')
    setTime('')
  }

  const projTitle = (id?: string) => projects.find((p) => p.id === id)?.title

  const monthLabel = new Date(ws + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Agenda</h1>
          <p className="mt-1 text-sm text-ink-400">Tarefas e reuniões da semana — as mesmas do Kanban, organizadas no tempo.</p>
        </div>
        <div className="flex items-center gap-1">
          <button className="btn-ghost !px-2" onClick={() => setWs(addDays(ws, -7))}>
            <ChevronLeft size={17} />
          </button>
          <button className="btn-outline !py-1.5 text-xs capitalize" onClick={() => setWs(weekStart(today))}>
            {monthLabel}
          </button>
          <button className="btn-ghost !px-2" onClick={() => setWs(addDays(ws, 7))}>
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      {/* Adição rápida */}
      <form
        className="card mb-4 flex flex-wrap items-center gap-2 p-3"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <div className="inline-flex rounded-lg border border-white/10 p-0.5">
          <button type="button" onClick={() => setKind('tarefa')} className={clsx('rounded-md px-2.5 py-1 text-xs font-medium', kind === 'tarefa' ? 'bg-white/10 text-white' : 'text-ink-400')}>
            Tarefa
          </button>
          <button type="button" onClick={() => setKind('reuniao')} className={clsx('flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium', kind === 'reuniao' ? 'bg-accent/20 text-accent-soft' : 'text-ink-400')}>
            <Video size={11} /> Reunião
          </button>
        </div>
        <input className="input min-w-[180px] flex-1" placeholder={kind === 'reuniao' ? 'Reunião com...' : 'Nova tarefa...'} value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="input !w-auto" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input className="input !w-28" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        <select className="input !w-auto max-w-[180px]" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">Sem projeto</option>
          {projects.filter((p) => p.status !== 'arquivo').map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <button className="btn-primary shrink-0" type="submit" disabled={!title.trim()}>
          <Plus size={16} /> Agendar
        </button>
      </form>

      {/* Grade da semana */}
      <div className="grid gap-2 md:grid-cols-7">
        {days.map((iso, i) => {
          const isToday = iso === today
          const items = tasks
            .filter((t) => t.date === iso)
            .sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'))
          return (
            <div
              key={iso}
              className={clsx(
                'flex min-h-[140px] flex-col rounded-2xl border p-2',
                isToday ? 'border-accent/40 bg-accent/[0.05]' : 'border-white/5 bg-ink-900/40',
              )}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className={clsx('text-xs font-semibold uppercase', isToday ? 'text-accent-soft' : 'text-ink-500')}>{DAY_NAMES[i]}</span>
                <span className={clsx('text-xs font-bold', isToday ? 'text-white' : 'text-ink-600')}>
                  {Number(iso.slice(8, 10))}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                {items.map((t) => (
                  <div
                    key={t.id}
                    className={clsx(
                      'group rounded-lg border p-1.5 text-[12px] leading-snug',
                      t.kind === 'reuniao'
                        ? 'border-accent/30 bg-accent/[0.1]'
                        : t.done
                          ? 'border-white/5 bg-white/[0.02] opacity-60'
                          : 'border-white/5 bg-ink-900',
                    )}
                  >
                    <div className="flex items-start gap-1.5">
                      <button
                        onClick={() => toggleTask(t.id)}
                        className={clsx('mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border text-[8px]', t.done ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300' : 'border-white/20')}
                      >
                        {t.done && '✓'}
                      </button>
                      <span className={clsx('flex-1', t.done ? 'text-ink-500 line-through' : 'text-ink-100')}>
                        {t.title}
                      </span>
                      <button onClick={() => removeTask(t.id)} className="text-ink-700 opacity-0 transition group-hover:opacity-100 hover:text-red-400">
                        <Trash2 size={11} />
                      </button>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 pl-5">
                      {t.time && (
                        <span className={clsx('flex items-center gap-0.5 text-[10px] font-semibold', t.kind === 'reuniao' ? 'text-accent-soft' : 'text-ink-500')}>
                          <Clock size={9} /> {t.time}
                        </span>
                      )}
                      {projTitle(t.projectId) && (
                        <span className="truncate text-[10px] text-ink-600">{projTitle(t.projectId)}</span>
                      )}
                      {/* Reagendar rápido */}
                      <select
                        className="ml-auto hidden rounded border border-white/10 bg-ink-900 px-1 py-0 text-[9px] text-ink-500 group-hover:block"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) updateTask(t.id, { date: e.target.value })
                        }}
                        title="Mover para outro dia"
                      >
                        <option value="">mover…</option>
                        {days.map((d, j) => (
                          <option key={d} value={d}>
                            {DAY_NAMES[j]} {Number(d.slice(8, 10))}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <button
                    onClick={() => setDate(iso)}
                    className="flex flex-1 items-center justify-center rounded-lg text-ink-800 transition hover:bg-white/[0.02] hover:text-ink-500"
                    title="Selecionar este dia no formulário"
                  >
                    <CalendarDays size={14} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-ink-600">
        Dica: reuniões 📅 aparecem destacadas. Passe o mouse num item para excluir ou mover de dia.
      </p>
    </div>
  )
}
