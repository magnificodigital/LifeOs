import { useMemo, useState } from 'react'
import {
  Plus, Play, Trash2, Sliders, Sparkles, Lock, Pencil, Check, X,
  ListTodo, Link2, ChevronDown, ChevronUp,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useStore } from '@/lib/store'
import {
  PROJECT_STATUS_LABEL,
  SCORE_CRITERIA,
  emptyScores,
  type Project,
  type ProjectStatus,
  type Task,
} from '@/lib/types'
import { computeProjectPriority, rankProjects, scoreColor } from '@/lib/scoring'
import { Card, Fade, PageHeader, Slider } from '@/components/ui'
import { todayISO } from '@/lib/utils'

const STATUS_STYLE: Record<ProjectStatus, string> = {
  execucao: 'bg-emerald-400/10 text-emerald-300',
  incubacao: 'bg-indigo-400/10 text-indigo-300',
  backlog: 'bg-amber-400/10 text-amber-300',
  arquivo: 'bg-white/5 text-ink-500',
}

export default function Projects() {
  const { projects, addProject, setInExecution } = useStore()
  const visible = projects.filter((p) => p.status !== 'arquivo') // ordem do usuário
  const ranked = rankProjects(visible) // ordem sugerida pelo STARK
  const inExecution = projects.find((p) => p.status === 'execucao')
  const [creating, setCreating] = useState(false)
  const [blocked, setBlocked] = useState<Project | null>(null)

  // "Gerador de caixa": retorno rápido mas sem escala — companheiro tático.
  const cashGen = useMemo(
    () => ranked.find((p) => p.scores.tempoRetorno >= 8 && p.scores.escalabilidade <= 4),
    [ranked],
  )

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

      {/* Recomendação estratégica do STARK */}
      {ranked.length > 0 && (
        <Fade>
          <Card className="mb-4 border-accent/20 bg-gradient-to-br from-accent/[0.1] to-transparent">
            <div className="flex items-start gap-3">
              <Sparkles size={18} className="mt-0.5 shrink-0 text-accent-soft" />
              <div className="flex-1">
                <p className="section-title !text-accent-soft">Leitura do STARK — ordem recomendada</p>
                <ol className="mt-2 space-y-1 text-sm">
                  {ranked.slice(0, 6).map((p, i) => (
                    <li key={p.id} className="flex items-center gap-2">
                      <span className={clsx('flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold', i === 0 ? 'bg-accent text-white' : 'bg-white/10 text-ink-400')}>
                        {i + 1}
                      </span>
                      <span className={i === 0 ? 'font-semibold text-white' : 'text-ink-300'}>{p.title}</span>
                      <span className="text-xs text-ink-600">({computeProjectPriority(p.scores)})</span>
                      {p.id === inExecution?.id && <span className="chip bg-emerald-400/10 text-emerald-300">em execução</span>}
                    </li>
                  ))}
                </ol>
                <p className="mt-2 text-[11px] text-ink-600">É só uma sugestão — abaixo você organiza os projetos na SUA ordem (setas ↑↓).</p>
                {cashGen && ranked[0] && cashGen.id !== ranked[0].id && (
                  <p className="mt-3 rounded-xl bg-white/[0.04] p-3 text-sm text-ink-300">
                    💡 <strong className="text-white">{cashGen.title}</strong> não escala, mas é seu caixa mais rápido. Estratégia: mantenha{' '}
                    <strong className="text-white">"{ranked[0].title}"</strong> como Projeto Único e use {cashGen.title.toLowerCase()} como
                    gerador de caixa tático (poucas horas/semana) enquanto a receita recorrente não chega — cada cliente vira case e parceiro.
                  </p>
                )}
                {!inExecution && (
                  <button className="btn-primary mt-3 !py-1.5" onClick={() => setInExecution(ranked[0].id)}>
                    <Play size={14} /> Executar "{ranked[0].title}"
                  </button>
                )}
              </div>
            </div>
          </Card>
        </Fade>
      )}

      <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-ink-500">Seus projetos (na sua ordem)</p>
      <div className="space-y-3">
        {visible.map((p, i) => (
          <Fade key={p.id} delay={i * 0.03}>
            <ProjectCard project={p} first={i === 0} last={i === visible.length - 1} onBlockedExecute={() => setBlocked(p)} />
          </Fade>
        ))}
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
                <Sparkles size={13} /> Análise do STARK
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
                  useStore.getState().setInExecution(blocked.id)
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
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cartão de projeto: editar, avaliar (notas) e gerar tarefas.
// ---------------------------------------------------------------------------
function ProjectCard({ project: p, first, last, onBlockedExecute }: { project: Project; first: boolean; last: boolean; onBlockedExecute: () => void }) {
  const { projects, goals, tasks, updateProject, setProjectScores, setInExecution, removeProject, moveProject, addTask, toggleTask, updateTask, removeTask } = useStore()
  const inExecution = projects.find((x) => x.status === 'execucao')
  const priority = computeProjectPriority(p.scores)

  const [editing, setEditing] = useState(false)
  const [showScores, setShowScores] = useState(false)
  const [showTasks, setShowTasks] = useState(p.status === 'execucao')
  const [title, setTitle] = useState(p.title)
  const [desc, setDesc] = useState(p.description ?? '')
  const [newTask, setNewTask] = useState('')

  const projTasks = tasks.filter((t) => t.projectId === p.id)
  const openCount = projTasks.filter((t) => !t.done).length
  const goal = goals.find((g) => g.id === p.goalId)

  const saveEdit = () => {
    updateProject(p.id, { title: title.trim() || p.title, description: desc.trim() || undefined })
    setEditing(false)
  }

  return (
    <Card hover className="group">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <div className="mt-0.5 flex flex-col">
            <button onClick={() => moveProject(p.id, -1)} disabled={first} className="text-ink-600 hover:text-ink-200 disabled:opacity-20" title="Subir">
              <ChevronUp size={15} />
            </button>
            <button onClick={() => moveProject(p.id, 1)} disabled={last} className="text-ink-600 hover:text-ink-200 disabled:opacity-20" title="Descer">
              <ChevronDown size={15} />
            </button>
          </div>
          <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-white/10" style={{ color: scoreColor(priority) }} title="Prioridade calculada pelo STARK">
            <span className="text-base font-bold leading-none">{priority}</span>
            <span className="text-[8px] uppercase tracking-wide text-ink-600">pri</span>
          </div>
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="space-y-2">
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
                <textarea className="input min-h-[70px]" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição, modelo de negócio, bloqueios..." />
                <div className="flex items-center gap-2">
                  <select
                    className="input !w-auto"
                    value={p.goalId ?? ''}
                    onChange={(e) => updateProject(p.id, { goalId: e.target.value || undefined })}
                  >
                    <option value="">Sem objetivo vinculado</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        🎯 {g.title}
                      </option>
                    ))}
                  </select>
                  <button className="btn-primary !py-1.5" onClick={saveEdit}>
                    <Check size={14} /> Salvar
                  </button>
                  <button className="btn-ghost !py-1.5" onClick={() => { setEditing(false); setTitle(p.title); setDesc(p.description ?? '') }}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-white">{p.title}</h3>
                  <span className={clsx('chip', STATUS_STYLE[p.status])}>{PROJECT_STATUS_LABEL[p.status]}</span>
                  <button onClick={() => setEditing(true)} className="text-ink-600 opacity-0 transition group-hover:opacity-100 hover:text-ink-200" title="Editar projeto">
                    <Pencil size={13} />
                  </button>
                </div>
                {p.description && <p className="mt-0.5 text-sm leading-snug text-ink-400">{p.description}</p>}
                {goal && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-600">
                    <Link2 size={10} /> alinha com: {goal.title}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {p.status !== 'execucao' && (
            <button
              className="btn-outline !py-1.5"
              onClick={() => {
                if (inExecution && inExecution.id !== p.id) onBlockedExecute()
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
                if (inExecution && inExecution.id !== p.id) return onBlockedExecute()
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
          <button onClick={() => setShowScores((v) => !v)} className={clsx('btn-ghost !px-2 !py-1.5', showScores && 'bg-white/10')} title="Avaliar (notas)">
            <Sliders size={15} />
          </button>
          <button
            onClick={() => {
              if (confirm(`Excluir o projeto "${p.title}"?`)) removeProject(p.id)
            }}
            className="text-ink-700 hover:text-red-400"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Notas de avaliação */}
      {showScores && (
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
            A prioridade recalcula na hora. Alto impacto + escala + automação + simplicidade sobem no ranking.
          </p>
        </div>
      )}

      {/* Tarefas do projeto */}
      <button
        onClick={() => setShowTasks((v) => !v)}
        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-ink-100"
      >
        <ListTodo size={14} />
        Tarefas do projeto ({openCount} aberta{openCount === 1 ? '' : 's'})
        {showTasks ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {showTasks && (
        <div className="mt-2 rounded-xl bg-white/[0.02] p-3">
          <form
            className="mb-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!newTask.trim()) return
              addTask({ title: newTask.trim(), projectId: p.id, status: 'backlog', date: todayISO() })
              setNewTask('')
            }}
          >
            <input className="input !py-1.5 text-sm" placeholder="Nova tarefa deste projeto (vai para o Kanban)..." value={newTask} onChange={(e) => setNewTask(e.target.value)} />
            <button className="btn-outline shrink-0 !px-2.5 !py-1.5" type="submit">
              <Plus size={15} />
            </button>
          </form>
          {projTasks.length === 0 ? (
            <p className="py-2 text-center text-xs text-ink-600">Nenhuma tarefa ainda. Qual é o menor próximo passo?</p>
          ) : (
            <div className="space-y-1">
              {projTasks.map((t) => (
                <ProjectTaskRow key={t.id} task={t} onToggle={() => toggleTask(t.id)} onRename={(v) => updateTask(t.id, { title: v })} onRemove={() => removeTask(t.id)} />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

/** Linha de tarefa do projeto — clique no texto para renomear. */
function ProjectTaskRow({ task: t, onToggle, onRename, onRemove }: { task: Task; onToggle: () => void; onRename: (v: string) => void; onRemove: () => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(t.title)
  return (
    <div className="group/t flex items-center gap-2.5 rounded-lg px-1.5 py-1">
      <button onClick={onToggle} className={clsx('flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]', t.done ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300' : 'border-white/20')}>
        {t.done && '✓'}
      </button>
      {editing ? (
        <input
          className="input flex-1 !py-1 text-sm"
          value={val}
          autoFocus
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => { if (val.trim()) onRename(val.trim()); setEditing(false) }}
          onKeyDown={(e) => { if (e.key === 'Enter') { if (val.trim()) onRename(val.trim()); setEditing(false) } }}
        />
      ) : (
        <button className={clsx('flex-1 truncate text-left text-sm', t.done ? 'text-ink-500 line-through' : 'text-ink-200 hover:text-white')} onClick={() => setEditing(true)} title="Clique para renomear">
          {t.kind === 'reuniao' && '📅 '}
          {t.title}
        </button>
      )}
      <span className="text-[10px] uppercase text-ink-600">{t.status}</span>
      <button onClick={onRemove} className="text-ink-700 opacity-0 transition group-hover/t:opacity-100 hover:text-red-400">
        <Trash2 size={12} />
      </button>
    </div>
  )
}

function NewProject({ onCreate, onCancel }: { onCreate: (title: string, desc: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  return (
    <Card className="mb-4">
      <div className="grid gap-2">
        <input className="input" placeholder="Nome do projeto" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <input className="input" placeholder="Descrição curta" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <p className="text-xs text-ink-500">Depois de criar, ajuste as 8 notas (ícone de sliders) para a IA calcular a prioridade.</p>
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
