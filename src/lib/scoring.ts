// ============================================================================
// Motores de cálculo — onde a filosofia vira número.
// ============================================================================
import type { DailyMetrics, Goal, Project, ProjectScores } from './types'

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n))

/**
 * Life Score diário (0–100).
 * Ponderamos os hábitos que mais movem uma vida extraordinária. Cada métrica é
 * normalizada para 0–1 e recebe um peso. Reflete Atomic Habits: pequenos sinais
 * diários compõem a trajetória.
 */
export function computeLifeScore(m: DailyMetrics): number {
  const norm = {
    sono: m.sono / 10,
    treino: m.treino / 10,
    agua: clamp(m.agua / 3, 0, 1), // 3L = ideal
    alimentacao: m.alimentacao / 10,
    foco: m.foco / 10,
    deepWork: clamp(m.deepWork / 4, 0, 1), // 4h de deep work = topo
    receita: m.receita > 0 ? 1 : 0,
    investimentos: m.investimentos > 0 ? 1 : 0,
    familia: clamp(m.familia / 3, 0, 1), // 3h de qualidade
    leitura: m.leitura / 10,
    aprendizado: m.aprendizado / 10,
    meditacao: clamp(m.meditacao / 20, 0, 1), // 20 min
    gratidao: m.gratidao / 10,
    humor: m.humor / 10,
    energia: m.energia / 10,
  }

  const weights: Record<keyof typeof norm, number> = {
    sono: 12,
    treino: 9,
    agua: 4,
    alimentacao: 8,
    foco: 10,
    deepWork: 12,
    receita: 7,
    investimentos: 5,
    familia: 9,
    leitura: 5,
    aprendizado: 6,
    meditacao: 5,
    gratidao: 3,
    humor: 3,
    energia: 2,
  }

  let total = 0
  let maxTotal = 0
  ;(Object.keys(weights) as (keyof typeof norm)[]).forEach((k) => {
    total += norm[k] * weights[k]
    maxTotal += weights[k]
  })

  return Math.round((total / maxTotal) * 100)
}

/**
 * Prioridade de um projeto (0–100).
 * Fórmula que favorece alto impacto, alavancagem (escala/automação/IA) e
 * simplicidade — os pilares de "Trabalhe 4 Horas por Semana" e do 80/20.
 */
export function computeProjectPriority(s: ProjectScores): number {
  const weights: Record<keyof ProjectScores, number> = {
    impactoFinanceiro: 3,
    proposito: 2.5,
    escalabilidade: 2.5,
    tempoRetorno: 1.5,
    complexidade: 1.5, // já vem invertido (10 = simples)
    automacao: 2,
    sinergia: 1.5,
    potencialIA: 2,
  }
  let total = 0
  let max = 0
  ;(Object.keys(weights) as (keyof ProjectScores)[]).forEach((k) => {
    total += s[k] * weights[k]
    max += 10 * weights[k]
  })
  return Math.round((total / max) * 100)
}

/** Progresso de um objetivo quantificável (0–100), medido a partir do baseline. */
export function computeGoalProgress(g: Goal): number | null {
  if (g.current === undefined || g.target === undefined) return null
  if (g.direction === 'down') {
    // Ex.: emagrecer. baseline = peso inicial; alvo < baseline.
    const start = g.baseline ?? g.current
    if (start <= g.target) return g.current <= g.target ? 100 : 0
    return clamp(Math.round(((start - g.current) / (start - g.target)) * 100))
  }
  // Aumentar (ex.: renda a partir do zero).
  const start = g.baseline ?? 0
  if (g.target === start) return 0
  return clamp(Math.round(((g.current - start) / (g.target - start)) * 100))
}

/** Ranking de projetos por prioridade (desc). */
export function rankProjects(projects: Project[]): Project[] {
  return [...projects].sort(
    (a, b) => computeProjectPriority(b.scores) - computeProjectPriority(a.scores),
  )
}

export function scoreColor(score: number): string {
  if (score >= 75) return '#34d399' // emerald
  if (score >= 50) return '#818cf8' // indigo
  if (score >= 30) return '#fbbf24' // amber
  return '#f87171' // red
}

export function scoreLabel(score: number): string {
  if (score >= 85) return 'Extraordinário'
  if (score >= 70) return 'Forte'
  if (score >= 50) return 'Sólido'
  if (score >= 30) return 'Atenção'
  return 'Crítico'
}
