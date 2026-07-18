// ============================================================================
// O Mentor — o conselho pessoal do usuário.
// ----------------------------------------------------------------------------
// Este é o cérebro estratégico. Ele NÃO é um chatbot: ele lê todo o estado da
// vida do usuário e responde como um CEO/conselheiro faria — desafiando,
// priorizando, protegendo a energia do usuário.
//
// Implementação atual: motor determinístico baseado em regras (funciona 100%
// offline, sem chave de API). A interface `answer()` foi desenhada para ser
// trocada por uma chamada a Claude/OpenAI/Gemini sem mudar a UI — ver
// `provider.ts`.
// ============================================================================
import type {
  DayLog,
  Goal,
  Idea,
  Meta,
  Project,
  Task,
} from '../types'
import { computeProjectPriority, rankProjects } from '../scoring'

export interface MentorContext {
  goals: Goal[]
  metas: Meta[]
  tasks: Task[]
  projects: Project[]
  ideas: Idea[]
  logs: DayLog[]
  today: string // ISO date
}

export interface CeoBriefing {
  oneThing: string
  eliminate: string
  automate: string
  delegate: string
  ignore: string
  challenge: string
}

const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

// ---------------------------------------------------------------------------
// Modo CEO — as 5 perguntas do dia + o desafio.
// ---------------------------------------------------------------------------
export function ceoBriefing(ctx: MentorContext): CeoBriefing {
  const active = ctx.projects.find((p) => p.status === 'execucao')
  const ranked = rankProjects(ctx.projects.filter((p) => p.status !== 'arquivo'))
  const todaysTasks = ctx.tasks.filter((t) => t.date === ctx.today && !t.done)
  const oneThingTask = todaysTasks.find((t) => t.isOneThing)

  const oneThing = oneThingTask
    ? `Concluir: "${oneThingTask.title}". É a alavanca 80/20 de hoje — proteja o bloco de Deep Work para ela.`
    : active
      ? `Avançar o projeto em execução ("${active.title}") em um passo concreto e mensurável. Escolha a menor ação que gera o maior resultado.`
      : 'Definir seu Projeto Único. Sem um foco declarado, todo esforço se dilui. Vá em Projetos e coloque um como "Em Execução".'

  const busyWork = todaysTasks.filter((t) => !t.isOneThing)
  const eliminate = busyWork.length > 3
    ? `Você tem ${busyWork.length} tarefas secundárias hoje. Corte pelo menos ${busyWork.length - 2}. Ocupação não é progresso.`
    : 'Revise sua lista: qualquer tarefa que não sirva a uma meta é candidata a corte.'

  const lowAutomation = ranked.find((p) => p.scores.automacao <= 4)
  const automate = lowAutomation
    ? `"${lowAutomation.title}" tem baixa automação (${lowAutomation.scores.automacao}/10). Que parte se repete e pode virar template, script ou fluxo de IA?`
    : 'Identifique a tarefa que você repetiu 3× esta semana — ela deveria ser um sistema, não um esforço.'

  const delegate = busyWork.length > 0
    ? `Olhe "${busyWork[0].title}": isso precisa ser você? Delegar antes de sobrecarregar.`
    : 'Nada urgente a delegar hoje — mas mantenha a régua: seu tempo vale o custo do seu objetivo financeiro.'

  const backlogCount = ctx.projects.filter((p) => p.status === 'backlog' || p.status === 'incubacao').length
  const ignore = backlogCount > 0
    ? `Ignore hoje os ${backlogCount} projetos em incubação/backlog. Eles não são urgentes — são distração fantasiada de ambição.`
    : 'Ignore notificações e novas ideias até concluir a One Thing.'

  return {
    oneThing,
    eliminate,
    automate,
    delegate,
    ignore,
    challenge: challengeUser(ctx),
  }
}

