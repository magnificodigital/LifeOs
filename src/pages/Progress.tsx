import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Flame, Zap, Lock } from 'lucide-react'
import { clsx } from 'clsx'
import { useStore } from '@/lib/store'
import { levelInfo, totalXp, computeStreak, achievements } from '@/lib/game'
import { computeGoalProgress } from '@/lib/scoring'
import { LIFE_AREAS } from '@/lib/types'
import { Card, Fade, PageHeader, ProgressBar, ScoreRing } from '@/components/ui'
import { todayISO, formatDatePt } from '@/lib/utils'

export default function Progress() {
  const store = useStore()
  const { habits, habitLog, tasks, goals, logs } = store
  const today = todayISO()

  const xp = useMemo(() => totalXp(habits, habitLog, tasks), [habits, habitLog, tasks])
  const info = useMemo(() => levelInfo(xp), [xp])
  const streak = computeStreak(habitLog, today)
  const achs = useMemo(() => achievements({ habits, log: habitLog, tasks, goals, today }), [habits, habitLog, tasks, goals, today])
  const unlocked = achs.filter((a) => a.unlocked).length

  const lastScore = [...logs].sort((a, b) => b.date.localeCompare(a.date))[0]?.score ?? 0
  const trend = logs.slice(-14).map((l) => ({ date: formatDatePt(l.date), score: l.score }))

  // XP por dia (últimos 14 dias) a partir do habitLog.
  const xpById = new Map(habits.map((h) => [h.id, h.xp]))
  const days: { date: string; xp: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    const dayXp = (habitLog[iso] ?? []).reduce((a, id) => a + (xpById.get(id) ?? 0), 0)
    days.push({ date: formatDatePt(iso), xp: dayXp })
  }

  return (
    <div>
      <PageHeader title="Progresso" subtitle="Sua evolução em números — nível, ofensiva, conquistas e trajetória." />

      {/* Perfil de jogo */}
      <Fade>
        <Card className="mb-4">
          <div className="grid gap-5 sm:grid-cols-[auto,1fr] sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-white">
                {info.level}
              </div>
              <div>
                <p className="text-lg font-bold text-white">Nível {info.level}</p>
                <p className="text-sm text-accent-soft">{info.title}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Tile icon={<Zap size={16} className="text-accent-soft" />} value={xp} label="XP total" />
              <Tile icon={<Flame size={16} className="text-amber-300" />} value={streak} label="Ofensiva" />
              <Tile icon={<span className="text-base">🏅</span>} value={`${unlocked}/${achs.length}`} label="Conquistas" />
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-ink-400">
              <span>Progresso do nível {info.level}</span>
              <span>{info.intoLevel} / {info.neededForNext} XP</span>
            </div>
            <ProgressBar value={info.progress} color="#6366f1" />
          </div>
        </Card>
      </Fade>

      {/* Conquistas */}
      <Fade delay={0.05}>
        <Card className="mb-4">
          <p className="section-title mb-4">Conquistas</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {achs.map((a) => (
              <div
                key={a.id}
                className={clsx(
                  'relative flex flex-col items-center gap-1 rounded-xl border p-3 text-center',
                  a.unlocked ? 'border-accent/25 bg-accent/[0.06]' : 'border-white/5 bg-white/[0.02] opacity-60',
                )}
              >
                <span className={clsx('text-2xl', !a.unlocked && 'grayscale')}>{a.emoji}</span>
                <p className="text-xs font-semibold text-ink-100">{a.title}</p>
                <p className="text-[10px] leading-tight text-ink-500">{a.desc}</p>
                {a.unlocked ? (
                  <span className="chip mt-0.5 bg-emerald-400/15 text-emerald-300">✓ Desbloqueada</span>
                ) : (
                  <span className="mt-0.5 flex items-center gap-1 text-[10px] text-ink-600">
                    <Lock size={9} /> {a.progressText}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </Fade>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* XP por dia */}
        <Fade delay={0.08}>
          <Card className="lg:col-span-2">
            <p className="section-title mb-3">XP ganho (14 dias)</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={days} margin={{ left: -24, right: 6, top: 6 }}>
                <defs>
                  <linearGradient id="xpg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#65728a', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#65728a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0c0e14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="xp" stroke="#818cf8" strokeWidth={2} fill="url(#xpg)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Fade>

        {/* Life Score */}
        <Fade delay={0.1}>
          <Card className="flex flex-col items-center justify-center text-center">
            <p className="section-title mb-2">Life Score atual</p>
            <ScoreRing value={lastScore} size={120} label="/ 100" />
            <ResponsiveContainer width="100%" height={70}>
              <AreaChart data={trend} margin={{ left: 0, right: 0, top: 8 }}>
                <Area type="monotone" dataKey="score" stroke="#34d399" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Fade>
      </div>

      {/* Avanço das metas */}
      <Fade delay={0.12}>
        <Card className="mt-4">
          <p className="section-title mb-4">Avanço dos objetivos</p>
          <div className="space-y-3.5">
            {goals.map((g) => {
              const area = LIFE_AREAS.find((a) => a.key === g.area)
              const prog = computeGoalProgress(g) ?? 0
              const stepsDone = g.steps.filter((s) => s.done).length
              return (
                <div key={g.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-ink-300">
                      {area?.emoji} {g.title}
                    </span>
                    <span className="text-xs text-ink-500">
                      {stepsDone}/{g.steps.length} passos · <strong className="text-white">{prog}%</strong>
                    </span>
                  </div>
                  <ProgressBar value={prog} />
                </div>
              )
            })}
          </div>
        </Card>
      </Fade>
    </div>
  )
}

function Tile({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3 text-center">
      <div className="mb-1 flex justify-center">{icon}</div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-ink-500">{label}</p>
    </div>
  )
}
