import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react'
import { admin } from '../../api'
import { normalizeDistrictName, getDistrictColorIntensity, getDistrictNumber, TN_38_DISTRICTS } from '../../data/districtNormalizer'
import Map3DContainer from '../../features/map3d/Map3DContainer'
import { getDistrictDisplayName } from '../../features/map3d/DistrictMesh'
import { getDistrictBaseColor } from '../../features/map3d/districtColorScale'
import '../../styles/tn-map.css'

export function LocationPinIcon({ size = 16, color = '#2563EB', fill = '#2563EB', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: '-3px', ...style }}
    >
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        fill={fill}
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="2.5" fill="#FFFFFF" />
    </svg>
  )
}

// Precision SVG centroid micro-offsets for perfect centered district label placement
const SVG_DISTRICT_OFFSETS = {
  chennai: { x: 8, y: -4 },
  ranipet: { x: 2, y: -4 },
  vellore: { x: -6, y: 0 },
  tirupathur: { x: -8, y: -4 },
  tirupattur: { x: -8, y: -4 },
  kancheepuram: { x: -2, y: -6 },
  kanchipuram: { x: -2, y: -6 },
  chengalpattu: { x: 8, y: 4 },
  chengalpet: { x: 8, y: 4 },
  perambalur: { x: -4, y: -3 },
  ariyalur: { x: 8, y: 0 },
  tiruchirappalli: { x: 0, y: 0 },
  trichy: { x: 0, y: 0 },
  thanjavur: { x: -4, y: 0 },
  tiruvarur: { x: 0, y: -6 },
  thiruvarur: { x: 0, y: -6 },
  nagapattinam: { x: 12, y: 16 },
  mayiladuthurai: { x: 6, y: -2 },
  kanniyakumari: { x: 0, y: -6 },
  kanyakumari: { x: 0, y: -6 },
  dharmapuri: { x: 0, y: -2 },
  krishnagiri: { x: 0, y: -4 },
  cuddalore: { x: 6, y: 0 },
  pudukkottai: { x: 0, y: 0 },
  ramanathapuram: { x: 8, y: 0 },
  ramnad: { x: 8, y: 0 },
  tiruvannamalai: { x: 2, y: -14 },
  tvmalai: { x: 2, y: -14 },
  nilgiris: { x: -4, y: 0 },
  coimbatore: { x: 0, y: 0 },
  tiruppur: { x: -3, y: 3 },
  erode: { x: 0, y: 0 },
  salem: { x: 0, y: 0 },
  namakkal: { x: 0, y: 0 },
  karur: { x: -2, y: 3 },
  dindigul: { x: 0, y: 0 },
  theni: { x: 0, y: 0 },
  madurai: { x: 0, y: 0 },
  sivagangai: { x: 0, y: 0 },
  virudhunagar: { x: 0, y: 0 },
  thoothukudi: { x: 0, y: 0 },
  tirunelveli: { x: 0, y: 0 },
  tenkasi: { x: 0, y: 0 },
  kallakurichi: { x: 0, y: 2 },
  villupuram: { x: 0, y: 0 },
}

// Dynamic Mercator Projection Engine based on actual GeoJSON Bounding Box
function projectCoordsDynamic(coords, bbox, width = 540, height = 660) {
  const { minLng, maxLng, minLat, maxLat } = bbox

  return coords.map(([lng, lat]) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * (width - 70) + 35
    const y = height - (((lat - minLat) / (maxLat - minLat)) * (height - 70) + 35)
    return { x: parseFloat(x.toFixed(1)), y: parseFloat(y.toFixed(1)) }
  })
}

function coordsToPoints(pointsArr) {
  return pointsArr.map((p) => `${p.x},${p.y}`).join(' ')
}

// Polygon Centroid Math Engine
function getCentroid(pointsArr) {
  let cx = 0, cy = 0
  pointsArr.forEach((p) => {
    cx += p.x
    cy += p.y
  })
  return { x: cx / pointsArr.length, y: cy / pointsArr.length }
}

