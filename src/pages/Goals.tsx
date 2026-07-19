import { useState } from 'react'
import { Plus, Trash2, Sparkles, Pencil } from 'lucide-react'
import { clsx } from 'clsx'
import { useStore } from '@/lib/store'
import { LIFE_AREAS, type Goal, type LifeArea } from '@/lib/types'
import { computeGoalProgress } from '@/lib/scoring'
import { Card, Fade, PageHeader, ProgressBar, Empty } from '@/components/ui'
import { brl, formatDatePt, uid } from '@/lib/utils'

export default function Goals() {
  const { goals, addGoal } = useStore()
  const [open, setOpen] = useState(false)

  return (
    <div>
      <PageHeader
        title="Objetivos"
        subtitle="Seu horizonte de 10 anos. Objetivos são a bússola — sem eles, toda prioridade é chute."
        action={
          <button className="btn-primary" onClick={() => setOpen((v) => !v)}>
            <Plus size={16} /> Novo objetivo
          </button>
        }
      />

      {open && <GoalForm onDone={() => setOpen(false)} onAdd={addGoal} />}

      {goals.length === 0 ? (
        <Empty>Nenhum objetivo ainda. Comece definindo para onde você quer levar sua vida.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g, i) => (
            <Fade key={g.id} delay={i * 0.04}>
              <GoalCard goal={g} />
            </Fade>
          ))}
        </div>
      )}
    </div>
  )
}

