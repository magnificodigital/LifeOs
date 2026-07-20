import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Star, Plus, Zap, Trophy, ArrowRight, Target, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { LIFE_AREAS, type LifeArea } from '@/lib/types'
import { levelInfo, totalXp, computeStreak, xpEarnedOn } from '@/lib/game'
import { computeGoalProgress } from '@/lib/scoring'
import { Card, Fade, ProgressBar } from '@/components/ui'
import { todayISO, brl } from '@/lib/utils'

export default function Today() {
  const store = useStore()
  const { habits, habitLog, tasks, goals, toggleHabit, toggleTask, addHabit } = store
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
  const priorityGoal = goals.find((g) => g.id === 'g-renda') ?? goals[0]
  const nextStep = priorityGoal?.steps.find((s) => !s.done)

  const [adding, setAdding] = useState(false)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div>
      {/* Guia rápido (dispensável) */}
      <Explainer />

      {/* Cabeçalho + nível */}
      <Fade>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{greeting} 👋</h1>
            <p className="text-sm text-ink-400">Um dia de cada vez. Complete suas missões e evolua.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/[0.08] px-3 py-2">
              <Flame size={18} className="text-amber-300" />
              <span className="text-lg font-bold text-white">{streak}</span>
              <span className="text-xs text-amber-200/70">dias</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-accent/20 bg-accent/[0.08] px-3 py-2">
              <Zap size={18} className="text-accent-soft" />
              <span className="text-lg font-bold text-white">{xp}</span>
              <span className="text-xs text-accent-soft/70">XP</span>
            </div>
          </div>
        </div>
      </Fade>

      {/* Barra de nível */}
      <Fade delay={0.04}>
        <Card className="mb-4 border-accent/20 bg-gradient-to-br from-accent/[0.1] to-transparent">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-xl font-bold text-white">
              {info.level}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline justify-between">
                <p className="font-semibold text-white">
                  Nível {info.level} · <span className="text-accent-soft">{info.title}</span>
                </p>
                <p className="text-xs text-ink-400">
                  {info.intoLevel} / {info.neededForNext} XP
                </p>
              </div>
              <div className="mt-2">
                <ProgressBar value={info.progress} color="#6366f1" />
              </div>
              <p className="mt-1.5 text-xs text-ink-500">
                Faltam <strong className="text-ink-300">{info.neededForNext - info.intoLevel} XP</strong> para o nível {info.level + 1}.
              </p>
            </div>
          </div>
        </Card>
      </Fade>

      {/* One Thing do dia */}
      {oneThing && (
        <Fade delay={0.06}>
          <button
            onClick={() => toggleTask(oneThing.id)}
            className={clsx(
              'card mb-4 flex w-full items-center gap-3 p-4 text-left transition',
              oneThing.done ? 'border-emerald-400/30 bg-emerald-400/[0.06]' : 'border-amber-400/30 bg-amber-400/[0.06]',
            )}
          >
            <div className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', oneThing.done ? 'bg-emerald-400/20 text-emerald-300' : 'bg-amber-400/20 text-amber-300')}>
              <Star size={18} fill="currentColor" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300/80">A única coisa (80/20)</p>
              <p className={clsx('font-semibold', oneThing.done ? 'text-ink-500 line-through' : 'text-white')}>{oneThing.title}</p>
            </div>
            <span className="chip bg-white/5 text-ink-400">+15 XP</span>
          </button>
        </Fade>
      )}

      {/* Missões / hábitos de hoje */}
      <Fade delay={0.08}>
        <Card className="mb-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="section-title">Missões de hoje</p>
              <p className="mt-0.5 text-xs text-ink-500">
                {doneCount} de {activeHabits.length} · +{earnedToday} XP hoje
              </p>
            </div>
            <button className="btn-ghost !px-2 !py-1.5 text-xs" onClick={() => setAdding((v) => !v)}>
              <Plus size={14} /> Hábito
            </button>
          </div>

          {allDone && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3 text-sm text-emerald-200">
              <Trophy size={16} /> Dia completo! Ofensiva mantida. 🔥
            </div>
          )}

          {adding && <AddHabit onAdd={(t, e, x, area) => { addHabit({ title: t, emoji: e, xp: x, area }); setAdding(false) }} onCancel={() => setAdding(false)} />}

          <div className="space-y-2">
            {activeHabits.map((h) => {
              const done = doneToday.includes(h.id)
              return (
                <motion.button
                  key={h.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleHabit(today, h.id)}
                  className={clsx(
                    'flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition',
                    done ? 'border-emerald-400/25 bg-emerald-400/[0.06]' : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.05]',
                  )}
                >
                  <div className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg transition', done ? 'bg-emerald-400/15' : 'bg-white/5')}>
                    {h.emoji}
                  </div>
                  <div className="flex-1">
                    <p className={clsx('text-sm font-medium', done ? 'text-ink-500 line-through' : 'text-ink-100')}>{h.title}</p>
                  </div>
                  <span className={clsx('chip shrink-0', done ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/5 text-ink-400')}>
                    {done ? '✓ ' : '+'}
                    {h.xp} XP
                  </span>
                </motion.button>
              )
            })}
            {activeHabits.length === 0 && (
              <p className="py-6 text-center text-sm text-ink-500">Nenhum hábito ainda. Adicione o primeiro acima.</p>
            )}
          </div>
        </Card>
      </Fade>

      {/* Agenda de hoje (reuniões e tarefas com horário) */}
      <TodaySchedule />

      {/* Objetivo prioritário — próximo passo */}
      {priorityGoal && (
        <Fade delay={0.1}>
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Target size={15} className="text-accent-soft" />
              <p className="section-title">Objetivo prioritário</p>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="font-semibold text-white">{priorityGoal.title}</p>
              <p className="text-sm font-semibold text-white">{computeGoalProgress(priorityGoal) ?? 0}%</p>
            </div>
            {priorityGoal.unit === 'R$/mês' && (
              <p className="mb-2 text-xs text-ink-500">{brl(priorityGoal.current ?? 0)} de {brl(priorityGoal.target ?? 0)} por mês</p>
            )}
            <ProgressBar value={computeGoalProgress(priorityGoal) ?? 0} />
            {nextStep && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/[0.03] p-3 text-sm">
                <Sparkles size={15} className="shrink-0 text-accent-soft" />
                <span className="text-ink-300">
                  Próximo passo: <strong className="text-white">{nextStep.title}</strong>
                </span>
              </div>
            )}
            <Link to="/plan" className="btn-ghost mt-2 !px-0 text-accent-soft">
              Ver plano completo <ArrowRight size={15} />
            </Link>
          </Card>
        </Fade>
      )}
    </div>
  )
}

