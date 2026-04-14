// straywatchsvp/src/components/ReportModal.jsx
import { useState, useEffect, useRef } from 'react'
import { submitSighting } from '../lib/supabase'
import { getWardForLocation } from '../lib/wardDetect'
import { reverseGeocode } from '../lib/geocode'

const STEPS = ['Location', 'Details', 'Confirm']

export default function ReportModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(0)
  const [locating, setLocating] = useState(false)
  const [location, setLocation] = useState(null)    // { lat, lng }
  const [ward, setWard] = useState(null)             // { ward_id, ward_name }
  const [address, setAddress] = useState('')
  const [locError, setLocError] = useState('')
  const [dogCount, setDogCount] = useState(1)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const miniMapRef = useRef(null)
  const miniMapInstanceRef = useRef(null)
  const markerRef = useRef(null)

  // Initialise mini Leaflet map for manual pin
  useEffect(() => {
    if (step !== 0 || !miniMapRef.current || miniMapInstanceRef.current) return
    if (typeof window.L === 'undefined') return

    const map = window.L.map(miniMapRef.current, {
      center: [11.6650, 92.7310],
      zoom: 13,
      zoomControl: true
    })
    miniMapInstanceRef.current = map

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)

    map.on('click', async (e) => {
      const { lat, lng } = e.latlng
      placeMarker(map, lat, lng)
      await resolveLocation(lat, lng)
    })

    return () => {
      map.remove()
      miniMapInstanceRef.current = null
      markerRef.current = null
    }
  }, [step])

  function placeMarker(map, lat, lng) {
    if (markerRef.current) markerRef.current.remove()
    markerRef.current = window.L.marker([lat, lng]).addTo(map)
  }

  async function resolveLocation(lat, lng) {
    setLocating(true)
    setLocError('')
    const [detectedWard, detectedAddress] = await Promise.all([
      getWardForLocation(lat, lng),
      reverseGeocode(lat, lng)
    ])
    setLocation({ lat, lng })
    setWard(detectedWard)
    setAddress(detectedAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    setLocating(false)
  }

  async function handleGPS() {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.')
      return
    }
    setLocating(true)
    setLocError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        if (miniMapInstanceRef.current) {
          miniMapInstanceRef.current.setView([latitude, longitude], 16)
          placeMarker(miniMapInstanceRef.current, latitude, longitude)
        }
        await resolveLocation(latitude, longitude)
      },
      (err) => {
        setLocating(false)
        setLocError('Could not get your location. Please tap the map to place a pin manually.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function handleSubmit() {
    if (!location || !ward) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const { error } = await submitSighting({
        latitude: location.lat,
        longitude: location.lng,
        ward_id: ward.ward_id,
        ward_name: ward.ward_name,
        dog_count: dogCount,
        notes: notes.trim() || null,
        address
      })
      setSubmitting(false)
      if (error) {
        if (error.code === '23505') {
          setIsDuplicate(true)
          setSubmitted(true)
        } else if (error.code === 'BACKEND_MISMATCH') {
          setSubmitError('Submission is temporarily unavailable because the live backend configuration does not match this app. Please ask the admin to verify Supabase settings.')
        } else {
          console.error('[StrayWatch] Submit error in modal:', error)
          setSubmitError(`Submission failed (${error.code || error.message || 'unknown error'}). Please try again.`)
        }
        return
      }
      setSubmitted(true)
      onSuccess && onSuccess(ward.ward_name)
    } catch (e) {
      setSubmitting(false)
      console.error('[StrayWatch] Unexpected submit exception:', e)
      setSubmitError('Submission failed. Please check your connection and try again.')
    }
  }

  // ── Success / Duplicate screen ──
  if (submitted) {
    return (
      <ModalShell onClose={onClose}>
        <div className="text-center py-6 px-2">
          <div className="text-4xl mb-3">{isDuplicate ? '📍' : '✅'}</div>
          {isDuplicate ? (
            <>
              <h3 className="text-base font-semibold text-gray-800 mb-2">Already recorded nearby</h3>
              <p className="text-sm text-gray-500">A sighting near this location was already recorded in the last hour, so no new entry was added.</p>
            </>
          ) : (
            <>
              <h3 className="text-base font-semibold text-gray-800 mb-2">Sighting submitted</h3>
              <p className="text-sm text-gray-500">Thank you. Your report for <strong>{ward?.ward_name}</strong> has been recorded and will appear on the heatmap.</p>
            </>
          )}
          <div className="mt-5 flex gap-2 justify-center">
            <button
              onClick={() => { setSubmitted(false); setStep(0); setLocation(null); setWard(null); setAddress(''); setNotes(''); setDogCount(1); setIsDuplicate(false) }}
              className="text-sm text-green-700 border border-green-300 rounded px-4 py-2 hover:bg-green-50"
            >
              Report another
            </button>
            <button onClick={onClose} className="text-sm text-gray-500 border border-gray-200 rounded px-4 py-2 hover:bg-gray-50">
              Close
            </button>
          </div>
        </div>
      </ModalShell>
    )
  }

  return (
    <ModalShell onClose={onClose}>
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-5">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-1 flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
              i < step ? 'bg-green-600 text-white' : i === step ? 'bg-green-100 text-green-700 border border-green-400' : 'bg-gray-100 text-gray-400'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs ${i === step ? 'text-green-700 font-medium' : 'text-gray-400'}`}>{label}</span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      {/* ── STEP 0: Location ── */}
      {step === 0 && (
        <div>
          <p className="text-sm text-gray-500 mb-3">Use your GPS or tap the map to mark where you saw stray dogs.</p>
          <button
            onClick={handleGPS}
            disabled={locating}
            className="w-full mb-3 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            {locating ? 'Locating...' : '📍 Use my location'}
          </button>
          <p className="text-xs text-center text-gray-400 mb-2">— or tap the map below —</p>
          <div ref={miniMapRef} style={{ height: '200px', borderRadius: '8px', overflow: 'hidden' }} className="border border-gray-200 mb-3" />
          {locError && <p className="text-xs text-red-500 mb-2">{locError}</p>}
          {location && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-800 mb-3">
              <div className="font-medium">{ward?.ward_name || 'Detecting ward...'}</div>
              <div className="text-xs text-green-600 mt-0.5">{address}</div>
            </div>
          )}
          <button
            onClick={() => setStep(1)}
            disabled={!location || !ward}
            className="w-full py-2.5 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-900 disabled:opacity-40 transition-colors"
          >
            Next: Add details
          </button>
        </div>
      )}

      {/* ── STEP 1: Details ── */}
      {step === 1 && (
        <div>
          <p className="text-sm text-gray-500 mb-4">How many stray dogs did you see?</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setDogCount(n)}
                className={`w-10 h-10 rounded-lg text-sm font-semibold border transition-colors ${
                  dogCount === n
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-green-400 hover:text-green-700'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <label className="block text-sm text-gray-600 mb-1">
            Additional notes <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value.slice(0, 150))}
            placeholder="Describe the location or situation..."
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:border-green-400"
          />
          <div className="text-xs text-gray-400 text-right mb-4">{notes.length} / 150</div>
          <div className="flex gap-2">
            <button onClick={() => setStep(0)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              Back
            </button>
            <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-900">
              Review & submit
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Confirm ── */}
      {step === 2 && (
        <div>
          <p className="text-sm text-gray-500 mb-4">Confirm your sighting before submitting.</p>
          <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-200 mb-5 text-sm">
            <Row label="Ward" value={ward?.ward_name} />
            <Row label="Dogs seen" value={`${dogCount} dog${dogCount !== 1 ? 's' : ''}`} />
            <Row label="Location" value={address} />
            {notes && <Row label="Notes" value={notes} />}
          </div>
          {submitError && <p className="text-xs text-red-500 mb-3">{submitError}</p>}
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit sighting'}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3 px-3 py-2">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className="text-gray-800 text-right">{value}</span>
    </div>
  )
}

function ModalShell({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Report stray dogs</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}
