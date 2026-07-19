// ============================================================================
// Provedores de LLM — o cérebro do STARK.
// ----------------------------------------------------------------------------
// Suporta OpenAI, Gemini, Claude, DeepSeek e Kimi. As chaves ficam SOMENTE no
// seu navegador (localStorage) e as chamadas vão direto do app para o
// provedor. Cada provedor tem uma lista de modelos editável — você pode
// digitar o ID do modelo mais novo assim que ele sair.
//
// Aviso: chave no navegador é aceitável para uso pessoal (a chave é sua e o
// app roda na sua máquina). Para um produto multiusuário, mova as chamadas
// para um backend (ex.: Supabase Edge Function).
// ============================================================================
import { recurringIncome, type MentorContext } from './mentor'
import { computeStreak } from '../game'

export type LlmProviderKey = 'openai' | 'gemini' | 'claude' | 'deepseek' | 'kimi'

export interface LlmProviderDef {
  key: LlmProviderKey
  label: string
  /** Modelos sugeridos (o campo é editável — digite qualquer ID novo). */
  models: string[]
  defaultModel: string
  keyPlaceholder: string
  keysUrl: string
}

export const LLM_PROVIDERS: LlmProviderDef[] = [
  {
    key: 'claude',
    label: 'Claude (Anthropic)',
    models: ['claude-opus-4-8', 'claude-sonnet-5', 'claude-haiku-4-5'],
    defaultModel: 'claude-opus-4-8',
    keyPlaceholder: 'sk-ant-...',
    keysUrl: 'https://platform.claude.com/settings/keys',
  },
  {
    key: 'openai',
    label: 'OpenAI',
    models: ['gpt-5', 'gpt-5-mini', 'gpt-4.1', 'gpt-4o'],
    defaultModel: 'gpt-5',
    keyPlaceholder: 'sk-...',
    keysUrl: 'https://platform.openai.com/api-keys',
  },
  {
    key: 'gemini',
    label: 'Gemini (Google)',
    models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
    defaultModel: 'gemini-2.5-pro',
    keyPlaceholder: 'AIza...',
    keysUrl: 'https://aistudio.google.com/apikey',
  },
  {
    key: 'deepseek',
    label: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
    keyPlaceholder: 'sk-...',
    keysUrl: 'https://platform.deepseek.com/api_keys',
  },
  {
    key: 'kimi',
    label: 'Kimi (Moonshot)',
    models: ['kimi-k2-0711-preview', 'moonshot-v1-128k', 'moonshot-v1-32k'],
    defaultModel: 'kimi-k2-0711-preview',
    keyPlaceholder: 'sk-...',
    keysUrl: 'https://platform.moonshot.ai/console/api-keys',
  },
]

export interface LlmConfig {
  apiKey?: string
  model?: string
}

export interface AiSettings {
  /** 'local' usa o motor de regras offline; caso contrário, um LlmProviderKey. */
  activeProvider: 'local' | LlmProviderKey
  providers: Partial<Record<LlmProviderKey, LlmConfig>>
}

export function defaultAiSettings(): AiSettings {
  return { activeProvider: 'local', providers: {} }
}

/** System prompt do STARK — a persona + o estado atual da vida do usuário. */
export function buildSystemPrompt(ctx: MentorContext): string {
  return [
    'Você é o STARK, o conselheiro pessoal do usuário no LifeOS AI: mentor, estrategista e coach executivo — o CEO da vida dele.',
    'Princípios: 80/20 (Tim Ferriss), eficácia (Drucker), alavancagem (Naval), hábitos atômicos (James Clear), capturar tudo (GTD/David Allen), dor+reflexão=progresso (Ray Dalio), biohacking.',
    'Toda resposta deve responder: "isso aproxima ou afasta o usuário da vida que ele deseja daqui a 10 anos?".',
    'Desafie o usuário. Proteja o foco. Seja direto e prático. Responda em português brasileiro. Nunca seja um chatbot genérico.',
    '--- ESTADO ATUAL DA VIDA DO USUÁRIO ---',
    JSON.stringify(
      {
        objetivos: ctx.goals.map((g) => ({
          area: g.area,
          titulo: g.title,
          atual: g.current,
          alvo: g.target,
          passosConcluidos: g.steps.filter((s) => s.done).length,
          totalPassos: g.steps.length,
        })),
        projetoEmExecucao: ctx.projects.find((p) => p.status === 'execucao')?.title ?? null,
        totalProjetos: ctx.projects.length,
        tarefasAbertas: ctx.tasks.filter((t) => !t.done).length,
        ideiasNovas: ctx.ideas.filter((i) => i.status === 'novo').length,
        ultimoLifeScore: [...ctx.logs].sort((a, b) => b.date.localeCompare(a.date))[0]?.score ?? null,
        ofensivaDias: ctx.habitLog ? computeStreak(ctx.habitLog, ctx.today) : 0,
        habitosHoje: {
          feitos: ctx.habitLog?.[ctx.today]?.length ?? 0,
          total: (ctx.habits ?? []).filter((h) => h.active).length,
        },
        rendaMensalRecorrente: recurringIncome(ctx),
        lancamentosFinanceiros: (ctx.finances ?? []).slice(0, 15).map((f) => ({
          tipo: f.type, valor: f.amount, descricao: f.label, recorrente: f.recurring,
        })),
        notasRecentes: (ctx.notes ?? []).slice(0, 10).map((n) => ({ tipo: n.kind, texto: n.text })),
      },
      null,
      2,
    ),
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Chamadas diretas a cada provedor (formato de cada API).
// ---------------------------------------------------------------------------
async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  system: string,
  question: string,
): Promise<string | null> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: question },
      ],
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? null
}

async function callClaude(apiKey: string, model: string, system: string, question: string): Promise<string | null> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      // Necessário para chamadas direto do navegador (uso pessoal, chave própria).
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: question }],
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const text = (data.content ?? []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('')
  return text || null
}

async function callGemini(apiKey: string, model: string, system: string, question: string): Promise<string | null> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: question }] }],
      }),
    },
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? null
}

export interface LlmResult {
  text: string | null
  error?: string
}

/**
 * Chama o LLM ativo. Retorna { text: null } quando não configurado
 * (a UI cai no motor local) e { error } quando a chamada falha.
 */
export async function chatWithLLM(question: string, ctx: MentorContext, settings: AiSettings): Promise<LlmResult> {
  const provider = settings.activeProvider
  if (provider === 'local') return { text: null }
  const cfg = settings.providers[provider]
  const def = LLM_PROVIDERS.find((p) => p.key === provider)
  if (!cfg?.apiKey || !def) return { text: null }
  const model = cfg.model || def.defaultModel
  const system = buildSystemPrompt(ctx)

  try {
    switch (provider) {
      case 'claude':
        return { text: await callClaude(cfg.apiKey, model, system, question) }
      case 'openai':
        return { text: await callOpenAICompatible('https://api.openai.com/v1', cfg.apiKey, model, system, question) }
      case 'deepseek':
        return { text: await callOpenAICompatible('https://api.deepseek.com', cfg.apiKey, model, system, question) }
      case 'kimi':
        return { text: await callOpenAICompatible('https://api.moonshot.ai/v1', cfg.apiKey, model, system, question) }
      case 'gemini':
        return { text: await callGemini(cfg.apiKey, model, system, question) }
    }
  } catch (e) {
    return { text: null, error: e instanceof Error ? e.message : 'Falha na chamada ao modelo' }
  }
}
