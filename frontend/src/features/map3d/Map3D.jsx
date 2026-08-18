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
      {/* High Performance Cool Theme Lighting Setup */}
      <ambientLight intensity={1.25} color="#ffffff" />
      <directionalLight position={[-12, 18, 20]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[14, -10, 14]} intensity={0.45} color="#e0f2fe" />
      <pointLight position={[0, 0, 20]} intensity={0.35} />

      {/* 3D Tamil Nadu Map - Front-facing with slight isometric tilt */}
      <group rotation={[-0.18, 0.1, 0]}>
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
  cameraZ = 37,
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      style={{ width: '100%', height: '100%', background: '#f8fafc' }}
    >
      <PerspectiveCamera makeDefault position={[0, 0.5, cameraZ]} fov={38} />
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
