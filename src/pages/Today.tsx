import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Flame, Star, Plus, Zap, Trophy, ArrowRight, Sparkles, Clock, Video,
  Trash2, ChevronUp, ChevronDown, Settings2,
} from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { LIFE_AREAS, type Habit, type LifeArea } from '@/lib/types'
import { levelInfo, totalXp, computeStreak, xpEarnedOn } from '@/lib/game'
import { computeGoalProgress } from '@/lib/scoring'
import { Card, Fade, ProgressBar } from '@/components/ui'
import { todayISO, brl } from '@/lib/utils'

export default function Today() {
  const store = useStore()
  const { habits, habitLog, tasks, projects, goals, toggleTask, addTask } = store
  const today = todayISO()
  const doneToday = habitLog[today] ?? []

  const xp = useMemo(() => totalXp(habits, habitLog, tasks), [habits, habitLog, tasks])
  const info = useMemo(() => levelInfo(xp), [xp])
  const streak = useMemo(() => computeStreak(habitLog, today), [habitLog, today])
  const earnedToday = xpEarnedOn(today, habits, habitLog)

  const activeHabits = habits.filter((h) => h.active)
  const doneCount = activeHabits.filter((h) => doneToday.includes(h.id)).length
  const allDone = doneCount === activeHabits.length && activeHabits.length > 0

  const oneThing = tasks.find((t) => t.date === today && t.isOneThing)
  const compromissos = tasks
    .filter((t) => t.date === today && (t.time || t.kind === 'reuniao'))
    .sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'))
  const todayTasks = tasks.filter(
    (t) => t.date === today && !t.isOneThing && !t.time && t.kind !== 'reuniao',
  )
  const priorityGoal = goals.find((g) => g.id === 'g-renda') ?? goals[0]
  const nextStep = priorityGoal?.steps.find((s) => !s.done)
  const projTitle = (id?: string) => projects.find((p) => p.id === id)?.title

  const [newTask, setNewTask] = useState('')
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  // Monta a sequência do dia dinamicamente (só entra o que existe).
  const steps: { title: string; hint?: string; node: ReactNode }[] = []

  // 1. A única coisa
  steps.push({
    title: 'A única coisa',
    hint: 'Comece por aqui — é a tarefa que produz 80% do resultado',
    node: oneThing ? (
      <button
        onClick={() => toggleTask(oneThing.id)}
        className={clsx(
          'flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition',
          oneThing.done ? 'border-emerald-400/30 bg-emerald-400/[0.06]' : 'border-amber-400/30 bg-amber-400/[0.06]',
        )}
      >
        <div className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', oneThing.done ? 'bg-emerald-400/20 text-emerald-300' : 'bg-amber-400/20 text-amber-300')}>
          <Star size={16} fill="currentColor" />
        </div>
        <span className={clsx('flex-1 font-semibold', oneThing.done ? 'text-ink-500 line-through' : 'text-white')}>{oneThing.title}</span>
        <span className="chip bg-white/5 text-ink-400">+15 XP</span>
      </button>
    ) : (
      <p className="text-sm text-ink-400">
        Nenhuma tarefa marcada como a Única Coisa.{' '}
        <Link to="/planejar" className="text-accent-soft">
          Escolha um foco no Planejar →
        </Link>
      </p>
    ),
  })

  // 2. Compromissos (com hora)
  if (compromissos.length > 0) {
    steps.push({
      title: 'Compromissos',
      hint: 'Reuniões e blocos com hora marcada',
      node: (
        <div className="space-y-1.5">
          {compromissos.map((t) => (
            <button
              key={t.id}
              onClick={() => toggleTask(t.id)}
              className={clsx('flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition', t.kind === 'reuniao' ? 'border border-accent/25 bg-accent/[0.08]' : 'bg-white/[0.03] hover:bg-white/[0.05]')}
            >
              <span className={clsx('flex w-14 shrink-0 items-center gap-1 font-semibold', t.kind === 'reuniao' ? 'text-accent-soft' : 'text-ink-400')}>
                {t.kind === 'reuniao' ? <Video size={12} /> : <Clock size={12} />} {t.time ?? '—'}
              </span>
              <span className={clsx('flex-1', t.done ? 'text-ink-500 line-through' : 'text-ink-100')}>{t.title}</span>
              {projTitle(t.projectId) && <span className="hidden text-[11px] text-ink-600 sm:block">{projTitle(t.projectId)}</span>}
            </button>
          ))}
        </div>
      ),
    })
  }

  // 3. Tarefas de hoje (dos projetos, sem hora)
  steps.push({
    title: 'Tarefas de hoje',
    hint: 'O que precisa sair hoje, dos seus projetos',
    node: (
      <div>
        <div className="space-y-1.5">
          {todayTasks.map((t) => (
            <div key={t.id} className="group flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2">
              <button
                onClick={() => toggleTask(t.id)}
                className={clsx('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs', t.done ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300' : 'border-white/20')}
              >
                {t.done && '✓'}
              </button>
              <span className={clsx('flex-1 text-sm', t.done ? 'text-ink-500 line-through' : 'text-ink-100')}>{t.title}</span>
              {projTitle(t.projectId) && <span className="text-[11px] text-ink-600">{projTitle(t.projectId)}</span>}
            </div>
          ))}
          {todayTasks.length === 0 && (
            <p className="py-2 text-center text-sm text-ink-500">Nada para hoje. Adicione abaixo ou puxe do Kanban.</p>
          )}
        </div>
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!newTask.trim()) return
            addTask({ title: newTask.trim(), status: 'hoje', date: today })
            setNewTask('')
          }}
        >
          <input className="input !py-1.5 text-sm" placeholder="Adicionar tarefa para hoje..." value={newTask} onChange={(e) => setNewTask(e.target.value)} />
          <button className="btn-outline shrink-0 !px-2.5 !py-1.5" type="submit">
            <Plus size={15} />
          </button>
        </form>
      </div>
    ),
  })

  // 4. Hábitos
  steps.push({
    title: 'Hábitos',
    hint: `Repita todo dia — ${doneCount}/${activeHabits.length} feitos · +${earnedToday} XP`,
    node: <HabitsBlock allDone={allDone} />,
  })

  return (
    <div>
      <Explainer />

      {/* Cabeçalho + ofensiva/XP */}
      <Fade>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{greeting} 👋</h1>
            <p className="text-sm text-ink-400">Seu dia, em ordem. Faça de cima para baixo.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/[0.08] px-3 py-2">
              <Flame size={18} className="text-amber-300" />
              <span className="text-lg font-bold text-white">{streak}</span>
              <span className="text-xs text-amber-200/70">dias</span>
            </div>
            <Link to="/evolucao" className="flex items-center gap-1.5 rounded-xl border border-accent/20 bg-accent/[0.08] px-3 py-2">
              <Zap size={18} className="text-accent-soft" />
              <span className="text-lg font-bold text-white">{xp}</span>
              <span className="text-xs text-accent-soft/70">XP</span>
            </Link>
          </div>
        </div>
      </Fade>

      {/* Barra de nível compacta */}
      <Fade delay={0.03}>
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-accent/15 bg-accent/[0.06] px-4 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">{info.level}</div>
          <div className="flex-1">
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="font-semibold text-white">Nível {info.level} · {info.title}</span>
              <span className="text-ink-400">faltam {info.neededForNext - info.intoLevel} XP</span>
            </div>
            <ProgressBar value={info.progress} color="#6366f1" />
          </div>
        </div>
      </Fade>

      {/* A sequência do dia — numerada */}
      <div className="space-y-4">
        {steps.map((s, i) => (
          <Fade key={s.title} delay={0.05 + i * 0.04}>
            <Card>
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white">{i + 1}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{s.title}</p>
                  {s.hint && <p className="text-[11px] text-ink-500">{s.hint}</p>}
                </div>
              </div>
              {s.node}
            </Card>
          </Fade>
        ))}
      </div>

      {/* Objetivo prioritário */}
      {priorityGoal && (
        <Fade delay={0.05 + steps.length * 0.04}>
          <Card className="mt-4 border-white/10 bg-white/[0.02]">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Rumo a: {priorityGoal.title}</p>
              <p className="text-sm font-semibold text-white">{computeGoalProgress(priorityGoal) ?? 0}%</p>
            </div>
            {priorityGoal.unit === 'R$/mês' && (
              <p className="text-xs text-ink-500">{brl(priorityGoal.current ?? 0)} de {brl(priorityGoal.target ?? 0)} por mês</p>
            )}
            <div className="mt-2">
              <ProgressBar value={computeGoalProgress(priorityGoal) ?? 0} />
            </div>
            {nextStep && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-300">
                <Sparkles size={13} className="text-accent-soft" /> Próximo passo: <strong className="text-white">{nextStep.title}</strong>
              </p>
            )}
            <Link to="/planejar" className="btn-ghost mt-1 !px-0 text-sm text-accent-soft">
              Ver plano completo <ArrowRight size={14} />
            </Link>
          </Card>
        </Fade>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bloco de hábitos: marcar (normal) ou gerenciar (editar/reordenar/excluir).
// ---------------------------------------------------------------------------
function HabitsBlock({ allDone }: { allDone: boolean }) {
  const { habits, habitLog, toggleHabit, addHabit, updateHabit, removeHabit, moveHabit } = useStore()
  const today = todayISO()
  const doneToday = habitLog[today] ?? []
  const active = habits.filter((h) => h.active)
  const [mode, setMode] = useState<'marcar' | 'gerenciar'>('marcar')
  const [adding, setAdding] = useState(false)

  return (
    <div>
      <div className="mb-2 flex justify-end gap-1.5">
        <button className={clsx('btn-ghost !px-2 !py-1 text-xs', mode === 'gerenciar' && 'text-accent-soft')} onClick={() => setMode(mode === 'marcar' ? 'gerenciar' : 'marcar')}>
          <Settings2 size={13} /> {mode === 'marcar' ? 'Gerenciar' : 'Concluir'}
        </button>
        <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => setAdding((v) => !v)}>
          <Plus size={13} /> Hábito
        </button>
      </div>

      {allDone && mode === 'marcar' && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3 text-sm text-emerald-200">
          <Trophy size={16} /> Dia completo! Ofensiva mantida. 🔥
        </div>
      )}

      {adding && <AddHabit onAdd={(t, e, x, area) => { addHabit({ title: t, emoji: e, xp: x, area }); setAdding(false) }} onCancel={() => setAdding(false)} />}

      <div className="space-y-2">
        {active.map((h, i) =>
          mode === 'marcar' ? (
            <motion.button
              key={h.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleHabit(today, h.id)}
              className={clsx(
                'flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition',
                doneToday.includes(h.id) ? 'border-emerald-400/25 bg-emerald-400/[0.06]' : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.05]',
              )}
            >
              <div className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base', doneToday.includes(h.id) ? 'bg-emerald-400/15' : 'bg-white/5')}>{h.emoji}</div>
              <span className={clsx('flex-1 text-sm font-medium', doneToday.includes(h.id) ? 'text-ink-500 line-through' : 'text-ink-100')}>{h.title}</span>
              <span className={clsx('chip shrink-0', doneToday.includes(h.id) ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/5 text-ink-400')}>
                {doneToday.includes(h.id) ? '✓ ' : '+'}
                {h.xp} XP
              </span>
            </motion.button>
          ) : (
            <HabitEditRow key={h.id} habit={h} first={i === 0} last={i === active.length - 1} onUpdate={(p) => updateHabit(h.id, p)} onRemove={() => removeHabit(h.id)} onMove={(d) => moveHabit(h.id, d)} />
          ),
        )}
        {active.length === 0 && <p className="py-4 text-center text-sm text-ink-500">Nenhum hábito ainda. Adicione o primeiro.</p>}
      </div>
    </div>
  )
}

function HabitEditRow({
  habit: h,
  first,
  last,
  onUpdate,
  onRemove,
  onMove,
}: {
  habit: Habit
  first: boolean
  last: boolean
  onUpdate: (patch: Partial<Habit>) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const [title, setTitle] = useState(h.title)
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-2 py-2">
      <div className="flex flex-col">
        <button onClick={() => onMove(-1)} disabled={first} className="text-ink-500 hover:text-ink-200 disabled:opacity-20">
          <ChevronUp size={14} />
        </button>
        <button onClick={() => onMove(1)} disabled={last} className="text-ink-500 hover:text-ink-200 disabled:opacity-20">
          <ChevronDown size={14} />
        </button>
      </div>
      <input className="input !w-12 !px-1 text-center text-base" value={h.emoji} onChange={(e) => onUpdate({ emoji: e.target.value.slice(0, 2) })} />
      <input
        className="input flex-1 !py-1.5 text-sm"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title.trim() && title !== h.title && onUpdate({ title: title.trim() })}
      />
      <select className="input !w-20 !py-1.5 text-xs" value={h.xp} onChange={(e) => onUpdate({ xp: Number(e.target.value) })}>
        {[5, 10, 15, 20, 25].map((v) => (
          <option key={v} value={v}>
            {v} XP
          </option>
        ))}
      </select>
      <button onClick={() => confirm(`Excluir o hábito "${h.title}"?`) && onRemove()} className="text-ink-600 hover:text-red-400">
        <Trash2 size={15} />
      </button>
    </div>
  )
}

