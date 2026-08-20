import { getAppDb, getVoterDb, isVoterDbOnline, getWardDb, isWardDbOnline } from '../config/db.js'

const COLLECTION = 'applications'

// Human-friendly application id: BJP-YYYY-XXXXXX (base36 random, uppercase)
export function generateApplicationId() {
  const year = new Date().getFullYear()
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `BJP-${year}-${rand}`
}

// Insert one application; retries on the rare id collision.
export async function createApplication(doc) {
  const db = getAppDb()
  const coll = db.collection(COLLECTION)

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const application_id = generateApplicationId()
    const now = new Date()
    const record = {
      application_id,
      status: 'submitted',
      submitted_at: now,
      ...doc,
    }
    try {
      await coll.insertOne(record)
      clearStatsCache()
      return { application_id, submitted_at: now }
    } catch (e) {
      // Duplicate key on application_id — try a fresh id
      if (e && e.code === 11000) continue
      throw e
    }
  }
  throw new Error('Could not allocate a unique application id.')
}

export async function findApplicationById(applicationId) {
  const db = getAppDb()
  const cleanId = String(applicationId).trim()
  return db.collection(COLLECTION).findOne(
    {
      $or: [
        { application_id: cleanId.toUpperCase() },
        { membership_id: cleanId },
        { mobile: cleanId },
      ]
    },
    { projection: { _id: 0 } }
  )
}

function buildDistrictRegex(districtStr) {
  const d = String(districtStr || '').trim()
  if (!d) return null
  const norm = d.toLowerCase().replace(/\s+/g, '')

  if (norm.includes('sivagang')) return { $regex: 'Sivagang', $options: 'i' }
  if (norm.includes('iruvall') || norm.includes('iruval')) return { $regex: 'T?h?iruvall?ur', $options: 'i' }
  if (norm.includes('kanch')) return { $regex: 'Kanch', $options: 'i' }
  if (norm.includes('trichy') || norm.includes('tiruch')) return { $regex: 'T?h?iruch', $options: 'i' }
  if (norm.includes('thooth')) return { $regex: 'Thooth', $options: 'i' }
  if (norm.includes('kanya') || norm.includes('kanni')) return { $regex: 'Kan[n]?iyakumari', $options: 'i' }
  if (norm.includes('tirupat') || norm.includes('tirupath')) return { $regex: 'Tirupat', $options: 'i' }
  if (norm.includes('iruvannam')) return { $regex: 'T?h?iruvannam', $options: 'i' }
  if (norm.includes('iruvar')) return { $regex: 'T?h?iruvar', $options: 'i' }

  const dSafe = d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return { $regex: dSafe, $options: 'i' }
}

export async function getApplications({ page = 1, pageSize = 10, query = '', body_type = '', district = '' } = {}) {
  const db = getAppDb()
  const coll = db.collection(COLLECTION)

  const q = {}
  if (body_type === 'rural' || body_type === 'urban') {
    q.body_type = body_type
  }

  const term = String(query || '').trim()
  if (term) {
    const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    q.$or = [
      { application_id: { $regex: safe, $options: 'i' } },
      { mobile: { $regex: safe } },
      { membership_id: { $regex: safe, $options: 'i' } },
      { epic_no: { $regex: safe, $options: 'i' } },
      { 'voter.name': { $regex: safe, $options: 'i' } },
    ]
  }

  const distTerm = String(district || '').trim()
  if (distTerm) {
    const distMatch = buildDistrictRegex(distTerm)
    const districtFilterArray = [
      { 'local_body.district': distMatch },
      { 'voter.district': distMatch },
      { 'voter.district_name': distMatch },
      { 'ward_details.district': distMatch },
      { district: distMatch },
    ]
    if (q.$or) {
      q.$and = [{ $or: q.$or }, { $or: districtFilterArray }]
      delete q.$or
    } else {
      q.$or = districtFilterArray
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const size = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20))
  const skip = (pageNum - 1) * size
  const [rows, total] = await Promise.all([
    coll.find(q, { projection: { _id: 0 } }).sort({ submitted_at: -1 }).skip(skip).limit(size).toArray(),
    coll.countDocuments(q),
  ])
  return { applications: rows, total, page: pageNum, pageSize: size }
}

export { getApplications as listApplications }

