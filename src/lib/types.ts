// ============================================================================
// LifeOS AI — Modelo de Domínio
// ----------------------------------------------------------------------------
// Este arquivo é a "constituição" do sistema. Cada tipo aqui reflete um
// princípio: nada existe de forma isolada. Tarefas pertencem a metas, metas
// pertencem a objetivos, objetivos pertencem a áreas da vida.
// ============================================================================

/** As 10 dimensões medidas no Dashboard (Score Geral da Vida). */
export type LifeArea =
  | 'saude'
  | 'financas'
  | 'familia'
  | 'negocios'
  | 'conhecimento'
  | 'proposito'
  | 'produtividade'
  | 'energia'
  | 'humor'
  | 'tempoLivre'

export const LIFE_AREAS: { key: LifeArea; label: string; emoji: string }[] = [
  { key: 'saude', label: 'Saúde', emoji: '🫀' },
  { key: 'financas', label: 'Finanças', emoji: '💰' },
  { key: 'familia', label: 'Família', emoji: '🏡' },
  { key: 'negocios', label: 'Negócios', emoji: '📈' },
  { key: 'conhecimento', label: 'Conhecimento', emoji: '📚' },
  { key: 'proposito', label: 'Propósito', emoji: '🧭' },
  { key: 'produtividade', label: 'Produtividade', emoji: '⚡' },
  { key: 'energia', label: 'Energia', emoji: '🔋' },
  { key: 'humor', label: 'Humor', emoji: '🙂' },
  { key: 'tempoLivre', label: 'Tempo Livre', emoji: '🏖️' },
]

/** Um passo rastreável do plano de um objetivo (o usuário "vai traçando"). */
export interface GoalStep {
  id: string
  title: string
  done: boolean
}

/** Objetivo de longo prazo (o "para onde" da vida). */
export interface Goal {
  id: string
  area: LifeArea
  title: string
  description?: string
  /** Valor atual e alvo — para objetivos quantificáveis (renda, peso...). */
  metricLabel?: string
  current?: number
  target?: number
  unit?: string
  /** Direção do progresso: 'up' quer aumentar, 'down' quer diminuir (ex: peso). */
  direction?: 'up' | 'down'
  /** Valor de partida — usado para medir progresso relativo (ex.: peso inicial). */
  baseline?: number
  deadline?: string // ISO date
  /** Plano de ação ordenado e marcável — o guia rumo ao objetivo. */
  steps: GoalStep[]
  /** Sugestões livres da IA (texto). */
  nextSteps: string[]
  createdAt: string
}

export type MetaHorizon = 'anual' | 'trimestral' | 'mensal' | 'semanal' | 'diaria'

export const HORIZONS: { key: MetaHorizon; label: string }[] = [
  { key: 'anual', label: 'Anual' },
  { key: 'trimestral', label: 'Trimestral' },
  { key: 'mensal', label: 'Mensal' },
  { key: 'semanal', label: 'Semanal' },
  { key: 'diaria', label: 'Diária' },
]

/** Meta hierárquica. Toda meta pode aninhar sob outra de horizonte maior. */
export interface Meta {
  id: string
  horizon: MetaHorizon
  title: string
  goalId?: string // objetivo de longo prazo ao qual serve
  parentId?: string // meta de horizonte superior
  done: boolean
  createdAt: string
}

export type TaskStatus = 'backlog' | 'hoje' | 'fazendo' | 'feito'

export const TASK_COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: 'backlog', label: 'A fazer' },
  { key: 'hoje', label: 'Hoje' },
  { key: 'fazendo', label: 'Fazendo' },
  { key: 'feito', label: 'Feito' },
]

/**
 * Tarefa. Vinculada a uma meta (metaId) e/ou a um projeto (projectId) quando
 * possível — mas capturar rápido importa mais que preencher tudo.
 * O Kanban a move entre colunas; a Agenda a mostra por dia/horário.
 */
export interface Task {
  id: string
  title: string
  metaId?: string
  /** Projeto que gerou esta tarefa — alinha execução com o Plan. */
  projectId?: string
  status: TaskStatus
  done: boolean
  /** Marcada como a "One Thing" do dia (a tarefa 80/20). */
  isOneThing?: boolean
  date: string // ISO date (dia planejado)
  /** Horário (HH:MM) — para reuniões e blocos com hora marcada. */
  time?: string
  /** Tarefa comum ou reunião (aparece destacada na Agenda). */
  kind?: 'tarefa' | 'reuniao'
  createdAt: string
}

/** Pensamento, frase ou nota rápida. Captura em 1 toque; STARK pode usar. */
export interface Note {
  id: string
  text: string
  kind: 'pensamento' | 'frase' | 'ideia'
  createdAt: string
}

/** Lançamento financeiro simples — alimenta a meta de renda. */
export interface FinanceEntry {
  id: string
  type: 'receita' | 'despesa'
  amount: number
  label: string
  /** Se true, conta como renda/gasto recorrente mensal. */
  recurring: boolean
  date: string
  createdAt: string
}

