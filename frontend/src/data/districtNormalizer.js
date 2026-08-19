/**
 * Centralized District Normalizer for Tamil Nadu 38 Districts
 * Handles mapping and alias resolution between GeoJSON (OpenCity, GIS, etc.), Database, and UI representations.
 */

export const TN_38_DISTRICTS = [
  'Ariyalur',
  'Chengalpattu',
  'Chennai',
  'Coimbatore',
  'Cuddalore',
  'Dharmapuri',
  'Dindigul',
  'Erode',
  'Kallakurichi',
  'Kancheepuram',
  'Kanniyakumari',
  'Karur',
  'Krishnagiri',
  'Madurai',
  'Mayiladuthurai',
  'Nagapattinam',
  'Namakkal',
  'Nilgiris',
  'Perambalur',
  'Pudukkottai',
  'Ramanathapuram',
  'Ranipet',
  'Salem',
  'Sivagangai',
  'Tenkasi',
  'Thanjavur',
  'Theni',
  'Thiruvallur',
  'Thiruvarur',
  'Thoothukudi',
  'Tiruchirappalli',
  'Tirunelveli',
  'Tirupathur',
  'Tiruppur',
  'Tiruvannamalai',
  'Vellore',
  'Villupuram',
  'Virudhunagar',
]


const ALIAS_MAP = {
  tiruvallur: 'Thiruvallur',
  thiruvallur: 'Thiruvallur',
  kanchipuram: 'Kancheepuram',
  kanchee: 'Kancheepuram',
  viluppuram: 'Villupuram',
  trichy: 'Tiruchirappalli',
  tiruchirapalli: 'Tiruchirappalli',
  tiruchchirappalli: 'Tiruchirappalli',
  'the nilgiris': 'Nilgiris',
  nilgiri: 'Nilgiris',
  'n|lgiris': 'Nilgiris',
  'nlgiris': 'Nilgiris',
  sivaganga: 'Sivagangai',
  kanyakumari: 'Kanniyakumari',
  tuticorin: 'Thoothukudi',
  thoothukkudi: 'Thoothukudi',
  mayiladuthurai: 'Mayiladuthurai',
  mayiladuthurai_rural: 'Mayiladuthurai',
  mayiladuturai: 'Mayiladuthurai',
  ranippettai: 'Ranipet',
  tiruppattur: 'Tirupathur',
  kallakkurichi: 'Kallakurichi',
  teni: 'Theni',
  thiruvarur: 'Tiruvarur',
}

/**
 * Normalizes any raw district string to official 38-district canonical name.
 */
export function normalizeDistrictName(rawDistrict) {
  if (!rawDistrict || typeof rawDistrict !== 'string') return ''
  const clean = rawDistrict.trim().toLowerCase()
  if (!clean) return ''

  if (ALIAS_MAP[clean]) return ALIAS_MAP[clean]

  const matched = TN_38_DISTRICTS.find((d) => d.toLowerCase() === clean)
  if (matched) return matched

  return clean.replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Returns canonical 1-38 district number for any given district name.
 */
export function getDistrictNumber(rawDistrict) {
  const norm = normalizeDistrictName(rawDistrict)
  const idx = TN_38_DISTRICTS.indexOf(norm)
  return idx !== -1 ? idx + 1 : null
}

/**
 * Helper to compute dynamic color intensity from application count
 * Flat 2D Slate/White (0) -> Light Gold (Low) -> Medium Gold (Med) -> Deep Crimson (High)
 */
export function getDistrictColorIntensity(count, maxCount) {
  if (!count || count <= 0) return '#FFFFFF' // Clean White / Neutral Flat Face
  if (!maxCount || maxCount <= 0) return '#FEF3C7'

  const ratio = count / maxCount
  if (ratio < 0.25) return '#FDE68A' // Light Gold
  if (ratio < 0.6) return '#F59E0B'  // Medium Gold / Saffron
  return '#DC2626'                  // Deep Crimson
}
