import { useState } from 'react'
import { Plus, Target, Trash2, Sparkles } from 'lucide-react'
import { useStore } from '@/lib/store'
import { LIFE_AREAS, type LifeArea } from '@/lib/types'
import { computeGoalProgress } from '@/lib/scoring'
import { Card, Fade, PageHeader, ProgressBar, Empty } from '@/components/ui'
import { brl, formatDatePt } from '@/lib/utils'

export default function Goals() {
  const { goals, addGoal, removeGoal } = useStore()
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
          {goals.map((g, i) => {
            const area = LIFE_AREAS.find((a) => a.key === g.area)
            const prog = computeGoalProgress(g)
            return (
              <Fade key={g.id} delay={i * 0.04}>
                <Card hover className="group">
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
                        <span className="text-ink-400">
                          {g.unit === 'R$'
                            ? `${brl(g.current ?? 0)} / ${brl(g.target ?? 0)}`
                            : `${g.current} / ${g.target} ${g.unit ?? ''}`}
                        </span>
                        <span className="font-semibold text-white">{prog}%</span>
                      </div>
                      <ProgressBar value={prog} />
                    </div>
                  )}

                  {g.deadline && (
                    <p className="mt-3 text-xs text-ink-500">Prazo: {formatDatePt(g.deadline)}</p>
                  )}

                  {g.nextSteps.length > 0 && (
                    <div className="mt-4 rounded-xl bg-white/[0.03] p-3">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-accent-soft">
                        <Sparkles size={13} /> IA sugere
                      </p>
                      <ul className="space-y-1.5 text-sm text-ink-300">
                        {g.nextSteps.map((s, j) => (
                          <li key={j} className="flex gap-2">
                            <Target size={14} className="mt-0.5 shrink-0 text-ink-600" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              </Fade>
            )
          })}
        </div>
      )}
    </div>
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
          <label className="label">Próximos passos (um por linha)</label>
          <textarea className="input min-h-[70px]" value={steps} onChange={(e) => setSteps(e.target.value)} />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          className="btn-primary"
          disabled={!title.trim()}
          onClick={() => {
            onAdd({
              title: title.trim(),
              area,
              unit: unit || undefined,
              current: current ? Number(current) : undefined,
              target: target ? Number(target) : undefined,
              direction: unit.toLowerCase() === 'kg' ? 'down' : 'up',
              deadline: deadline || undefined,
              nextSteps: steps.split('\n').map((s) => s.trim()).filter(Boolean),
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
