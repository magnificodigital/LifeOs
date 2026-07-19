import { NavLink, Outlet } from 'react-router-dom'
import {
  Sun,
  Target,
  Trophy,
  Bot,
  LayoutDashboard,
  FolderKanban,
  Lightbulb,
  ListTree,
  HeartPulse,
  ClipboardCheck,
  Command,
} from 'lucide-react'
import { clsx } from 'clsx'

const primary = [
  { to: '/', label: 'Hoje', icon: Sun, end: true },
  { to: '/objetivos', label: 'Objetivos', icon: Target },
  { to: '/progresso', label: 'Progresso', icon: Trophy },
  { to: '/assistente', label: 'Mentor IA', icon: Bot },
]

const advanced = [
  { to: '/painel', label: 'Painel completo', icon: LayoutDashboard },
  { to: '/projetos', label: 'Projetos & Decisões', icon: FolderKanban },
  { to: '/ideias', label: 'Banco de Ideias', icon: Lightbulb },
  { to: '/metas', label: 'Metas & Tarefas', icon: ListTree },
  { to: '/lifescore', label: 'Life Score', icon: HeartPulse },
  { to: '/revisoes', label: 'Revisões', icon: ClipboardCheck },
]

// Abas mostradas na barra inferior (mobile).
const mobileTabs = [...primary, { to: '/painel', label: 'Painel', icon: LayoutDashboard }]

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-white/5 bg-ink-950/80 px-4 py-6 backdrop-blur md:flex">
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

        <p className="mt-6 mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-ink-600">Avançado</p>
        <nav className="flex flex-col gap-1">
          {advanced.map((n) => (
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

      <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-white/5 bg-ink-950/95 px-2 py-2 backdrop-blur md:hidden">
        {mobileTabs.map((n) => (
          <MobileNavItem key={n.to} {...n} />
        ))}
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