/** A IA desafia: ocupação vs. resultado, excesso de projetos. */
export function challengeUser(ctx: MentorContext): string {
  const openTasks = ctx.tasks.filter((t) => !t.done)
  const inExecution = ctx.projects.filter((p) => p.status === 'execucao')
  const startedThisMonth = ctx.projects.filter((p) => {
    const d = new Date(p.createdAt)
    const now = new Date(ctx.today)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  if (inExecution.length > 1) {
    return `Você tem ${inExecution.length} projetos "Em Execução" ao mesmo tempo. A Regra do Projeto Único existe por um motivo: foco dividido é velocidade dividida. Escolha UM.`
  }
  if (startedThisMonth.length >= 3) {
    return `Você iniciou ${startedThisMonth.length} projetos este mês. Isso reduz drasticamente sua velocidade. Menos, porém melhor.`
  }
  if (openTasks.length > 12) {
    return `${openTasks.length} tarefas abertas. Você está ocupado ou realmente produzindo resultado? A diferença define os próximos 10 anos.`
  }
  const orphanTasks = ctx.tasks.filter((t) => !t.metaId)
  if (orphanTasks.length > 0) {
    return `Há tarefas sem meta vinculada. Toda ação precisa servir a um objetivo — senão é só movimento.`
  }
  return 'Sua estrutura está enxuta. Agora a única pergunta que importa: você executou a One Thing de hoje?'
}

// ---------------------------------------------------------------------------
// Análise anti-distração: uma nova ideia vale interromper o projeto atual?
// ---------------------------------------------------------------------------
export interface IdeaAnalysis {
  potential: number
  moreImpactful: boolean
  projectToPause?: string
  verdict: string
  questions: string[]
}

export function analyzeIdea(idea: Idea, ctx: MentorContext): IdeaAnalysis {
  const active = ctx.projects.find((p) => p.status === 'execucao')
  const activePriority = active ? computeProjectPriority(active.scores) : 0

  // Heurística de potencial a partir do texto (proxy até plugar um LLM).
  const text = `${idea.title} ${idea.notes ?? ''}`.toLowerCase()
  let potential = 45
  const signals: Record<string, number> = {
    recorrente: 12, assinatura: 12, saas: 10, automat: 10, ia: 8, escala: 10,
    passiv: 12, produto: 6, audiência: 6, comunidade: 5, curso: 6,
  }
  for (const [k, v] of Object.entries(signals)) if (text.includes(k)) potential += v
  const noise: Record<string, number> = { talvez: -8, 'quem sabe': -8, ideia: -3, 'um dia': -10 }
  for (const [k, v] of Object.entries(noise)) if (text.includes(k)) potential += v
  potential = Math.max(5, Math.min(98, potential))

  const moreImpactful = potential > activePriority + 15 // margem de segurança

  const verdict = active
    ? moreImpactful
      ? `Esta ideia (potencial ${potential}) parece superar seu projeto atual "${active.title}" (prioridade ${activePriority}). Ainda assim: não troque no impulso. Deixe-a 7 dias em incubação. Se continuar tão forte, aí sim reavalie.`
      : `Manter o foco. Seu projeto atual "${active.title}" (prioridade ${activePriority}) segue mais valioso que esta ideia (potencial ${potential}). Guarde-a no Banco — trocar agora atrasaria sua meta.`
    : `Você não tem um projeto em execução. Antes de abraçar esta ideia, defina se ela merece ser O Projeto Único.`

  return {
    potential,
    moreImpactful,
    projectToPause: moreImpactful ? active?.title : undefined,
    verdict,
    questions: [
      'Esta ideia gera mais impacto do que o projeto atual?',
      active ? `Qual projeto precisa ser pausado? (hoje: "${active.title}")` : 'Qual seria seu Projeto Único?',
      'Quanto tempo esta ideia atrasará sua meta financeira?',
      'Vale a pena trocar — ou é só novidade?',
    ],
  }
}

// ---------------------------------------------------------------------------
// Assistente conversacional — roteia perguntas em linguagem natural.
// ---------------------------------------------------------------------------
export function answer(question: string, ctx: MentorContext): string {
  const q = question.toLowerCase()
  const active = ctx.projects.find((p) => p.status === 'execucao')
  const ranked = rankProjects(ctx.projects.filter((p) => p.status !== 'arquivo'))
  const lastLog = [...ctx.logs].sort((a, b) => b.date.localeCompare(a.date))[0]

  const match = (...words: string[]) => words.some((w) => q.includes(w))

  if (match('hoje', 'focar', 'foco', 'agora')) {
    const b = ceoBriefing(ctx)
    return `**Sua One Thing hoje:** ${b.oneThing}\n\n**Elimine:** ${b.eliminate}\n\n${b.challenge}`
  }
  if (match('começar', 'iniciar', 'novo projeto', 'outra ideia', 'outro projeto')) {
    return active
      ? `Não recomendo. Você já tem "${active.title}" em execução. A Regra do Projeto Único protege sua velocidade. Registre a ideia no Banco de Ideias — eu faço a análise de troca antes de qualquer decisão.`
      : `Você não tem projeto em execução, então faz sentido escolher um. Vá em Projetos: eu ranqueio por prioridade e o topo da lista deveria ser o seu foco.`
  }
  if (match('atrasando', 'travando', 'me impede', 'atrapalha')) {
    const backlog = ctx.projects.filter((p) => p.status !== 'arquivo' && p.status !== 'execucao').length
    return `O que mais atrasa sua vida agora: **dispersão**. Você tem ${backlog} projeto(s) fora de execução competindo por atenção${lastLog && lastLog.score < 50 ? ` e seu último Life Score foi ${lastLog.score}/100 — sinal de que os hábitos base (sono, foco, treino) precisam de atenção antes de mais ambição` : ''}. Conserte o sistema, não force mais esforço.`
  }
  if (match('desperdiç', 'perdendo tempo', 'perco tempo')) {
    const secondary = ctx.tasks.filter((t) => !t.done && !t.isOneThing).length
    return `Seu maior vazamento de tempo: **tarefas que não movem uma meta**. Há ${secondary} tarefa(s) secundária(s) abertas. Regra: se não serve a um objetivo de 10 anos, é desperdício elegante.`
  }
  if (match('dinheiro', 'ganhar mais', 'renda', 'receita', 'faturar')) {
    const best = ranked[0]
    return best
      ? `Concentre energia em "${best.title}" — é seu projeto de maior prioridade (${computeProjectPriority(best.scores)}/100), com o melhor equilíbrio entre impacto financeiro, escala e automação. Dinheiro segue foco, não esforço espalhado.`
      : `Cadastre seus projetos com notas de impacto/escala/automação. Eu ranqueio e aponto onde seu próximo real deve vir.`
  }
  if (match('delegar', 'terceirizar', 'contratar')) {
    const cand = ctx.tasks.find((t) => !t.done && !t.isOneThing)
    return cand
      ? `Candidato claro a delegar: "${cand.title}". Pergunta-chave: isso exige VOCÊ, ou só exige que alguém faça? Delegação antes de sobrecarga.`
      : `Nada crítico a delegar hoje. Quando uma tarefa se repetir 3×, ela vira sistema (automação) ou vira de outra pessoa (delegação) — nunca sua rotina.`
  }
  if (match('score', 'pontuação', 'como estou', 'como está minha vida')) {
    return lastLog
      ? `Seu último Life Score foi **${lastLog.score}/100** (${lastLog.date}). ${lastLog.score >= 70 ? 'Trajetória forte — mantenha os sistemas.' : 'Abaixo do seu potencial. Foque nos hábitos de maior peso: sono, deep work e treino.'}`
      : `Ainda não há check-in registrado. Faça o check-in diário do Life Score para eu começar a medir sua trajetória.`
  }
  if (match('objetivo', 'meta', 'onde quero chegar')) {
    const fin = ctx.goals.find((g) => g.area === 'financas')
    return fin && fin.target
      ? `Seu norte financeiro: ${fin.title} (${brl(fin.current ?? 0)} de ${brl(fin.target)}). Cada decisão de hoje deveria responder: "isso me aproxima desse número?"`
      : `Defina seus objetivos de longo prazo primeiro — eles são a bússola. Sem destino, prioridade é chute.`
  }
  if (match('ideia', 'banco de ideias')) {
    const news = ctx.ideas.filter((i) => i.status === 'novo').length
    return `Você tem ${news} ideia(s) aguardando avaliação no Banco. Regra do sistema: nenhuma vira ação por impulso — abra cada uma e eu faço a análise de troca contra seu projeto atual.`
  }

  // Fallback — sempre estratégico, nunca genérico.
  return `Reformulo a pergunta que realmente importa: **o que é a melhor coisa que você pode fazer hoje para construir a vida que deseja daqui a 10 anos?**\n\n${active ? `Para você, hoje, a resposta passa por avançar "${active.title}".` : 'Comece definindo seu Projeto Único — sem foco, não há alavanca.'} Pergunte-me sobre foco, dinheiro, o que delegar, o que está te atrasando ou seu Life Score.`
}
