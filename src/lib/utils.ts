export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function brl(n: number): string {
  return n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

export function formatDatePt(iso: string): string {
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    })
  } catch {
    return iso
  }
}

/** Segunda-feira da semana de uma data (ISO). */
export function weekStart(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const day = (d.getDay() + 6) % 7 // 0 = segunda
  d.setDate(d.getDate() - day)
  return d.toISOString().slice(0, 10)
}
