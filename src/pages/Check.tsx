import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { clsx } from 'clsx'
import { useStore } from '@/lib/store'
import { computeCheck } from '@/lib/check'
import { Card, Fade, PageHeader, ProgressBar, ScoreRing } from '@/components/ui'
import { scoreColor } from '@/lib/scoring'
import { todayISO } from '@/lib/utils'

/**
 * CHECK — avaliação automática. O app compara o que você PLANEJOU com o que
 * FEZ, por categoria da vida. Sem preencher formulário: só olhar e ajustar.
 */
export default function Check() {
  const store = useStore()
  const [period, setPeriod] = useState<'hoje' | 'semana'>('hoje')
  const today = todayISO()

  const result = useMemo(
    () =>
      computeCheck(period, {
        goals: store.goals,
        metas: store.metas,
        habits: store.habits,
        habitLog: store.habitLog,
        tasks: store.tasks,
        today,
      }),
    [period, store.goals, store.metas, store.habits, store.habitLog, store.tasks, today],
  )

  const periodTasks = store.tasks.filter(
    (t) => t.status !== 'backlog' && (period === 'hoje' ? t.date === today : true),
  )

  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-accent-soft">Check · Avaliar</p>
      <PageHeader
        title="Avaliação"
        subtitle="Planejado × feito, por categoria — calculado automaticamente. O que aprender aqui vira ajuste no seu próximo Plan."
      />

      <div className="mb-5 inline-flex rounded-xl border border-white/10 p-1">
        {(['hoje', 'semana'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={clsx(
              'rounded-lg px-5 py-1.5 text-sm font-medium capitalize transition',
              period === p ? 'bg-white/10 text-white' : 'text-ink-400 hover:text-ink-100',
            )}
          >
            {p === 'hoje' ? 'Hoje' : 'Semana'}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px,1fr]">
        {/* Resumo */}
        <Fade>
          <Card className="flex flex-col items-center gap-3 text-center">
            <p className="section-title">Conclusão</p>
            <ScoreRing value={result.pct} size={140} label="feito" />
            <p className="text-sm text-ink-400">
              {result.totalDone} de {result.totalPlanned} itens planejados
            </p>
            <div className="mt-1 flex w-full items-start gap-2 rounded-xl border border-accent/20 bg-accent/[0.06] p-3 text-left">
              <Sparkles size={15} className="mt-0.5 shrink-0 text-accent-soft" />
              <p className="text-sm text-ink-200">{result.read}</p>
            </div>
            <Link to="/plan" className="btn-ghost !px-0 text-accent-soft">
              Ajustar meu Plan <ArrowRight size={15} />
            </Link>
          </Card>
        </Fade>

        {/* Por categoria */}
        <Fade delay={0.05}>
          <Card>
            <p className="section-title mb-4">Por categoria</p>
            {result.areas.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-500">
                Nada planejado neste período. Marque hábitos no Action e crie tarefas no Kanban.
              </p>
            ) : (
              <div className="space-y-4">
                {result.areas.map((a) => (
                  <div key={a.area}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-ink-300">
                        {a.emoji} {a.label}
                      </span>
                      <span className="text-xs text-ink-500">
                        {a.done}/{a.planned} · <strong style={{ color: scoreColor(a.pct) }}>{a.pct}%</strong>
                      </span>
                    </div>
                    <ProgressBar value={a.pct} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Fade>
      </div>

      {/* Detalhe das tarefas do período */}
      <Fade delay={0.08}>
        <Card className="mt-4">
          <p className="section-title mb-3">Tarefas — {period === 'hoje' ? 'hoje' : 'na semana'}</p>
          {periodTasks.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink-500">Nenhuma tarefa neste período.</p>
          ) : (
            <div className="grid gap-1.5 sm:grid-cols-2">
              {periodTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-2.5 rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
                  {t.done ? (
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                  ) : (
                    <Circle size={16} className="shrink-0 text-ink-600" />
                  )}
                  <span className={clsx(t.done ? 'text-ink-500 line-through' : 'text-ink-200')}>{t.title}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Fade>
    </div>
  )
}
