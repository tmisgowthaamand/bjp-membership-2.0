import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import { getDistrictColor } from './districtColorScale'

// Canonical Full District Name (Official 38 Tamil Nadu District Full Names)
export function getDistrictDisplayName(rawName = '') {
  const norm = (rawName || '').trim()

  const fullNameMap = {
    'trichy': 'Tiruchirappalli',
    'tiruchirappalli': 'Tiruchirappalli',
    'tiruchirapalli': 'Tiruchirappalli',
    'tvmalai': 'Tiruvannamalai',
    't.v.malai': 'Tiruvannamalai',
    'tiruvannamalai': 'Tiruvannamalai',
    'ramnad': 'Ramanathapuram',
    'ramanathapuram': 'Ramanathapuram',
    'chengalpet': 'Chengalpattu',
    'chengalpattu': 'Chengalpattu',
    'viluppuram': 'Villupuram',
    'villupuram': 'Villupuram',
    'kanyakumari': 'Kanniyakumari',
    'kanniyakumari': 'Kanniyakumari',
    'tuticorin': 'Thoothukudi',
    'thoothukudi': 'Thoothukudi',
    'thoothukkudi': 'Thoothukudi',
    'sivaganga': 'Sivagangai',
    'sivagangai': 'Sivagangai',
    'tiruvarur': 'Tiruvarur',
    'thiruvarur': 'Tiruvarur',
    'kanchipuram': 'Kancheepuram',
    'kancheepuram': 'Kancheepuram',
    'tirupattur': 'Tirupathur',
    'tirupathur': 'Tirupathur',
    'kallakkurichi': 'Kallakurichi',
    'kallakurichi': 'Kallakurichi',
    'mayiladuturai': 'Mayiladuthurai',
    'mayiladuthurai': 'Mayiladuthurai',
    'tiruvallur': 'Thiruvallur',
    'thiruvallur': 'Thiruvallur',
  }

  const lower = norm.toLowerCase()
  if (fullNameMap[lower]) return fullNameMap[lower]

  // Capitalize nicely
  return norm.replace(/\b\w/g, (c) => c.toUpperCase())
}

// District-specific optimal font sizing for bold, high-visibility clarity across all 38 districts
export function getDistrictFontSize(displayName = '') {
  const norm = displayName.toLowerCase().replace(/[^a-z]/g, '')

  // Specific high-visibility sizing tailored to each district's polygon area
  const customSizes = {
    tiruchirappalli: 0.31, // Large central district — bold and clearly readable
    tiruvannamalai: 0.31,  // Large northern district
    ramanathapuram: 0.29,  // Wide coastal district
    chengalpattu: 0.29,
    kancheepuram: 0.28,
    dharmapuri: 0.32,
    krishnagiri: 0.32,
    villupuram: 0.31,
    kallakurichi: 0.30,
    cuddalore: 0.31,
    salem: 0.35,
    erode: 0.35,
    coimbatore: 0.34,
    tiruppur: 0.32,
    namakkal: 0.33,
    karur: 0.34,
    dindigul: 0.34,
    theni: 0.35,
    madurai: 0.34,
    sivagangai: 0.30,
    virudhunagar: 0.30,
    thoothukudi: 0.31,
    tirunelveli: 0.33,
    tenkasi: 0.31,
    kanniyakumari: 0.28,
    pudukkottai: 0.31,
    thanjavur: 0.31,
    vellore: 0.32,
    tirupathur: 0.30,
    thiruvallur: 0.31,
    nilgiris: 0.33,
    chennai: 0.29,
    ranipet: 0.28,
    ariyalur: 0.28,
    perambalur: 0.27,
    tiruvarur: 0.27,
    nagapattinam: 0.26,
    mayiladuthurai: 0.27,
  }

  if (customSizes[norm]) return customSizes[norm]

  const len = displayName.length
  if (len <= 6) return 0.35
  if (len <= 10) return 0.32
  return 0.30
}

// Precision centroid micro-offsets to center full text neatly in each polygon
export function getDistrictCentroidOffset(districtName = '') {
  const key = districtName.toLowerCase().replace(/[^a-z]/g, '')

  const offsets = {
    chennai: [0.06, 0.0],
    ranipet: [0.05, 0.06],
    vellore: [-0.05, 0.0],
    tirupathur: [-0.06, -0.05],
    kancheepuram: [0.0, 0.10],
    chengalpattu: [0.10, -0.06],
    chengalpet: [0.10, -0.06],
    perambalur: [-0.12, 0.08],
    ariyalur: [0.12, -0.05],
    tiruchirappalli: [-0.02, 0.04],
    trichy: [-0.02, 0.04],
    thanjavur: [-0.15, -0.08],
    tiruvarur: [0.0, -0.10],
    thiruvarur: [0.0, -0.10],
    nagapattinam: [0.14, 0.22],
    mayiladuthurai: [0.06, 0.06],
    kanniyakumari: [0.0, -0.08],
    kanyakumari: [0.0, -0.08],
    dharmapuri: [0.0, -0.05],
    krishnagiri: [0.0, 0.05],
    cuddalore: [0.06, 0.0],
    pudukkottai: [0.0, 0.0],
    ramanathapuram: [0.08, 0.0],
    ramnad: [0.08, 0.0],
    tiruvannamalai: [0.0, 0.0],
  }

  return offsets[key] || [0, 0]
}

export function DistrictMesh({
  district,
  isHovered,
  isSelected,
  onPointerOver,
  onPointerOut,
  onClick,
}) {
  const color = getDistrictColor(district.name, district.count, isHovered, isSelected)
  const [baseCx, baseCy] = district.centroid || [0, 0]
  const textZ = district.depth + 0.07
  const posZ = isHovered ? 0.45 : isSelected ? 0.3 : 0

  const displayName = useMemo(() => getDistrictDisplayName(district.name), [district.name])
  const fontSize = useMemo(() => getDistrictFontSize(displayName), [displayName])
  const [ox, oy] = useMemo(() => getDistrictCentroidOffset(district.name), [district.name])

  const cx = baseCx + ox
  const cy = baseCy + oy

  return (
    <group
      position={[0, 0, posZ]}
      onPointerOver={(e) => {
        e.stopPropagation()
        onPointerOver(e, district)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        onPointerOut(district)
      }}
      onClick={(e) => {
        e.stopPropagation()
        onClick(district)
      }}
    >
      {district.geometries.map((geom, idx) => (
        <mesh key={idx} geometry={geom}>
          <meshStandardMaterial
            color={color}
            roughness={0.32}
            metalness={0.06}
          />
        </mesh>
      ))}

      {/* Bright, Ultra-Crisp Bold District Label with High-Contrast Halo */}
      <Text
        position={[cx, cy, textZ]}
        fontSize={fontSize}
        color={isSelected ? '#ffffff' : '#0f172a'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.042}
        outlineColor={isSelected ? '#0f172a' : '#ffffff'}
        outlineOpacity={1}
        fontWeight="bold"
        letterSpacing={0.01}
        sdfGlyphSize={512}
        renderOrder={10}
        depthOffset={-1}
      >
        {displayName}
      </Text>
    </group>
  )
}


