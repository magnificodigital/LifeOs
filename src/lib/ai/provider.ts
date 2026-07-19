// ============================================================================
// Camada de provedor de IA — ponto único de troca para plugar um LLM real.
// ----------------------------------------------------------------------------
// Hoje o app roda 100% offline com o motor de regras (`mentor.ts`). Quando
// você quiser respostas generativas com Claude/OpenAI/Gemini, implemente
// `chatWithLLM` aqui — a UI não muda. Recomendação de produção: NÃO exponha
// chaves no cliente; encaminhe para uma Edge Function (Supabase/Firebase) que
// guarda o segredo e faz a chamada ao modelo, injetando o contexto abaixo.
// ============================================================================
import type { MentorContext } from './mentor'

export type AiProvider = 'local' | 'claude' | 'openai' | 'gemini'

export interface AiSettings {
  provider: AiProvider
  /** Endpoint da sua função serverless (ex.: /api/mentor). Nunca a chave crua. */
  endpoint?: string
}

/**
 * Monta um "system prompt" estratégico que carrega a persona do LifeOS.
 * Reaproveite isto no backend ao chamar o modelo.
 */
export function buildSystemPrompt(ctx: MentorContext): string {
  return [
    'Você é o STARK, o conselheiro pessoal do usuário no LifeOS AI: mentor, estrategista e coach executivo — o CEO da vida dele.',
    'Princípios: 80/20, Essencialismo, Deep Work, One Thing, Atomic Habits, sistema em vez de motivação, automação antes de esforço, delegação antes de sobrecarga.',
    'Toda resposta deve responder: "isso aproxima ou afasta o usuário da vida que ele deseja daqui a 10 anos?".',
    'Desafie o usuário. Proteja o foco. Nunca seja um chatbot genérico.',
    '--- ESTADO ATUAL DA VIDA DO USUÁRIO ---',
    JSON.stringify(
      {
        objetivos: ctx.goals.map((g) => ({ area: g.area, titulo: g.title, atual: g.current, alvo: g.target })),
        projetoEmExecucao: ctx.projects.find((p) => p.status === 'execucao')?.title ?? null,
        totalProjetos: ctx.projects.length,
        tarefasAbertas: ctx.tasks.filter((t) => !t.done).length,
        ideiasNovas: ctx.ideas.filter((i) => i.status === 'novo').length,
        ultimoLifeScore: [...ctx.logs].sort((a, b) => b.date.localeCompare(a.date))[0]?.score ?? null,
      },
      null,
      2,
    ),
  ].join('\n')
}

/**
 * Placeholder para a chamada real ao LLM. Retorna null quando não configurado,
 * sinalizando à UI para usar o motor local (`mentor.answer`).
 */
export async function chatWithLLM(
  _question: string,
  _ctx: MentorContext,
  settings: AiSettings,
): Promise<string | null> {
  if (settings.provider === 'local' || !settings.endpoint) return null
  try {
    const res = await fetch(settings.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: settings.provider,
        system: buildSystemPrompt(_ctx),
        question: _question,
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { answer?: string }
    return data.answer ?? null
  } catch {
    return null
  }
}
