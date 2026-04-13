// straywatchsvp/src/components/DisclaimerBanner.jsx
import { useState } from 'react'

const STORAGE_KEY = 'straywatchsvp_disclaimer_dismissed'

export default function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === '1'
  )

  if (dismissed) return null

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3 text-sm text-amber-800">
      <span className="mt-0.5 shrink-0 text-amber-500">⚠</span>
      <p className="flex-1 leading-snug">
        Sightings on this map are <strong>citizen-reported and unverified</strong>. This platform is a public awareness tool and civic pressure instrument. Data is indicative only and does not represent an official Animal Husbandry Department census.
      </p>
      <button
        onClick={dismiss}
        className="shrink-0 text-amber-600 hover:text-amber-900 font-medium ml-2"
        aria-label="Dismiss disclaimer"
      >
        ✕
      </button>
    </div>
  )
}
