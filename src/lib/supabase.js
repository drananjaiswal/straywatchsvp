// straywatchsvp/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Submit a new sighting. Returns { data, error }.
// error.code === '23505' means dedupe_hash collision (friendly duplicate).
export async function submitSighting({ latitude, longitude, ward_id, ward_name, dog_count, notes, address }) {
  const { data, error } = await supabase
    .from('sightings')
    .insert([{ latitude, longitude, ward_id, ward_name, dog_count, notes: notes || null, address }])
    .select()
    .single()
  return { data, error }
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
