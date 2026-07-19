// ============================================================================
// CHECK automático — planejado × feito, por categoria da vida.
// Sem formulário: o app lê seus hábitos e tarefas e monta a avaliação sozinho.
// (Ray Dalio: dor + reflexão = progresso; aqui a "reflexão" já vem calculada.)
// ============================================================================
import { LIFE_AREAS, type Goal, type Habit, type HabitLog, type LifeArea, type Meta, type Task } from './types'

export interface CheckArea {
  area: LifeArea
  label: string
  emoji: string
  planned: number
  done: number
  pct: number
}

export interface CheckResult {
  period: 'hoje' | 'semana'
  areas: CheckArea[]
  totalPlanned: number
  totalDone: number
  pct: number
  read: string
}

export interface CheckInput {
  goals: Goal[]
  metas: Meta[]
  habits: Habit[]
  habitLog: HabitLog
  tasks: Task[]
  today: string
}

function lastDays(today: string, n: number): string[] {
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const d = new Date(today + 'T00:00:00')
    d.setDate(d.getDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

/** Área de uma tarefa via meta → objetivo. */
function taskArea(t: Task, metas: Meta[], goals: Goal[]): LifeArea | null {
  if (!t.metaId) return null
  const meta = metas.find((m) => m.id === t.metaId)
  if (!meta?.goalId) return null
  return goals.find((g) => g.id === meta.goalId)?.area ?? null
}

export function computeCheck(period: 'hoje' | 'semana', input: CheckInput): CheckResult {
  const days = lastDays(input.today, period === 'hoje' ? 1 : 7)
  const active = input.habits.filter((h) => h.active)

  const per: Record<string, { planned: number; done: number }> = {}
  const bump = (area: LifeArea | null, planned: number, done: number) => {
    const key = area ?? 'produtividade'
    per[key] = per[key] ?? { planned: 0, done: 0 }
    per[key].planned += planned
    per[key].done += done
  }

  // Hábitos: planejado = 1 por dia por hábito ativo; feito = registrado no dia.
  for (const day of days) {
    const doneIds = new Set(input.habitLog[day] ?? [])
    for (const h of active) bump(h.area, 1, doneIds.has(h.id) ? 1 : 0)
  }

  // Tarefas no período: planejado = existe; feito = status "feito".
  const inPeriod = new Set(days)
  for (const t of input.tasks) {
    if (t.status === 'backlog') continue
    if (!inPeriod.has(t.date)) continue
    bump(taskArea(t, input.metas, input.goals), 1, t.status === 'feito' ? 1 : 0)
  }

  const areas: CheckArea[] = LIFE_AREAS.filter((a) => per[a.key] && per[a.key].planned > 0).map((a) => {
    const { planned, done } = per[a.key]
    return { area: a.key, label: a.label, emoji: a.emoji, planned, done, pct: Math.round((done / planned) * 100) }
  })

  const totalPlanned = areas.reduce((s, a) => s + a.planned, 0)
  const totalDone = areas.reduce((s, a) => s + a.done, 0)
  const pct = totalPlanned ? Math.round((totalDone / totalPlanned) * 100) : 0

  const weakest = [...areas].sort((a, b) => a.pct - b.pct)[0]
  const strongest = [...areas].sort((a, b) => b.pct - a.pct)[0]
  const label = period === 'hoje' ? 'hoje' : 'esta semana'

  let read: string
  if (totalPlanned === 0) {
    read = `Nada planejado ${label} ainda. Adicione hábitos e tarefas para o STARK avaliar seu ritmo.`
  } else if (pct >= 80) {
    read = `Execução forte ${label}: ${pct}% do planejado concluído.${strongest ? ` Destaque em ${strongest.label}.` : ''} Mantenha os sistemas — é assim que se constrói.`
  } else if (pct >= 50) {
    read = `Ritmo mediano ${label} (${pct}%).${weakest ? ` O elo mais fraco é ${weakest.label} (${weakest.pct}%).` : ''} Ajuste esse ponto no próximo Plan.`
  } else {
    read = `Atenção: só ${pct}% do planejado saiu ${label}.${weakest ? ` ${weakest.label} está travando (${weakest.pct}%).` : ''} Menos, porém melhor — corte o excesso e proteja o essencial.`
  }

  return { period, areas, totalPlanned, totalDone, pct, read }
}
