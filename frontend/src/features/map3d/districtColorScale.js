// Exact Executive Soft Pastel Palette from Commit 6faaf03
const SOFT_PASTEL_DISTRICT_COLORS = {
  chennai: '#C7D2FE',         // Soft Pastel Indigo
  thiruvallur: '#FECDD3',     // Soft Pastel Rose
  tiruvallur: '#FECDD3',
  kancheepuram: '#FDE68A',    // Soft Pastel Warm Amber
  kanchipuram: '#FDE68A',
  chengalpattu: '#FED7AA',    // Soft Pastel Peach
  chengalpet: '#FED7AA',
  vellore: '#BAE6FD',         // Soft Pastel Sky Blue
  ranipet: '#99F6E4',         // Soft Pastel Mint Cyan
  tirupathur: '#BFDBFE',      // Soft Pastel Blue
  tirupattur: '#BFDBFE',
  tiruvannamalai: '#A7F3D0',  // Soft Pastel Mint Green
  tvmalai: '#A7F3D0',
  villupuram: '#DDD6FE',      // Soft Pastel Lilac
  viluppuram: '#DDD6FE',
  kallakurichi: '#E0E7FF',    // Soft Pastel Lavender Ice
  cuddalore: '#FEF08A',       // Soft Pastel Sand Yellow
  krishnagiri: '#FFEDD5',     // Soft Pastel Warm Saffron
  dharmapuri: '#FFE4E6',      // Soft Pastel Blush
  salem: '#E0F2FE',           // Soft Pastel Ice Blue
  erode: '#C7D2FE',           // Soft Pastel Periwinkle
  nilgiris: '#D1FAE5',        // Soft Pastel Sage Green
  coimbatore: '#A7F3D0',      // Soft Pastel Emerald Mint
  tiruppur: '#FECDD3',        // Soft Pastel Coral Pink
  namakkal: '#FEE2E2',        // Soft Pastel Warm Blush
  karur: '#E0F2FE',           // Soft Pastel Slate Blue
  tiruchirappalli: '#FDBA74',  // Soft BJP Saffron Accent
  trichy: '#FDBA74',
  perambalur: '#D9F99D',      // Soft Pastel Soft Lime
  ariyalur: '#FEF08A',        // Soft Pastel Warm Gold
  mayiladuthurai: '#FBCFE8',  // Soft Pastel Powder Pink
  nagapattinam: '#FDE68A',    // Soft Pastel Muted Gold
  tiruvarur: '#BAE6FD',       // Soft Pastel Ocean Breeze
  thiruvarur: '#BAE6FD',
  thanjavur: '#E9D5FF',       // Soft Pastel Orchid
  pudukkottai: '#ECFCCB',     // Soft Pastel Light Green
  dindigul: '#FEF08A',        // Soft Pastel Muted Amber
  theni: '#FCE7F3',           // Soft Pastel Blossom Pink
  madurai: '#F5D0FE',         // Soft Pastel Light Magenta
  sivaganga: '#CBD5E1',       // Soft Muted Slate
  sivagangai: '#CBD5E1',
  virudhunagar: '#D9F99D',    // Soft Pastel Spring Sage
  ramanathapuram: '#FEF08A',  // Soft Pastel Sunshine
  ramnad: '#FEF08A',
  thoothukudi: '#FED7AA',     // Soft Pastel Soft Orange
  thoothukkudi: '#FED7AA',
  tenkasi: '#E9D5FF',         // Soft Pastel Light Lavender
  tirunelveli: '#FECDD3',     // Soft Pastel Rose Muted
  kanyakumari: '#DDD6FE',     // Soft Pastel Soft Violet
  kanniyakumari: '#DDD6FE',
}

// Map each district name to its soft pastel color
export function getDistrictBaseColor(name = '') {
  const norm = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\./g, '')
  return SOFT_PASTEL_DISTRICT_COLORS[norm] || '#BAE6FD'
}

export function getDistrictColor(districtName = '', count = 0, isHovered = false, isSelected = false) {
  if (isSelected) return '#3B82F6' // Gentle Blue Highlight for selected
  if (isHovered) return '#F59E0B'  // Soft Warm Amber Glow on hover

  return getDistrictBaseColor(districtName)
}

// 3D block extrusion depth in Three.js units
export function getExtrusionDepth(count = 0) {
  const baseDepth = 0.85 // Prominent 3D block depth
  if (!count || count === 0) return baseDepth
  return Math.min(baseDepth + count * 0.025, 2.4)
}


