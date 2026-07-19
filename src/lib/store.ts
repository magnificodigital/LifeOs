import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ChatMessage,
  DailyMetrics,
  DailyReview,
  DayLog,
  Goal,
  Habit,
  HabitLog,
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
  habits: Habit[]
  habitLog: HabitLog
  dailyReviews: DailyReview[]
  weeklyReviews: WeeklyReview[]
  chat: ChatMessage[]
  ai: AiSettings

  // Goals
  addGoal: (g: Omit<Goal, 'id' | 'createdAt'>) => void
  updateGoal: (id: string, patch: Partial<Goal>) => void
  removeGoal: (id: string) => void
  addGoalStep: (goalId: string, title: string) => void
  toggleGoalStep: (goalId: string, stepId: string) => void
  removeGoalStep: (goalId: string, stepId: string) => void

  // Metas
  addMeta: (m: Omit<Meta, 'id' | 'createdAt' | 'done'>) => void
  toggleMeta: (id: string) => void
  removeMeta: (id: string) => void

  // Tasks
  addTask: (t: Omit<Task, 'id' | 'createdAt' | 'done'>) => void
  toggleTask: (id: string) => void
  setOneThing: (id: string) => void
  removeTask: (id: string) => void

  // Habits
  addHabit: (h: Omit<Habit, 'id' | 'createdAt' | 'active'>) => void
  updateHabit: (id: string, patch: Partial<Habit>) => void
  removeHabit: (id: string) => void
  toggleHabit: (date: string, id: string) => void

  // Projects
  addProject: (p: Omit<Project, 'id' | 'createdAt'>) => void
  updateProject: (id: string, patch: Partial<Project>) => void
  setProjectScores: (id: string, scores: ProjectScores) => void
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

const step = (title: string, done = false) => ({ id: uid(), title, done })