export type ProjectStatus = 'execucao' | 'incubacao' | 'backlog' | 'arquivo'

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  execucao: 'Em Execução',
  incubacao: 'Incubação',
  backlog: 'Backlog',
  arquivo: 'Arquivo',
}

/** Critérios do Sistema de Priorização (0–10 cada). */
export interface ProjectScores {
  impactoFinanceiro: number
  proposito: number
  escalabilidade: number
  tempoRetorno: number // 0 = retorno lento, 10 = retorno rápido
  complexidade: number // 0 = muito complexo, 10 = simples (invertido a favor da simplicidade)
  automacao: number
  sinergia: number
  potencialIA: number
}

export const SCORE_CRITERIA: { key: keyof ProjectScores; label: string; hint: string }[] = [
  { key: 'impactoFinanceiro', label: 'Impacto Financeiro', hint: 'Quanto pode gerar de receita/patrimônio' },
  { key: 'proposito', label: 'Propósito', hint: 'Alinhamento com o que importa para você' },
  { key: 'escalabilidade', label: 'Escalabilidade', hint: 'Cresce sem exigir mais do seu tempo' },
  { key: 'tempoRetorno', label: 'Tempo para Retorno', hint: '10 = retorno rápido' },
  { key: 'complexidade', label: 'Simplicidade', hint: '10 = simples de executar' },
  { key: 'automacao', label: 'Automação', hint: 'Pode rodar sem você' },
  { key: 'sinergia', label: 'Sinergia', hint: 'Reforça seus outros projetos' },
  { key: 'potencialIA', label: 'Potencial de IA', hint: 'IA pode alavancar o resultado' },
]

export interface Project {
  id: string
  title: string
  description?: string
  status: ProjectStatus
  scores: ProjectScores
  goalId?: string
  createdAt: string
}

export type IdeaStatus = 'novo' | 'avaliada' | 'aprovada' | 'descartada'

/** Ideia no Banco de Ideias. A IA a intercepta antes de virar ação. */
export interface Idea {
  id: string
  title: string
  notes?: string
  category?: string
  status: IdeaStatus
  /** Avaliação de potencial (0–100) atribuída pela IA. */
  potential?: number
  relatedProjectId?: string
  createdAt: string
}

/** Métricas diárias que alimentam o Life Score. Escalas 0–10 salvo indicado. */
export interface DailyMetrics {
  sono: number // qualidade 0–10
  treino: number // intensidade 0–10 (0 = não treinou)
  peso?: number // kg (opcional)
  agua: number // litros
  alimentacao: number // 0–10
  foco: number // 0–10
  deepWork: number // horas
  receita: number // R$ gerado no dia
  investimentos: number // R$ investido no dia
  familia: number // horas de qualidade
  leitura: number // páginas / minutos → 0–10 de esforço
  aprendizado: number // 0–10
  meditacao: number // minutos
  gratidao: number // 0–10
  humor: number // 0–10
  energia: number // 0–10
}

/** Registro de um dia (check-in do Life Score). */
export interface DayLog {
  date: string // ISO date (YYYY-MM-DD) — chave
  metrics: DailyMetrics
  /** Score calculado e congelado no momento do check-in. */
  score: number
}

export interface DailyReview {
  date: string
  fiz: string
  avancei: string
  afastou: string
  amanha: string
  score?: number
}

export interface WeeklyReview {
  weekStart: string
  conquistas: string
  erros: string
  desperdicio: string
  evolucao: string
  projetosParados: string
  dinheiroGanho: number
  tempoPerdido: string
  tempoInvestido: string
}

/** Hábito diário — a unidade simples e gamificada do dia a dia. */
export interface Habit {
  id: string
  title: string
  emoji: string
  xp: number
  area: LifeArea
  /** Meta opcional a que o hábito serve (para "traçar avanços"). */
  goalId?: string
  active: boolean
  createdAt: string
}

/** Registro de hábitos concluídos por dia: { 'YYYY-MM-DD': ['id1','id2'] }. */
export type HabitLog = Record<string, string[]>

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export function emptyMetrics(): DailyMetrics {
  return {
    sono: 5,
    treino: 0,
    peso: undefined,
    agua: 2,
    alimentacao: 5,
    foco: 5,
    deepWork: 0,
    receita: 0,
    investimentos: 0,
    familia: 0,
    leitura: 0,
    aprendizado: 0,
    meditacao: 0,
    gratidao: 5,
    humor: 5,
    energia: 5,
  }
}

export function emptyScores(): ProjectScores {
  return {
    impactoFinanceiro: 5,
    proposito: 5,
    escalabilidade: 5,
    tempoRetorno: 5,
    complexidade: 5,
    automacao: 5,
    sinergia: 5,
    potencialIA: 5,
  }
}
