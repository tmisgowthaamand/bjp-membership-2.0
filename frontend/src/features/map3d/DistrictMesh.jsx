import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import { getDistrictColor } from './districtColorScale'

// Canonical Full District Name (Official 38 Tamil Nadu District Full Names across Web & Mobile)
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
export function getDistrictFontSize(displayName = '', isMobile = false) {
  const norm = displayName.toLowerCase().replace(/[^a-z]/g, '')

  // Specific high-visibility sizing tailored to each district's polygon area
  const customSizes = {
    tiruchirappalli: isMobile ? 0.22 : 0.28,
    tiruvannamalai: isMobile ? 0.22 : 0.28,
    ramanathapuram: isMobile ? 0.21 : 0.27,
    chengalpattu: isMobile ? 0.23 : 0.28,
    kancheepuram: isMobile ? 0.22 : 0.27,
    dharmapuri: isMobile ? 0.25 : 0.31,
    krishnagiri: isMobile ? 0.25 : 0.31,
    villupuram: isMobile ? 0.24 : 0.30,
    kallakurichi: isMobile ? 0.24 : 0.29,
    cuddalore: isMobile ? 0.24 : 0.30,
    salem: isMobile ? 0.26 : 0.34,
    erode: isMobile ? 0.26 : 0.34,
    coimbatore: isMobile ? 0.25 : 0.33,
    tiruppur: isMobile ? 0.25 : 0.31,
    namakkal: isMobile ? 0.25 : 0.32,
    karur: isMobile ? 0.25 : 0.33,
    dindigul: isMobile ? 0.26 : 0.33,
    theni: isMobile ? 0.26 : 0.34,
    madurai: isMobile ? 0.26 : 0.33,
    sivagangai: isMobile ? 0.24 : 0.29,
    virudhunagar: isMobile ? 0.24 : 0.29,
    thoothukudi: isMobile ? 0.24 : 0.30,
    tirunelveli: isMobile ? 0.25 : 0.32,
    tenkasi: isMobile ? 0.24 : 0.30,
    kanniyakumari: isMobile ? 0.22 : 0.27,
    pudukkottai: isMobile ? 0.24 : 0.30,
    thanjavur: isMobile ? 0.24 : 0.30,
    vellore: isMobile ? 0.25 : 0.31,
    tirupathur: isMobile ? 0.24 : 0.29,
    thiruvallur: isMobile ? 0.24 : 0.30,
    nilgiris: isMobile ? 0.25 : 0.32,
    chennai: isMobile ? 0.23 : 0.28,
    ranipet: isMobile ? 0.22 : 0.27,
    ariyalur: isMobile ? 0.22 : 0.27,
    perambalur: isMobile ? 0.21 : 0.26,
    tiruvarur: isMobile ? 0.21 : 0.26,
    nagapattinam: isMobile ? 0.20 : 0.25,
    mayiladuthurai: isMobile ? 0.21 : 0.26,
  }

  if (customSizes[norm]) return customSizes[norm]

  const len = displayName.length
  if (len <= 6) return isMobile ? 0.27 : 0.34
  if (len <= 10) return isMobile ? 0.24 : 0.31
  return isMobile ? 0.22 : 0.28
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

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640
  const displayName = useMemo(() => getDistrictDisplayName(district.name), [district.name])
  const fontSize = useMemo(() => getDistrictFontSize(displayName, isMobile), [displayName, isMobile])

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
        outlineWidth={isMobile ? 0.028 : 0.04}
        outlineColor={isSelected ? '#0f172a' : '#ffffff'}
        outlineOpacity={1}
        fontWeight="bold"
        letterSpacing={0.01}
        sdfGlyphSize={256}
        renderOrder={10}
        depthOffset={-1}
      >
        {displayName}
      </Text>
    </group>
  )
}


