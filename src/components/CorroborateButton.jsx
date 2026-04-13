// straywatchsvp/src/components/CorroborateButton.jsx
import { useState } from 'react'

const STORAGE_PREFIX = 'straywatchsvp_corroborate_'

export default function CorroborateButton({ wardId, wardName }) {
  const storageKey = `${STORAGE_PREFIX}ward_${wardId}_${new Date().toDateString()}`
  const [done, setDone] = useState(() => localStorage.getItem(storageKey) === '1')

  async function handleCorroborate() {
    if (done) return
    // Optimistic UI update before network call
    setDone(true)
    localStorage.setItem(storageKey, '1')
    // Note: corroboration is recorded at ward-aggregate level in localStorage.
    // For a Supabase-backed per-sighting increment, wire corroborateSighting(sightingId)
    // from supabase.js to the most recent sighting in this ward.
  }

  if (done) {
    return (
      <div className="text-xs text-green-600 font-medium py-1">
        Noted. Thanks for confirming.
      </div>
    )
  }

  return (
    <button
      onClick={handleCorroborate}
      className="text-xs text-gray-500 hover:text-green-700 border border-gray-200 hover:border-green-300 rounded px-2 py-1 transition-colors text-left"
    >
      I also see strays in {wardName.split(' - ')[0]}
    </button>
  )
}
