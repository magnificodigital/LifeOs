import { useMemo, useState } from 'react'
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import { Moon, CalendarDays, FileBarChart, Check } from 'lucide-react'
import { clsx } from 'clsx'
import { useStore } from '@/lib/store'
import { Card, Fade, PageHeader, Stat } from '@/components/ui'
import { scoreColor } from '@/lib/scoring'
import { todayISO, formatDatePt, brl, weekStart } from '@/lib/utils'

type Tab = 'diaria' | 'semanal' | 'mensal'

export default function Reviews() {
  const [tab, setTab] = useState<Tab>('diaria')
  return (
    <div>
      <PageHeader
        title="Revisões"
        subtitle="O que fiz? O que me aproximou? O que me afastou? Refletir é como o sistema aprende."
      />
      <div className="mb-5 inline-flex rounded-xl border border-white/10 p-1">
        {(
          [
            { k: 'diaria', label: 'Diária', icon: Moon },
            { k: 'semanal', label: 'Semanal', icon: CalendarDays },
            { k: 'mensal', label: 'Mensal', icon: FileBarChart },
          ] as const
        ).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={clsx(
              'flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition',
              tab === t.k ? 'bg-white/10 text-white' : 'text-ink-400 hover:text-ink-100',
            )}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'diaria' && <Daily />}
      {tab === 'semanal' && <Weekly />}
      {tab === 'mensal' && <Monthly />}
    </div>
  )
}

function Daily() {
  const { logs, dailyReviews, saveDailyReview } = useStore()
  const today = todayISO()
  const existing = dailyReviews.find((r) => r.date === today)
  const score = logs.find((l) => l.date === today)?.score
  const [f, setF] = useState({
    fiz: existing?.fiz ?? '',
    avancei: existing?.avancei ?? '',
    afastou: existing?.afastou ?? '',
    amanha: existing?.amanha ?? '',
  })
  const [saved, setSaved] = useState(false)

  return (
    <Fade>
      <div className="grid gap-4 lg:grid-cols-[1fr,280px]">
        <Card>
          <p className="section-title mb-4">Revisão de hoje — {formatDatePt(today)}</p>
          <div className="space-y-4">
            <Field label="O que fiz hoje?" value={f.fiz} onChange={(v) => setF({ ...f, fiz: v })} />
            <Field label="O que avancei em direção aos meus objetivos?" value={f.avancei} onChange={(v) => setF({ ...f, avancei: v })} />
            <Field label="O que me afastou dos meus objetivos?" value={f.afastou} onChange={(v) => setF({ ...f, afastou: v })} />
            <Field label="O que devo fazer amanhã?" value={f.amanha} onChange={(v) => setF({ ...f, amanha: v })} />
          </div>
          <button
            className="btn-primary mt-4"
            onClick={() => {
              saveDailyReview({ date: today, ...f, score })
              setSaved(true)
            }}
          >
            {saved ? (
              <>
                <Check size={16} /> Salvo
              </>
            ) : (
              'Fechar o dia'
            )}
          </button>
        </Card>
        <Card className="h-fit text-center">
          <p className="section-title mb-2">Seu Score hoje</p>
          <p className="text-5xl font-bold" style={{ color: scoreColor(score ?? 0) }}>
            {score ?? '—'}
          </p>
          <p className="mt-1 text-xs text-ink-500">
            {score === undefined ? 'Faça o check-in no Life Score.' : 'Registrado a partir do seu check-in diário.'}
          </p>
        </Card>
      </div>
    </Fade>
  )
}

