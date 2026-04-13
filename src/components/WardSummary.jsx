// straywatchsvp/src/components/WardSummary.jsx
import CorroborateButton from './CorroborateButton'

export default function WardSummary({ sightings }) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)

  // Aggregate per ward for last 30 days
  const wardMap = {}
  for (const s of sightings) {
    if (new Date(s.created_at) < cutoff) continue
    if (!wardMap[s.ward_id]) {
      wardMap[s.ward_id] = {
        ward_id: s.ward_id,
        ward_name: s.ward_name,
        sightings: 0,
        dogs: 0,
        corroborations: 0
      }
    }
    wardMap[s.ward_id].sightings += 1
    wardMap[s.ward_id].dogs += s.dog_count || 1
    wardMap[s.ward_id].corroborations += s.corroborations || 0
  }

  const wards = Object.values(wardMap).sort((a, b) => b.dogs - a.dogs)

  if (wards.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8 text-sm">
        No sightings in the last 30 days. Be the first to report.
      </div>
    )
  }

  const maxDogs = wards[0]?.dogs || 1

  function densityColor(dogs) {
    const ratio = dogs / maxDogs
    if (ratio > 0.6) return 'bg-red-100 text-red-700 border-red-200'
    if (ratio > 0.3) return 'bg-orange-100 text-orange-700 border-orange-200'
    return 'bg-yellow-50 text-yellow-700 border-yellow-200'
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {wards.map((w, i) => (
        <div
          key={w.ward_id}
          className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex flex-col gap-2"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs text-gray-400 font-medium">#{i + 1}</div>
              <div className="text-sm font-medium text-gray-800 leading-tight">{w.ward_name}</div>
            </div>
            <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded border ${densityColor(w.dogs)}`}>
              {w.dogs} dog{w.dogs !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {w.sightings} sighting{w.sightings !== 1 ? 's' : ''} &middot; {w.corroborations} corroboration{w.corroborations !== 1 ? 's' : ''}
          </div>
          <CorroborateButton wardId={w.ward_id} wardName={w.ward_name} />
        </div>
      ))}
    </div>
  )
}
