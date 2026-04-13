// straywatchsvp/src/pages/About.jsx
import DisclaimerBanner from '../components/DisclaimerBanner'

export default function About() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6 text-sm text-gray-700 leading-relaxed">

      <DisclaimerBanner />

      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">About StrayWatch SVP</h1>
        <p>
          StrayWatch SVP is a civic technology platform enabling residents of Sri Vijaya Puram (Port Blair),
          Andaman &amp; Nicobar Islands, to anonymously report stray dog sightings and visualise density
          patterns across the 24 municipal wards of the Port Blair Municipal Council.
        </p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-2">Purpose</h2>
        <p>
          This platform is a <strong>public awareness and civic pressure instrument</strong>. It aggregates
          citizen observations to surface ward-level patterns that can inform the Animal Husbandry Department,
          Port Blair Municipal Council, and the public about areas with high stray dog density — supporting
          evidence-based Animal Birth Control (ABC) programme planning under the Prevention of Cruelty to
          Animals Act, 1960 and the Animal Birth Control (Dogs) Rules, 2001.
        </p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-2">Data methodology</h2>
        <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
          <li>All sightings are <strong>citizen-reported and unverified</strong>. No field validation is performed.</li>
          <li>GPS coordinates are captured on-device and are not shared with any third party beyond the Supabase database.</li>
          <li>
            <strong>Deduplication:</strong> A submission from the same approximate location (within ~100 m radius)
            within the same clock hour is automatically rejected to prevent accidental duplicate reporting.
            The reporter is informed with a friendly message.
          </li>
          <li>
            <strong>Corroboration:</strong> Residents can tap "I also see strays in Ward N" to passively confirm
            reports without filing a new sighting. This is recorded once per ward per day per device.
          </li>
          <li>
            The heatmap weight corresponds to the number of dogs reported per sighting (1–10), not a count
            of independent submissions. A single report of 8 dogs contributes more heat than 8 reports of 1 dog.
          </li>
          <li>
            Data should not be cited as an official census. For official stray dog population data, contact the
            Animal Husbandry Department, Andaman &amp; Nicobar Administration.
          </li>
        </ul>
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-2">Privacy</h2>
        <p>
          No login is required. No personal information is collected. GPS coordinates are stored only to
          place sightings on the map and detect the ward automatically. Nominatim (OpenStreetMap) is used
          for reverse geocoding; no API key or account is required, and no user data is transmitted beyond
          the coordinates themselves.
        </p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-2">Technology</h2>
        <p>
          Built with React 18, Vite, Tailwind CSS, Leaflet.js, and Supabase. Maps use OpenStreetMap tiles.
          Heatmap rendering uses the leaflet-heat library. Ward detection uses Turf.js point-in-polygon
          against the 24 ward boundaries of Sri Vijaya Puram. Deployed on Vercel. Installable as a
          Progressive Web App (PWA) for offline map access.
        </p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-2">Install as app</h2>
        <p className="mb-2">StrayWatch SVP can be installed on your phone or desktop for offline access:</p>
        <ul className="list-disc pl-5 space-y-1 text-gray-600">
          <li><strong>Android (Chrome):</strong> Tap the three-dot menu → "Add to Home screen"</li>
          <li><strong>iPhone (Safari):</strong> Tap the Share icon → "Add to Home Screen"</li>
          <li><strong>Desktop (Chrome/Edge):</strong> Click the install icon in the address bar</li>
        </ul>
      </div>

      <div className="text-xs text-gray-400 border-t border-gray-100 pt-4">
        StrayWatch SVP is an independent civic tool. It is not affiliated with the Port Blair Municipal
        Council or the Andaman &amp; Nicobar Administration. MIT licensed.
      </div>

    </div>
  )
}