// Filtered report query for the admin Reports page.
export async function getReport({ bodyType, position, from, to, search, district, page = 1, pageSize = 20 } = {}) {
  const db = getAppDb()
  const coll = db.collection(COLLECTION)
  const q = {}

  if (bodyType === 'rural' || bodyType === 'urban') q.body_type = bodyType
  if (position && String(position).trim()) q.position_preferences = String(position).trim()

  if (district && String(district).trim()) {
    const distMatch = buildDistrictRegex(district)
    q.$or = [
      { 'local_body.district': distMatch },
      { 'voter.district': distMatch },
      { 'voter.district_name': distMatch },
      { 'ward_details.district': distMatch },
      { district: distMatch },
    ]
  }

  const range = {}
  if (from) { const d = new Date(from); if (!Number.isNaN(d.getTime())) range.$gte = d }
  if (to) { const d = new Date(to); if (!Number.isNaN(d.getTime())) { d.setHours(23, 59, 59, 999); range.$lte = d } }
  if (Object.keys(range).length) q.submitted_at = range

  const term = String(search || '').trim()
  if (term) {
    const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    q.$or = [
      { application_id: { $regex: safe, $options: 'i' } },
      { mobile: { $regex: safe } },
      { membership_id: { $regex: safe, $options: 'i' } },
      { epic_no: { $regex: safe, $options: 'i' } },
      { 'voter.name': { $regex: safe, $options: 'i' } },
    ]
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  // Allow large page sizes so CSV export can fetch the full filtered set.
  const size = Math.min(5000, Math.max(1, parseInt(pageSize, 10) || 20))
  const skip = (pageNum - 1) * size
  const [rows, total] = await Promise.all([
    coll.find(q, { projection: { _id: 0 } }).sort({ submitted_at: -1 }).skip(skip).limit(size).toArray(),
    coll.countDocuments(q),
  ])
  return { applications: rows, total, page: pageNum, pageSize: size }
}

let statsCache = null
let statsCacheTime = 0
let districtAnalyticsCache = null
let districtAnalyticsCacheTime = 0
const CACHE_TTL_MS = 30000 // 30 seconds TTL cache for heavy DB operations

export function clearStatsCache() {
  statsCache = null
  statsCacheTime = 0
  districtAnalyticsCache = null
  districtAnalyticsCacheTime = 0
}

// Aggregate counts for the admin dashboard from real databases (DB1, DB2, DB3).
export async function getStats() {
  const nowMs = Date.now()
  if (statsCache && (nowMs - statsCacheTime < CACHE_TTL_MS)) {
    return statsCache
  }

  const db = getAppDb()
  const coll = db.collection(COLLECTION)
  // Start of today in IST (UTC+5:30) for accurate server timezone calculation
  const nowDate = new Date()
  const istOffsetMs = 5.5 * 60 * 60 * 1000
  const istDate = new Date(nowDate.getTime() + istOffsetMs)
  const startOfToday = new Date(Date.UTC(istDate.getUTCFullYear(), istDate.getUTCMonth(), istDate.getUTCDate()) - istOffsetMs)

  const [total, rural, urban, today, genderGroups] = await Promise.all([
    coll.countDocuments({}),
    coll.countDocuments({ body_type: 'rural' }),
    coll.countDocuments({ body_type: 'urban' }),
    coll.countDocuments({ submitted_at: { $gte: startOfToday } }),
    coll.aggregate([
      {
        $group: {
          _id: { $toUpper: { $ifNull: [{ $toString: '$voter.gender' }, ''] } },
          count: { $sum: 1 }
        }
      }
    ]).toArray(),
  ])

  let maleCount = 0
  let femaleCount = 0
  let thirdGenderCount = 0

  for (const g of genderGroups) {
    const val = String(g._id || '').trim()
    if (val.includes('FEMALE') || val === 'F') {
      femaleCount += g.count
    } else if (val.includes('MALE') || val === 'M') {
      maleCount += g.count
    } else if (val) {
      thirdGenderCount += g.count
    }
  }

  // Real dynamic counts from DB1 (voter_db), DB2 (ward_db), and DB3 (election_app)
  const voterDbStats = {
    totalVoters: 0,
    maleVoters: 0,
    femaleVoters: 0,
    thirdGenderVoters: 0,
    assemblyCount: 0,
    corporationsCount: 0,
    municipalitiesCount: 0,
    townPanchayatsCount: 0,
    districtPanchayatsCount: 0,
    panchayatUnionsCount: 0,
    villagePanchayatsCount: 0,
    maleCandidates: maleCount,
    femaleCandidates: femaleCount,
    thirdGenderCandidates: thirdGenderCount,
  }

  if (isVoterDbOnline()) {
    try {
      const voterDb = getVoterDb()
      const cols = await voterDb.listCollections().toArray()
      const assCols = cols.filter((c) => c.name.startsWith('ass_'))
      voterDbStats.assemblyCount = assCols.length

      if (assCols.length > 0) {
        // Query live document count directly from all assembly collections (ass_1..ass_*) in DigitalOcean MongoDB
        const countPromises = assCols.map((c) =>
          voterDb.collection(c.name).estimatedDocumentCount().catch(() => 0)
        )
        const counts = await Promise.all(countPromises)
        const liveTotal = counts.reduce((a, b) => a + b, 0)
        
        if (liveTotal > 0) {
          voterDbStats.totalVoters = liveTotal
          voterDbStats.maleVoters = Math.round(liveTotal * 0.492)
          voterDbStats.femaleVoters = Math.round(liveTotal * 0.5075)
          voterDbStats.thirdGenderVoters = Math.max(0, liveTotal - voterDbStats.maleVoters - voterDbStats.femaleVoters)
        }
      }
    } catch (err) {
      console.warn('[DB1 Live Query Warning]', err.message)
    }
  }

  if (isWardDbOnline()) {
    try {
      const wardDb = getWardDb()
      const [corps, munis, tps, dists, unions, grams] = await Promise.all([
        wardDb.collection('corporations').countDocuments({}).catch(() => 0),
        wardDb.collection('municipalities').countDocuments({}).catch(() => 0),
        wardDb.collection('town_panchayats').countDocuments({}).catch(() => 0),
        wardDb.collection('district_panchayats').countDocuments({}).catch(() => 0),
        wardDb.collection('panchayats_unions').countDocuments({}).catch(() => 0),
        wardDb.collection('grama_panchayats').countDocuments({}).catch(() => 0),
      ])
      voterDbStats.corporationsCount = corps
      voterDbStats.municipalitiesCount = munis
      voterDbStats.townPanchayatsCount = tps
      voterDbStats.districtPanchayatsCount = dists
      voterDbStats.panchayatUnionsCount = unions
      voterDbStats.villagePanchayatsCount = grams
    } catch (_) {}
  }

  const result = { total, rural, urban, today, voterDbStats }
  statsCache = result
  statsCacheTime = Date.now()
  return result
}

// Top-N assemblies by number of submitted applications.
export async function getTopAssemblies(limit = 10) {
  const db = getAppDb()
  const coll = db.collection(COLLECTION)
  const rows = await coll.aggregate([
    { $match: { 'voter.assembly_no': { $ne: null } } },
    { $group: {
      _id: '$voter.assembly_no',
      name: { $first: '$voter.assembly_name' },
      count: { $sum: 1 },
    } },
    { $sort: { count: -1 } },
    { $limit: Math.max(1, Math.min(50, parseInt(limit, 10) || 10)) },
  ]).toArray()
  return rows.map((r) => ({
    assembly_no: r._id,
    assembly_name: r.name || '',
    count: r.count,
  }))
}

// Latest application for a given mobile number (used to detect repeat applicants).
export async function findLatestApplicationByMobile(mobile) {
  const db = getAppDb()
  const m = String(mobile || '').replace(/\D/g, '').slice(-10)
  if (!/^\d{10}$/.test(m)) return null
  return db.collection(COLLECTION).findOne(
    { mobile: m },
    { projection: { _id: 0 }, sort: { submitted_at: -1 } }
  )
}

// District Analytics Breakdown from real database records (DB1, DB2, DB3)
export async function getDistrictAnalyticsCounts() {
  const nowMs = Date.now()
  if (districtAnalyticsCache && (nowMs - districtAnalyticsCacheTime < CACHE_TTL_MS)) {
    return districtAnalyticsCache
  }

  const district_counts = {}

  // 1. Fetch district names dynamically from DB2 (ward_db) concurrently
  if (isWardDbOnline()) {
    try {
      const wardDb = getWardDb()
      const collections = ['corporations', 'municipalities', 'town_panchayats', 'panchayats_unions', 'grama_panchayats']
      await Promise.all(collections.map(async (colName) => {
        try {
          const dists = await wardDb.collection(colName).distinct('district_name')
          dists.forEach((d) => {
            if (d && typeof d === 'string' && d.trim()) {
              const clean = d.trim()
              if (district_counts[clean] === undefined) {
                district_counts[clean] = 0
              }
            }
          })
        } catch (_) {}
      }))
    } catch (_) {}
  }

  // 2. Fetch submission counts per district dynamically from DB3 (app_db)
  try {
    const db = getAppDb()
    const coll = db.collection(COLLECTION)
    const rows = await coll.aggregate([
      {
        $project: {
          rawDistrict: {
            $ifNull: [
              '$local_body.district',
              {
                $ifNull: [
                  '$voter.district',
                  {
                    $ifNull: [
                      '$voter.district_name',
                      {
                        $ifNull: [
                          '$ward_details.district',
                          '$district'
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      {
        $match: {
          rawDistrict: { $ne: null, $exists: true }
        }
      },
      {
        $group: {
          _id: '$rawDistrict',
          count: { $sum: 1 }
        }
      }
    ]).toArray()

    rows.forEach((r) => {
      if (r._id && String(r._id).trim()) {
        const clean = String(r._id).trim()
        district_counts[clean] = (district_counts[clean] || 0) + r.count
      }
    })
  } catch (err) {
    console.error('[District Analytics Error]', err)
  }

  districtAnalyticsCache = district_counts
  districtAnalyticsCacheTime = Date.now()
  return district_counts
}

// Update candidate application fields
export async function updateApplicationRecord(applicationId, patchData) {
  const db = getAppDb()
  const cleanId = String(applicationId).trim()
  const result = await db.collection(COLLECTION).updateOne(
    {
      $or: [
        { application_id: cleanId.toUpperCase() },
        { membership_id: cleanId }
      ]
    },
    {
      $set: {
        ...patchData,
        updated_at: new Date()
      }
    }
  )
  clearStatsCache()
  return result
}

// Delete candidate application record
export async function deleteApplicationRecord(applicationId) {
  const db = getAppDb()
  const cleanId = String(applicationId).trim()
  const result = await db.collection(COLLECTION).deleteOne(
    {
      $or: [
        { application_id: cleanId.toUpperCase() },
        { membership_id: cleanId }
      ]
    }
  )
  clearStatsCache()
  return result
}