/** Guia de 3 passos — some para sempre depois de dispensado. */
function Explainer() {
  const [hidden, setHidden] = useState(() => localStorage.getItem('lifeos-hint') === '2')
  if (hidden) return null
  return (
    <div className="mb-5 rounded-2xl border border-accent/20 bg-accent/[0.06] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm leading-relaxed text-ink-200">
          <p className="mb-1 font-semibold text-white">Onde fica cada coisa:</p>
          <p>
            <strong className="text-accent-soft">Hoje</strong> — o que fazer agora, de cima para baixo.{' '}
            <strong className="text-accent-soft">Planejar</strong> — seus objetivos e projetos (onde as tarefas nascem).{' '}
            <strong className="text-accent-soft">Agenda</strong> — tudo no calendário.{' '}
            <strong className="text-accent-soft">Evolução</strong> — como foi e o que ajustar.
          </p>
          <p className="mt-1 text-ink-400">As tarefas são as mesmas em todo lugar — só mudam de vista. Peça ajuda ao STARK quando travar.</p>
        </div>
        <button
          className="btn-ghost shrink-0 !px-2 !py-1 text-xs"
          onClick={() => {
            localStorage.setItem('lifeos-hint', '2')
            setHidden(true)
          }}
        >
          Entendi ✓
        </button>
      </div>
    </div>
  )
}