function Weekly() {
  const { logs, weeklyReviews, saveWeeklyReview } = useStore()
  const ws = weekStart(todayISO())
  const weekLogs = logs.filter((l) => weekStart(l.date) === ws)
  const avg = weekLogs.length ? Math.round(weekLogs.reduce((a, l) => a + l.score, 0) / weekLogs.length) : 0
  const existing = weeklyReviews.find((r) => r.weekStart === ws)
  const [f, setF] = useState({
    conquistas: existing?.conquistas ?? '',
    erros: existing?.erros ?? '',
    desperdicio: existing?.desperdicio ?? '',
    evolucao: existing?.evolucao ?? '',
    projetosParados: existing?.projetosParados ?? '',
    dinheiroGanho: existing?.dinheiroGanho ?? 0,
    tempoPerdido: existing?.tempoPerdido ?? '',
    tempoInvestido: existing?.tempoInvestido ?? '',
  })
  const chart = weekLogs.map((l) => ({ date: formatDatePt(l.date), score: l.score }))

  return (
    <Fade>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="section-title mb-4">Balanço da semana</p>
          <div className="space-y-4">
            <Field label="Principais conquistas" value={f.conquistas} onChange={(v) => setF({ ...f, conquistas: v })} />
            <Field label="Principais erros" value={f.erros} onChange={(v) => setF({ ...f, erros: v })} />
            <Field label="Maior desperdício" value={f.desperdicio} onChange={(v) => setF({ ...f, desperdicio: v })} />
            <Field label="Maior evolução" value={f.evolucao} onChange={(v) => setF({ ...f, evolucao: v })} />
            <Field label="Projetos parados" value={f.projetosParados} onChange={(v) => setF({ ...f, projetosParados: v })} />
            <div>
              <label className="label">Dinheiro ganho na semana (R$)</label>
              <input
                type="number"
                className="input"
                value={f.dinheiroGanho}
                onChange={(e) => setF({ ...f, dinheiroGanho: Number(e.target.value) })}
              />
            </div>
          </div>
          <button className="btn-primary mt-4" onClick={() => saveWeeklyReview({ weekStart: ws, ...f })}>
            Salvar revisão semanal
          </button>
        </Card>
        <div className="space-y-4">
          <Card>
            <p className="section-title mb-3">Life Score da semana</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chart} margin={{ left: -24 }}>
                <XAxis dataKey="date" tick={{ fill: '#65728a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#65728a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ background: '#0c0e14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {chart.map((c, i) => (
                    <Cell key={i} fill={scoreColor(c.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Score médio" value={avg} />
              <Stat label="Dias registrados" value={weekLogs.length} />
            </div>
          </Card>
        </div>
      </div>
    </Fade>
  )
}

function Monthly() {
  const { logs, projects, goals } = useStore()
  const now = new Date()
  const monthLogs = useMemo(
    () => logs.filter((l) => new Date(l.date + 'T00:00:00').getMonth() === now.getMonth()),
    [logs],
  )
  const avg = monthLogs.length ? Math.round(monthLogs.reduce((a, l) => a + l.score, 0) / monthLogs.length) : 0
  const receita = monthLogs.reduce((a, l) => a + l.metrics.receita, 0)
  const investido = monthLogs.reduce((a, l) => a + l.metrics.investimentos, 0)
  const deepWork = monthLogs.reduce((a, l) => a + l.metrics.deepWork, 0)
  const pesos = monthLogs.map((l) => l.metrics.peso).filter((p): p is number => p !== undefined)
  const pesoDelta = pesos.length >= 2 ? +(pesos[pesos.length - 1] - pesos[0]).toFixed(1) : 0
  const active = projects.find((p) => p.status === 'execucao')

  const insights: string[] = []
  if (avg >= 70) insights.push('Trajetória forte no mês — seus sistemas estão sustentando o resultado.')
  else if (avg > 0) insights.push('Score médio abaixo do potencial. Priorize sono, treino e Deep Work — são os hábitos de maior peso.')
  if (pesoDelta < 0) insights.push(`Você perdeu ${Math.abs(pesoDelta)} kg no mês. Mantenha a consistência.`)
  if (deepWork > 0) insights.push(`Acumulou ${deepWork.toFixed(0)}h de Deep Work — é aqui que o trabalho profundo compõe.`)
  if (active) insights.push(`Foco preservado em "${active.title}". Um projeto de cada vez é sua maior vantagem.`)
  if (insights.length === 0) insights.push('Poucos dados neste mês. Faça o check-in diário para gerar um relatório completo.')

  return (
    <Fade>
      <Card className="mb-4">
        <p className="section-title mb-4">Relatório executivo — {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <Stat label="Score médio" value={avg} />
          <Stat label="Receita" value={brl(receita)} />
          <Stat label="Investido" value={brl(investido)} />
          <Stat label="Deep Work" value={`${deepWork.toFixed(0)}h`} />
          <Stat label="Δ Peso" value={`${pesoDelta > 0 ? '+' : ''}${pesoDelta} kg`} />
          <Stat label="Dias ativos" value={monthLogs.length} />
          <Stat label="Objetivos" value={goals.length} />
          <Stat label="Projetos" value={projects.length} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="section-title mb-3">Evolução do Score</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthLogs.map((l) => ({ date: formatDatePt(l.date), score: l.score }))} margin={{ left: -24 }}>
              <XAxis dataKey="date" tick={{ fill: '#65728a', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} tick={{ fill: '#65728a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0c0e14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="score" radius={[5, 5, 0, 0]}>
                {monthLogs.map((l, i) => (
                  <Cell key={i} fill={scoreColor(l.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <p className="section-title mb-3">Insights da IA</p>
          <ul className="space-y-2.5">
            {insights.map((ins, i) => (
              <li key={i} className="flex gap-2 rounded-xl bg-white/[0.03] p-3 text-sm text-ink-200">
                <span className="text-accent-soft">✦</span>
                {ins}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Fade>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea className="input min-h-[60px]" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