// ---------------------------------------------------------------------------
// Dados iniciais — os OBJETIVOS REAIS do usuário, já com plano de ação.
// ---------------------------------------------------------------------------
function seed() {
  const goals: Goal[] = [
    {
      id: 'g-renda',
      area: 'financas',
      title: 'Sair do zero → R$ 10.000/mês',
      description: 'Renda mensal recorrente que sustente o padrão da família. Prioridade máxima.',
      metricLabel: 'Renda mensal',
      current: 0,
      baseline: 0,
      target: 10000,
      unit: 'R$/mês',
      direction: 'up',
      deadline: '2026-12-31',
      steps: [
        step('Escolher UMA oferta/projeto principal para focar'),
        step('Definir a oferta: o que vende, para quem e por quanto'),
        step('Conseguir os 3 primeiros clientes pagantes'),
        step('Chegar a R$ 3.000/mês'),
        step('Automatizar entrega e captação de clientes'),
        step('Escalar até R$ 10.000/mês recorrentes'),
      ],
      nextSteps: [
        'Foque em UMA oferta até validar — dispersão mata a velocidade.',
        'Priorize receita recorrente sobre trabalho pontual.',
      ],
      createdAt: todayISO(),
    },
    {
      id: 'g-peso',
      area: 'saude',
      title: 'Emagrecer 8 kg até dez/2026',
      description: 'Ajuste o peso atual nos números. Aqui medimos os kg que faltam para a meta.',
      metricLabel: 'kg restantes',
      current: 8,
      baseline: 8,
      target: 0,
      unit: 'kg',
      direction: 'down',
      deadline: '2026-12-31',
      steps: [
        step('Pesar e registrar o peso inicial'),
        step('Treino de força 4×/semana'),
        step('Ajustar dieta para déficit calórico leve'),
        step('Beber 3L de água por dia'),
        step('Dormir 7h+ por noite'),
        step('Reavaliar o peso a cada 2 semanas'),
      ],
      nextSteps: ['Consistência > intensidade. 4 treinos por semana batem qualquer dieta radical.'],
      createdAt: todayISO(),
    },
    {
      id: 'g-leitura',
      area: 'conhecimento',
      title: 'Ler mais livros (meta: 12 no ano)',
      metricLabel: 'Livros lidos',
      current: 0,
      baseline: 0,
      target: 12,
      unit: 'livros',
      direction: 'up',
      deadline: '2026-12-31',
      steps: [
        step('Escolher o próximo livro'),
        step('Ler 20 minutos por dia'),
        step('Terminar 1 livro por mês'),
        step('Anotar 3 aprendizados de cada livro'),
      ],
      nextSteps: ['20 minutos por dia = ~1 livro por mês. O hábito vence a meta.'],
      createdAt: todayISO(),
    },
    {
      id: 'g-lancar',
      area: 'negocios',
      title: 'Finalizar e lançar 1 projeto',
      metricLabel: 'Projetos lançados',
      current: 0,
      baseline: 0,
      target: 1,
      unit: 'projeto',
      direction: 'up',
      deadline: '2026-12-31',
      steps: [
        step('Listar todos os projetos em aberto'),
        step('Escolher 1 para lançar primeiro (Regra do Projeto Único)'),
        step('Definir o escopo mínimo do lançamento'),
        step('Marcar uma data de lançamento'),
        step('Lançar'),
        step('Divulgar para conseguir os primeiros usuários'),
      ],
      nextSteps: ['Lançado imperfeito vale mais que perfeito na gaveta.'],
      createdAt: todayISO(),
    },
  ]

  const habits: Habit[] = [
    { id: 'h-deep', title: '1h de Deep Work no projeto', emoji: '🎯', xp: 25, area: 'negocios', goalId: 'g-renda', active: true, createdAt: todayISO() },
    { id: 'h-vendas', title: 'Uma ação de vendas/receita', emoji: '💸', xp: 20, area: 'financas', goalId: 'g-renda', active: true, createdAt: todayISO() },
    { id: 'h-treino', title: 'Treinar', emoji: '💪', xp: 20, area: 'saude', goalId: 'g-peso', active: true, createdAt: todayISO() },
    { id: 'h-comer', title: 'Comer bem (déficit leve)', emoji: '🥗', xp: 10, area: 'saude', goalId: 'g-peso', active: true, createdAt: todayISO() },
    { id: 'h-agua', title: 'Beber 3L de água', emoji: '💧', xp: 5, area: 'saude', goalId: 'g-peso', active: true, createdAt: todayISO() },
    { id: 'h-dormir', title: 'Dormir 7h+', emoji: '😴', xp: 10, area: 'saude', goalId: 'g-peso', active: true, createdAt: todayISO() },
    { id: 'h-ler', title: 'Ler 20 minutos', emoji: '📚', xp: 10, area: 'conhecimento', goalId: 'g-leitura', active: true, createdAt: todayISO() },
    { id: 'h-medita', title: 'Meditar 10 minutos', emoji: '🧘', xp: 5, area: 'energia', active: true, createdAt: todayISO() },
  ]

  // Histórico de hábitos: ofensiva de alguns dias terminando ontem (hoje fica p/ o usuário).
  const habitLog: HabitLog = {}
  const pattern = [
    ['h-deep', 'h-treino', 'h-ler', 'h-agua', 'h-dormir'],
    ['h-deep', 'h-vendas', 'h-comer', 'h-agua', 'h-medita'],
    ['h-treino', 'h-ler', 'h-agua', 'h-dormir'],
    ['h-deep', 'h-vendas', 'h-treino', 'h-comer', 'h-agua', 'h-ler', 'h-dormir'],
    ['h-ler', 'h-agua', 'h-comer'],
    ['h-deep', 'h-treino', 'h-vendas', 'h-agua'],
  ]
  for (let i = 1; i <= pattern.length; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    habitLog[d.toISOString().slice(0, 10)] = pattern[i - 1]
  }

  const metas: Meta[] = [
    { id: 'm-s1', horizon: 'semanal', title: 'Conseguir 1 cliente pagante', goalId: 'g-renda', done: false, createdAt: todayISO() },
    { id: 'm-s2', horizon: 'semanal', title: 'Treinar 4×', goalId: 'g-peso', done: false, createdAt: todayISO() },
  ]

  const tasks: Task[] = [
    { id: 't1', title: 'Definir minha oferta principal em 1 frase', metaId: 'm-s1', done: false, isOneThing: true, date: todayISO(), createdAt: todayISO() },
  ]

  const mk = (s: Partial<ProjectScores>): ProjectScores => ({
    impactoFinanceiro: 5, proposito: 5, escalabilidade: 5, tempoRetorno: 5,
    complexidade: 5, automacao: 5, sinergia: 5, potencialIA: 5, ...s,
  })

  // Exemplos de projetos para a IA demonstrar "por onde começar". Edite à vontade.
  const projects: Project[] = [
    {
      id: 'p-serv', title: 'Serviço/Freelance (renda rápida)', status: 'backlog', goalId: 'g-renda',
      description: 'Dinheiro entra rápido, mas troca tempo por dinheiro — pouca escala.',
      scores: mk({ impactoFinanceiro: 7, proposito: 4, escalabilidade: 2, tempoRetorno: 9, complexidade: 8, automacao: 2, sinergia: 4, potencialIA: 3 }),
      createdAt: todayISO(),
    },
    {
      id: 'p-prod', title: 'Produto digital / SaaS', status: 'backlog', goalId: 'g-renda',
      description: 'Recorrente e escalável, retorno mais lento no começo.',
      scores: mk({ impactoFinanceiro: 8, proposito: 8, escalabilidade: 9, tempoRetorno: 4, complexidade: 5, automacao: 8, sinergia: 7, potencialIA: 9 }),
      createdAt: todayISO(),
    },
    {
      id: 'p-cons', title: 'Consultoria 1:1', status: 'backlog',
      description: 'Alto valor por hora, valida a oferta, mas não escala.',
      scores: mk({ impactoFinanceiro: 7, proposito: 6, escalabilidade: 3, tempoRetorno: 8, complexidade: 7, automacao: 3, sinergia: 6, potencialIA: 4 }),
      createdAt: todayISO(),
    },
  ]

  const ideas: Idea[] = [
    { id: 'i1', title: 'Newsletter paga sobre meu nicho', notes: 'Assinatura recorrente, escalável, forte potencial de IA.', status: 'novo', createdAt: todayISO() },
    { id: 'i2', title: 'Curso gravado', notes: 'Produto digital, renda passiva depois de pronto.', status: 'novo', createdAt: todayISO() },
  ]

  const logs: DayLog[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    const base: DailyMetrics = {
      ...emptyMetrics(),
      sono: 6 + (i % 3), treino: i % 2 === 0 ? 7 : 0, agua: 2 + (i % 3) * 0.5,
      alimentacao: 6 + (i % 3), foco: 5 + (i % 4), deepWork: (i % 3) + 1,
      receita: i % 2 === 0 ? 300 : 0, familia: i % 3, leitura: 5 + (i % 4),
      aprendizado: 5 + (i % 3), meditacao: (i % 2) * 10, gratidao: 6 + (i % 3),
      humor: 6 + (i % 3), energia: 5 + (i % 4),
    }
    logs.push({ date: iso, metrics: base, score: computeLifeScore(base) })
  }

  return { goals, habits, habitLog, metas, tasks, projects, ideas, logs }
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
      addGoalStep: (goalId, title) =>
        set((st) => ({
          goals: st.goals.map((g) => (g.id === goalId ? { ...g, steps: [...g.steps, step(title)] } : g)),
        })),
      toggleGoalStep: (goalId, stepId) =>
        set((st) => ({
          goals: st.goals.map((g) =>
            g.id === goalId ? { ...g, steps: g.steps.map((x) => (x.id === stepId ? { ...x, done: !x.done } : x)) } : g,
          ),
        })),
      removeGoalStep: (goalId, stepId) =>
        set((st) => ({
          goals: st.goals.map((g) => (g.id === goalId ? { ...g, steps: g.steps.filter((x) => x.id !== stepId) } : g)),
        })),

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

      addHabit: (h) => set((st) => ({ habits: [...st.habits, { ...h, id: uid(), active: true, createdAt: todayISO() }] })),
      updateHabit: (id, patch) => set((st) => ({ habits: st.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),
      removeHabit: (id) => set((st) => ({ habits: st.habits.filter((h) => h.id !== id) })),
      toggleHabit: (date, id) =>
        set((st) => {
          const cur = st.habitLog[date] ?? []
          const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
          return { habitLog: { ...st.habitLog, [date]: next } }
        }),

      addProject: (p) => set((st) => ({ projects: [...st.projects, { ...p, id: uid(), createdAt: todayISO() }] })),
      updateProject: (id, patch) => set((st) => ({ projects: st.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      setProjectScores: (id, scores) => set((st) => ({ projects: st.projects.map((p) => (p.id === id ? { ...p, scores } : p)) })),
      setInExecution: (id) =>
        set((st) => ({
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
        set((st) => ({ dailyReviews: [r, ...st.dailyReviews.filter((x) => x.date !== r.date)] })),
      saveWeeklyReview: (r) =>
        set((st) => ({ weeklyReviews: [r, ...st.weeklyReviews.filter((x) => x.weekStart !== r.weekStart)] })),

      pushChat: (m) => set((st) => ({ chat: [...st.chat, { ...m, id: uid(), createdAt: new Date().toISOString() }] })),
      clearChat: () => set({ chat: [] }),

      setAi: (patch) => set((st) => ({ ai: { ...st.ai, ...patch } })),
      resetAll: () => set({ ...seed(), dailyReviews: [], weeklyReviews: [], chat: [], ai: { provider: 'local' } }),
    }),
    { name: 'lifeos-ai-v2' },
  ),
)
