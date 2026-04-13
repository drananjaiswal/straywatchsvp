// straywatchsvp/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Submit a new sighting. Returns { data, error }.
// error.code === '23505' means dedupe_hash collision (friendly duplicate).
// Note: .single() removed — Safari's Supabase JS v2 throws PGRST116 when
// RLS blocks the post-insert SELECT, causing false "Submission failed" errors
// even when the INSERT succeeded. We use .select() without .single() and
// treat PGRST116 (no rows returned) as a success.
const DEDUPE_CONSTRAINT = 'sightings_dedupe_hash_unique'

export async function submitSighting({ latitude, longitude, ward_id, ward_name, dog_count, notes, address }) {
  const { data, error } = await supabase
    .from('sightings')
    .insert([{ latitude, longitude, ward_id, ward_name, dog_count, notes: notes || null, address }])
    .select()

  if (error) {
    // Log full error so Safari DevTools shows root cause
    console.error('[StrayWatch] submitSighting error:', JSON.stringify(error))

    // Dedupe hash collision — treat as soft duplicate, not a hard error
    if (error.code === '23505' && error.constraint === DEDUPE_CONSTRAINT) {
      return { data: null, error: { code: '23505', message: 'duplicate' } }
    }

    // PGRST116 = "no rows returned" after insert — INSERT succeeded but RLS
    // blocked the SELECT. Treat as success to avoid false failure on Safari.
    if (error.code === 'PGRST116') {
      console.warn('[StrayWatch] Insert succeeded but SELECT returned no rows (RLS). Treating as success.')
      return { data: {}, error: null }
    }

    return { data: null, error }
  }

  return { data: data?.[0] || {}, error: null }
}

// Fetch all sightings for heatmap and summary (last 90 days for heatmap, 30 for ward summary)
export async function getSightings() {
  const since = new Date()
  since.setDate(since.getDate() - 90)
  const { data, error } = await supabase
    .from('sightings')
    .select('id, latitude, longitude, ward_id, ward_name, dog_count, corroborations, created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
  return { data: data || [], error }
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
