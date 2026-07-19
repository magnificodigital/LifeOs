// ============================================================================
// Supabase — backup e sincronização do LifeOS na nuvem.
// ----------------------------------------------------------------------------
// Usamos a API REST do Supabase via fetch (sem dependência extra). A URL do
// projeto já vem configurada; cole a "anon public key" (Settings → API) na
// tela de Conexões para ativar.
//
// Setup no Supabase (SQL Editor) — rode uma vez:
//
//   create table if not exists lifeos_state (
//     sync_id text primary key,
//     data jsonb not null,
//     updated_at timestamptz default now()
//   );
//   alter table lifeos_state enable row level security;
//   -- Política simples para uso pessoal (o sync_id funciona como segredo):
//   create policy "lifeos anon rw" on lifeos_state
//     for all using (true) with check (true);
// ============================================================================

export const SUPABASE_URL = 'https://uumyojjistaxcmhkilen.supabase.co'
const TABLE = 'lifeos_state'

export interface SupabaseSettings {
  anonKey?: string
  /** Identificador do seu backup (funciona como um código secreto pessoal). */
  syncId?: string
  lastSync?: string
}

function headers(anonKey: string) {
  return {
    'Content-Type': 'application/json',
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  }
}

export interface SyncResult {
  ok: boolean
  message: string
}

/** Envia o estado completo do app para a nuvem (upsert por sync_id). */
export async function backupToCloud(
  settings: SupabaseSettings,
  data: unknown,
): Promise<SyncResult> {
  if (!settings.anonKey || !settings.syncId) {
    return { ok: false, message: 'Configure a anon key e um código de sincronização.' }
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?on_conflict=sync_id`, {
      method: 'POST',
      headers: { ...headers(settings.anonKey), Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify([{ sync_id: settings.syncId, data, updated_at: new Date().toISOString() }]),
    })
    if (res.status === 404) return { ok: false, message: 'Tabela lifeos_state não existe. Rode o SQL de setup (botão acima).' }
    if (res.status === 401 || res.status === 403) return { ok: false, message: 'Anon key inválida ou sem permissão (verifique a política RLS).' }
    if (!res.ok) return { ok: false, message: `Erro ${res.status} ao salvar.` }
    return { ok: true, message: 'Backup salvo na nuvem. ✓' }
  } catch {
    return { ok: false, message: 'Falha de rede ao contatar o Supabase.' }
  }
}

/** Restaura o estado salvo na nuvem. Retorna o objeto de dados ou null. */
export async function restoreFromCloud(
  settings: SupabaseSettings,
): Promise<{ result: SyncResult; data: unknown | null }> {
  if (!settings.anonKey || !settings.syncId) {
    return { result: { ok: false, message: 'Configure a anon key e um código de sincronização.' }, data: null }
  }
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?sync_id=eq.${encodeURIComponent(settings.syncId)}&select=data,updated_at`,
      { headers: headers(settings.anonKey) },
    )
    if (res.status === 404) return { result: { ok: false, message: 'Tabela lifeos_state não existe. Rode o SQL de setup.' }, data: null }
    if (!res.ok) return { result: { ok: false, message: `Erro ${res.status} ao buscar.` }, data: null }
    const rows = (await res.json()) as { data: unknown; updated_at: string }[]
    if (!rows.length) return { result: { ok: false, message: 'Nenhum backup encontrado para esse código.' }, data: null }
    return { result: { ok: true, message: `Backup de ${new Date(rows[0].updated_at).toLocaleString('pt-BR')} restaurado. ✓` }, data: rows[0].data }
  } catch {
    return { result: { ok: false, message: 'Falha de rede ao contatar o Supabase.' }, data: null }
  }
}

export const SETUP_SQL = `create table if not exists lifeos_state (
  sync_id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);
alter table lifeos_state enable row level security;
create policy "lifeos anon rw" on lifeos_state
  for all using (true) with check (true);`
