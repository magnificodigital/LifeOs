import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ChatMessage,
  DailyMetrics,
  DailyReview,
  DayLog,
  Goal,
  Idea,
  Meta,
  Project,
  ProjectScores,
  Task,
  WeeklyReview,
} from './types'
import { emptyMetrics } from './types'
import { computeLifeScore } from './scoring'
import { uid, todayISO } from './utils'
import type { AiSettings } from './ai/provider'

interface State {
  goals: Goal[]
  metas: Meta[]
  tasks: Task[]
  projects: Project[]
  ideas: Idea[]
  logs: DayLog[]
  dailyReviews: DailyReview[]
  weeklyReviews: WeeklyReview[]
  chat: ChatMessage[]
  ai: AiSettings

  // Goals
  addGoal: (g: Omit<Goal, 'id' | 'createdAt'>) => void
  updateGoal: (id: string, patch: Partial<Goal>) => void
  removeGoal: (id: string) => void

  // Metas
  addMeta: (m: Omit<Meta, 'id' | 'createdAt' | 'done'>) => void
  toggleMeta: (id: string) => void
  removeMeta: (id: string) => void

  // Tasks
  addTask: (t: Omit<Task, 'id' | 'createdAt' | 'done'>) => void
  toggleTask: (id: string) => void
  setOneThing: (id: string) => void
  removeTask: (id: string) => void

  // Projects
  addProject: (p: Omit<Project, 'id' | 'createdAt'>) => void
  updateProject: (id: string, patch: Partial<Project>) => void
  setProjectScores: (id: string, scores: ProjectScores) => void
  /** Coloca um projeto em execução — força a Regra do Projeto Único. */
  setInExecution: (id: string) => void
  removeProject: (id: string) => void

  // Ideas
  addIdea: (i: Omit<Idea, 'id' | 'createdAt' | 'status'>) => void
  updateIdea: (id: string, patch: Partial<Idea>) => void
  removeIdea: (id: string) => void

  // Life Score
  saveDayLog: (date: string, metrics: DailyMetrics) => void

  // Reviews
  saveDailyReview: (r: DailyReview) => void
  saveWeeklyReview: (r: WeeklyReview) => void

  // Chat
  pushChat: (m: Omit<ChatMessage, 'id' | 'createdAt'>) => void
  clearChat: () => void

  setAi: (patch: Partial<AiSettings>) => void
  resetAll: () => void
}

