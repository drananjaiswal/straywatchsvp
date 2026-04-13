// straywatchsvp/src/pages/Home.jsx
import { useState, useEffect } from 'react'
import { getSightings } from '../lib/supabase'
import DisclaimerBanner from '../components/DisclaimerBanner'
import StatsBar from '../components/StatsBar'
import HeatmapLayer from '../components/HeatmapLayer'
import WardSummary from '../components/WardSummary'
import ReportModal from '../components/ReportModal'

export default function Home() {
  const [sightings, setSightings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    function onOnline() { setOffline(false) }
    function onOffline() { setOffline(true) }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])

  useEffect(() => {
    getSightings().then(({ data }) => {
      setSightings(data)
      setLoading(false)
    })
  }, [])

  function handleSuccess() {
    setShowModal(false)
    getSightings().then(({ data }) => setSightings(data))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 flex flex-col gap-5">

      {offline && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-2 text-center">
          You are offline — showing cached data
        </div>
      )}

      <DisclaimerBanner />

      {/* Hero */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">StrayWatch SVP</h1>
        <p className="text-gray-500 text-sm mt-1">
          Crowdsourced stray dog density map for Sri Vijaya Puram (Port Blair), Andaman &amp; Nicobar Islands.
          Report sightings anonymously. Help the community and civic authorities act.
        </p>
      </div>

      {/* Stats */}
      {!loading && <StatsBar sightings={sightings} />}

      {/* Heatmap preview */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700">Live density heatmap</h2>
          <a href="/map" className="text-xs text-green-600 hover:underline">Full screen →</a>
        </div>
        <HeatmapLayer sightings={sightings} height="320px" />
      </div>

      {/* Ward summary */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Ward-wise sightings (last 30 days)</h2>
        {loading
          ? <div className="text-center text-gray-400 text-sm py-6">Loading...</div>
          : <WardSummary sightings={sightings} />
        }
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-4 left-0 right-0 px-4 sm:hidden z-40">
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-3.5 bg-green-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:bg-green-700 transition-colors"
        >
          + Report stray dogs near me
        </button>
      </div>

      {/* Desktop CTA */}
      <div className="hidden sm:block">
        <button
          onClick={() => setShowModal(true)}
          className="py-2.5 px-6 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
        >
          + Report stray dogs
        </button>
      </div>

      {/* Bottom padding for mobile sticky button */}
      <div className="h-16 sm:hidden" />

      {showModal && (
        <ReportModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
