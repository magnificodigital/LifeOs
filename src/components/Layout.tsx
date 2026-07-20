import { NavLink, Outlet } from 'react-router-dom'
import {
  Sun, CalendarDays, Map, TrendingUp, Bot, Command,
  Columns3, Wallet, StickyNote, Plug,
} from 'lucide-react'
import { clsx } from 'clsx'

// Menu plano: um clique para tudo, sem abas escondidas.
const primary = [
  { to: '/', label: 'Hoje', icon: Sun, end: true },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/planejar', label: 'Planejar', icon: Map },
  { to: '/evolucao', label: 'Evolução', icon: TrendingUp },
]

const more = [
  { to: '/kanban', label: 'Kanban', icon: Columns3 },
  { to: '/financas', label: 'Finanças', icon: Wallet },
  { to: '/notas', label: 'Notas', icon: StickyNote },
  { to: '/conexoes', label: 'Conexões', icon: Plug },
]

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-white/5 bg-ink-950/80 px-4 py-6 backdrop-blur md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
            <Command size={18} />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-white">LifeOS AI</p>
            <p className="text-[10px] uppercase tracking-widest text-ink-500">Seu guia diário</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {primary.map((n) => (
            <NavItem key={n.to} {...n} />
          ))}
        </nav>

        <div className="mt-4">
          <NavLink
            to="/stark"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-xl border px-3 py-3 transition',
                isActive
                  ? 'border-accent/40 bg-accent/[0.12] text-white'
                  : 'border-accent/20 bg-accent/[0.06] text-ink-200 hover:bg-accent/[0.1]',
              )
            }
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
              <Bot size={17} />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-white">STARK</p>
              <p className="text-[10px] text-ink-400">Seu conselheiro pessoal</p>
            </div>
          </NavLink>
        </div>

        <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-widest text-ink-600">Mais</p>
        <nav className="flex flex-col gap-1">
          {more.map((n) => (
            <NavItem key={n.to} {...n} />
          ))}
        </nav>

        <p className="mt-auto px-3 pt-6 text-[11px] leading-relaxed text-ink-600">
          "Qual a melhor coisa que você pode fazer hoje para construir a vida que deseja daqui a 10 anos?"
        </p>
      </aside>

      <div className="flex-1">
        <main className="mx-auto max-w-5xl px-5 py-8 pb-28 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Barra inferior (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-white/5 bg-ink-950/95 px-2 py-2 backdrop-blur md:hidden">
        {primary.map((n) => (
          <MobileNavItem key={n.to} {...n} />
        ))}
        <MobileNavItem to="/stark" label="STARK" icon={Bot} />
      </nav>
    </div>
  )
}

type Item = { to: string; label: string; icon: typeof Sun; end?: boolean }

function NavItem({ to, label, icon: Icon, end }: Item) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          isActive ? 'bg-white/[0.06] text-white' : 'text-ink-400 hover:bg-white/[0.03] hover:text-ink-100',
        )
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  )
}

function MobileNavItem({ to, label, icon: Icon, end }: Item) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx('flex flex-1 flex-col items-center gap-1 rounded-lg py-1 text-[10px]', isActive ? 'text-accent-soft' : 'text-ink-500')
      }
    >
      <Icon size={20} />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}
