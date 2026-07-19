// ============================================================================
// Gamificação — XP, níveis, ofensiva (streak) e conquistas.
// A ideia: transformar "preencher formulário" em "jogar a sua própria vida".
// ============================================================================
import type { Goal, Habit, HabitLog, Task } from './types'

// ---------------------------------------------------------------------------
// Níveis
// ---------------------------------------------------------------------------
/** XP acumulado necessário para atingir um nível (curva suave e crescente). */
export function xpForLevel(level: number): number {
  // Nível 1 = 0 XP; cada nível pede um pouco mais que o anterior.
  return Math.round(50 * (level - 1) * level) // 0, 100, 300, 600, 1000, 1500...
}

export function levelForXp(xp: number): number {
  let level = 1
  while (xpForLevel(level + 1) <= xp) level++
  return level
}

export interface LevelInfo {
  level: number
  title: string
  xp: number
  intoLevel: number // XP dentro do nível atual
  neededForNext: number // XP total do nível atual até o próximo
  progress: number // 0–100
}

const LEVEL_TITLES = [
  'Iniciante', 'Aprendiz', 'Consistente', 'Focado', 'Executor',
  'Estrategista', 'Construtor', 'Imparável', 'Mestre', 'Titã',
]

export function levelInfo(xp: number): LevelInfo {
  const level = levelForXp(xp)
  const base = xpForLevel(level)
  const next = xpForLevel(level + 1)
  const intoLevel = xp - base
  const neededForNext = next - base
  return {
    level,
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)],
    xp,
    intoLevel,
    neededForNext,
    progress: Math.round((intoLevel / neededForNext) * 100),
  }
}

// ---------------------------------------------------------------------------
// XP total
// ---------------------------------------------------------------------------
export function totalXp(habits: Habit[], log: HabitLog, tasks: Task[]): number {
  const xpById = new Map(habits.map((h) => [h.id, h.xp]))
  let xp = 0
  for (const ids of Object.values(log)) {
    for (const id of ids) xp += xpById.get(id) ?? 0
  }
  // Tarefas concluídas valem XP fixo (execução conta).
  xp += tasks.filter((t) => t.done).length * 15
  return xp
}

export function xpEarnedOn(date: string, habits: Habit[], log: HabitLog): number {
  const xpById = new Map(habits.map((h) => [h.id, h.xp]))
  return (log[date] ?? []).reduce((a, id) => a + (xpById.get(id) ?? 0), 0)
}

// ---------------------------------------------------------------------------
// Ofensiva (streak) — dias consecutivos com pelo menos 1 hábito concluído.
// ---------------------------------------------------------------------------
function isoOf(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function computeStreak(log: HabitLog, today: string): number {
  const done = (iso: string) => (log[iso]?.length ?? 0) > 0
  const cur = new Date(today + 'T00:00:00')
  // A ofensiva pode ainda estar "viva" se hoje não foi marcado mas ontem sim.
  if (!done(isoOf(cur))) cur.setDate(cur.getDate() - 1)
  let streak = 0
  while (done(isoOf(cur))) {
    streak++
    cur.setDate(cur.getDate() - 1)
  }
  return streak
}

// ---------------------------------------------------------------------------
// Conquistas / medalhas
// ---------------------------------------------------------------------------
export interface Achievement {
  id: string
  emoji: string
  title: string
  desc: string
  unlocked: boolean
  progressText?: string
}

export interface GameState {
  habits: Habit[]
  log: HabitLog
  tasks: Task[]
  goals: Goal[]
  today: string
}

export function achievements(s: GameState): Achievement[] {
  const xp = totalXp(s.habits, s.log, s.tasks)
  const streak = computeStreak(s.log, s.today)
  const level = levelForXp(xp)
  const daysLogged = Object.values(s.log).filter((v) => v.length > 0).length
  const tasksDone = s.tasks.filter((t) => t.done).length
  const stepsDone = s.goals.reduce((a, g) => a + g.steps.filter((x) => x.done).length, 0)
  // Contagem de conclusões de um hábito específico por título (ex.: treino, leitura).
  const countHabit = (match: string) => {
    const ids = new Set(s.habits.filter((h) => h.title.toLowerCase().includes(match)).map((h) => h.id))
    return Object.values(s.log).reduce((a, v) => a + v.filter((id) => ids.has(id)).length, 0)
  }
  const treinos = countHabit('trein')
  const leituras = countHabit('ler') + countHabit('leitura')

  const list: (Omit<Achievement, 'unlocked'> & { cond: boolean })[] = [
    { id: 'first-step', emoji: '👟', title: 'Primeiro Passo', desc: 'Complete seu primeiro hábito', cond: daysLogged >= 1, progressText: `${daysLogged} dia(s)` },
    { id: 'streak-3', emoji: '⚡', title: 'Pegando o Ritmo', desc: '3 dias de ofensiva', cond: streak >= 3, progressText: `${streak}/3` },
    { id: 'streak-7', emoji: '🔥', title: 'Semana de Fogo', desc: '7 dias de ofensiva', cond: streak >= 7, progressText: `${streak}/7` },
    { id: 'streak-30', emoji: '🌋', title: 'Imparável', desc: '30 dias de ofensiva', cond: streak >= 30, progressText: `${streak}/30` },
    { id: 'level-5', emoji: '⭐', title: 'Executor', desc: 'Chegue ao nível 5', cond: level >= 5, progressText: `Nível ${level}` },
    { id: 'xp-1000', emoji: '💎', title: 'Mil de XP', desc: 'Acumule 1.000 XP', cond: xp >= 1000, progressText: `${xp}/1000` },
    { id: 'trainer', emoji: '💪', title: 'Rumo aos -8kg', desc: '20 treinos registrados', cond: treinos >= 20, progressText: `${treinos}/20` },
    { id: 'reader', emoji: '📚', title: 'Leitor Voraz', desc: '20 sessões de leitura', cond: leituras >= 20, progressText: `${leituras}/20` },
    { id: 'executor', emoji: '✅', title: 'Mão na Massa', desc: 'Conclua 25 tarefas', cond: tasksDone >= 25, progressText: `${tasksDone}/25` },
    { id: 'planner', emoji: '🗺️', title: 'Estrategista', desc: 'Complete 10 passos de metas', cond: stepsDone >= 10, progressText: `${stepsDone}/10` },
  ]
  return list.map(({ cond, ...a }) => ({ ...a, unlocked: cond }))
}
