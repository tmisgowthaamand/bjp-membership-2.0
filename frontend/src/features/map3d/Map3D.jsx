import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { DistrictMesh } from './DistrictMesh'
import { normalizeDistrictName } from './districtIndex'

function SceneContent({
  districts,
  hoveredId,
  selectedDistrict,
  onPointerOver,
  onPointerOut,
  onClick,
}) {
  const selectedNorm = normalizeDistrictName(selectedDistrict || '')

  return (
    <>
      {/* Bright Luminous High-Clarity Lighting Setup */}
      <ambientLight intensity={1.9} color="#ffffff" />
      <directionalLight position={[-10, 20, 22]} intensity={1.7} color="#ffffff" />
      <directionalLight position={[14, -10, 16]} intensity={0.75} color="#ffffff" />
      <directionalLight position={[0, 14, 20]} intensity={0.5} color="#ffffff" />
      <pointLight position={[0, 0, 24]} intensity={0.55} color="#ffffff" />

      {/* 3D Tamil Nadu Map - Elevated Group for Perfect Southern/Northern Fit */}
      <group position={[0, 1.2, 0]} rotation={[-0.18, 0.1, 0]}>
        {/* 38 3D District Blocks */}
        {districts.map((d) => (
          <DistrictMesh
            key={d.id}
            district={d}
            isHovered={hoveredId === d.id}
            isSelected={selectedNorm === d.id}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
            onClick={onClick}
          />
        ))}
      </group>
    </>
  )
}

export function Map3D({
  districts,
  hoveredId,
  selectedDistrict,
  onPointerOver,
  onPointerOut,
  onClick,
  controlsRef,
  cameraZ = 35,
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        precision: 'highp',
      }}
      style={{ width: '100%', height: '100%', background: '#f8fafc' }}
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
      <Suspense fallback={null}>
        <SceneContent
          districts={districts}
          hoveredId={hoveredId}
          selectedDistrict={selectedDistrict}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
          onClick={onClick}
        />
      </Suspense>
    </Canvas>
  )
}

