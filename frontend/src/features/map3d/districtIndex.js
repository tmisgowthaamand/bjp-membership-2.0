// Official 38 Districts of Tamil Nadu (Canonical Government Order)
export const TN_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul',
  'Erode', 'Kallakurichi', 'Kancheepuram', 'Kanniyakumari', 'Karur', 'Krishnagiri',
  'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur',
  'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivagangai', 'Tenkasi',
  'Thanjavur', 'Theni', 'Thiruvallur', 'Thiruvarur', 'Thoothukudi', 'Tiruchirappalli',
  'Tirunelveli', 'Tirupathur', 'Tiruppur', 'Tiruvannamalai', 'Vellore', 'Villupuram', 'Virudhunagar'
]

// Normalizes district names across variations
export function normalizeDistrictName(name = '') {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\./g, '')
    .replace('the nilgiris', 'nilgiris')
    .replace('kanniyakumari', 'kanyakumari')
    .replace('sivagangai', 'sivaganga')
    .replace('thiruvarur', 'tiruvarur')
    .replace('thoothukkudi', 'thoothukudi')
    .replace('kanchipuram', 'kancheepuram')
}

// Build a fast lookup dictionary with normalized keys
export function buildCountLookup(counts = {}) {
  const map = {}
  Object.entries(counts).forEach(([k, v]) => {
    map[normalizeDistrictName(k)] = v
  })
  return map
}
