// straywatchsvp/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before running the app.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const EXPECTED_APP_KEY = 'straywatchsvp'
const EXPECTED_APP_NAME = 'StrayWatch SVP'
const MIN_SCHEMA_VERSION = 1
const EXPECTED_SIGHTING_COLUMNS = 'id, latitude, longitude, ward_id, ward_name, dog_count, address, created_at'
const EXPECTED_WARD_COLUMNS = 'id, name'

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  return { data: data?.session || null, error }
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => callback(session))
}

export async function signInAdmin(email) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/admin`
    }
  })
  return { data, error }
}

export async function signOutAdmin() {
  return supabase.auth.signOut()
}

export async function isCurrentUserAdmin() {
  const { data, error } = await supabase.rpc('is_current_user_admin')
  return { data: Boolean(data), error }
}

export async function validateBackendSchema() {
  const { data: metadata, error: metadataError } = await supabase
    .from('app_metadata')
    .select('app_key, app_name, schema_version')
    .eq('app_key', EXPECTED_APP_KEY)
    .maybeSingle()

  if (!metadataError && metadata) {
    const versionOk = Number(metadata.schema_version) >= MIN_SCHEMA_VERSION
    const keyOk = metadata.app_key === EXPECTED_APP_KEY

    if (keyOk && versionOk) {
      return { ok: true, error: null }
    }

    return {
      ok: false,
      error: {
        code: 'APP_METADATA_MISMATCH',
        message:
          `This frontend expects ${EXPECTED_APP_NAME} metadata (${EXPECTED_APP_KEY}, schema v${MIN_SCHEMA_VERSION}+), but the connected backend does not match.`,
        details: `Received app_key=${metadata.app_key || 'unknown'}, schema_version=${metadata.schema_version || 'unknown'}`
      }
    }
  }

  const [{ error: sightingsError }, { error: wardsError }] = await Promise.all([
    supabase.from('sightings').select(EXPECTED_SIGHTING_COLUMNS).limit(1),
    supabase.from('wards').select(EXPECTED_WARD_COLUMNS).limit(1)
  ])

  const schemaError = metadataError || sightingsError || wardsError

  if (!schemaError) {
    return { ok: true, error: null }
  }

  const isSchemaMismatch =
    schemaError.code === 'PGRST204' ||
    schemaError.code === '42P01' ||
    schemaError.code === 'PGRST116'

  if (!isSchemaMismatch) {
    return { ok: true, error: null }
  }

  return {
    ok: false,
    error: {
      code: schemaError.code,
      message:
        'This frontend is connected to a Supabase project that does not match the StrayWatch SVP backend identity or schema. Check VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and the live migration.',
      details: schemaError.message || schemaError.details || null
    }
  }
}

// Submit a new sighting. Returns { data, error }.
// We intentionally do not request a post-insert SELECT here.
// That keeps submission resilient even if PostgREST schema cache lags behind
// recent table changes, and it avoids Safari/RLS false negatives.
const DEDUPE_CONSTRAINT = 'sightings_dedupe_hash_unique'

export async function submitSighting({ latitude, longitude, ward_id, ward_name, dog_count, notes, address }) {
  const { data, error } = await supabase
    .from('sightings')
    .insert([{ latitude, longitude, ward_id, ward_name, dog_count, notes: notes || null, address }])

  if (error) {
    // Log full error so Safari DevTools shows root cause
    console.error('[StrayWatch] submitSighting error:', JSON.stringify(error))

    // Dedupe hash collision — treat as soft duplicate, not a hard error
    if (error.code === '23505' && error.constraint === DEDUPE_CONSTRAINT) {
      return { data: null, error: { code: '23505', message: 'duplicate' } }
    }

    return { data: null, error }
  }

  return { data: data || {}, error: null }
}

// Fetch all sightings for heatmap and summary (last 90 days for heatmap, 30 for ward summary)
export async function getSightings() {
  const since = new Date()
  since.setDate(since.getDate() - 90)
  const { data, error } = await supabase
    .from('sightings')
    .select('id, latitude, longitude, ward_id, ward_name, dog_count, corroborations, created_at')
    .eq('is_hidden', false)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
  return { data: data || [], error }
}

export async function getAdminSightings() {
  const { data, error } = await supabase
    .from('sightings')
    .select('id, ward_name, created_at, is_hidden, hidden_at')
    .order('created_at', { ascending: false })
    .limit(500)
  return { data: data || [], error }
}

export async function hideAllSightings(reason) {
  const { data, error } = await supabase.rpc('hide_all_sightings', { reason: reason || null })
  return { data, error }
}

export async function restoreAllSightings(reason) {
  const { data, error } = await supabase.rpc('restore_all_sightings', { reason: reason || null })
  return { data, error }
}

// Increment corroborations for a specific sighting by 1.
// Uses rpc to guarantee atomic increment with no other column changes.
export async function corroborateSighting(sightingId) {
  const { data, error } = await supabase.rpc('increment_corroboration', { sighting_id: sightingId })
  return { data, error }
}

// Subscribe to new sightings via Supabase Realtime.
// onInsert receives the new sighting row.
export function subscribeToSightings(onInsert) {
  const channel = supabase
    .channel('sightings-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'sightings' },
      (payload) => onInsert(payload.new)
    )
    .subscribe()
  return channel
}

// Unsubscribe from Realtime channel
export function unsubscribeFromSightings(channel) {
  supabase.removeChannel(channel)
}
