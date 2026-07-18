import { useState } from 'react'
import { Check } from 'lucide-react'
import { useStore } from '@/lib/store'
import { emptyMetrics, type DailyMetrics } from '@/lib/types'
import { computeLifeScore, scoreLabel, scoreColor } from '@/lib/scoring'
import { Card, Fade, PageHeader, ScoreRing, Slider } from '@/components/ui'
import { todayISO } from '@/lib/utils'

export default function LifeScore() {
  const { logs, saveDayLog } = useStore()
  const today = todayISO()
  const existing = logs.find((l) => l.date === today)
  const [m, setM] = useState<DailyMetrics>(existing?.metrics ?? emptyMetrics())
  const [saved, setSaved] = useState(false)

  const set = (k: keyof DailyMetrics, v: number) => {
    setM((prev) => ({ ...prev, [k]: v }))
    setSaved(false)
  }
  const live = computeLifeScore(m)

  return (
    <div>
      <PageHeader
        title="Life Score"
        subtitle="Check-in de hoje. Pequenos sinais diários compõem a trajetória — Atomic Habits em números."
      />

      <div className="grid gap-4 lg:grid-cols-[300px,1fr]">
        <Fade>
          <Card className="sticky top-6 flex flex-col items-center gap-3 text-center">
            <p className="section-title">Seu Score de hoje</p>
            <ScoreRing value={live} size={160} label="/ 100" />
            <span className="chip" style={{ background: `${scoreColor(live)}1a`, color: scoreColor(live) }}>
              {scoreLabel(live)}
            </span>
            <button
              className="btn-primary mt-2 w-full"
              onClick={() => {
                saveDayLog(today, m)
                setSaved(true)
              }}
            >
              {saved ? (
                <>
                  <Check size={16} /> Registrado
                </>
              ) : (
                'Salvar check-in'
              )}
            </button>
            <p className="text-xs text-ink-500">
              A IA recalcula seu Score automaticamente a cada ajuste.
            </p>
          </Card>
        </Fade>

        <Fade delay={0.05}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <p className="section-title mb-4">Corpo</p>
              <div className="space-y-4">
                <Slider label="Qualidade do sono" value={m.sono} onChange={(v) => set('sono', v)} />
                <Slider label="Treino (intensidade)" value={m.treino} onChange={(v) => set('treino', v)} />
                <Slider label="Peso" value={m.peso ?? 0} onChange={(v) => set('peso', v)} min={40} max={160} suffix="kg" />
                <Slider label="Água" value={m.agua} onChange={(v) => set('agua', v)} max={5} step={0.5} suffix="L" />
                <Slider label="Alimentação" value={m.alimentacao} onChange={(v) => set('alimentacao', v)} />
                <Slider label="Energia" value={m.energia} onChange={(v) => set('energia', v)} />
              </div>
            </Card>

            <Card>
              <p className="section-title mb-4">Trabalho & Riqueza</p>
              <div className="space-y-4">
                <Slider label="Foco" value={m.foco} onChange={(v) => set('foco', v)} />
                <Slider label="Deep Work" value={m.deepWork} onChange={(v) => set('deepWork', v)} max={8} step={0.5} suffix="h" />
                <Slider label="Receita gerada" value={m.receita} onChange={(v) => set('receita', v)} max={20000} step={100} suffix="R$" />
                <Slider label="Investido" value={m.investimentos} onChange={(v) => set('investimentos', v)} max={20000} step={100} suffix="R$" />
              </div>
            </Card>

            <Card>
              <p className="section-title mb-4">Mente & Aprendizado</p>
              <div className="space-y-4">
                <Slider label="Leitura" value={m.leitura} onChange={(v) => set('leitura', v)} />
                <Slider label="Aprendizado" value={m.aprendizado} onChange={(v) => set('aprendizado', v)} />
                <Slider label="Meditação" value={m.meditacao} onChange={(v) => set('meditacao', v)} max={60} step={5} suffix="min" />
                <Slider label="Gratidão" value={m.gratidao} onChange={(v) => set('gratidao', v)} />
              </div>
            </Card>

            <Card>
              <p className="section-title mb-4">Vida & Relações</p>
              <div className="space-y-4">
                <Slider label="Tempo com família" value={m.familia} onChange={(v) => set('familia', v)} max={8} step={0.5} suffix="h" />
                <Slider label="Humor" value={m.humor} onChange={(v) => set('humor', v)} />
              </div>
            </Card>
          </div>
        </Fade>
      </div>
    </div>
  )
}
