import { MongoClient } from 'mongodb'

// Three independent connections:
//   voterDb -> voter roll (ass_1..ass_234), READ-ONLY, 5.8cr records
//   wardDb  -> excel ward master data (READ-ONLY)
//   appDb   -> BJP local body applications (read/write)
let voterClient, wardClient, appClient
let voterDb = null
let wardDb = null
let appDb = null

export async function connectDbs() {
  const voterUrl = process.env.MONGO_VOTER_URL || process.env.VOTER_DB_URI
  const voterDbName = process.env.MONGO_VOTER_DB_NAME || 'voter_db'

  const wardUrl = process.env.MONGO_WARD_URL || process.env.WARD_DB_URI
  const wardDbName = process.env.MONGO_WARD_DB_NAME || 'ward_db'

  let appUrl = process.env.MONGO_APP_URL || process.env.APP_DB_URI || 'mongodb+srv://tmisgowthaamand_db_user:UQZ0VVD9waDPex2l@cluster0.5q8xfoa.mongodb.net/election_app?retryWrites=true&w=majority&appName=Cluster0'
  if (appUrl.includes('cluster0.j9z0eyx')) {
    appUrl = 'mongodb+srv://tmisgowthaamand_db_user:UQZ0VVD9waDPex2l@cluster0.5q8xfoa.mongodb.net/election_app?retryWrites=true&w=majority&appName=Cluster0'
  }
  const appDbName = process.env.MONGO_APP_DB_NAME || 'election_app'

  try {
    voterClient = new MongoClient(voterUrl, { serverSelectionTimeoutMS: 8000 })
    await voterClient.connect()
    voterDb = voterClient.db(voterDbName)
    console.log(`[db] voter_db connected (${voterDbName}) — read only`)
  } catch (e) {
    console.warn(`[db] voter_db connection failed: ${e.message} (voter lookup will report offline)`)
    voterDb = null
  }

  if (wardUrl) {
    try {
      wardClient = new MongoClient(wardUrl, { serverSelectionTimeoutMS: 8000 })
      await wardClient.connect()
      wardDb = wardClient.db(wardDbName)
      console.log(`[db] ward_db connected (${wardDbName}) — read only`)
    } catch (e) {
      console.warn(`[db] ward_db connection failed: ${e.message}`)
      wardDb = null
    }
  }

  try {
    appClient = new MongoClient(appUrl, { serverSelectionTimeoutMS: 8000 })
    await appClient.connect()
    appDb = appClient.db(appDbName)
    try {
      await appDb.collection('applications').createIndex({ application_id: 1 }, { unique: true })
      await appDb.collection('applications').createIndex({ mobile: 1 })
    } catch (_) { /* index best-effort */ }
    console.log(`[db] app db connected (${appDbName})`)
  } catch (e) {
    console.warn(`[db] app db connection failed: ${e.message}`)
    appDb = null
  }
}

export function getVoterDb() {
  if (!voterDb) throw new Error('VOTER_DB_OFFLINE')
  return voterDb
}
export function isVoterDbOnline() { return !!voterDb }

export function getWardDb() {
  if (!wardDb) throw new Error('WARD_DB_OFFLINE')
  return wardDb
}
export function isWardDbOnline() { return !!wardDb }

export function getAppDb() {
  if (!appDb) throw new Error('APP_DB_OFFLINE')
  return appDb
}
export function isAppDbOnline() { return !!appDb }

export async function closeDbs() {
  await voterClient?.close().catch(() => {})
  await wardClient?.close().catch(() => {})
  await appClient?.close().catch(() => {})
}

