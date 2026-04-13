// straywatchsvp/src/lib/geocode.js

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
const USER_AGENT = 'StrayWatchSVP/1.0 (contact@pbmc.gov.in)'

// Reverse geocode a lat/lng to a human-readable address string.
// Returns address string or null on failure.
export async function reverseGeocode(latitude, longitude) {
  try {
    const url = `${NOMINATIM_BASE}/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=17&addressdetails=1`
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT }
    })
    if (!res.ok) return null
    const json = await res.json()
    if (json && json.display_name) {
      // Trim to most relevant parts: road, suburb, city
      const a = json.address || {}
      const parts = [
        a.road || a.pedestrian || a.footway,
        a.suburb || a.neighbourhood || a.village,
        a.city || a.town || 'Port Blair'
      ].filter(Boolean)
      return parts.join(', ')
    }
    return null
  } catch {
    return null
  }
}
