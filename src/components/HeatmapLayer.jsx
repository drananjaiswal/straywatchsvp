// straywatchsvp/src/components/HeatmapLayer.jsx
import { useEffect, useRef } from 'react'
import { subscribeToSightings, unsubscribeFromSightings } from '../lib/supabase'

const MAP_CENTER = [11.6650, 92.7310] // Port Blair
const MAP_ZOOM = 13

export default function HeatmapLayer({ sightings, height = '420px', wardFilter = null }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const heatRef = useRef(null)
  const pointsRef = useRef([])

  function buildPoints(data) {
    return data
      .filter(s => !wardFilter || s.ward_id === wardFilter)
      .map(s => [s.latitude, s.longitude, s.dog_count || 1])
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Guard: leaflet-heat must be available from the index.html script tag
    if (typeof window.L === 'undefined') {
      console.error('Leaflet not loaded')
      return
    }

    const map = window.L.map(containerRef.current, {
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      zoomControl: true
    })
    mapRef.current = map

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map)

    // Colour legend — bottom left
    const legend = window.L.control({ position: 'bottomleft' })
    legend.onAdd = () => {
      const div = window.L.DomUtil.create('div')
      div.style.cssText = 'background:white;padding:6px 10px;border-radius:6px;border:1px solid #e5e7eb;font-size:11px;line-height:1.8'
      div.innerHTML = `
        <div style="font-weight:600;margin-bottom:2px;color:#374151">Dog density</div>
        <div><span style="color:#facc15;font-size:14px">●</span> Low</div>
        <div><span style="color:#f97316;font-size:14px">●</span> Medium</div>
        <div><span style="color:#dc2626;font-size:14px">●</span> High</div>
      `
      return div
    }
    legend.addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
      heatRef.current = null
    }
  }, [])

  // Update heatmap when sightings or filter changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || typeof window.L.heatLayer === 'undefined') return

    const points = buildPoints(sightings)
    pointsRef.current = points

    if (heatRef.current) {
      heatRef.current.setLatLngs(points)
    } else {
      heatRef.current = window.L.heatLayer(points, {
        radius: 35,
        blur: 20,
        maxZoom: 13,
        gradient: { 0.4: '#facc15', 0.65: '#f97316', 1.0: '#dc2626' }
      }).addTo(map)
    }
  }, [sightings, wardFilter])

  // Realtime: subscribe to new inserts and append to heatmap
  useEffect(() => {
    const channel = subscribeToSightings((newSighting) => {
      if (wardFilter && newSighting.ward_id !== wardFilter) return
      if (heatRef.current) {
        const pt = [newSighting.latitude, newSighting.longitude, newSighting.dog_count || 1]
        pointsRef.current = [...pointsRef.current, pt]
        heatRef.current.setLatLngs(pointsRef.current)
      }
    })
    return () => unsubscribeFromSightings(channel)
  }, [wardFilter])

  return (
    <div
      ref={containerRef}
      style={{ height, width: '100%', borderRadius: '8px', overflow: 'hidden', zIndex: 0 }}
      className="border border-gray-200"
    />
  )
}
