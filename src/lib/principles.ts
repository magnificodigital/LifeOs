// ============================================================================
// Os fundamentos do LifeOS — os pensadores e livros que moldam cada decisão.
// STARK "pensa" a partir daqui. Estas referências são a alma do app.
// ============================================================================
export interface Principle {
  author: string
  work: string
  idea: string
  /** Onde isso aparece, concretamente, no LifeOS. */
  inApp: string
  emoji: string
}

export const PRINCIPLES: Principle[] = [
  {
    author: 'Tim Ferriss',
    work: 'Trabalhe 4 Horas por Semana · Ferramentas dos Titãs',
    idea: 'Foque no 80/20, automatize e delegue antes de se sobrecarregar.',
    inApp: 'Priorização de projetos e o Modo CEO (o que eliminar, automatizar, delegar).',
    emoji: '⚡',
  },
  {
    author: 'Peter Drucker',
    work: 'O Gestor Eficaz',
    idea: '"O que é medido é gerenciado." Eficácia antes de eficiência.',
    inApp: 'O ciclo Plan · Action · Progress · Check e o Life Score.',
    emoji: '📊',
  },
  {
    author: 'Naval Ravikant',
    work: 'The Almanack of Naval',
    idea: 'Riqueza vem de alavancagem: código, mídia e conhecimento específico.',
    inApp: 'Notas de escalabilidade, automação e potencial de IA nos projetos.',
    emoji: '🧭',
  },
  {
    author: 'James Clear',
    work: 'Hábitos Atômicos',
    idea: 'Você não sobe ao nível das metas; cai ao nível dos seus sistemas. 1% melhor por dia.',
    inApp: 'Hábitos diários, ofensiva (não quebre a corrente) e XP.',
    emoji: '🔁',
  },
  {
    author: 'David Allen',
    work: 'A Arte de Fazer Acontecer (GTD)',
    idea: 'Tire tudo da cabeça: capture cada ideia para a mente ficar livre para executar.',
    inApp: 'Banco de Ideias, Notas e captura rápida em 1 toque.',
    emoji: '🗂️',
  },
  {
    author: 'Ray Dalio',
    work: 'Princípios',
    idea: 'Dor + reflexão = progresso. Encare erros como dados e crie seus princípios.',
    inApp: 'O Check: avaliação do planejado × feito para ajustar o próximo Plan.',
    emoji: '⚖️',
  },
  {
    author: 'Biohacking',
    work: 'Sono · Treino · Nutrição · Energia',
    idea: 'O corpo é a base. Otimize os sinais biológicos que sustentam foco e disposição.',
    inApp: 'Métricas de saúde do Life Score e os hábitos de corpo.',
    emoji: '🧬',
  },
]