// ---------------------------------------------------------------------------
// Dados de exemplo — um usuário fictício alinhado ao briefing (Tim Ferriss etc.)
// ---------------------------------------------------------------------------
function seed() {
  const goals: Goal[] = [
    {
      id: 'g-fin', area: 'financas', title: 'Patrimônio de R$ 10 milhões',
      metricLabel: 'Patrimônio', current: 1850000, target: 10000000, unit: 'R$', direction: 'up',
      deadline: '2032-12-31',
      nextSteps: ['Escalar o produto principal', 'Automatizar aquisição', 'Investir 30% da receita'],
      createdAt: '2026-01-02',
    },
    {
      id: 'g-casa', area: 'financas', title: 'Casa dos sonhos até R$ 3 milhões',
      metricLabel: 'Reservado', current: 420000, target: 3000000, unit: 'R$', direction: 'up',
      deadline: '2030-06-30', nextSteps: ['Manter reserva dedicada', 'Rever após próximo marco de receita'],
      createdAt: '2026-01-02',
    },
    {
      id: 'g-saude', area: 'saude', title: 'Perder 8 kg e manter',
      metricLabel: 'Peso', current: 86, target: 78, unit: 'kg', direction: 'down',
      deadline: '2026-12-31', nextSteps: ['Treino de força 4×/semana', 'Déficit calórico leve', 'Dormir 7h30'],
      createdAt: '2026-01-02',
    },
    {
      id: 'g-fam', area: 'familia', title: 'Viajar mais com a família',
      nextSteps: ['3 viagens este ano', 'Sextas sem trabalho'], createdAt: '2026-01-02',
    },
    {
      id: 'g-tempo', area: 'tempoLivre', title: 'Trabalhar só em projetos importantes',
      nextSteps: ['Aplicar a Regra do Projeto Único', 'Delegar o operacional'], createdAt: '2026-01-02',
    },
  ]

  const metas: Meta[] = [
    { id: 'm-a1', horizon: 'anual', title: 'Levar o negócio a R$ 3M de receita', goalId: 'g-fin', done: false, createdAt: '2026-01-02' },
    { id: 'm-t1', horizon: 'trimestral', title: 'Lançar a v2 do produto', goalId: 'g-fin', parentId: 'm-a1', done: false, createdAt: '2026-01-02' },
    { id: 'm-me1', horizon: 'mensal', title: 'Automatizar onboarding de clientes', goalId: 'g-fin', parentId: 'm-t1', done: false, createdAt: '2026-07-01' },
    { id: 'm-s1', horizon: 'semanal', title: 'Fechar 2 novos clientes', goalId: 'g-fin', parentId: 'm-me1', done: false, createdAt: '2026-07-13' },
    { id: 'm-sd', horizon: 'semanal', title: 'Treinar 4×', goalId: 'g-saude', done: false, createdAt: '2026-07-13' },
    { id: 'm-d1', horizon: 'diaria', title: 'Bloco de Deep Work no produto', goalId: 'g-fin', parentId: 'm-s1', done: false, createdAt: todayISO() },
  ]

  const tasks: Task[] = [
    { id: 't1', title: 'Escrever a página de vendas da v2', metaId: 'm-d1', done: false, isOneThing: true, date: todayISO(), createdAt: todayISO() },
    { id: 't2', title: 'Responder e-mails de suporte', metaId: 'm-s1', done: false, date: todayISO(), createdAt: todayISO() },
    { id: 't3', title: 'Treino de força (pernas)', metaId: 'm-sd', done: false, date: todayISO(), createdAt: todayISO() },
  ]

  const mkScores = (s: Partial<ProjectScores>): ProjectScores => ({
    impactoFinanceiro: 5, proposito: 5, escalabilidade: 5, tempoRetorno: 5,
    complexidade: 5, automacao: 5, sinergia: 5, potencialIA: 5, ...s,
  })

  const projects: Project[] = [
    {
      id: 'p1', title: 'Produto SaaS v2', status: 'execucao', goalId: 'g-fin',
      description: 'A alavanca principal de receita recorrente.',
      scores: mkScores({ impactoFinanceiro: 9, proposito: 8, escalabilidade: 9, tempoRetorno: 7, complexidade: 6, automacao: 8, sinergia: 8, potencialIA: 9 }),
      createdAt: '2026-05-10',
    },
    {
      id: 'p2', title: 'Canal no YouTube', status: 'incubacao',
      description: 'Audiência de longo prazo, retorno lento.',
      scores: mkScores({ impactoFinanceiro: 4, proposito: 7, escalabilidade: 8, tempoRetorno: 2, complexidade: 4, automacao: 3, sinergia: 6, potencialIA: 6 }),
      createdAt: '2026-06-20',
    },
    {
      id: 'p3', title: 'Consultoria 1:1', status: 'backlog',
      description: 'Alto valor por hora, mas não escala.',
      scores: mkScores({ impactoFinanceiro: 7, proposito: 5, escalabilidade: 2, tempoRetorno: 9, complexidade: 8, automacao: 2, sinergia: 4, potencialIA: 3 }),
      createdAt: '2026-07-05',
    },
  ]

  const ideas: Idea[] = [
    { id: 'i1', title: 'App de finanças com IA', notes: 'Modelo de assinatura recorrente, automatizável, forte potencial de IA e escala.', status: 'novo', createdAt: todayISO() },
    { id: 'i2', title: 'Newsletter paga', notes: 'Talvez um dia. Renda passiva com comunidade.', status: 'novo', createdAt: todayISO() },
  ]

  // Últimos 7 dias de Life Score (trajetória de exemplo).
  const logs: DayLog[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    const base: DailyMetrics = {
      ...emptyMetrics(),
      sono: 6 + ((i * 3) % 4), treino: i % 2 === 0 ? 7 : 0, peso: 86 - (6 - i) * 0.2,
      agua: 2 + (i % 3) * 0.5, alimentacao: 6 + (i % 3), foco: 5 + (i % 4),
      deepWork: (i % 3) + 1, receita: i % 2 === 0 ? 1200 : 0, investimentos: i === 3 ? 3000 : 0,
      familia: (i % 3), leitura: 5 + (i % 4), aprendizado: 5 + (i % 3),
      meditacao: (i % 2) * 15, gratidao: 6 + (i % 3), humor: 6 + (i % 3), energia: 5 + (i % 4),
    }
    logs.push({ date: iso, metrics: base, score: computeLifeScore(base) })
  }

  return { goals, metas, tasks, projects, ideas, logs }
}

