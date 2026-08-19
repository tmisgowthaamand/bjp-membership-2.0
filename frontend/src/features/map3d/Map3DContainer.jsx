import { useState, useEffect, useRef } from 'react'
import { Map3D } from './Map3D'
import { DistrictTooltip, LocationPinIcon } from './DistrictTooltip'
import { useDistrictGeometry } from './useDistrictGeometry'
import { buildCountLookup, normalizeDistrictName } from './districtIndex'
import { getDistrictNumber } from '../../data/districtNormalizer'
import '../../styles/tn-map.css'

export default function Map3DContainer({
  districtCounts = {},
  selectedDistrict,
  onSelectDistrict,
}) {
  const [geoData, setGeoData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [hoveredId, setHoveredId] = useState(null)
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, district: '', count: 0 })
  const containerRef = useRef(null)
  const controlsRef = useRef(null)

  // 1. Fetch the 38-district GeoJSON
  useEffect(() => {
    fetch('/tn-districts.geojson?v=38')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load GeoJSON')
        return res.json()
      })
      .then((data) => {
        setGeoData(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('[Map3D] GeoJSON loading failed:', err)
        setError(true)
        setLoading(false)
      })
  }, [])

  const countLookup = buildCountLookup(districtCounts)
  const districts = useDistrictGeometry(geoData, countLookup)

  // Pointer event handlers
  const handlePointerOver = (e, district) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setHoveredId(district.id)
      setTooltip({
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        district: district.name,
        count: district.count,
        lat: district.lat,
        lng: district.lng,
      })
    }
  }

  const handlePointerOut = () => {
    setHoveredId(null)
    setTooltip((prev) => ({ ...prev, visible: false }))
  }

  const handleClick = (district) => {
    if (onSelectDistrict) {
      const isAlreadyActive = normalizeDistrictName(selectedDistrict || '') === district.id
      onSelectDistrict(isAlreadyActive ? '' : district.name)
    }
  }

  const getInitialCameraZ = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 480) return 46
      if (window.innerWidth < 768) return 40
    }
    return 35
  }

  const [cameraZ, setCameraZ] = useState(getInitialCameraZ)

  useEffect(() => {
    const handleResize = () => {
      const targetZ = getInitialCameraZ()
      setCameraZ(targetZ)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const applyZoom = (zVal) => {
    setCameraZ(zVal)
    if (controlsRef.current) {
      controlsRef.current.object.position.set(0, 0.2, zVal)
      controlsRef.current.update()
    }
  }

  const zoomIn = () => {
    const nextZ = Math.max(14, cameraZ - 4)
    applyZoom(nextZ)
  }

  const zoomOut = () => {
    const nextZ = Math.min(55, cameraZ + 4)
    applyZoom(nextZ)
  }

  const resetView = () => {
    const defaultZ = getInitialCameraZ()
    applyZoom(defaultZ)
    if (controlsRef.current) {
      controlsRef.current.reset()
      controlsRef.current.object.position.set(0, 0.2, defaultZ)
      controlsRef.current.update()
    }
  }

  return (
    <div ref={containerRef} className="tn-map-wrapper" style={{ height: 'min(620px, 75vh)', minHeight: 520, background: '#f8fafc', borderRadius: 20 }}>

      {loading && (
        <div className="tn-map-loading">
          <div className="tn-map-spinner" />
          <span>Rendering 3D Tamil Nadu Map…</span>
        </div>
      )}

      {error && (
        <div className="tn-map-loading">
          <span style={{ fontSize: 32 }}>🗺️</span>
          <span style={{ color: '#c45200' }}>3D Map Unavailable</span>
        </div>
      )}

      {!loading && !error && (
        <>
          <Map3D
            districts={districts}
            hoveredId={hoveredId}
            selectedDistrict={selectedDistrict}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onClick={handleClick}
            controlsRef={controlsRef}
            cameraZ={cameraZ}
          />

          <DistrictTooltip tooltip={tooltip} />

          {/* Floating Zoom & Fit Perspective Controls */}
          <div style={{
            position: 'absolute', top: 12, right: 12, zIndex: 900,
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <button
              onClick={resetView}
              className="btn btn-sm"
              style={{
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 800,
                color: '#ffffff',
                background: '#f76201',
                border: 'none',
                boxShadow: '0 4px 12px rgba(247,98,1,0.3)',
                padding: '6px 14px',
                cursor: 'pointer'
              }}
              title="Auto-Fit Entire Tamil Nadu Map"
            >
              ↺ Fit Full Map
            </button>

            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(247, 98, 1, 0.2)',
              borderRadius: 12,
              padding: '3px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              <button
                onClick={zoomIn}
                style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: 8, width: 26, height: 26, fontWeight: 900, fontSize: 15, cursor: 'pointer' }}
                title="Zoom In (+)"
              >
                +
              </button>
              <button
                onClick={zoomOut}
                style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: 8, width: 26, height: 26, fontWeight: 900, fontSize: 15, cursor: 'pointer' }}
                title="Zoom Out (-)"
              >
                -
              </button>
            </div>
          </div>

          {/* District 3D Hint Badge */}
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              zIndex: 900,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(247, 98, 1, 0.2)',
              borderRadius: 12,
              padding: '7px 14px',
              fontSize: 11,
              fontWeight: 700,
              color: '#334155',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span>✨ Full 38 Districts Visible • Drag to rotate • Click district to filter</span>
          </div>

          {/* Selected District Badge */}
          {selectedDistrict && (
            <div className="tn-selected-badge" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <LocationPinIcon size={14} color="#FFFFFF" fill="#FFFFFF" />
              <span>#{getDistrictNumber(selectedDistrict)} {selectedDistrict}</span>
              <button onClick={() => onSelectDistrict && onSelectDistrict('')}>
                ✕
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
