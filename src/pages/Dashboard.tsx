import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { ArrowRight, Sparkles, Flame } from 'lucide-react'
import { useStore } from '@/lib/store'
import { LIFE_AREAS, type DailyMetrics } from '@/lib/types'
import { Card, Fade, PageHeader, ScoreRing, ProgressBar } from '@/components/ui'
import { ceoBriefing, type MentorContext } from '@/lib/ai/mentor'
import { scoreLabel, scoreColor, computeGoalProgress } from '@/lib/scoring'
import { todayISO, formatDatePt, brl } from '@/lib/utils'

/** Deriva um score 0–100 por área da vida a partir dos dados disponíveis. */
function areaScores(metrics: DailyMetrics | undefined, ctx: MentorContext) {
  const m = metrics
  const goalProg = (id: string) => {
    const g = ctx.goals.find((x) => x.id === id)
    return g ? (computeGoalProgress(g) ?? 50) : 50
  }
  return {
    saude: m ? Math.round(((m.sono + m.treino + m.alimentacao + m.energia) / 40) * 100) : 50,
    financas: Math.round(
      (ctx.goals.filter((g) => g.area === 'financas').reduce((a, g) => a + (computeGoalProgress(g) ?? 0), 0) /
        Math.max(1, ctx.goals.filter((g) => g.area === 'financas').length)) || 0,
    ),
    familia: m ? Math.min(100, Math.round((m.familia / 3) * 100)) : 50,
    negocios: (() => {
      const active = ctx.projects.find((p) => p.status === 'execucao')
      return active ? 70 : 40
    })(),
    conhecimento: m ? Math.round(((m.leitura + m.aprendizado) / 20) * 100) : 50,
    proposito: goalProg('g-tempo'),
    produtividade: m ? Math.round(((m.foco + Math.min(10, m.deepWork * 2.5)) / 20) * 100) : 50,
    energia: m ? m.energia * 10 : 50,
    humor: m ? m.humor * 10 : 50,
    tempoLivre: m ? Math.min(100, Math.round((m.familia / 3) * 60 + (m.humor / 10) * 40)) : 50,
  } as Record<string, number>
}

export default function Dashboard() {
  const { goals, metas, tasks, projects, ideas, logs } = useStore()
  const ctx: MentorContext = { goals, metas, tasks, projects, ideas, logs, today: todayISO() }

  const lastLog = useMemo(() => [...logs].sort((a, b) => b.date.localeCompare(a.date))[0], [logs])
  const general = lastLog?.score ?? 0
  const scores = useMemo(() => areaScores(lastLog?.metrics, ctx), [lastLog, goals, projects])

  const radarData = LIFE_AREAS.map((a) => ({ area: a.label, value: scores[a.key] ?? 50 }))
  const trend = logs.slice(-14).map((l) => ({ date: formatDatePt(l.date), score: l.score }))

  const briefing = useMemo(() => ceoBriefing(ctx), [tasks, projects, ideas, logs])
  const activeProject = projects.find((p) => p.status === 'execucao')
  const finGoal = goals.find((g) => g.area === 'financas')

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Sua vida em uma tela. Cada número aqui é uma pergunta: isso te aproxima ou te afasta da vida que você deseja?"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Score geral + radar */}
        <Fade>
          <Card className="flex flex-col items-center justify-center gap-3 text-center">
            <p className="section-title">Score Geral da Vida</p>
            <ScoreRing value={general} label="/ 100" size={150} />
            <span
              className="chip"
              style={{ background: `${scoreColor(general)}1a`, color: scoreColor(general) }}
            >
              {scoreLabel(general)}
            </span>
          </Card>
        </Fade>

        <Fade delay={0.05}>
          <Card className="lg:col-span-2 h-full">
            <p className="section-title mb-2">10 Dimensões</p>
            <ResponsiveContainer width="100%" height={230}>
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="area" tick={{ fill: '#8592a5', fontSize: 10 }} />
                <Radar dataKey="value" stroke="#818cf8" fill="#6366f1" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </Fade>
      </div>

      {/* Barras por área */}
      <Fade delay={0.1}>
        <Card className="mt-4">
          <p className="section-title mb-4">Áreas da Vida</p>
          <div className="grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
            {LIFE_AREAS.map((a) => (
              <div key={a.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-ink-300">
                    {a.emoji} {a.label}
                  </span>
                  <span className="font-semibold text-white">{scores[a.key] ?? 50}</span>
                </div>
                <ProgressBar value={scores[a.key] ?? 50} />
              </div>
            ))}
          </div>
        </Card>
      </Fade>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Modo CEO */}
        <Fade delay={0.12}>
          <Card className="lg:col-span-2 border-accent/20 bg-gradient-to-br from-accent/[0.08] to-transparent">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-accent-soft" />
              <p className="section-title !text-accent-soft">Modo CEO — hoje</p>
            </div>
            <p className="mb-4 text-lg font-semibold leading-snug text-white">{briefing.oneThing}</p>
            <div className="grid gap-2.5 text-sm text-ink-300 sm:grid-cols-2">
              <CeoLine label="Elimine" text={briefing.eliminate} />
              <CeoLine label="Automatize" text={briefing.automate} />
              <CeoLine label="Delegue" text={briefing.delegate} />
              <CeoLine label="Ignore" text={briefing.ignore} />
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3">
              <Flame size={16} className="mt-0.5 shrink-0 text-amber-300" />
              <p className="text-sm text-amber-100/90">{briefing.challenge}</p>
            </div>
            <Link to="/stark" className="btn-ghost mt-3 !px-0 text-accent-soft">
              Falar com STARK <ArrowRight size={15} />
            </Link>
          </Card>
        </Fade>

        {/* Foco atual */}
        <Fade delay={0.15}>
          <div className="flex h-full flex-col gap-4">
            <Card>
              <p className="section-title mb-2">Projeto Único</p>
              {activeProject ? (
                <>
                  <p className="text-lg font-semibold text-white">{activeProject.title}</p>
                  <p className="mt-1 text-sm text-ink-400">{activeProject.description}</p>
                  <span className="chip mt-3 bg-emerald-400/10 text-emerald-300">● Em execução</span>
                </>
              ) : (
                <p className="text-sm text-ink-400">
                  Nenhum projeto em execução.{' '}
                  <Link to="/plan" className="text-accent-soft">
                    Defina seu foco →
                  </Link>
                </p>
              )}
            </Card>
            {finGoal && (
              <Card>
                <p className="section-title mb-2">Norte Financeiro</p>
                <p className="text-lg font-semibold text-white">{brl(finGoal.current ?? 0)}</p>
                <p className="text-xs text-ink-500">de {brl(finGoal.target ?? 0)}</p>
                <div className="mt-3">
                  <ProgressBar value={computeGoalProgress(finGoal) ?? 0} />
                </div>
              </Card>
            )}
          </div>
        </Fade>
      </div>

      {/* Trajetória */}
      <Fade delay={0.18}>
        <Card className="mt-4">
          <p className="section-title mb-3">Trajetória do Life Score (14 dias)</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trend} margin={{ left: -22, right: 6, top: 6 }}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#65728a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#65728a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0c0e14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#8592a5' }}
              />
              <Area type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={2} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </Fade>
    </div>
  )
}

function CeoLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3">
      <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <p className="text-sm leading-snug text-ink-200">{text}</p>
    </div>
  )
}