const s = seed()

export const useStore = create<State>()(
  persist(
    (set) => ({
      ...s,
      dailyReviews: [],
      weeklyReviews: [],
      chat: [],
      ai: { provider: 'local' },

      addGoal: (g) => set((st) => ({ goals: [...st.goals, { ...g, id: uid(), createdAt: todayISO() }] })),
      updateGoal: (id, patch) => set((st) => ({ goals: st.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
      removeGoal: (id) => set((st) => ({ goals: st.goals.filter((g) => g.id !== id) })),

      addMeta: (m) => set((st) => ({ metas: [...st.metas, { ...m, id: uid(), done: false, createdAt: todayISO() }] })),
      toggleMeta: (id) => set((st) => ({ metas: st.metas.map((m) => (m.id === id ? { ...m, done: !m.done } : m)) })),
      removeMeta: (id) => set((st) => ({ metas: st.metas.filter((m) => m.id !== id) })),

      addTask: (t) => set((st) => ({ tasks: [...st.tasks, { ...t, id: uid(), done: false, createdAt: todayISO() }] })),
      toggleTask: (id) => set((st) => ({ tasks: st.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
      setOneThing: (id) =>
        set((st) => {
          const target = st.tasks.find((t) => t.id === id)
          if (!target) return {}
          return {
            tasks: st.tasks.map((t) =>
              t.date === target.date ? { ...t, isOneThing: t.id === id ? !t.isOneThing : false } : t,
            ),
          }
        }),
      removeTask: (id) => set((st) => ({ tasks: st.tasks.filter((t) => t.id !== id) })),

      addProject: (p) => set((st) => ({ projects: [...st.projects, { ...p, id: uid(), createdAt: todayISO() }] })),
      updateProject: (id, patch) => set((st) => ({ projects: st.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      setProjectScores: (id, scores) => set((st) => ({ projects: st.projects.map((p) => (p.id === id ? { ...p, scores } : p)) })),
      setInExecution: (id) =>
        set((st) => ({
          // Regra do Projeto Único: qualquer outro em execução volta para incubação.
          projects: st.projects.map((p) =>
            p.id === id
              ? { ...p, status: 'execucao' as const }
              : p.status === 'execucao'
                ? { ...p, status: 'incubacao' as const }
                : p,
          ),
        })),
      removeProject: (id) => set((st) => ({ projects: st.projects.filter((p) => p.id !== id) })),

      addIdea: (i) => set((st) => ({ ideas: [...st.ideas, { ...i, id: uid(), status: 'novo', createdAt: todayISO() }] })),
      updateIdea: (id, patch) => set((st) => ({ ideas: st.ideas.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
      removeIdea: (id) => set((st) => ({ ideas: st.ideas.filter((i) => i.id !== id) })),

      saveDayLog: (date, metrics) =>
        set((st) => {
          const score = computeLifeScore(metrics)
          const exists = st.logs.some((l) => l.date === date)
          const logs = exists
            ? st.logs.map((l) => (l.date === date ? { date, metrics, score } : l))
            : [...st.logs, { date, metrics, score }]
          return { logs: logs.sort((a, b) => a.date.localeCompare(b.date)) }
        }),

      saveDailyReview: (r) =>
        set((st) => ({
          dailyReviews: [r, ...st.dailyReviews.filter((x) => x.date !== r.date)],
        })),
      saveWeeklyReview: (r) =>
        set((st) => ({
          weeklyReviews: [r, ...st.weeklyReviews.filter((x) => x.weekStart !== r.weekStart)],
        })),

      pushChat: (m) => set((st) => ({ chat: [...st.chat, { ...m, id: uid(), createdAt: new Date().toISOString() }] })),
      clearChat: () => set({ chat: [] }),

      setAi: (patch) => set((st) => ({ ai: { ...st.ai, ...patch } })),
      resetAll: () => set({ ...s, dailyReviews: [], weeklyReviews: [], chat: [], ai: { provider: 'local' } }),
    }),
    { name: 'lifeos-ai-v1' },
  ),
)