function GoalCard({ goal: g }: { goal: Goal }) {
  const { removeGoal, updateGoal, addGoalStep, toggleGoalStep, removeGoalStep } = useStore()
  const area = LIFE_AREAS.find((a) => a.key === g.area)
  const prog = computeGoalProgress(g)
  const [newStep, setNewStep] = useState('')
  const [editVal, setEditVal] = useState(false)
  const [val, setVal] = useState(String(g.current ?? ''))
  const isMoney = g.unit?.startsWith('R$')
  const stepsDone = g.steps.filter((s) => s.done).length

  const metricText =
    g.current === undefined || g.target === undefined
      ? null
      : isMoney
        ? `${brl(g.current)} / ${brl(g.target)}`
        : g.direction === 'down'
          ? `Faltam ${g.current} ${g.unit ?? ''}`
          : `${g.current} / ${g.target} ${g.unit ?? ''}`

  return (
    <Card hover className="group flex flex-col">
      <div className="flex items-start justify-between">
        <span className="chip bg-white/5 text-ink-300">
          {area?.emoji} {area?.label}
        </span>
        <button
          onClick={() => removeGoal(g.id)}
          className="text-ink-600 opacity-0 transition group-hover:opacity-100 hover:text-red-400"
        >
          <Trash2 size={15} />
        </button>
      </div>
      <h3 className="mt-2 text-lg font-semibold text-white">{g.title}</h3>
      {g.description && <p className="mt-1 text-sm text-ink-400">{g.description}</p>}

      {prog !== null && (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-sm">
            <button className="text-ink-300 hover:text-white" onClick={() => setEditVal((v) => !v)} title="Atualizar valor atual">
              {metricText} <Pencil size={11} className="ml-1 inline opacity-50" />
            </button>
            <span className="font-semibold text-white">{prog}%</span>
          </div>
          <ProgressBar value={prog} />
          {editVal && (
            <div className="mt-2 flex gap-2">
              <input
                className="input !py-1.5"
                type="number"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                placeholder={g.direction === 'down' ? `${g.unit} restantes` : `valor atual (${g.unit})`}
                autoFocus
              />
              <button
                className="btn-primary !py-1.5"
                onClick={() => {
                  updateGoal(g.id, { current: Number(val) })
                  setEditVal(false)
                }}
              >
                Salvar
              </button>
            </div>
          )}
        </div>
      )}

      {g.deadline && <p className="mt-3 text-xs text-ink-500">Prazo: {formatDatePt(g.deadline)}</p>}

      {/* Plano de ação rastreável */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Plano de ação</p>
          <span className="text-[11px] text-ink-600">
            {stepsDone}/{g.steps.length}
          </span>
        </div>
        <div className="space-y-1">
          {g.steps.map((s) => (
            <div key={s.id} className="group/step flex items-center gap-2.5 rounded-lg px-1 py-1">
              <button
                onClick={() => toggleGoalStep(g.id, s.id)}
                className={clsx(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]',
                  s.done ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300' : 'border-white/20',
                )}
              >
                {s.done && '✓'}
              </button>
              <span className={clsx('flex-1 text-sm', s.done ? 'text-ink-500 line-through' : 'text-ink-200')}>{s.title}</span>
              <button
                onClick={() => removeGoalStep(g.id, s.id)}
                className="text-ink-700 opacity-0 transition group-hover/step:opacity-100 hover:text-red-400"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!newStep.trim()) return
            addGoalStep(g.id, newStep.trim())
            setNewStep('')
          }}
        >
          <input className="input !py-1.5 text-sm" placeholder="Adicionar passo..." value={newStep} onChange={(e) => setNewStep(e.target.value)} />
          <button className="btn-outline !px-2.5 !py-1.5" type="submit">
            <Plus size={15} />
          </button>
        </form>
      </div>

      {g.nextSteps.length > 0 && (
        <div className="mt-4 rounded-xl bg-white/[0.03] p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-accent-soft">
            <Sparkles size={13} /> Dica da IA
          </p>
          <ul className="space-y-1.5 text-sm text-ink-300">
            {g.nextSteps.map((s, j) => (
              <li key={j}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

function GoalForm({
  onDone,
  onAdd,
}: {
  onDone: () => void
  onAdd: ReturnType<typeof useStore.getState>['addGoal']
}) {
  const [title, setTitle] = useState('')
  const [area, setArea] = useState<LifeArea>('financas')
  const [current, setCurrent] = useState('')
  const [target, setTarget] = useState('')
  const [unit, setUnit] = useState('R$')
  const [deadline, setDeadline] = useState('')
  const [steps, setSteps] = useState('')

  return (
    <Card className="mb-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Objetivo</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Patrimônio de R$ 10 milhões" />
        </div>
        <div>
          <label className="label">Área</label>
          <select className="input" value={area} onChange={(e) => setArea(e.target.value as LifeArea)}>
            {LIFE_AREAS.map((a) => (
              <option key={a.key} value={a.key}>
                {a.emoji} {a.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Unidade</label>
          <input className="input" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="R$, kg..." />
        </div>
        <div>
          <label className="label">Valor atual</label>
          <input className="input" type="number" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div>
          <label className="label">Meta</label>
          <input className="input" type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>
        <div>
          <label className="label">Prazo</label>
          <input className="input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Plano de ação (um passo por linha)</label>
          <textarea className="input min-h-[70px]" value={steps} onChange={(e) => setSteps(e.target.value)} placeholder={'Ex.:\nDefinir a oferta\nConseguir 3 clientes\nEscalar'} />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          className="btn-primary"
          disabled={!title.trim()}
          onClick={() => {
            const cur = current ? Number(current) : undefined
            onAdd({
              title: title.trim(),
              area,
              unit: unit || undefined,
              current: cur,
              baseline: cur ?? 0,
              target: target ? Number(target) : undefined,
              direction: unit.toLowerCase() === 'kg' ? 'down' : 'up',
              deadline: deadline || undefined,
              steps: steps.split('\n').map((s) => s.trim()).filter(Boolean).map((t) => ({ id: uid(), title: t, done: false })),
              nextSteps: [],
            })
            onDone()
          }}
        >
          Criar objetivo
        </button>
        <button className="btn-ghost" onClick={onDone}>
          Cancelar
        </button>
      </div>
    </Card>
  )
}
