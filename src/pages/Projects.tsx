import { useState } from 'react'
import { Plus, Play, Trash2, Sliders, Sparkles, Lock } from 'lucide-react'
import { clsx } from 'clsx'
import { useStore } from '@/lib/store'
import {
  PROJECT_STATUS_LABEL,
  SCORE_CRITERIA,
  emptyScores,
  type Project,
  type ProjectStatus,
} from '@/lib/types'
import { computeProjectPriority, rankProjects, scoreColor } from '@/lib/scoring'
import { Card, Fade, PageHeader, ProgressBar, Slider } from '@/components/ui'

const STATUS_STYLE: Record<ProjectStatus, string> = {
  execucao: 'bg-emerald-400/10 text-emerald-300',
  incubacao: 'bg-indigo-400/10 text-indigo-300',
  backlog: 'bg-amber-400/10 text-amber-300',
  arquivo: 'bg-white/5 text-ink-500',
}

export default function Projects() {
  const { projects, addProject, updateProject, setProjectScores, setInExecution, removeProject } = useStore()
  const ranked = rankProjects(projects)
  const inExecution = projects.find((p) => p.status === 'execucao')
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [blocked, setBlocked] = useState<Project | null>(null)

  return (
    <div>
      <PageHeader
        title="Projetos"
        subtitle="A IA ranqueia por prioridade. Somente UM pode estar em execução — foco dividido é velocidade dividida."
        action={
          <button className="btn-primary" onClick={() => setCreating((v) => !v)}>
            <Plus size={16} /> Novo projeto
          </button>
        }
      />

      {creating && (
        <NewProject
          onCancel={() => setCreating(false)}
          onCreate={(title, desc) => {
            addProject({ title, description: desc, status: 'backlog', scores: emptyScores() })
            setCreating(false)
          }}
        />
      )}

      {/* Recomendação da IA: por onde começar e em que ordem */}
      {ranked.length > 0 && !inExecution && (
        <Fade>
          <Card className="mb-4 border-accent/20 bg-gradient-to-br from-accent/[0.1] to-transparent">
            <div className="flex items-start gap-3">
              <Sparkles size={18} className="mt-0.5 shrink-0 text-accent-soft" />
              <div>
                <p className="section-title !text-accent-soft">Recomendação da IA — comece por aqui</p>
                <p className="mt-1 text-white">
                  Coloque <strong>"{ranked[0].title}"</strong> em execução primeiro (prioridade{' '}
                  {computeProjectPriority(ranked[0].scores)}/100).{' '}
                  {ranked[1] && (
                    <>
                      Depois: <span className="text-ink-300">{ranked.slice(1, 3).map((p) => p.title).join(' → ')}</span>.
                    </>
                  )}
                </p>
                <p className="mt-1.5 text-sm text-ink-400">
                  Um projeto de cada vez. Termine (ou valide) antes de abrir o próximo — é assim que você sai do zero mais rápido.
                </p>
                <button className="btn-primary mt-3 !py-1.5" onClick={() => setInExecution(ranked[0].id)}>
                  <Play size={14} /> Executar "{ranked[0].title}"
                </button>
              </div>
            </div>
          </Card>
        </Fade>
      )}

      <div className="space-y-3">
        {ranked.map((p, i) => {
          const priority = computeProjectPriority(p.scores)
          return (
            <Fade key={p.id} delay={i * 0.04}>
              <Card hover className="group">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-white/10" style={{ color: scoreColor(priority) }}>
                      <span className="text-base font-bold leading-none">{priority}</span>
                      <span className="text-[8px] uppercase tracking-wide text-ink-600">pri</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{p.title}</h3>
                        <span className={clsx('chip', STATUS_STYLE[p.status])}>{PROJECT_STATUS_LABEL[p.status]}</span>
                      </div>
                      {p.description && <p className="mt-0.5 text-sm text-ink-400">{p.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {p.status !== 'execucao' && (
                      <button
                        className="btn-outline !py-1.5"
                        onClick={() => {
                          if (inExecution && inExecution.id !== p.id) setBlocked(p)
                          else setInExecution(p.id)
                        }}
                      >
                        <Play size={14} /> Executar
                      </button>
                    )}
                    <select
                      className="rounded-xl border border-white/10 bg-ink-900 px-2 py-1.5 text-xs text-ink-300"
                      value={p.status}
                      onChange={(e) => {
                        const v = e.target.value as ProjectStatus
                        if (v === 'execucao') {
                          if (inExecution && inExecution.id !== p.id) return setBlocked(p)
                          return setInExecution(p.id)
                        }
                        updateProject(p.id, { status: v })
                      }}
                    >
                      {(Object.keys(PROJECT_STATUS_LABEL) as ProjectStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {PROJECT_STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => setEditing(editing === p.id ? null : p.id)} className="btn-ghost !px-2 !py-1.5">
                      <Sliders size={15} />
                    </button>
                    <button onClick={() => removeProject(p.id)} className="text-ink-700 hover:text-red-400">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {editing === p.id && (
                  <div className="mt-4 grid gap-3 rounded-xl bg-white/[0.02] p-4 sm:grid-cols-2">
                    {SCORE_CRITERIA.map((c) => (
                      <Slider
                        key={c.key}
                        label={c.label}
                        value={p.scores[c.key]}
                        onChange={(v) => setProjectScores(p.id, { ...p.scores, [c.key]: v })}
                      />
                    ))}
                    <p className="text-xs text-ink-600 sm:col-span-2">
                      A prioridade é recalculada automaticamente. Alto impacto + escala + automação + simplicidade sobem no ranking.
                    </p>
                  </div>
                )}
              </Card>
            </Fade>
          )
        })}
      </div>

      {/* Bloqueio da Regra do Projeto Único */}
      {blocked && inExecution && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="max-w-md">
            <div className="mb-3 flex items-center gap-2 text-amber-300">
              <Lock size={18} />
              <p className="font-semibold">Regra do Projeto Único</p>
            </div>
            <p className="text-sm text-ink-300">
              Você já tem <strong className="text-white">"{inExecution.title}"</strong> em execução. Manter dois projetos ativos ao
              mesmo tempo reduz drasticamente sua velocidade.
            </p>
            <div className="mt-3 rounded-xl bg-white/[0.03] p-3 text-sm text-ink-300">
              <p className="mb-1 flex items-center gap-1.5 text-accent-soft">
                <Sparkles size={13} /> Análise da IA
              </p>
              Prioridade de "{blocked.title}": <strong className="text-white">{computeProjectPriority(blocked.scores)}</strong> vs. "
              {inExecution.title}": <strong className="text-white">{computeProjectPriority(inExecution.scores)}</strong>.{' '}
              {computeProjectPriority(blocked.scores) > computeProjectPriority(inExecution.scores)
                ? 'A nova tem prioridade maior — mas troque com intenção, não por impulso.'
                : 'A atual ainda é mais valiosa. Recomendo manter o foco.'}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                className="btn-primary"
                onClick={() => {
                  setInExecution(blocked.id)
                  setBlocked(null)
                }}
              >
                Trocar mesmo assim
              </button>
              <button className="btn-ghost" onClick={() => setBlocked(null)}>
                Manter o foco atual
              </button>
            </div>
          </Card>
        </div>
      )}

      <Fade delay={0.1}>
        <Card className="mt-4">
          <p className="section-title mb-3">Ranking de prioridade</p>
          <div className="space-y-2.5">
            {ranked.map((p) => (
              <div key={p.id} className="flex items-center gap-3 text-sm">
                <span className="w-40 shrink-0 truncate text-ink-300">{p.title}</span>
                <div className="flex-1">
                  <ProgressBar value={computeProjectPriority(p.scores)} />
                </div>
                <span className="w-8 text-right font-semibold text-white">{computeProjectPriority(p.scores)}</span>
              </div>
            ))}
          </div>
        </Card>
      </Fade>
    </div>
  )
}

function NewProject({ onCreate, onCancel }: { onCreate: (title: string, desc: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  return (
    <Card className="mb-4">
      <div className="grid gap-2">
        <input className="input" placeholder="Nome do projeto" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="input" placeholder="Descrição curta" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <p className="text-xs text-ink-500">Depois de criar, ajuste as 8 notas para a IA calcular a prioridade.</p>
      </div>
      <div className="mt-3 flex gap-2">
        <button className="btn-primary" disabled={!title.trim()} onClick={() => onCreate(title.trim(), desc.trim())}>
          Criar
        </button>
        <button className="btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </Card>
  )
}