/** Guia de 3 passos — some para sempre depois de dispensado. */
function Explainer() {
  const [hidden, setHidden] = useState(() => localStorage.getItem('lifeos-hint') === '1')
  if (hidden) return null
  return (
    <div className="mb-5 rounded-2xl border border-accent/20 bg-accent/[0.06] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm leading-relaxed text-ink-200">
          <p className="mb-1 font-semibold text-white">Como o LifeOS funciona (só isso):</p>
          <p>
            <strong className="text-accent-soft">1. Planejar</strong> — defina objetivos e escolha UM projeto para focar.{' '}
            <strong className="text-accent-soft">2. Hoje</strong> — execute as missões e tarefas do dia.{' '}
            <strong className="text-accent-soft">3. Evolução</strong> — veja o que funcionou e ajuste.
          </p>
          <p className="mt-1 text-ink-400">O STARK te acompanha em tudo. O resto é detalhe.</p>
        </div>
        <button
          className="btn-ghost shrink-0 !px-2 !py-1 text-xs"
          onClick={() => {
            localStorage.setItem('lifeos-hint', '1')
            setHidden(true)
          }}
        >
          Entendi ✓
        </button>
      </div>
    </div>
  )
}

/** Compromissos de hoje: reuniões e tarefas com horário. */
function TodaySchedule() {
  const { tasks, projects } = useStore()
  const today = todayISO()
  const items = tasks
    .filter((t) => t.date === today && (t.time || t.kind === 'reuniao'))
    .sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'))
  if (items.length === 0) return null
  const projTitle = (id?: string) => projects.find((p) => p.id === id)?.title
  return (
    <Fade delay={0.09}>
      <Card className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="section-title">Agenda de hoje</p>
          <Link to="/agenda" className="text-xs text-accent-soft hover:underline">
            ver semana →
          </Link>
        </div>
        <div className="space-y-1.5">
          {items.map((t) => (
            <div key={t.id} className={clsx('flex items-center gap-3 rounded-xl px-3 py-2 text-sm', t.kind === 'reuniao' ? 'border border-accent/25 bg-accent/[0.08]' : 'bg-white/[0.03]')}>
              <span className={clsx('w-12 shrink-0 font-semibold', t.kind === 'reuniao' ? 'text-accent-soft' : 'text-ink-400')}>
                {t.time ?? '—'}
              </span>
              <span className={clsx('flex-1', t.done ? 'text-ink-500 line-through' : 'text-ink-100')}>{t.title}</span>
              {projTitle(t.projectId) && <span className="hidden text-[11px] text-ink-600 sm:block">{projTitle(t.projectId)}</span>}
            </div>
          ))}
        </div>
      </Card>
    </Fade>
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
