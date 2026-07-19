import { useState } from 'react'
import { Brain, Plug, Cloud, Check, Eye, EyeOff, Copy, UploadCloud, DownloadCloud, Info, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import { useStore } from '@/lib/store'
import { LLM_PROVIDERS } from '@/lib/ai/provider'
import { INTEGRATIONS } from '@/lib/integrations'
import { backupToCloud, restoreFromCloud, SETUP_SQL, SUPABASE_URL } from '@/lib/supabase'
import { Card, Fade, PageHeader } from '@/components/ui'

type Tab = 'llms' | 'integracoes' | 'nuvem'

/**
 * Conexões — o lugar único para configurar o cérebro do STARK (LLMs com
 * modelo + chave de API), as integrações e a nuvem (Supabase).
 */
export default function Connections() {
  const [tab, setTab] = useState<Tab>('llms')
  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-accent-soft">Configuração</p>
      <PageHeader
        title="Conexões"
        subtitle="O cérebro do STARK, suas integrações e a nuvem — tudo num lugar. Chaves ficam somente no seu navegador."
      />

      <div className="mb-5 inline-flex flex-wrap rounded-xl border border-white/10 p-1">
        {(
          [
            { k: 'llms', label: 'Modelos de IA', icon: Brain },
            { k: 'integracoes', label: 'Integrações', icon: Plug },
            { k: 'nuvem', label: 'Nuvem (Supabase)', icon: Cloud },
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

      {tab === 'llms' && <LlmsTab />}
      {tab === 'integracoes' && <IntegrationsTab />}
      {tab === 'nuvem' && <CloudTab />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// LLMs — escolha o ativo, o modelo e cole a chave de cada provedor.
// ---------------------------------------------------------------------------
function LlmsTab() {
  const { ai, setActiveProvider, setProviderConfig } = useStore()
  return (
    <div className="space-y-4">
      <Fade>
        <Card className="border-accent/20 bg-gradient-to-br from-accent/[0.08] to-transparent">
          <p className="section-title mb-2">Cérebro ativo do STARK</p>
          <div className="flex flex-wrap gap-2">
            <ProviderChip label="Motor local (offline)" active={ai.activeProvider === 'local'} onClick={() => setActiveProvider('local')} />
            {LLM_PROVIDERS.map((p) => (
              <ProviderChip
                key={p.key}
                label={p.label}
                active={ai.activeProvider === p.key}
                configured={!!ai.providers[p.key]?.apiKey}
                onClick={() => setActiveProvider(p.key)}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-500">
            O provedor ativo responde no chat do STARK. Sem chave configurada, o app usa o motor estratégico local (grátis, offline).
          </p>
        </Card>
      </Fade>

      {LLM_PROVIDERS.map((def, i) => {
        const cfg = ai.providers[def.key] ?? {}
        return (
          <Fade key={def.key} delay={i * 0.04}>
            <ProviderCard
              def={def}
              apiKey={cfg.apiKey ?? ''}
              model={cfg.model ?? def.defaultModel}
              onKey={(v) => setProviderConfig(def.key, { apiKey: v })}
              onModel={(v) => setProviderConfig(def.key, { model: v })}
            />
          </Fade>
        )
      })}

      <div className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3 text-xs text-amber-100/80">
        <Info size={14} className="mt-0.5 shrink-0 text-amber-300" />
        Suas chaves ficam salvas apenas neste navegador e as chamadas vão direto do app para o provedor — adequado para uso pessoal. Se um dia o LifeOS for multiusuário, movemos as chamadas para o backend.
      </div>
    </div>
  )
}

function ProviderChip({ label, active, configured, onClick }: { label: string; active: boolean; configured?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition',
        active ? 'border-accent bg-accent/15 text-white' : 'border-white/10 text-ink-300 hover:bg-white/5',
      )}
    >
      {active && <Check size={14} className="text-accent-soft" />}
      {label}
      {configured && !active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
    </button>
  )
}

function ProviderCard({
  def,
  apiKey,
  model,
  onKey,
  onModel,
}: {
  def: (typeof LLM_PROVIDERS)[number]
  apiKey: string
  model: string
  onKey: (v: string) => void
  onModel: (v: string) => void
}) {
  const [show, setShow] = useState(false)
  const isCustom = !def.models.includes(model)
  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="font-semibold text-white">{def.label}</p>
        <a href={def.keysUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-accent-soft hover:underline">
          Obter chave <ExternalLink size={11} />
        </a>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Modelo</label>
          <select
            className="input"
            value={isCustom ? '__custom' : model}
            onChange={(e) => onModel(e.target.value === '__custom' ? '' : e.target.value)}
          >
            {def.models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            <option value="__custom">Outro (digitar ID)...</option>
          </select>
          {isCustom && (
            <input
              className="input mt-2"
              placeholder="ID do modelo (ex.: o mais novo lançado)"
              value={model}
              onChange={(e) => onModel(e.target.value)}
              autoFocus
            />
          )}
        </div>
        <div>
          <label className="label">Chave de API</label>
          <div className="flex gap-2">
            <input
              className="input"
              type={show ? 'text' : 'password'}
              placeholder={def.keyPlaceholder}
              value={apiKey}
              onChange={(e) => onKey(e.target.value)}
              autoComplete="off"
            />
            <button className="btn-outline shrink-0 !px-3" onClick={() => setShow((v) => !v)} title={show ? 'Ocultar' : 'Mostrar'}>
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {apiKey && <p className="mt-1 text-[11px] text-emerald-400/80">✓ Chave salva neste navegador</p>}
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Integrações — LiveKit, Calendar, WhatsApp, GloryFit Pro, Gmail.
// ---------------------------------------------------------------------------
function IntegrationsTab() {
  const { integrations, setIntegration } = useStore()
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {INTEGRATIONS.map((def, i) => {
        const st = integrations[def.key] ?? { enabled: false, values: {} }
        return (
          <Fade key={def.key} delay={i * 0.04}>
            <Card className="h-full">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{def.emoji}</span>
                  <div>
                    <p className="font-semibold text-white">{def.label}</p>
                    <p className="text-xs text-ink-500">{def.desc}</p>
                  </div>
                </div>
                <Toggle on={st.enabled} onChange={(v) => setIntegration(def.key, { enabled: v })} />
              </div>

              {st.enabled && def.fields.length > 0 && (
                <div className="mt-3 space-y-2.5">
                  {def.fields.map((f) => (
                    <div key={f.key}>
                      <label className="label">{f.label}</label>
                      <input
                        className="input"
                        type={f.secret ? 'password' : 'text'}
                        placeholder={f.placeholder}
                        value={st.values[f.key] ?? ''}
                        onChange={(e) => setIntegration(def.key, { values: { ...st.values, [f.key]: e.target.value } })}
                      />
                    </div>
                  ))}
                </div>
              )}

              {def.note && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-white/[0.03] p-2.5 text-[11px] leading-relaxed text-ink-500">
                  <Info size={13} className="mt-0.5 shrink-0 text-ink-500" />
                  {def.note}
                </div>
              )}
            </Card>
          </Fade>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Nuvem — Supabase: backup e restauração do estado do app.
// ---------------------------------------------------------------------------
function CloudTab() {
  const store = useStore()
  const { supabase, setSupabase, importState } = store
  const [busy, setBusy] = useState<'backup' | 'restore' | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [showSql, setShowSql] = useState(false)
  const [copied, setCopied] = useState(false)

  const snapshot = () => {
    const {
      goals, metas, tasks, projects, ideas, logs, habits, habitLog,
      notes, finances, dailyReviews, weeklyReviews,
    } = store
    return { goals, metas, tasks, projects, ideas, logs, habits, habitLog, notes, finances, dailyReviews, weeklyReviews }
  }

  const doBackup = async () => {
    setBusy('backup')
    const r = await backupToCloud(supabase, snapshot())
    setMsg({ ok: r.ok, text: r.message })
    if (r.ok) setSupabase({ lastSync: new Date().toISOString() })
    setBusy(null)
  }

  const doRestore = async () => {
    if (!confirm('Restaurar vai SUBSTITUIR os dados atuais deste navegador pelos da nuvem. Continuar?')) return
    setBusy('restore')
    const { result, data } = await restoreFromCloud(supabase)
    setMsg({ ok: result.ok, text: result.message })
    if (result.ok && data) importState(data as Record<string, unknown>)
    setBusy(null)
  }

  return (
    <div className="space-y-4">
      <Fade>
        <Card>
          <p className="section-title mb-1">Projeto Supabase</p>
          <p className="break-all font-mono text-sm text-ink-300">{SUPABASE_URL}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Anon public key</label>
              <input
                className="input"
                type="password"
                placeholder="eyJhbGciOi... (Settings → API → anon public)"
                value={supabase.anonKey ?? ''}
                onChange={(e) => setSupabase({ anonKey: e.target.value })}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="label">Código de sincronização</label>
              <input
                className="input"
                placeholder="ex.: willy-lifeos-2026 (invente um e guarde)"
                value={supabase.syncId ?? ''}
                onChange={(e) => setSupabase({ syncId: e.target.value })}
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-ink-500">
            O código identifica o SEU backup — use o mesmo em outros dispositivos para puxar seus dados. Trate-o como um segredo.
          </p>
        </Card>
      </Fade>

      <Fade delay={0.05}>
        <Card>
          <p className="section-title mb-3">Primeira vez? Crie a tabela</p>
          <p className="mb-3 text-sm text-ink-400">
            No painel do Supabase, abra o <strong className="text-ink-200">SQL Editor</strong> e rode este script uma única vez:
          </p>
          <button className="btn-outline mb-2" onClick={() => setShowSql((v) => !v)}>
            {showSql ? 'Ocultar SQL' : 'Ver SQL de setup'}
          </button>
          {showSql && (
            <div className="relative">
              <pre className="overflow-x-auto rounded-xl bg-black/40 p-4 text-xs leading-relaxed text-emerald-200">{SETUP_SQL}</pre>
              <button
                className="btn-ghost absolute right-2 top-2 !px-2 !py-1 text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(SETUP_SQL)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          )}
        </Card>
      </Fade>

      <Fade delay={0.08}>
        <Card>
          <p className="section-title mb-3">Backup & Restauração</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" disabled={busy !== null} onClick={doBackup}>
              <UploadCloud size={16} /> {busy === 'backup' ? 'Enviando...' : 'Salvar na nuvem'}
            </button>
            <button className="btn-outline" disabled={busy !== null} onClick={doRestore}>
              <DownloadCloud size={16} /> {busy === 'restore' ? 'Restaurando...' : 'Restaurar da nuvem'}
            </button>
          </div>
          {supabase.lastSync && (
            <p className="mt-2 text-xs text-ink-500">Último backup: {new Date(supabase.lastSync).toLocaleString('pt-BR')}</p>
          )}
          {msg && (
            <p className={clsx('mt-3 rounded-xl p-3 text-sm', msg.ok ? 'bg-emerald-400/10 text-emerald-200' : 'bg-red-400/10 text-red-200')}>
              {msg.text}
            </p>
          )}
        </Card>
      </Fade>
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={clsx('relative h-6 w-11 shrink-0 rounded-full transition', on ? 'bg-accent' : 'bg-white/10')}
      role="switch"
      aria-checked={on}
    >
      <span className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  )
}
