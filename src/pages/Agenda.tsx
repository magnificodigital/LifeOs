import { useMemo, useState } from 'react'
import { Plus, Trash2, ChevronLeft, ChevronRight, Clock, Video, CalendarDays } from 'lucide-react'
import { clsx } from 'clsx'
import { useStore } from '@/lib/store'
import { todayISO, weekStart } from '@/lib/utils'

const DAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
function longDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
}

type View = 'dia' | 'semana' | 'mes'

/** Agenda — as mesmas tarefas do Kanban/projetos, organizadas no calendário. */
export default function Agenda() {
  const { tasks, projects, addTask, toggleTask, removeTask, updateTask } = useStore()
  const today = todayISO()
  const [view, setView] = useState<View>('semana')
  const [anchor, setAnchor] = useState(today) // data de referência

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(today)
  const [time, setTime] = useState('')
  const [kind, setKind] = useState<'tarefa' | 'reuniao'>('tarefa')
  const [projectId, setProjectId] = useState('')

  const add = () => {
    if (!title.trim()) return
    addTask({ title: title.trim(), date, time: time || undefined, kind, projectId: projectId || undefined, status: 'hoje' })
    setTitle('')
    setTime('')
  }

  const projTitle = (id?: string) => projects.find((p) => p.id === id)?.title
  const dayItems = (iso: string) =>
    tasks.filter((t) => t.date === iso).sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'))

  // Navegação por período conforme a vista.
  const shift = (dir: -1 | 1) => {
    if (view === 'dia') setAnchor(addDays(anchor, dir))
    else if (view === 'semana') setAnchor(addDays(anchor, dir * 7))
    else {
      const d = new Date(anchor + 'T00:00:00')
      d.setMonth(d.getMonth() + dir)
      setAnchor(d.toISOString().slice(0, 10))
    }
  }
  const periodLabel =
    view === 'dia'
      ? longDate(anchor)
      : view === 'semana'
        ? `Semana de ${new Date(weekStart(anchor) + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
        : new Date(anchor + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Agenda</h1>
          <p className="mt-1 text-sm text-ink-400">Tarefas e reuniões no calendário — as mesmas do resto do app.</p>
        </div>
        <div className="inline-flex rounded-xl border border-white/10 p-1">
          {(['dia', 'semana', 'mes'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={clsx('rounded-lg px-3.5 py-1.5 text-sm font-medium capitalize transition', view === v ? 'bg-white/10 text-white' : 'text-ink-400 hover:text-ink-100')}
            >
              {v === 'mes' ? 'Mês' : v}
            </button>
          ))}
        </div>
      </div>

      {/* Adição rápida */}
      <form className="card mb-4 flex flex-wrap items-center gap-2 p-3" onSubmit={(e) => { e.preventDefault(); add() }}>
        <div className="inline-flex rounded-lg border border-white/10 p-0.5">
          <button type="button" onClick={() => setKind('tarefa')} className={clsx('rounded-md px-2.5 py-1 text-xs font-medium', kind === 'tarefa' ? 'bg-white/10 text-white' : 'text-ink-400')}>
            Tarefa
          </button>
          <button type="button" onClick={() => setKind('reuniao')} className={clsx('flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium', kind === 'reuniao' ? 'bg-accent/20 text-accent-soft' : 'text-ink-400')}>
            <Video size={11} /> Reunião
          </button>
        </div>
        <input className="input min-w-[160px] flex-1" placeholder={kind === 'reuniao' ? 'Reunião com...' : 'Nova tarefa...'} value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="input !w-auto" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input className="input !w-28" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        <select className="input !w-auto max-w-[170px]" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">Sem projeto</option>
          {projects.filter((p) => p.status !== 'arquivo').map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
        <button className="btn-primary shrink-0" type="submit" disabled={!title.trim()}>
          <Plus size={16} /> Agendar
        </button>
      </form>

      {/* Navegação de período */}
      <div className="mb-3 flex items-center justify-between">
        <button className="btn-ghost !px-2" onClick={() => shift(-1)}>
          <ChevronLeft size={18} />
        </button>
        <button className="text-sm font-semibold capitalize text-white" onClick={() => setAnchor(today)} title="Voltar para hoje">
          {periodLabel}
        </button>
        <button className="btn-ghost !px-2" onClick={() => shift(1)}>
          <ChevronRight size={18} />
        </button>
      </div>

      {view === 'dia' && (
        <DayView items={dayItems(anchor)} today={today} anchor={anchor} projTitle={projTitle} onToggle={toggleTask} onRemove={removeTask} />
      )}
      {view === 'semana' && (
        <WeekView ws={weekStart(anchor)} today={today} dayItems={dayItems} projTitle={projTitle} onToggle={toggleTask} onRemove={removeTask} onMove={(id: string, d: string) => updateTask(id, { date: d })} onPick={(d: string) => setDate(d)} />
      )}
      {view === 'mes' && (
        <MonthView anchor={anchor} today={today} dayItems={dayItems} onPick={(d: string) => { setAnchor(d); setDate(d); setView('dia') }} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
function TaskRow({ t, projTitle, onToggle, onRemove }: any) {
  return (
    <div className={clsx('group flex items-center gap-3 rounded-xl px-3 py-2 text-sm', t.kind === 'reuniao' ? 'border border-accent/25 bg-accent/[0.08]' : 'bg-white/[0.03]')}>
      <button onClick={() => onToggle(t.id)} className={clsx('flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]', t.done ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300' : 'border-white/20')}>
        {t.done && '✓'}
      </button>
      <span className={clsx('flex w-14 shrink-0 items-center gap-1 font-semibold', t.kind === 'reuniao' ? 'text-accent-soft' : 'text-ink-500')}>
        {t.time ? (t.kind === 'reuniao' ? <Video size={11} /> : <Clock size={11} />) : null} {t.time ?? '—'}
      </span>
      <span className={clsx('flex-1', t.done ? 'text-ink-500 line-through' : 'text-ink-100')}>{t.title}</span>
      {projTitle(t.projectId) && <span className="hidden text-[11px] text-ink-600 sm:block">{projTitle(t.projectId)}</span>}
      <button onClick={() => onRemove(t.id)} className="text-ink-700 opacity-0 transition group-hover:opacity-100 hover:text-red-400">
        <Trash2 size={13} />
      </button>
    </div>
  )
}

function DayView({ items, projTitle, onToggle, onRemove }: any) {
  return (
    <div className="card p-4">
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-500">Nada agendado neste dia.</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((t: any) => (
            <TaskRow key={t.id} t={t} projTitle={projTitle} onToggle={onToggle} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  )
}

function WeekView({ ws, today, dayItems, projTitle, onToggle, onRemove, onMove, onPick }: any) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(ws, i)), [ws])
  return (
    <div className="grid gap-2 md:grid-cols-7">
      {days.map((iso, i) => {
        const isToday = iso === today
        const items = dayItems(iso)
        return (
          <div key={iso} className={clsx('flex min-h-[140px] flex-col rounded-2xl border p-2', isToday ? 'border-accent/40 bg-accent/[0.05]' : 'border-white/5 bg-ink-900/40')}>
            <div className="mb-2 flex items-center justify-between px-1">
              <span className={clsx('text-xs font-semibold uppercase', isToday ? 'text-accent-soft' : 'text-ink-500')}>{DAY_NAMES[i]}</span>
              <span className={clsx('text-xs font-bold', isToday ? 'text-white' : 'text-ink-600')}>{Number(iso.slice(8, 10))}</span>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              {items.map((t: any) => (
                <div key={t.id} className={clsx('group rounded-lg border p-1.5 text-[12px] leading-snug', t.kind === 'reuniao' ? 'border-accent/30 bg-accent/[0.1]' : t.done ? 'border-white/5 bg-white/[0.02] opacity-60' : 'border-white/5 bg-ink-900')}>
                  <div className="flex items-start gap-1.5">
                    <button onClick={() => onToggle(t.id)} className={clsx('mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border text-[8px]', t.done ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300' : 'border-white/20')}>
                      {t.done && '✓'}
                    </button>
                    <span className={clsx('flex-1', t.done ? 'text-ink-500 line-through' : 'text-ink-100')}>{t.title}</span>
                    <button onClick={() => onRemove(t.id)} className="text-ink-700 opacity-0 transition group-hover:opacity-100 hover:text-red-400">
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 pl-5">
                    {t.time && <span className={clsx('text-[10px] font-semibold', t.kind === 'reuniao' ? 'text-accent-soft' : 'text-ink-500')}>{t.time}</span>}
                    {projTitle(t.projectId) && <span className="truncate text-[10px] text-ink-600">{projTitle(t.projectId)}</span>}
                    <select className="ml-auto hidden rounded border border-white/10 bg-ink-900 px-1 text-[9px] text-ink-500 group-hover:block" value="" onChange={(e) => e.target.value && onMove(t.id, e.target.value)} title="Mover de dia">
                      <option value="">mover…</option>
                      {days.map((d: string, j: number) => (
                        <option key={d} value={d}>{DAY_NAMES[j]} {Number(d.slice(8, 10))}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <button onClick={() => onPick(iso)} className="flex flex-1 items-center justify-center rounded-lg text-ink-800 transition hover:bg-white/[0.02] hover:text-ink-500" title="Usar este dia no formulário">
                  <CalendarDays size={14} />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MonthView({ anchor, today, dayItems, onPick }: any) {
  const first = new Date(anchor + 'T00:00:00')
  first.setDate(1)
  const monthIdx = first.getMonth()
  const startOffset = (first.getDay() + 6) % 7 // segunda = 0
  const gridStart = new Date(first)
  gridStart.setDate(first.getDate() - startOffset)
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return d.toISOString().slice(0, 10)
  })

  return (
    <div className="card p-2">
      <div className="mb-1 grid grid-cols-7 gap-1 px-1 text-center text-[10px] font-semibold uppercase text-ink-600">
        {DAY_NAMES.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((iso) => {
          const items = dayItems(iso)
          const meetings = items.filter((t: any) => t.kind === 'reuniao').length
          const isToday = iso === today
          const inMonth = new Date(iso + 'T00:00:00').getMonth() === monthIdx
          return (
            <button
              key={iso}
              onClick={() => onPick(iso)}
              className={clsx(
                'flex min-h-[68px] flex-col rounded-lg border p-1.5 text-left transition hover:border-accent/40',
                isToday ? 'border-accent/50 bg-accent/[0.08]' : 'border-white/5',
                !inMonth && 'opacity-35',
              )}
            >
              <span className={clsx('text-xs font-semibold', isToday ? 'text-accent-soft' : 'text-ink-400')}>{Number(iso.slice(8, 10))}</span>
              {items.length > 0 && (
                <div className="mt-auto flex flex-wrap gap-0.5">
                  {meetings > 0 && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                  {items.length > meetings && <span className="h-1.5 w-1.5 rounded-full bg-ink-500" />}
                  <span className="ml-0.5 text-[10px] text-ink-500">{items.length}</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
      <p className="mt-2 px-1 text-[11px] text-ink-600">
        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" /> reunião ·{' '}
        <span className="mx-1 inline-block h-1.5 w-1.5 rounded-full bg-ink-500 align-middle" /> tarefa · toque num dia para ver
      </p>
    </div>
  )
}
