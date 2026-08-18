import { getAppDb } from '../config/db.js'

const COLLECTION = 'admin_users'

export async function listAdminUsers() {
  const db = getAppDb()
  return db.collection(COLLECTION).find({}, { projection: { password: 0 } }).sort({ created_at: -1 }).toArray()
}

export async function findAdminUserByUsername(username) {
  const db = getAppDb()
  const cleanUser = String(username || '').trim().toLowerCase()
  return db.collection(COLLECTION).findOne({ username: cleanUser })
}

export async function createAdminUserRecord(userData) {
  const db = getAppDb()
  const cleanUser = String(userData.username || '').trim().toLowerCase()
  const existing = await findAdminUserByUsername(cleanUser)
  if (existing) {
    throw new Error('An admin user with this username already exists.')
  }
  const record = {
    username: cleanUser,
    password: userData.password,
    role: userData.role || 'district_admin', // 'state_admin' | 'district_admin'
    assigned_district: userData.assigned_district || '',
    avatar_url: userData.avatar_url || '',
    status: userData.status || 'active', // 'active' | 'suspended'
    created_at: new Date(),
    updated_at: new Date(),
  }
  await db.collection(COLLECTION).insertOne(record)
  delete record.password
  return record
}

export async function updateAdminUserRecord(username, patchData) {
  const db = getAppDb()
  const cleanUser = String(username || '').trim().toLowerCase()
  const updateDoc = {
    ...patchData,
    updated_at: new Date(),
  }
  delete updateDoc.username
  delete updateDoc._id

  const res = await db.collection(COLLECTION).updateOne(
    { username: cleanUser },
    { $set: updateDoc }
  )
  return res
}

export async function deleteAdminUserRecord(username) {
  const db = getAppDb()
  const cleanUser = String(username || '').trim().toLowerCase()
  return db.collection(COLLECTION).deleteOne({ username: cleanUser })
}
