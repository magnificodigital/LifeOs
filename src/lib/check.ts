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

// ---------------------------------------------------------------------------
// Fechamento do ciclo: Check → ajustes concretos para o próximo Plan.
// (Dalio: dor + reflexão = progresso. Aqui a reflexão vira ação.)
// ---------------------------------------------------------------------------
export interface PlanAdjustment {
  emoji: string
  text: string
}

export function suggestPlanAdjustments(result: CheckResult, input: CheckInput): PlanAdjustment[] {
  const out: PlanAdjustment[] = []
  const weakest = [...result.areas].sort((a, b) => a.pct - b.pct)[0]
  const strongest = [...result.areas].sort((a, b) => b.pct - a.pct)[0]

  if (result.totalPlanned === 0) {
    return [{ emoji: '🗺️', text: 'Nada planejado neste período. Comece pequeno: 3 hábitos e 1 tarefa por dia já geram sinal para eu avaliar.' }]
  }

  // Área mais fraca → ajuste direto.
  if (weakest && weakest.pct < 60) {
    const habitsInArea = input.habits.filter((h) => h.active && h.area === weakest.area)
    if (habitsInArea.length > 1) {
      out.push({
        emoji: weakest.emoji,
        text: `${weakest.label} travou (${weakest.pct}%). Reduza para UM hábito dessa área até estabilizar — consistência antes de volume.`,
      })
    } else {
      out.push({
        emoji: weakest.emoji,
        text: `${weakest.label} ficou em ${weakest.pct}%. Troque o horário ou reduza a dificuldade do hábito (ex.: 10 min em vez de 1h) — o sistema deve caber no seu pior dia.`,
      })
    }
  }

  // Excesso de planejamento generalizado.
  if (result.pct < 50 && result.totalPlanned >= 8) {
    out.push({
      emoji: '✂️',
      text: `Você planejou ${result.totalPlanned} itens e concluiu ${result.totalDone}. O plano está maior que o dia. Corte 30% — menos, porém melhor.`,
    })
  }

  // Tarefas paradas em "fazendo".
  const stuck = input.tasks.filter((t) => t.status === 'fazendo').length
  if (stuck >= 3) {
    out.push({
      emoji: '🚧',
      text: `${stuck} tarefas estão paradas em "Fazendo". Trabalho em progresso demais é fila disfarçada — termine uma antes de puxar outra.`,
    })
  }

  // Reforço do que funciona.
  if (strongest && strongest.pct >= 80 && strongest !== weakest) {
    out.push({
      emoji: strongest.emoji,
      text: `${strongest.label} está forte (${strongest.pct}%). O que essa rotina tem que as outras não têm? Copie o formato (mesmo horário/gatilho) para a área mais fraca.`,
    })
  }

  // Execução forte → subir a régua.
  if (result.pct >= 85) {
    out.push({
      emoji: '📈',
      text: 'Execução acima de 85%. Hora de subir a régua: aumente a dificuldade de UM hábito ou adicione o próximo passo do seu objetivo prioritário ao Kanban.',
    })
  }

  if (out.length === 0) {
    out.push({ emoji: '✅', text: 'Ritmo saudável — nenhum ajuste estrutural necessário. Mantenha o sistema rodando e reavalie na próxima semana.' })
  }
  return out
}
