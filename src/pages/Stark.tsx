import { useState } from 'react'
import { MessageSquare, Settings, BookOpen, Mic, Plug, Info } from 'lucide-react'
import { clsx } from 'clsx'
import { useStore } from '@/lib/store'
import type { AiProvider, IntegrationKey } from '@/lib/ai/provider'
import { PRINCIPLES } from '@/lib/principles'
import Assistant from './Assistant'
import { Card, Fade, PageHeader } from '@/components/ui'

type Tab = 'conversa' | 'config' | 'principios'

export default function Stark() {
  const [tab, setTab] = useState<Tab>('conversa')
  return (
    <div>
      <div className="mb-5 inline-flex flex-wrap rounded-xl border border-white/10 p-1">
        {(
          [
            { k: 'conversa', label: 'Conversa', icon: MessageSquare },
            { k: 'config', label: 'Configurar (Jarvis)', icon: Settings },
            { k: 'principios', label: 'Princípios', icon: BookOpen },
          ] as const
        ).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={clsx(
              'flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition',
              tab === t.k ? 'bg-white/10 text-white' : 'text-ink-400 hover:text-ink-100',
            )}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'conversa' && <Assistant />}
      {tab === 'config' && <StarkConfig />}
      {tab === 'principios' && <StarkPrinciples />}
    </div>
  )
}

const INTEGRATIONS: { key: IntegrationKey; label: string; desc: string }[] = [
  { key: 'calendar', label: 'Calendário', desc: 'Google/Apple Calendar — compromissos e tempo livre' },
  { key: 'health', label: 'Saúde', desc: 'Apple Health / Google Fit / Health Connect' },
  { key: 'whatsapp', label: 'WhatsApp', desc: 'Lembretes e captura por mensagem' },
  { key: 'email', label: 'E-mail', desc: 'Resumos e triagem da caixa de entrada' },
  { key: 'notion', label: 'Notion', desc: 'Notas e bases de conhecimento' },
  { key: 'drive', label: 'Google Drive', desc: 'Documentos e arquivos' },
  { key: 'bank', label: 'Bancos & Investimentos', desc: 'Saldo, receitas e patrimônio (Open Finance)' },
]

function StarkConfig() {
  const { ai, setAi } = useStore()
  const integrations = ai.integrations ?? {}
  const providers: { key: AiProvider; label: string }[] = [
    { key: 'local', label: 'Local (offline)' },
    { key: 'claude', label: 'Claude' },
    { key: 'openai', label: 'OpenAI' },
    { key: 'gemini', label: 'Gemini' },
  ]

  return (
    <div>
      <PageHeader title="Configurar o STARK" subtitle="Transforme o STARK no seu Jarvis: escolha o cérebro, ative a voz e conecte suas fontes." />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Cérebro */}
        <Fade>
          <Card>
            <p className="section-title mb-3">Cérebro do STARK</p>
            <label className="label">Modelo de linguagem</label>
            <select className="input" value={ai.provider} onChange={(e) => setAi({ provider: e.target.value as AiProvider })}>
              {providers.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
            {ai.provider !== 'local' && (
              <div className="mt-3">
                <label className="label">Endpoint do seu backend (emite a resposta com sua chave)</label>
                <input className="input" placeholder="https://seu-app.functions/mentor" value={ai.endpoint ?? ''} onChange={(e) => setAi({ endpoint: e.target.value })} />
              </div>
            )}
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-white/[0.03] p-3 text-xs text-ink-400">
              <Info size={14} className="mt-0.5 shrink-0 text-accent-soft" />
              Por segurança, a chave do modelo nunca fica no app. Ela vive no seu backend (ex.: Supabase Edge Function), que recebe o contexto e devolve a resposta. Sem backend, o STARK usa o motor estratégico local.
            </div>
          </Card>
        </Fade>

        {/* Modo Jarvis / voz */}
        <Fade delay={0.05}>
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <p className="section-title flex items-center gap-1.5">
                <Mic size={13} className="text-accent-soft" /> Modo Jarvis (voz)
              </p>
              <Toggle on={!!ai.voiceEnabled} onChange={(v) => setAi({ voiceEnabled: v })} />
            </div>
            <p className="mb-3 text-sm text-ink-400">Conversa por voz em tempo real via LiveKit — falar e ouvir o STARK, como o Jarvis.</p>
            <label className="label">LiveKit URL (wss://…)</label>
            <input className="input" placeholder="wss://seu-projeto.livekit.cloud" value={ai.livekitUrl ?? ''} onChange={(e) => setAi({ livekitUrl: e.target.value })} disabled={!ai.voiceEnabled} />
            <label className="label mt-3">Endpoint de token (backend)</label>
            <input className="input" placeholder="https://seu-app.functions/livekit-token" value={ai.livekitTokenEndpoint ?? ''} onChange={(e) => setAi({ livekitTokenEndpoint: e.target.value })} disabled={!ai.voiceEnabled} />
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3 text-xs text-amber-100/80">
              <Info size={14} className="mt-0.5 shrink-0 text-amber-300" />
              A voz em tempo real precisa de um servidor LiveKit + um agente de voz (STT → LLM → TTS) rodando no backend. Esta tela guarda a configuração; a conexão entra quando o backend estiver no ar.
            </div>
          </Card>
        </Fade>

        {/* Integrações */}
        <Fade delay={0.1}>
          <Card className="lg:col-span-2">
            <p className="section-title mb-1 flex items-center gap-1.5">
              <Plug size={13} className="text-accent-soft" /> Integrações — para o STARK "saber de tudo"
            </p>
            <p className="mb-4 text-sm text-ink-400">Marque o que você quer conectar. Cada fonte dá mais contexto ao STARK. (Conexões entram com o backend; por ora registram sua intenção.)</p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {INTEGRATIONS.map((it) => (
                <label key={it.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 hover:bg-white/[0.04]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-accent"
                    checked={!!integrations[it.key]}
                    onChange={(e) => setAi({ integrations: { ...integrations, [it.key]: e.target.checked } })}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink-100">{it.label}</p>
                    <p className="text-xs text-ink-500">{it.desc}</p>
                  </div>
                  <span className="chip bg-white/5 text-[10px] text-ink-500">em breve</span>
                </label>
              ))}
            </div>
          </Card>
        </Fade>
      </div>
    </div>
  )
}

function StarkPrinciples() {
  return (
    <div>
      <PageHeader
        title="Os princípios do STARK"
        subtitle="O STARK pensa a partir destes pensadores. São a alma do LifeOS — cada um molda uma parte concreta do app."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {PRINCIPLES.map((p, i) => (
          <Fade key={p.author} delay={i * 0.04}>
            <Card hover className="h-full">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{p.emoji}</span>
                <div>
                  <p className="font-semibold text-white">{p.author}</p>
                  <p className="text-xs text-ink-500">{p.work}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-ink-200">{p.idea}</p>
              <div className="mt-3 rounded-xl bg-white/[0.03] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-soft">No LifeOS</p>
                <p className="mt-0.5 text-sm text-ink-300">{p.inApp}</p>
              </div>
            </Card>
          </Fade>
        ))}
      </div>
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={clsx('relative h-6 w-11 rounded-full transition', on ? 'bg-accent' : 'bg-white/10')}
      role="switch"
      aria-checked={on}
    >
      <span className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  )
}
