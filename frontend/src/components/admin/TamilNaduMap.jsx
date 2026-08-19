import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react'
import { admin } from '../../api'
import { normalizeDistrictName, getDistrictColorIntensity, getDistrictNumber, TN_38_DISTRICTS } from '../../data/districtNormalizer'
import Map3DContainer from '../../features/map3d/Map3DContainer'
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

// Distinct Vibrant District Color Palette for all 38 Districts
const DISTRICT_PALETTE = {
  Chennai: '#9333EA',       // Purple
  Thiruvallur: '#DC2626',   // Crimson Red
  Kancheepuram: '#D97706',  // Amber Gold
  Chengalpattu: '#EA580C',  // Saffron Orange
  Vellore: '#0284C7',       // Sky Blue
  Ranipet: '#0891B2',       // Cyan
  Tirupathur: '#0369A1',    // Deep Blue
  Tiruvannamalai: '#65A30D',// Apple Green
  Villupuram: '#7E22CE',    // Royal Purple
  Kallakurichi: '#A21CAF',  // Deep Magenta
  Cuddalore: '#D97706',     // Amber
  Krishnagiri: '#EA580C',   // Bright Orange
  Dharmapuri: '#B91C1C',    // Ruby Red
  Salem: '#0284C7',         // Teal Blue
  Erode: '#7E22CE',         // Violet
  Nilgiris: '#D97706',      // Amber
  Coimbatore: '#15803D',    // Forest Green
  Tiruppur: '#DC2626',      // Bright Red
  Namakkal: '#991B1B',      // Dark Red
  Karur: '#0284C7',         // Cyan
  Tiruchirappalli: '#EA580C',// Saffron
  Perambalur: '#4D7C0F',    // Green
  Ariyalur: '#B45309',      // Rust Gold
  Mayiladuthurai: '#E11D48',// Rose Red
  Nagapattinam: '#D97706',  // Amber Gold
  Tiruvarur: '#0284C7',     // Sky Blue
  Thanjavur: '#9333EA',     // Purple
  Pudukkottai: '#65A30D',   // Lime Green
  Dindigul: '#B45309',      // Brown Gold
  Theni: '#DC2626',         // Red
  Madurai: '#C026D3',       // Magenta
  Sivagangai: '#0891B2',    // Cyan
  Virudhunagar: '#65A30D',  // Lime
  Ramanathapuram: '#D97706',// Gold
  Tenkasi: '#C026D3',       // Orchid
  Tirunelveli: '#991B1B',   // Dark Red
  Thoothukudi: '#EA580C',   // Orange
  Kanniyakumari: '#7E22CE', // Purple
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
          <h2 style={{ margin: '6px 0 0 0', fontSize: 24, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
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

      {/* 2. Real Application KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderRadius: 16, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Total Applications</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif', marginTop: 4 }}>
            {totalApps}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#059669', marginTop: 2 }}>✓ Verified Local Database</div>
        </div>

        <div style={{ padding: '16px 20px', borderRadius: 16, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Active Districts</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#2563EB', fontFamily: 'Outfit, sans-serif', marginTop: 4 }}>
            {`${activeDistrictsCount} / 38`}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginTop: 2 }}>Districts with Submissions</div>
        </div>

        <div style={{ padding: '16px 20px', borderRadius: 16, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Peak Density</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#DC2626', fontFamily: 'Outfit, sans-serif', marginTop: 4 }}>
            {maxCount}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginTop: 2 }}>Single District Max Count</div>
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

            {/* SVG Map Stage */}
            <div style={{ width: '100%', height: 'auto' }}>
              <svg viewBox="0 0 540 660" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
                <defs>
                  <filter id="stateSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0F172A" floodOpacity="0.22" />
                  </filter>

                  <filter id="districtHighlightGlow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#000000" floodOpacity="0.4" />
                  </filter>
                </defs>

                <g filter="url(#stateSoftShadow)">
                  {featurePointsList.map(({ normName, projected }) => {
                    if (!projected.length) return null

                    const pointsStr = coordsToPoints(projected)
                    const centroid = getCentroid(projected)
                    const count = Number(normalizedCounts[normName]) || 0
                    const distNum = getDistrictNumber(normName)
                    const isSelected = selectedDistrict && selectedDistrict.toLowerCase() === normName.toLowerCase()
                    const isHovered = hoveredDistrict === normName
                    const isAnimatedActive = currentAnimDistrict === normName

                    const lx = centroid.x
                    const ly = centroid.y

                    // Color palette selection
                    const baseColor = DISTRICT_PALETTE[normName] || '#0284C7'
                    const fillColor = isAnimatedActive
                      ? '#F59E0B'
                      : isSelected
                      ? '#2563EB'
                      : isHovered
                      ? '#1D4ED8'
                      : count > 0
                      ? getDistrictColorIntensity(count, maxCount)
                      : baseColor

                    return (
                      <g
                        key={normName}
                        style={{ cursor: 'pointer' }}
                        onMouseMove={(e) => handleMouseMove(e, normName)}
                        onMouseLeave={() => setHoveredDistrict(null)}
                        onClick={() => onSelectDistrict && onSelectDistrict(isSelected ? '' : normName)}
                      >
                        {/* Polygon Surface with Clean White Borders */}
                        <polygon
                          points={pointsStr}
                          fill={fillColor}
                          stroke="#FFFFFF"
                          strokeWidth={isAnimatedActive || isSelected ? '2.5' : '1.5'}
                          strokeLinejoin="round"
                          filter={isAnimatedActive || isHovered || isSelected ? 'url(#districtHighlightGlow)' : undefined}
                          style={{
                            transition: 'fill 0.25s ease, stroke 0.25s ease',
                            opacity: 1
                          }}
                        />

                        {/* Clean Centered Text Label inside Polygon */}
                        <text
                          x={lx}
                          y={count > 0 ? ly - 5 : ly}
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize={normName.length > 12 ? '8.5' : normName.length > 9 ? '9.5' : '11.5'}
                          fontWeight="800"
                          fontFamily="Outfit, sans-serif"
                          style={{
                            pointerEvents: 'none',
                            textShadow: '0 1px 4px rgba(15,23,42,0.85)'
                          }}
                        >
                          {normName}
                        </text>

                        {/* Clean Non-Overlapping Application Count Badge */}
                        {count > 0 && (
                          <g transform={`translate(${lx - 10}, ${ly + 2})`}>
                            <rect
                              width="20"
                              height="11"
                              rx="5"
                              fill="#0F172A"
                              stroke="#FFFFFF"
                              strokeWidth="1"
                            />
                            <text
                              x="10"
                              y="8.5"
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
                  <span>#{getDistrictNumber(hoveredDistrict)} {hoveredDistrict}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 3, fontSize: 11, color: '#E2E8F0' }}>
                  <span>Real Applications: <strong>{normalizedCounts[hoveredDistrict] || 0}</strong></span>
                  <span style={{ color: '#94A3B8' }}>
                    ({Math.round(((Number(normalizedCounts[hoveredDistrict]) || 0) / totalApps) * 100)}%)
                  </span>
                </div>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11, fontWeight: 800, color: '#64748B', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <LocationPinIcon size={14} color="#2563EB" fill="#2563EB" />
              <span>38 Complete Districts (#1 to #38) • Dynamic Mercator Projection Engine</span>
            </div>
          </div>
        )}

        {/* Right Side: Interactive District Directory Cards */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#0F172A', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>DISTRICT APPLICATION DIRECTORY</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#2563EB' }}>Total: {totalApps} Applications</span>
          </div>

          <div style={{ maxHeight: 540, overflowY: 'auto', paddingRight: 6 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(172px, 1fr))', gap: 10 }}>
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
                      padding: '10px 12px', borderRadius: 14, cursor: 'pointer',
                      background: isAnimatedActive ? '#FEF3C7' : isSelected ? '#2563EB' : count > 0 ? '#EFF6FF' : '#F8FAFC',
                      color: isSelected ? '#FFFFFF' : '#0F172A',
                      border: isAnimatedActive ? '2px solid #F59E0B' : isSelected ? '2px solid #1D4ED8' : count > 0 ? '1.5px solid #BFDBFE' : '1px solid #E2E8F0',
                      transition: 'all 0.15s ease',
                      boxShadow: isAnimatedActive ? '0 4px 12px rgba(245,158,11,0.3)' : isSelected ? '0 4px 12px rgba(37,99,235,0.25)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 900,
                        background: isSelected ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                        color: isSelected ? '#FFFFFF' : '#475569',
                        padding: '1px 5px', borderRadius: 6,
                        fontFamily: 'JetBrains Mono, monospace', flexShrink: 0
                      }}>
                        #{distNum}
                      </span>
                      <LocationPinIcon size={12} color={isSelected ? '#FFFFFF' : DISTRICT_PALETTE[name] || '#2563EB'} fill={isSelected ? '#FFFFFF' : DISTRICT_PALETTE[name] || '#2563EB'} />
                      <span
                        title={name}
                        style={{
                          fontSize,
                          fontWeight: 800,
                          fontFamily: 'Outfit, sans-serif',
                          flex: 1,
                          letterSpacing: name.length > 13 ? '-0.2px' : 'normal',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? 'rgba(255,255,255,0.9)' : '#64748B' }}>
                        {pct}% share
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 8,
                        background: isSelected ? '#FFFFFF' : count > 0 ? '#2563EB' : '#E2E8F0',
                        color: isSelected ? '#2563EB' : count > 0 ? '#FFFFFF' : '#475569'
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
