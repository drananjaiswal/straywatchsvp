// straywatchsvp/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
