// ============================================================================
// Integrações — as fontes que alimentam o STARK e o LifeOS.
// Cada integração guarda sua própria configuração (localmente).
// ============================================================================
export type IntegrationKey = 'livekit' | 'calendar' | 'whatsapp' | 'gloryfitpro' | 'gmail'

export interface IntegrationField {
  key: string
  label: string
  placeholder?: string
  secret?: boolean
}

export interface IntegrationDef {
  key: IntegrationKey
  label: string
  emoji: string
  desc: string
  fields: IntegrationField[]
  /** O que já funciona hoje vs. o que precisa de backend. */
  status: 'config' | 'em-breve'
  note?: string
}

export const INTEGRATIONS: IntegrationDef[] = [
  {
    key: 'livekit',
    label: 'LiveKit (voz do STARK)',
    emoji: '🎙️',
    desc: 'Conversa por voz em tempo real com o STARK.',
    fields: [
      { key: 'url', label: 'LiveKit URL', placeholder: 'wss://seu-projeto.livekit.cloud' },
      { key: 'tokenEndpoint', label: 'Endpoint de token (backend)', placeholder: 'https://.../livekit-token' },
    ],
    status: 'config',
    note: 'A voz precisa de um agente (STT → LLM → TTS) rodando no seu servidor LiveKit. A configuração fica salva para quando ele estiver no ar.',
  },
  {
    key: 'calendar',
    label: 'Google Calendar',
    emoji: '📅',
    desc: 'Compromissos e tempo livre no contexto do STARK.',
    fields: [{ key: 'calendarId', label: 'ID do calendário', placeholder: 'primary' }],
    status: 'em-breve',
    note: 'Requer OAuth do Google — entra junto com o backend.',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    emoji: '💬',
    desc: 'Lembretes e captura de tarefas/notas por mensagem.',
    fields: [{ key: 'phone', label: 'Seu número', placeholder: '+55 11 9....' }],
    status: 'em-breve',
    note: 'Via WhatsApp Business API — precisa de backend.',
  },
  {
    key: 'gloryfitpro',
    label: 'GloryFit Pro',
    emoji: '⌚',
    desc: 'Passos, sono e treino da sua pulseira alimentando o Life Score.',
    fields: [],
    status: 'em-breve',
    note: 'O GloryFit não tem API pública — o caminho é sincronizar a pulseira com o Google Fit / Health Connect no celular, e o LifeOS ler de lá.',
  },
  {
    key: 'gmail',
    label: 'Gmail',
    emoji: '📧',
    desc: 'Resumos e triagem da caixa de entrada pelo STARK.',
    fields: [],
    status: 'em-breve',
    note: 'Requer OAuth do Google — entra junto com o backend.',
  },
]

/** Config salva por integração: { livekit: { enabled, values: {...} } } */
export interface IntegrationState {
  enabled: boolean
  values: Record<string, string>
}

export type IntegrationsSettings = Partial<Record<IntegrationKey, IntegrationState>>