function AddHabit({
  onAdd,
  onCancel,
}: {
  onAdd: (title: string, emoji: string, xp: number, area: LifeArea) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('✅')
  const [xp, setXp] = useState(10)
  const [area, setArea] = useState<LifeArea>('saude')
  return (
    <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex gap-2">
        <input className="input !w-16 text-center text-lg" value={emoji} onChange={(e) => setEmoji(e.target.value.slice(0, 2))} />
        <input className="input" placeholder="Novo hábito..." value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      </div>
      <div className="mt-2 flex gap-2">
        <select className="input" value={area} onChange={(e) => setArea(e.target.value as LifeArea)}>
          {LIFE_AREAS.map((a) => (
            <option key={a.key} value={a.key}>
              {a.emoji} {a.label}
            </option>
          ))}
        </select>
        <select className="input !w-28" value={xp} onChange={(e) => setXp(Number(e.target.value))}>
          {[5, 10, 15, 20, 25].map((v) => (
            <option key={v} value={v}>
              +{v} XP
            </option>
          ))}
        </select>
      </div>
      <div className="mt-2 flex gap-2">
        <button className="btn-primary !py-1.5 text-sm" disabled={!title.trim()} onClick={() => onAdd(title.trim(), emoji || '✅', xp, area)}>
          Adicionar
        </button>
        <button className="btn-ghost !py-1.5 text-sm" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
