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

  const mapHeight = 'calc(100vh - 230px)'
  const selectedWard = wardFilter ? wardsData.find(w => w.id === wardFilter) : null

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.16),_transparent_26%),linear-gradient(180deg,_#f7fbf8_0%,_#eef5f1_100%)]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-5 px-4 py-5">
        <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_30px_80px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="border-b border-slate-200/70 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Ward heat intelligence
                </div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Live stray dog heatmap</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Focus the map by ward, zoom directly into the selected boundary, and inspect where citizen reports are clustering across Sri Vijaya Puram.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <MetricCard label="Visible sightings" value={filtered.length} accent="text-emerald-700" />
                <MetricCard label="Coverage" value={selectedWard ? 'Ward focus' : 'All wards'} accent="text-sky-700" />
                <MetricCard label="Map mode" value={offline ? 'Cached' : 'Live'} accent={offline ? 'text-amber-700' : 'text-slate-700'} />
              </div>
            </div>
          </div>

          <div className="px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex min-w-[240px] flex-col gap-1 text-sm font-medium text-slate-700">
                  Explore by ward
                  <select
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    value={wardFilter || ''}
                    onChange={e => setWardFilter(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">All wards</option>
                    {wardsData.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </label>

                <div className="flex flex-wrap items-center gap-2 pt-6 sm:pt-0">
                  {selectedWard ? (
                    <>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                        {selectedWard.name}
                      </span>
                      <button
                        onClick={() => setWardFilter(null)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        Clear filter
                      </button>
                    </>
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Showing all wards
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  {filtered.length} sighting{filtered.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  + Report sighting
                </button>
              </div>
            </div>

            {offline && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                You are offline. The map is showing cached heatmap data until the network returns.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/70 bg-slate-950/85 p-3 shadow-[0_35px_90px_-40px_rgba(15,23,42,0.75)] backdrop-blur">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-2 pt-2 text-white">
            <div>
              <div className="text-sm font-semibold">Heatmap canvas</div>
              <div className="text-xs text-slate-300">
                {selectedWard
                  ? 'The map automatically zooms to the selected ward.'
                  : 'Select a ward to fly into its boundary and inspect local density.'}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Live reports
            </div>
          </div>

          <div className="flex-1 px-0">
        {loading
          ? <div className="flex h-64 items-center justify-center text-sm text-slate-300">Loading heatmap...</div>
          : <HeatmapLayer sightings={filtered} height={mapHeight} wardFilter={wardFilter} />
        }
          </div>
        </div>
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

function MetricCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className={`mt-2 text-base font-semibold ${accent}`}>{value}</div>
    </div>
  )
}
