import { useMemo, useState } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, RefreshCw, Target } from 'lucide-react'
import { clsx } from 'clsx'
import { useStore } from '@/lib/store'
import type { FinanceEntry } from '@/lib/types'
import { Card, Fade, PageHeader, ProgressBar, Stat } from '@/components/ui'
import { brl, todayISO } from '@/lib/utils'

/**
 * Finanças — o painel de dinheiro. Registro rápido (valor + descrição) e o
 * progresso direto para a meta de R$ 10.000/mês. Sem planilha, sem fricção.
 */
export default function Finances() {
  const { finances, goals, addFinance, removeFinance, updateGoal } = useStore()
  const rendaGoal = goals.find((g) => g.unit === 'R$/mês') ?? goals.find((g) => g.area === 'financas')
  const target = rendaGoal?.target ?? 10000

  const [type, setType] = useState<'receita' | 'despesa'>('receita')
  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('')
  const [recurring, setRecurring] = useState(true)

  const stats = useMemo(() => {
    const recRec = finances.filter((f) => f.type === 'receita' && f.recurring).reduce((s, f) => s + f.amount, 0)
    const recDes = finances.filter((f) => f.type === 'despesa' && f.recurring).reduce((s, f) => s + f.amount, 0)
    const month = new Date().getMonth()
    const inMonth = (f: FinanceEntry) => new Date(f.createdAt).getMonth() === month
    const oneRec = finances.filter((f) => f.type === 'receita' && !f.recurring && inMonth(f)).reduce((s, f) => s + f.amount, 0)
    const oneDes = finances.filter((f) => f.type === 'despesa' && !f.recurring && inMonth(f)).reduce((s, f) => s + f.amount, 0)
    return { recRec, recDes, oneRec, oneDes, monthIncome: recRec + oneRec, monthNet: recRec + oneRec - recDes - oneDes }
  }, [finances])

  const progress = Math.min(100, Math.round((stats.recRec / target) * 100))

  const add = () => {
    const val = Number(amount)
    if (!val || !label.trim()) return
    addFinance({ type, amount: val, label: label.trim(), recurring, date: todayISO() })
    setAmount('')
    setLabel('')
  }

  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-accent-soft">Ferramenta</p>
      <PageHeader title="Finanças" subtitle="Seu dinheiro em um lugar. Registre rápido e veja o quanto falta para a renda que sua família precisa." />

      {/* Progresso da renda */}
      <Fade>
        <Card className="mb-4 border-accent/20 bg-gradient-to-br from-accent/[0.1] to-transparent">
          <div className="flex items-center gap-2">
            <Target size={15} className="text-accent-soft" />
            <p className="section-title">Renda mensal recorrente</p>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-3xl font-bold text-white">{brl(stats.recRec)}</p>
            <p className="text-sm text-ink-400">meta {brl(target)}/mês</p>
          </div>
          <div className="mt-3">
            <ProgressBar value={progress} />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-ink-500">{progress}% da meta · faltam {brl(Math.max(0, target - stats.recRec))}/mês</p>
            {rendaGoal && (
              <button
                className="btn-ghost !px-2 !py-1 text-xs text-accent-soft"
                onClick={() => updateGoal(rendaGoal.id, { current: stats.recRec })}
                title="Atualizar a meta de renda com sua renda recorrente atual"
              >
                <RefreshCw size={12} /> Sincronizar com a meta
              </button>
            )}
          </div>
        </Card>
      </Fade>

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card><Stat label="Recorrente" value={brl(stats.recRec)} hint="receita/mês" /></Card>
        <Card><Stat label="No mês" value={brl(stats.monthIncome)} hint="receita total" /></Card>
        <Card><Stat label="Despesas" value={brl(stats.recDes + stats.oneDes)} hint="no mês" /></Card>
        <Card><Stat label="Saldo" value={brl(stats.monthNet)} hint="mês" /></Card>
      </div>

      {/* Registro rápido */}
      <Fade delay={0.05}>
        <Card className="mb-4">
          <div className="mb-3 inline-flex rounded-xl border border-white/10 p-1">
            {(['receita', 'despesa'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={clsx(
                  'flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition',
                  type === t ? (t === 'receita' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300') : 'text-ink-400 hover:text-ink-100',
                )}
              >
                {t === 'receita' ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {t}
              </button>
            ))}
          </div>
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              add()
            }}
          >
            <input className="input !w-32" type="number" placeholder="R$ 0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <input className="input min-w-[160px] flex-1" placeholder="Descrição (ex.: cliente X, assinatura)" value={label} onChange={(e) => setLabel(e.target.value)} />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-300">
              <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="accent-accent" /> Recorrente
            </label>
            <button className="btn-primary shrink-0" type="submit" disabled={!amount || !label.trim()}>
              <Plus size={16} /> Registrar
            </button>
          </form>
        </Card>
      </Fade>

      {/* Lançamentos */}
      <Fade delay={0.08}>
        <Card>
          <p className="section-title mb-3">Lançamentos</p>
          {finances.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-500">Nenhum lançamento ainda. Registre sua primeira receita acima.</p>
          ) : (
            <div className="space-y-1.5">
              {finances.map((f) => (
                <div key={f.id} className="group flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
                  <div className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', f.type === 'receita' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300')}>
                    {f.type === 'receita' ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-ink-100">{f.label}</p>
                    {f.recurring && <span className="text-[11px] text-ink-600">recorrente</span>}
                  </div>
                  <p className={clsx('text-sm font-semibold', f.type === 'receita' ? 'text-emerald-300' : 'text-red-300')}>
                    {f.type === 'receita' ? '+' : '−'}
                    {brl(f.amount)}
                  </p>
                  <button onClick={() => removeFinance(f.id)} className="text-ink-700 opacity-0 transition group-hover:opacity-100 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Fade>
    </div>
  )
}
