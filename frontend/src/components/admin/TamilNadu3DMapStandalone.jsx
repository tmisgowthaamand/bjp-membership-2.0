import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { DistrictMesh, getDistrictDisplayName } from '../../features/map3d/DistrictMesh'
import { useDistrictGeometry } from '../../features/map3d/useDistrictGeometry'
import { buildCountLookup, normalizeDistrictName } from '../../features/map3d/districtIndex'
import { getDistrictNumber } from '../../data/districtNormalizer'
import '../../styles/tn-map.css'

/**
 * Standalone Plug-and-Play 3D Tamil Nadu Interactive Map Component
 * Fully synced with the latest SDF vector typography, soft pastel palette,
 * non-breaking zoom resolution, centroid micro-offsets, and 3D tactile relief lighting.
 */
export default function TamilNadu3DMap({
  districtCounts = {},
  selectedDistrict = '',
  onSelectDistrict = () => {},
  height = 560,
  backgroundColor = '#f8fafc',
  showReset = true,
  showHint = true,
  className = '',
  style = {},
}) {
  const containerRef = useRef(null)
  const controlsRef = useRef(null)
  const [geoData, setGeoData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState(null)
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, district: '', count: 0, lat: 0, lng: 0 })

  // 1. Fetch 38-district GeoJSON
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
        console.error('[TamilNadu3DMap] Failed to load GeoJSON:', err)
        setLoading(false)
      })
  }, [])

  const countLookup = useMemo(() => buildCountLookup(districtCounts), [districtCounts])
  const districts = useDistrictGeometry(geoData, countLookup)
  const selectedNorm = normalizeDistrictName(selectedDistrict || '')

  const getInitialCameraZ = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 480) return 46
      if (window.innerWidth < 768) return 40
    }
    return 35
  }

  const [cameraZ, setCameraZ] = useState(getInitialCameraZ)

  const applyZoom = (zVal) => {
    setCameraZ(zVal)
    if (controlsRef.current) {
      controlsRef.current.object.position.set(0, 0.2, zVal)
      controlsRef.current.update()
    }
  }

  const zoomIn = () => applyZoom(Math.max(14, cameraZ - 4))
  const zoomOut = () => applyZoom(Math.min(55, cameraZ + 4))

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
    <div
      ref={containerRef}
      className={`tn-map-wrapper ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: 20,
        overflow: 'hidden',
        background: backgroundColor,
        border: '1.5px solid rgba(247, 98, 1, 0.15)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
        ...style,
      }}
    >
      {loading ? (
        <div className="tn-map-loading">
          <div className="tn-map-spinner" />
          <span>Rendering 3D Tamil Nadu Map…</span>
        </div>
      ) : (
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          style={{ width: '100%', height: '100%', background: backgroundColor }}
        >
          <PerspectiveCamera makeDefault position={[0, 0.2, cameraZ]} fov={38} />
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.7}
            minDistance={10}
            maxDistance={50}
            dampingFactor={0.08}
          />
          {/* Bright Luminous High-Clarity Lighting Setup */}
          <ambientLight intensity={1.9} color="#ffffff" />
          <directionalLight position={[-10, 20, 22]} intensity={1.7} color="#ffffff" />
          <directionalLight position={[14, -10, 16]} intensity={0.75} color="#ffffff" />
          <directionalLight position={[0, 14, 20]} intensity={0.5} color="#ffffff" />
          <pointLight position={[0, 0, 24]} intensity={0.55} color="#ffffff" />

          {/* 3D Tamil Nadu Map - Elevated Group for Perfect Southern/Northern Fit */}
          <group position={[0, 1.2, 0]} rotation={[-0.18, 0.1, 0]}>

            <Suspense fallback={null}>
              {districts.map((d) => (
                <DistrictMesh
                  key={d.id}
                  district={d}
                  isHovered={hoveredId === d.id}
                  isSelected={selectedNorm === d.id}
                  onPointerOver={(e, dist) => {
                    if (containerRef.current) {
                      const rect = containerRef.current.getBoundingClientRect()
                      setHoveredId(dist.id)
                      setTooltip({
                        visible: true,
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                        district: dist.name,
                        count: dist.count,
                        lat: dist.lat,
                        lng: dist.lng,
                      })
                    }
                  }}
                  onPointerOut={() => {
                    setHoveredId(null)
                    setTooltip((p) => ({ ...p, visible: false }))
                  }}
                  onClick={(dist) => {
                    const isAlready = selectedNorm === dist.id
                    onSelectDistrict(isAlready ? '' : dist.name)
                  }}
                />
              ))}
            </Suspense>
          </group>
        </Canvas>
      )}

      {/* Floating 2D Tooltip */}
      {tooltip.visible && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x + 14,
            top: tooltip.y - 75,
            pointerEvents: 'none',
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(247, 98, 1, 0.45)',
            borderRadius: 12,
            padding: '10px 14px',
            minWidth: 170,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            color: '#fff',
          }}
        >
          <div style={{ fontSize: 13.5, fontWeight: 800, fontFamily: 'Outfit, sans-serif', marginBottom: 4 }}>
            📍 {getDistrictDisplayName(tooltip.district)}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 20, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: '#f76201' }}>
              {tooltip.count.toLocaleString()}
            </span>
            <span style={{ fontSize: 12, opacity: 0.75, fontFamily: 'Plus Jakarta Sans, sans-serif' }}> applications</span>
          </div>
          {tooltip.lat && tooltip.lng && (
            <div style={{ fontSize: 10.5, color: '#90caf9', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <span>🌐</span>
              <span style={{ fontWeight: 600 }}>{tooltip.lat}° N, {tooltip.lng}° E</span>
            </div>
          )}
        </div>
      )}

      {/* Zoom & Fit Perspective Controls */}
      {showReset && !loading && (
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 900, display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={resetView}
            style={{
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 800,
              color: '#ffffff',
              background: '#f76201',
              border: 'none',
              boxShadow: '0 4px 12px rgba(247,98,1,0.3)',
              padding: '6px 14px',
              cursor: 'pointer',
            }}
            title="Auto-Fit Entire Tamil Nadu Map"
          >
            ↺ Fit Full Map
          </button>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(247, 98, 1, 0.2)',
              borderRadius: 12,
              padding: '3px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
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
      )}

      {/* Interaction Hint */}
      {showHint && (
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
          }}
        >
          ✨ Full 38 Districts Visible • Drag to rotate • Click district to filter
        </div>
      )}

      {/* Selected District Badge */}
      {selectedDistrict && (
        <div
          className="tn-selected-badge"
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 900,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'linear-gradient(135deg, #f76201, #e05500)',
            color: '#ffffff',
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            boxShadow: '0 4px 16px rgba(247, 98, 1, 0.35)',
          }}
        >
          <span>📍 #{getDistrictNumber(selectedDistrict)} {selectedDistrict}</span>
          <button
            onClick={() => onSelectDistrict('')}
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              border: 'none',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              padding: '2px 7px',
              borderRadius: 10,
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
