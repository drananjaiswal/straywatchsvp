// straywatchsvp/src/pages/MapPage.jsx
import { useState, useEffect } from 'react'
import { getSightings } from '../lib/supabase'
import HeatmapLayer from '../components/HeatmapLayer'
import ReportModal from '../components/ReportModal'
import wardsData from '../data/wards.json'

export default function MapPage() {
  const [sightings, setSightings] = useState([])
  const [loading, setLoading] = useState(true)
  const [wardFilter, setWardFilter] = useState(null)
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

  const filtered = wardFilter
    ? sightings.filter(s => s.ward_id === wardFilter)
    : sightings

  const mapHeight = 'calc(100vh - 120px)'

  return (
    <div className="flex flex-col h-screen">

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-gray-700">Filter by ward:</span>
        <select
          className="text-sm border border-gray-200 rounded px-2 py-1 text-gray-700 focus:outline-none focus:border-green-400"
          value={wardFilter || ''}
          onChange={e => setWardFilter(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">All wards</option>
          {wardsData.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400 ml-auto">
          {filtered.length} sighting{filtered.length !== 1 ? 's' : ''}
          {wardFilter ? ` in ${wardsData.find(w => w.id === wardFilter)?.name}` : ' across all wards'}
        </span>
        <button
          onClick={() => setShowModal(true)}
          className="ml-auto sm:ml-0 text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 font-medium"
        >
          + Report
        </button>
      </div>

      {offline && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs px-4 py-1.5 text-center">
          You are offline — showing cached data
        </div>
      )}

      {/* Full-screen map */}
      <div className="flex-1 px-0">
        {loading
          ? <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading heatmap...</div>
          : <HeatmapLayer sightings={filtered} height={mapHeight} wardFilter={wardFilter} />
        }
      </div>

      {showModal && (
        <ReportModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            getSightings().then(({ data }) => setSightings(data))
          }}
        />
      )}
    </div>
  )
}
