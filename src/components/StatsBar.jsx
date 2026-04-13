// straywatchsvp/src/components/StatsBar.jsx

export default function StatsBar({ sightings }) {
  const now = new Date()
  const last24h = new Date(now - 24 * 60 * 60 * 1000)
  const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000)

  const total = sightings.length
  const recent = sightings.filter(s => new Date(s.created_at) >= last24h).length
  const activeWards = new Set(
    sightings.filter(s => new Date(s.created_at) >= last30d).map(s => s.ward_id)
  ).size
  const totalDogs = sightings.reduce((sum, s) => sum + (s.dog_count || 1), 0)

  const stat = (label, value, color = 'text-gray-800') => (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 text-center flex-1 min-w-0">
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {stat('Total Sightings', total)}
      {stat('Dogs Reported', totalDogs, 'text-orange-600')}
      {stat('Last 24 Hours', recent, recent > 0 ? 'text-red-600' : 'text-gray-800')}
      {stat('Active Wards (30d)', activeWards, 'text-green-700')}
    </div>
  )
}
