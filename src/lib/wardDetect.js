// straywatchsvp/src/lib/wardDetect.js
import * as turf from '@turf/turf'

let wardGeoJSON = null

async function loadWards() {
  if (wardGeoJSON) return wardGeoJSON
  try {
    const res = await fetch('/ward-boundaries.geojson')
    wardGeoJSON = await res.json()
  } catch {
    wardGeoJSON = null
  }
  return wardGeoJSON
}

// Detect which ward a lat/lng point falls in.
// Returns { ward_id, ward_name } or null if outside all wards or GeoJSON unavailable.
export async function detectWard(latitude, longitude) {
  const geojson = await loadWards()
  if (!geojson || !geojson.features) return null

  const point = turf.point([longitude, latitude])
  for (const feature of geojson.features) {
    try {
      if (turf.booleanPointInPolygon(point, feature)) {
        return {
          ward_id: feature.properties.ward_id,
          ward_name: feature.properties.ward_name || `Ward ${feature.properties.ward_id}`
        }
      }
    } catch {
      continue
    }
  }
  return null
}

// Fallback: nearest ward centroid when GeoJSON is unavailable.
// Uses a static lookup of approximate Port Blair ward centroids.
const WARD_CENTROIDS = [
  { ward_id: 1,  ward_name: 'Ward 1 - Aberdeen Bazaar',       lat: 11.6650, lng: 92.7310 },
  { ward_id: 2,  ward_name: 'Ward 2 - Junglighat',            lat: 11.6720, lng: 92.7450 },
  { ward_id: 3,  ward_name: 'Ward 3 - Naya Bazar',            lat: 11.6680, lng: 92.7360 },
  { ward_id: 4,  ward_name: 'Ward 4 - Goalghar',              lat: 11.6640, lng: 92.7290 },
  { ward_id: 5,  ward_name: 'Ward 5 - Dairy Farm',            lat: 11.6580, lng: 92.7270 },
  { ward_id: 6,  ward_name: 'Ward 6 - Phoenix Bay',           lat: 11.6740, lng: 92.7380 },
  { ward_id: 7,  ward_name: 'Ward 7 - Haddo',                 lat: 11.6800, lng: 92.7300 },
  { ward_id: 8,  ward_name: 'Ward 8 - Bathubasti',            lat: 11.6760, lng: 92.7260 },
  { ward_id: 9,  ward_name: 'Ward 9 - Delanipur',             lat: 11.6710, lng: 92.7220 },
  { ward_id: 10, ward_name: 'Ward 10 - Premnagar',            lat: 11.6620, lng: 92.7200 },
  { ward_id: 11, ward_name: 'Ward 11 - Prem Nagar Extension', lat: 11.6600, lng: 92.7180 },
  { ward_id: 12, ward_name: 'Ward 12 - Shadipur',             lat: 11.6550, lng: 92.7250 },
  { ward_id: 13, ward_name: 'Ward 13 - Lamba Line',           lat: 11.6700, lng: 92.7150 },
  { ward_id: 14, ward_name: 'Ward 14 - Garacharma',           lat: 11.6500, lng: 92.7100 },
  { ward_id: 15, ward_name: 'Ward 15 - Dollygunj',            lat: 11.6450, lng: 92.7080 },
  { ward_id: 16, ward_name: 'Ward 16 - Atlanta Point',        lat: 11.6530, lng: 92.7160 },
  { ward_id: 17, ward_name: 'Ward 17 - Gurudwara Line',       lat: 11.6690, lng: 92.7330 },
  { ward_id: 18, ward_name: 'Ward 18 - Brookshabad',          lat: 11.6820, lng: 92.7280 },
  { ward_id: 19, ward_name: 'Ward 19 - Teal House',           lat: 11.6840, lng: 92.7350 },
  { ward_id: 20, ward_name: 'Ward 20 - Minnie Bay',           lat: 11.6780, lng: 92.7420 },
  { ward_id: 21, ward_name: 'Ward 21 - South Point',          lat: 11.6420, lng: 92.7050 },
  { ward_id: 22, ward_name: 'Ward 22 - Panighat',             lat: 11.6860, lng: 92.7200 },
  { ward_id: 23, ward_name: 'Ward 23 - Bimblitan',            lat: 11.6900, lng: 92.7150 },
  { ward_id: 24, ward_name: 'Ward 24 - Chouldari',            lat: 11.6480, lng: 92.7120 }
]

export function nearestWardFallback(latitude, longitude) {
  let nearest = null
  let minDist = Infinity
  for (const w of WARD_CENTROIDS) {
    const d = Math.hypot(w.lat - latitude, w.lng - longitude)
    if (d < minDist) { minDist = d; nearest = w }
  }
  return nearest ? { ward_id: nearest.ward_id, ward_name: nearest.ward_name } : null
}

// Unified ward detection: try GeoJSON polygon first, fallback to centroid distance
export async function getWardForLocation(latitude, longitude) {
  const result = await detectWard(latitude, longitude)
  if (result) return result
  return nearestWardFallback(latitude, longitude)
}
