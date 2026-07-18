import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  HeartPulse,
  Target,
  ListTree,
  FolderKanban,
  Lightbulb,
  Bot,
  ClipboardCheck,
  Command,
} from 'lucide-react'
import { clsx } from 'clsx'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/lifescore', label: 'Life Score', icon: HeartPulse },
  { to: '/objetivos', label: 'Objetivos', icon: Target },
  { to: '/metas', label: 'Metas & Tarefas', icon: ListTree },
  { to: '/projetos', label: 'Projetos', icon: FolderKanban },
  { to: '/ideias', label: 'Banco de Ideias', icon: Lightbulb },
  { to: '/assistente', label: 'Assistente IA', icon: Bot },
  { to: '/revisoes', label: 'Revisões', icon: ClipboardCheck },
]

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-ink-950/80 px-4 py-6 backdrop-blur md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
            <Command size={18} />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-white">LifeOS AI</p>
            <p className="text-[10px] uppercase tracking-widest text-ink-500">O CEO da sua vida</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((n) => (
            <NavItem key={n.to} {...n} />
          ))}
        </nav>
        <p className="px-3 text-[11px] leading-relaxed text-ink-600">
          "O que é a melhor coisa que você pode fazer hoje para construir a vida que deseja daqui a 10 anos?"
        </p>
      </aside>

      {/* Main */}
      <div className="flex-1">
        <main className="mx-auto max-w-6xl px-5 py-8 pb-28 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-white/5 bg-ink-950/95 px-2 py-2 backdrop-blur md:hidden">
        {nav.slice(0, 6).map((n) => (
          <MobileNavItem key={n.to} {...n} />
        ))}
      </nav>
    </div>
  )
}

function NavItem({ to, label, icon: Icon, end }: (typeof nav)[number]) {
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

function MobileNavItem({ to, label, icon: Icon, end }: (typeof nav)[number]) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(
          'flex flex-1 flex-col items-center gap-1 rounded-lg py-1 text-[10px]',
          isActive ? 'text-accent-soft' : 'text-ink-500',
        )
      }
    >
      <Icon size={20} />
      <span className="truncate">{label.split(' ')[0]}</span>
    </NavLink>
  )
}
