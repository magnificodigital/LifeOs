import { Target, FolderKanban, Lightbulb } from 'lucide-react'
import Goals from './Goals'
import Projects from './Projects'
import Ideas from './Ideas'

/**
 * PLANEJAR — uma página só, sem abas escondidas: seus objetivos, os projetos
 * que servem a eles e as ideias esperando a vez. As pílulas rolam a página.
 */
export default function Plan() {
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return (
    <div>
      <div className="sticky top-0 z-10 -mx-5 mb-6 border-b border-white/5 bg-ink-950/90 px-5 py-2.5 backdrop-blur">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'sec-objetivos', label: 'Objetivos', icon: Target },
              { id: 'sec-projetos', label: 'Projetos', icon: FolderKanban },
              { id: 'sec-ideias', label: 'Ideias', icon: Lightbulb },
            ] as const
          ).map((s) => (
            <button
              key={s.id}
              onClick={() => jump(s.id)}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-ink-300 transition hover:bg-white/10 hover:text-white"
            >
              <s.icon size={13} /> {s.label}
            </button>
          ))}
        </div>
      </div>

      <section id="sec-objetivos" className="scroll-mt-20">
        <Goals />
      </section>

      <section id="sec-projetos" className="mt-12 scroll-mt-20 border-t border-white/5 pt-10">
        <Projects />
      </section>

      <section id="sec-ideias" className="mt-12 scroll-mt-20 border-t border-white/5 pt-10">
        <Ideas />
      </section>
    </div>
  )
}