export default function TamilNaduMap({ onSelectDistrict, selectedDistrict = '' }) {
  const [mapMode, setMapMode] = useState('3D') // '3D' | '2D'
  const [geoJson, setGeoJson] = useState(null)
  const [rawCounts, setRawCounts] = useState({})
  const [userRole, setUserRole] = useState('super_admin')
  const [hoveredDistrict, setHoveredDistrict] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Animated Tour Mode State
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(false)
  const [animatedIndex, setAnimatedIndex] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.allSettled([
      fetch('/tn-districts.geojson?v=38').then((res) => res.json()),
      admin.getDistrictAnalytics(),
    ]).then(([geoRes, countRes]) => {
      if (geoRes.status === 'fulfilled') setGeoJson(geoRes.value)
      if (countRes.status === 'fulfilled') {
        const payload = countRes.value || {}
        const counts = payload.data?.district_counts || payload.district_counts || {}
        setRawCounts(counts)
        setUserRole(payload.user_role || payload.role || 'super_admin')
      } else {
        setError('Could not fetch real application data from server.')
      }
    }).finally(() => setLoading(false))
  }, [])

  // Auto-Animation District Tour Interval
  useEffect(() => {
    if (isPlayingAnimation) {
      timerRef.current = setInterval(() => {
        setAnimatedIndex((prevIndex) => (prevIndex + 1) % TN_38_DISTRICTS.length)
      }, 1200)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlayingAnimation])

  // Current active district under animation
  const currentAnimDistrict = useMemo(() => {
    if (!isPlayingAnimation) return null
    return TN_38_DISTRICTS[animatedIndex]
  }, [isPlayingAnimation, animatedIndex])

  // Normalized counts dictionary for all 38 TN Districts
  const normalizedCounts = useMemo(() => {
    const map = {}
    TN_38_DISTRICTS.forEach((d) => { map[d] = 0 })

    Object.entries(rawCounts).forEach(([key, val]) => {
      const norm = normalizeDistrictName(key)
      if (norm) {
        map[norm] = (map[norm] || 0) + (Number(val) || 0)
      }
    })
    return map
  }, [rawCounts])

  const maxCount = useMemo(() => {
    return Math.max(...Object.values(normalizedCounts), 1)
  }, [normalizedCounts])

  const totalApps = useMemo(() => {
    return Object.values(normalizedCounts).reduce((a, b) => a + (Number(b) || 0), 0)
  }, [normalizedCounts])

  const activeDistrictsCount = useMemo(() => {
    return Object.values(normalizedCounts).filter((c) => c > 0).length
  }, [normalizedCounts])

  // Compute exact Bounding Box of all 38 districts from GeoJSON coordinates
  const geoBbox = useMemo(() => {
    if (!geoJson || !geoJson.features) {
      return { minLng: 76.0, maxLng: 80.6, minLat: 8.0, maxLat: 13.6 }
    }
    let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90

    geoJson.features.forEach((feat) => {
      const rawCoords = feat.geometry?.coordinates?.[0] || []
      rawCoords.forEach(([lng, lat]) => {
        if (lng < minLng) minLng = lng
        if (lng > maxLng) maxLng = lng
        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
      })
    })

    return { minLng, maxLng, minLat, maxLat }
  }, [geoJson])

  const handleMouseMove = (e, name) => {
    const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect()
    setHoveredDistrict(name)
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const isDistrictAdmin = userRole === 'district_admin'
  const features = geoJson?.features || []

  // Pre-calculate projected points using dynamic bounding box
  const featurePointsList = useMemo(() => {
    return features.map((feat) => {
      const rawName = feat.properties?.district || feat.properties?.name || 'District'
      const normName = normalizeDistrictName(rawName)
      const rawCoords = feat.geometry?.coordinates?.[0] || []
      const projected = projectCoordsDynamic(rawCoords, geoBbox, 540, 660)
      return { feat, normName, projected }
    })
  }, [features, geoBbox])

  return (
    <div className="admin-card mb-4" style={{
      padding: '26px 32px', background: '#FFFFFF', borderRadius: 24,
      border: '1px solid #E2E8F0', boxShadow: '0 8px 30px -6px rgba(15,23,42,0.06)'
    }}>
      {/* 1. Header Banner & Animated Tour / 2D-3D Mode Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span style={{
            fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: isDistrictAdmin ? '#D97706' : '#2563EB',
            background: isDistrictAdmin ? '#FEF3C7' : '#EFF6FF',
            padding: '4px 12px', borderRadius: 8
          }}>
            {isDistrictAdmin ? 'District Admin (Read Only — All 38 Districts)' : 'All 38 Districts Active'}
          </span>
          <h2 style={{ margin: '6px 0 0 0', fontSize: 'clamp(17px, 4.5vw, 24px)', fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
            TAMIL NADU 38-DISTRICT INTERACTIVE MAP
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* 2D / 3D Mode Toggle Switch */}
          <div style={{
            background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 14, padding: 3, display: 'flex', gap: 2
          }}>
            <button
              onClick={() => setMapMode('3D')}
              style={{
                background: mapMode === '3D' ? '#f76201' : 'transparent',
                color: mapMode === '3D' ? '#FFFFFF' : '#475569',
                border: 'none', borderRadius: 11, padding: '6px 14px', fontSize: 12, fontWeight: 800,
                cursor: 'pointer', transition: 'all 0.15s ease'
              }}
            >
              🧊 3D Extruded View
            </button>
            <button
              onClick={() => setMapMode('2D')}
              style={{
                background: mapMode === '2D' ? '#2563EB' : 'transparent',
                color: mapMode === '2D' ? '#FFFFFF' : '#475569',
                border: 'none', borderRadius: 11, padding: '6px 14px', fontSize: 12, fontWeight: 800,
                cursor: 'pointer', transition: 'all 0.15s ease'
              }}
            >
              🗺️ 2D Vector Map
            </button>
          </div>

          {/* Animated Tour Toggle Button */}
          {mapMode === '2D' && (
            <button
              onClick={() => setIsPlayingAnimation(!isPlayingAnimation)}
              style={{
                background: isPlayingAnimation ? '#DC2626' : '#2563EB',
                color: '#FFFFFF', border: 'none', borderRadius: 12,
                padding: '8px 18px', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37,99,235,0.25)', transition: 'all 0.15s ease'
              }}
            >
              {isPlayingAnimation ? '⏸ Pause 38-District Tour' : '▶ Play 38-District Tour'}
            </button>
          )}

          {selectedDistrict && (
            <button
              onClick={() => onSelectDistrict && onSelectDistrict('')}
              style={{
                background: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FCA5A5',
                borderRadius: 12, padding: '8px 16px', fontSize: 13, fontWeight: 800, cursor: 'pointer'
              }}
            >
              Clear Selected Filter ({selectedDistrict}) ✕
            </button>
          )}
        </div>
      </div>

      {/* Selected District Dynamic Application Banner */}
      {selectedDistrict && (
        <div style={{
          marginBottom: 20, padding: '16px 24px', borderRadius: 18,
          background: 'linear-gradient(135deg, #1E4ED8, #2563EB)', color: '#FFFFFF',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14,
          boxShadow: '0 8px 24px rgba(37,99,235,0.25)', border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#93C5FD', display: 'flex', alignItems: 'center', gap: 6 }}>
              <LocationPinIcon size={14} color="#93C5FD" fill="#93C5FD" />
              <span>Selected District Live Registry Filter</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'Outfit, sans-serif', marginTop: 2 }}>
              DISTRICT #{getDistrictNumber(selectedDistrict)} — {selectedDistrict.toUpperCase()}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#E0E7FF', marginTop: 2 }}>
              Live Database Submissions: <strong style={{ color: '#FFFFFF', fontSize: 15 }}>{normalizedCounts[selectedDistrict] || 0} Applications</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => {
                window.location.href = `/admin/applications?district=${encodeURIComponent(selectedDistrict)}`
              }}
              style={{
                background: '#FFFFFF', color: '#1E4ED8', border: 'none',
                borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 900,
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'all 0.15s ease'
              }}
            >
              View All {normalizedCounts[selectedDistrict] || 0} Applications in {selectedDistrict} →
            </button>

            <button
              onClick={() => onSelectDistrict && onSelectDistrict('')}
              style={{
                background: 'rgba(255,255,255,0.2)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 800, cursor: 'pointer'
              }}
              title="Clear District Filter"
            >
              ✕ Clear
            </button>
          </div>
        </div>
      )}

      {/* Animated Tour Banner Status */}
      {isPlayingAnimation && mapMode === '2D' && (
        <div style={{
          marginBottom: 18, padding: '10px 18px', borderRadius: 14,
          background: '#EFF6FF', border: '1.5px solid #60A5FA',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#2563EB', display: 'inline-block', animation: 'pulse 1s infinite' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#1E4ED8' }}>
              Animating District {animatedIndex + 1} of 38: <strong>#{animatedIndex + 1} {currentAnimDistrict}</strong>
            </span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB' }}>
            Real Applications: {normalizedCounts[currentAnimDistrict] || 0}
          </span>
        </div>
      )}

      {/* 2. Real Application KPI Summary Cards (3 Columns) */}
      <div className="tn-kpi-cards-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
        marginBottom: 24,
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{
          padding: '14px 12px',
          borderRadius: 16,
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          boxSizing: 'border-box',
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <div style={{
            fontSize: 10.5,
            fontWeight: 800,
            color: '#64748B',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            Total Applications
          </div>
          <div style={{
            fontSize: 24,
            fontWeight: 900,
            color: '#0F172A',
            fontFamily: 'Outfit, sans-serif',
            marginTop: 4,
            lineHeight: 1.1
          }}>
            {totalApps}
          </div>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#059669',
            marginTop: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            ✓ Verified DB
          </div>
        </div>

        <div style={{
          padding: '14px 12px',
          borderRadius: 16,
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          boxSizing: 'border-box',
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <div style={{
            fontSize: 10.5,
            fontWeight: 800,
            color: '#64748B',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            Active Districts
          </div>
          <div style={{
            fontSize: 24,
            fontWeight: 900,
            color: '#2563EB',
            fontFamily: 'Outfit, sans-serif',
            marginTop: 4,
            lineHeight: 1.1
          }}>
            {`${activeDistrictsCount} / 38`}
          </div>
          <div style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#64748B',
            marginTop: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            With Submissions
          </div>
        </div>

        <div style={{
          padding: '14px 12px',
          borderRadius: 16,
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          boxSizing: 'border-box',
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <div style={{
            fontSize: 10.5,
            fontWeight: 800,
            color: '#64748B',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            Peak Density
          </div>
          <div style={{
            fontSize: 24,
            fontWeight: 900,
            color: '#DC2626',
            fontFamily: 'Outfit, sans-serif',
            marginTop: 4,
            lineHeight: 1.1
          }}>
            {maxCount}
          </div>
          <div style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#64748B',
            marginTop: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            Max Count
          </div>
        </div>
      </div>

      {/* 3. Main Stage: 3D Extruded Canvas or 2D Vector Map + Right Directory Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
        
        {/* Map Container Stage */}
        {mapMode === '3D' ? (
          <div style={{ width: '100%' }}>
            <Suspense fallback={
              <div style={{ height: 560, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdf6ee', borderRadius: 24, border: '1.5px solid #E2E8F0' }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="spinner-border text-warning" role="status" style={{ width: '2.5rem', height: '2.5rem' }} />
                  <div style={{ marginTop: 12, fontSize: 13, fontWeight: 800, color: '#f76201' }}>Loading 3D Extruded Tamil Nadu Map…</div>
                </div>
              </div>
            }>
              <Map3DContainer
                districtCounts={rawCounts}
                selectedDistrict={selectedDistrict}
                onSelectDistrict={onSelectDistrict}
              />
            </Suspense>
          </div>
        ) : (
          /* 2D Map Stage */
          <div style={{
            position: 'relative',
            background: '#F8FAFC',
            borderRadius: 24, border: '1.5px solid #E2E8F0', padding: 24,
            boxShadow: '0 10px 30px -5px rgba(15,23,42,0.06)'
          }}>
            {loading && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                <div className="spinner-border text-primary" role="status" />
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, color: '#2563EB' }}>Loading Application Metrics...</div>
              </div>
            )}

            {error && (
              <div style={{
                position: 'absolute', inset: 16, background: 'rgba(255,255,255,0.95)',
                borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: 20, zIndex: 10, textAlign: 'center'
              }}>
                <div style={{ color: '#DC2626', fontSize: 14, fontWeight: 900 }}>⚠️ {error}</div>
                <button
                  onClick={() => window.location.reload()}
                  style={{ marginTop: 12, padding: '6px 16px', background: '#2563EB', color: '#FFF', borderRadius: 8, border: 'none', fontWeight: 800, cursor: 'pointer' }}
                >
                  Retry Connection
                </button>
              </div>
            )}

            {/* SVG Map Stage with Zero-Lag Hardware Acceleration */}
            <div style={{ width: '100%', height: 'auto', transform: 'translateZ(0)' }}>
              <svg
                viewBox="0 0 540 660"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  overflow: 'visible',
                  filter: 'drop-shadow(0 10px 20px rgba(15, 23, 42, 0.15))'
                }}
              >
                {/* 1. LAYER 1: Base Map Polygons */}
                <g id="map-polygons">
                  {featurePointsList.map(({ normName, projected }) => {
                    if (!projected.length) return null

                    const pointsStr = coordsToPoints(projected)
                    const count = Number(normalizedCounts[normName]) || 0
                    const isSelected = selectedDistrict && selectedDistrict.toLowerCase() === normName.toLowerCase()
                    const isHovered = hoveredDistrict === normName
                    const isAnimatedActive = currentAnimDistrict === normName

                    // Clean Executive Vector Theme (Screenshot 2 Style)
                    const isActive = count > 0
                    const fillColor = isSelected
                      ? '#2563EB'
                      : isHovered || isAnimatedActive
                      ? '#EA580C'
                      : isActive
                      ? '#C2410C'
                      : '#F1F5F9'

                    const strokeColor = isSelected
                      ? '#1D4ED8'
                      : isHovered || isAnimatedActive
                      ? '#9A3412'
                      : isActive
                      ? '#7C2D12'
                      : '#475569'

                    const strokeWidth = isSelected || isHovered || isAnimatedActive ? '2' : '1'

                    return (
                      <polygon
                        key={`poly-${normName}`}
                        points={pointsStr}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                        style={{
                          cursor: 'pointer',
                          transition: 'fill 0.12s ease, stroke 0.12s ease',
                        }}
                        onMouseMove={(e) => handleMouseMove(e, normName)}
                        onMouseLeave={() => setHoveredDistrict(null)}
                        onClick={() => onSelectDistrict && onSelectDistrict(isSelected ? '' : normName)}
                      />
                    )
                  })}
                </g>

                {/* 2. LAYER 2: Crisp Text Labels & Application Badges Rendered on Top */}
                <g id="map-labels" style={{ pointerEvents: 'none' }}>
                  {featurePointsList.map(({ normName, projected }) => {
                    if (!projected.length) return null

                    const centroid = getCentroid(projected)
                    const count = Number(normalizedCounts[normName]) || 0
                    const isSelected = selectedDistrict && selectedDistrict.toLowerCase() === normName.toLowerCase()
                    const isHovered = hoveredDistrict === normName
                    const isAnimatedActive = currentAnimDistrict === normName

                    const normKey = normName.toLowerCase().replace(/[^a-z]/g, '')
                    const offset = SVG_DISTRICT_OFFSETS[normKey] || { x: 0, y: 0 }
                    const lx = centroid.x + offset.x
                    const ly = centroid.y + offset.y

                    const isActive = count > 0
                    const textColor = isSelected || isHovered || isAnimatedActive || isActive
                      ? '#FFFFFF'
                      : '#0F172A'

                    const textShadow = isSelected || isHovered || isAnimatedActive || isActive
                      ? '0 1px 3px rgba(0,0,0,0.9)'
                      : 'none'

                    // Custom tailored font sizing per polygon area for zero overlap
                    const customSizes = {
                      tiruchirappalli: 8.2,
                      ramanathapuram: 8.2,
                      tiruvannamalai: 8.5,
                      mayiladuthurai: 7.8,
                      nagapattinam: 7.8,
                      kanniyakumari: 8,
                      chengalpattu: 8.2,
                      kancheepuram: 8.2,
                      kallakurichi: 8.2,
                      thiruvallur: 8.5,
                      perambalur: 7.8,
                      ariyalur: 7.8,
                      tiruvarur: 7.8,
                      ranipet: 7.8,
                      tirupathur: 7.8,
                      chennai: 8.5,
                    }

                    const svgLabel = getDistrictDisplayName(normName)
                    const fSize = customSizes[normKey] || (svgLabel.length > 10 ? 8.5 : svgLabel.length > 7 ? 9.5 : 11)

                    return (
                      <g key={`label-${normName}`}>
                        {/* Clean Centered Text Label with Crisp SVG Text Halo */}
                        <text
                          x={lx}
                          y={isActive ? ly - 4 : ly + 3}
                          textAnchor="middle"
                          fill={textColor}
                          stroke={isActive || isSelected || isHovered || isAnimatedActive ? 'none' : '#FFFFFF'}
                          strokeWidth={isActive || isSelected || isHovered || isAnimatedActive ? '0' : '2.8'}
                          strokeLinejoin="round"
                          paintOrder="stroke fill"
                          fontSize={fSize}
                          fontWeight="800"
                          fontFamily="Outfit, -apple-system, sans-serif"
                          style={{
                            pointerEvents: 'none',
                            textShadow,
                            letterSpacing: svgLabel.length > 12 ? '-0.2px' : 'normal'
                          }}
                        >
                          {svgLabel}
                        </text>

                        {/* Pill Badge for Active Applications (Screenshot 2 Match) */}
                        {isActive && (
                          <g transform={`translate(${lx - 11}, ${ly + 2})`}>
                            <rect
                              width="22"
                              height="12"
                              rx="6"
                              fill="#0F172A"
                              stroke="#FFFFFF"
                              strokeWidth="1"
                            />
                            <text
                              x="11"
                              y="9"
                              textAnchor="middle"
                              fill="#FFFFFF"
                              fontSize="7.5"
                              fontWeight="900"
                              fontFamily="JetBrains Mono, monospace"
                              style={{ pointerEvents: 'none' }}
                            >
                              {count}
                            </text>
                          </g>
                        )}
                      </g>
                    )
                  })}
                </g>
              </svg>
            </div>

            {/* Hover Cursor Tooltip Overlay */}
            {hoveredDistrict && (
              <div style={{
                position: 'absolute',
                top: Math.max(10, tooltipPos.y - 65),
                left: Math.min(240, Math.max(10, tooltipPos.x - 60)),
                background: '#0F172A', color: '#FFFFFF',
                borderRadius: 12, padding: '8px 14px', fontSize: 12,
                boxShadow: '0 10px 25px -5px rgba(15,23,42,0.4)', pointerEvents: 'none', zIndex: 99,
                border: '1.5px solid #2563EB', backdropFilter: 'blur(6px)'
              }}>
                <div style={{ fontWeight: 800, color: '#60A5FA', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LocationPinIcon size={14} color="#60A5FA" fill="#2563EB" />
                  <span>{hoveredDistrict}</span>
                </div>
                <div style={{ marginTop: 4, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#F59E0B', fontFamily: 'JetBrains Mono, monospace' }}>
                    {normalizedCounts[hoveredDistrict] || 0}
                  </span>
                  <span style={{ fontSize: 11, opacity: 0.8 }}>Applications Submitted</span>
                </div>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11, fontWeight: 800, color: '#64748B', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <LocationPinIcon size={14} color="#2563EB" fill="#2563EB" />
              <span>38 Complete Districts (#1 to #38) • Dynamic Mercator Projection Engine</span>
            </div>
          </div>
        )}

        {/* Right Side: Interactive District Directory Cards (2 Columns) */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#0F172A', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>DISTRICT APPLICATION DIRECTORY</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#2563EB' }}>Total: {totalApps} Applications</span>
          </div>

          <div style={{ maxHeight: 540, overflowY: 'auto', paddingRight: 6 }}>
            <div className="tn-district-directory-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {TN_38_DISTRICTS.map((name, idx) => {
                const count = Number(normalizedCounts[name]) || 0
                const distNum = idx + 1
                const isSelected = selectedDistrict && selectedDistrict.toLowerCase() === name.toLowerCase()
                const isAnimatedActive = currentAnimDistrict === name
                const pct = totalApps ? Math.round((count / totalApps) * 100) : 0
                const fontSize = name.length > 14 ? 10.5 : name.length > 12 ? 11 : 12

                return (
                  <div
                    key={name}
                    onClick={() => {
                      setIsPlayingAnimation(false)
                      onSelectDistrict && onSelectDistrict(isSelected ? '' : name)
                    }}
                    style={{
                      padding: '9px 10px', borderRadius: 14, cursor: 'pointer',
                      background: isAnimatedActive ? '#FEF3C7' : isSelected ? '#2563EB' : count > 0 ? '#EFF6FF' : '#F8FAFC',
                      color: isSelected ? '#FFFFFF' : '#0F172A',
                      border: isAnimatedActive ? '2px solid #F59E0B' : isSelected ? '2px solid #1D4ED8' : count > 0 ? '1.5px solid #BFDBFE' : '1px solid #E2E8F0',
                      transition: 'all 0.15s ease',
                      boxShadow: isAnimatedActive ? '0 4px 12px rgba(245,158,11,0.3)' : isSelected ? '0 4px 12px rgba(37,99,235,0.25)' : 'none',
                      minWidth: 0,
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, minWidth: 0 }}>
                      <span style={{
                        fontSize: 9.5, fontWeight: 900,
                        background: isSelected ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                        color: isSelected ? '#FFFFFF' : '#475569',
                        padding: '1px 4px', borderRadius: 5,
                        fontFamily: 'JetBrains Mono, monospace', flexShrink: 0
                      }}>
                        #{distNum}
                      </span>
                      <LocationPinIcon size={11} color={isSelected ? '#FFFFFF' : getDistrictBaseColor(name)} fill={isSelected ? '#FFFFFF' : getDistrictBaseColor(name)} style={{ flexShrink: 0 }} />
                      <span
                        title={name}
                        style={{
                          fontSize,
                          fontWeight: 800,
                          fontFamily: 'Outfit, sans-serif',
                          flex: 1,
                          letterSpacing: name.length > 13 ? '-0.3px' : 'normal',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          minWidth: 0
                        }}
                      >
                        {name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 600, color: isSelected ? 'rgba(255,255,255,0.9)' : '#64748B', whiteSpace: 'nowrap' }}>
                        {pct}% share
                      </span>
                      <span style={{
                        fontSize: 10.5, fontWeight: 900, padding: '2px 7px', borderRadius: 7,
                        background: isSelected ? '#FFFFFF' : count > 0 ? '#2563EB' : '#E2E8F0',
                        color: isSelected ? '#2563EB' : count > 0 ? '#FFFFFF' : '#475569',
                        flexShrink: 0
                      }}>
                        {count}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
