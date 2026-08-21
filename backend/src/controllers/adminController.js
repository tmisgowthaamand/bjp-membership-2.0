import crypto from 'crypto'
import { signSession, COOKIE_NAME, SESSION_COOKIE_OPTS } from '../middleware/adminAuth.js'
import { listApplications, getStats, getTopAssemblies, getReport, findApplicationById, getDistrictAnalyticsCounts, updateApplicationRecord, deleteApplicationRecord } from '../models/applicationModel.js'
import { listAdminUsers, findAdminUserByUsername, createAdminUserRecord, updateAdminUserRecord, deleteAdminUserRecord, verifyPassword } from '../models/adminUserModel.js'
import { isAppDbOnline, getAppDb } from '../config/db.js'
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService.js'

// Constant-time string compare to avoid leaking credential length/timing.
function safeEqual(a, b) {
  if (!a || !b) return false
  const ab = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

export async function postLogin(req, res) {
  const username = String(req.body?.username || '').trim().toLowerCase()
  const password = String(req.body?.password || '')

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' })
  }

  const superUser = (process.env.ADMIN_USERNAME || '').trim().toLowerCase()
  const superPass = process.env.ADMIN_PASSWORD

  const stateUser = (process.env.STATE_ADMIN_USERNAME || '').trim().toLowerCase()
  const statePass = process.env.STATE_ADMIN_PASSWORD

  const distUser = (process.env.DISTRICT_ADMIN_USERNAME || '').trim().toLowerCase()
  const distPass = process.env.DISTRICT_ADMIN_PASSWORD

  // 1. Super Admin: strictly from .env
  if (superUser && superPass && safeEqual(username, superUser) && safeEqual(password, superPass)) {
    const token = signSession(superUser, 'super_admin', '')
    res.cookie(COOKIE_NAME, token, SESSION_COOKIE_OPTS)
    return res.json({ success: true, token, role: 'super_admin', assigned_district: '', message: 'Super Admin authenticated successfully.' })
  }

  // 2. State Admin: from process.env
  if (stateUser && statePass && safeEqual(username, stateUser) && safeEqual(password, statePass)) {
    const token = signSession(stateUser, 'state_admin', '')
    res.cookie(COOKIE_NAME, token, SESSION_COOKIE_OPTS)
    return res.json({ success: true, token, role: 'state_admin', assigned_district: '', message: 'State Admin authenticated successfully.' })
  }

  // 3. District Admin: from process.env
  if (distUser && distPass && safeEqual(username, distUser) && safeEqual(password, distPass)) {
    const token = signSession(distUser, 'district_admin', '')
    res.cookie(COOKIE_NAME, token, SESSION_COOKIE_OPTS)
    return res.json({ success: true, token, role: 'district_admin', assigned_district: '', message: 'District Admin authenticated successfully.' })
  }

  // 4. Dynamic Admins stored in MongoDB DB3 (admin_users collection)
  if (isAppDbOnline()) {
    try {
      const dbUser = await findAdminUserByUsername(username)
      if (dbUser && dbUser.status !== 'suspended' && verifyPassword(password, dbUser.password)) {
        const token = signSession(dbUser.username, dbUser.role || 'district_admin', dbUser.assigned_district || '')
        res.cookie(COOKIE_NAME, token, SESSION_COOKIE_OPTS)
        return res.json({
          success: true,
          token,
          role: dbUser.role || 'district_admin',
          assigned_district: dbUser.assigned_district || '',
          message: `${dbUser.role} authenticated successfully.`
        })
      }
    } catch (_) {}
  }

  return res.status(401).json({ success: false, message: 'Invalid username or password.' })
}

export function getSession(req, res) {
  return res.json({
    success: true,
    user: req.admin?.u || null,
    role: req.admin?.r || 'super_admin',
    assigned_district: req.admin?.d || '',
  })
}

export function postLogout(req, res) {
  res.clearCookie(COOKIE_NAME, { ...SESSION_COOKIE_OPTS, maxAge: undefined })
  return res.json({ success: true })
}

export async function getDashboardStats(req, res) {
  if (!isAppDbOnline()) return res.status(503).json({ success: false, message: 'Application database unavailable.' })
  try {
    const [stats, topAssemblies] = await Promise.all([getStats(), getTopAssemblies(10)])
    return res.json({ success: true, ...stats, topAssemblies })
  } catch (err) {
    console.error('[Dashboard Stats Error]', err)
    return res.status(500).json({ success: false, message: 'Could not load stats.', error: err?.message })
  }
}

export async function getDistrictAnalytics(req, res) {
  if (!isAppDbOnline()) return res.status(503).json({ success: false, message: 'Application database unavailable.' })
  try {
    const userRole = req.admin?.r || 'super_admin'
    const counts = await getDistrictAnalyticsCounts()
    return res.json({ success: true, district_counts: counts, user_role: userRole })
  } catch (err) {
    console.error('[District Analytics Error]', err)
    return res.status(500).json({ success: false, message: 'Could not fetch district analytics.', error: err?.message })
  }
}

export async function getApplications(req, res) {
  if (!isAppDbOnline()) return res.status(503).json({ success: false, message: 'Application database unavailable.' })
  try {
    const { search = '', page = 1, page_size = 20, district = '' } = req.query
    const result = await listApplications({ search, page, pageSize: page_size, district })
    return res.json({ success: true, ...result })
  } catch (err) {
    console.error('[Get Applications Error]', err)
    return res.status(500).json({ success: false, message: 'Could not load applications.', error: err?.message })
  }
}

export async function getReports(req, res) {
  if (!isAppDbOnline()) return res.status(503).json({ success: false, message: 'Application database unavailable.' })
  try {
    const { body_type, position, from, to, search, page = 1, page_size = 20, district = '' } = req.query
    const result = await getReport({
      bodyType: body_type, position, from, to, search, district,
      page, pageSize: page_size,
    })
    return res.json({ success: true, ...result })
  } catch (err) {
    console.error('[Get Reports Error]', err)
    return res.status(500).json({ success: false, message: 'Could not load report.', error: err?.message })
  }
}

export async function getApplicationDetail(req, res) {
  if (!isAppDbOnline()) return res.status(503).json({ success: false, message: 'Application database unavailable.' })
  const app = await findApplicationById(req.params.id)
  if (!app) return res.status(404).json({ success: false, message: 'Application not found.' })

  try {
    const msg = await getAppDb().collection('organiser_messages').findOne({ application_id: app.application_id })
    if (msg) app.organiser_message = { text: msg.message, sent_at: msg.created_at }
  } catch (_) {}

  return res.json({ success: true, application: app })
}

export async function updateApplication(req, res) {
  if (!isAppDbOnline()) return res.status(503).json({ success: false, message: 'Application database unavailable.' })
  const { id } = req.params
  const patchData = req.body || {}

  try {
    const result = await updateApplicationRecord(id, patchData)
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Application not found.' })
    }
    return res.json({ success: true, message: 'Application updated successfully.' })
  } catch (err) {
    console.error('[Update Application Error]', err)
    return res.status(500).json({ success: false, message: 'Failed to update application.' })
  }
}

export async function deleteApplication(req, res) {
  if (!isAppDbOnline()) return res.status(503).json({ success: false, message: 'Application database unavailable.' })
  const { id } = req.params

  try {
    const existing = await findApplicationById(id)
    if (existing && (existing.photo_url || existing.photoUrl)) {
      await deleteFromCloudinary(existing.photo_url || existing.photoUrl).catch(() => {})
    }

    const result = await deleteApplicationRecord(id)
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Application record not found.' })
    }
    return res.json({ success: true, message: 'Application deleted successfully.' })
  } catch (err) {
    console.error('[Delete Application Error]', err)
    return res.status(500).json({ success: false, message: 'Failed to delete application.' })
  }
}

export async function updateApplicationPhoto(req, res) {
  if (!isAppDbOnline()) return res.status(503).json({ success: false, message: 'Application database unavailable.' })
  const { id } = req.params
  const file = req.file
  if (!file || !file.buffer || !file.buffer.length) {
    return res.status(400).json({ success: false, message: 'No image file received.' })
  }
  try {
    const uploadRes = await uploadToCloudinary({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      folder: `bjp_localbody/admin_uploads`,
    })
    const photoUrl = uploadRes.url
    const col = getAppDb().collection('applications')
    const result = await col.updateOne(
      { application_id: id },
      { $set: { photo_url: photoUrl, updated_at: new Date() } }
    )
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Application record not found.' })
    }
    return res.json({ success: true, photo_url: photoUrl, message: 'Candidate photo updated successfully.' })
  } catch (err) {
    console.error('[Update Candidate Photo Error]', err)
    return res.status(500).json({ success: false, message: 'Could not upload candidate photo.' })
  }
}

export async function updateApplicationMembershipId(req, res) {
  if (!isAppDbOnline()) return res.status(503).json({ success: false, message: 'Application database unavailable.' })
  const { id } = req.params
  const membershipId = String(req.body?.membership_id || '').trim()
  if (!membershipId) {
    return res.status(400).json({ success: false, message: 'Membership ID is required.' })
  }
  try {
    const col = getAppDb().collection('applications')
    const result = await col.updateOne(
      { application_id: id },
      { $set: { membership_id: membershipId, updated_at: new Date() } }
    )
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Application record not found.' })
    }
    return res.json({ success: true, membership_id: membershipId, message: 'Membership ID updated successfully.' })
  } catch (err) {
    console.error('[Update Membership ID Error]', err)
    return res.status(500).json({ success: false, message: 'Could not update membership ID.' })
  }
}

// ── DYNAMIC ADMIN USER MANAGEMENT (SUPER ADMIN ONLY) ──────────────
export async function getAdminUsers(req, res) {
  if (!isAppDbOnline()) return res.status(503).json({ success: false, message: 'Application database unavailable.' })
  try {
    const users = await listAdminUsers()
    return res.json({ success: true, users })
  } catch (err) {
    console.error('[Get Admin Users Error]', err)
    return res.status(500).json({ success: false, message: 'Could not load admin users.' })
  }
}

export async function postAdminUser(req, res) {
  if (!isAppDbOnline()) return res.status(503).json({ success: false, message: 'Application database unavailable.' })
  const { username, password, role, assigned_district, status } = req.body || {}
  const file = req.file

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' })
  }

  try {
    let avatarUrl = ''
    if (file && file.buffer && file.buffer.length) {
      const uploadRes = await uploadToCloudinary({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        folder: 'bjp_localbody/admin_avatars',
      })
      avatarUrl = uploadRes.url
    }

    const newUser = await createAdminUserRecord({
      username,
      password,
      role: role || 'district_admin',
      assigned_district: assigned_district || '',
      avatar_url: avatarUrl,
      status: status || 'active',
    })

    return res.json({ success: true, user: newUser, message: 'Admin user created successfully.' })
  } catch (err) {
    console.error('[Create Admin User Error]', err)
    return res.status(400).json({ success: false, message: err?.message || 'Could not create admin user.' })
  }
}

export async function putAdminUser(req, res) {
  if (!isAppDbOnline()) return res.status(503).json({ success: false, message: 'Application database unavailable.' })
  const { username } = req.params
  const patchData = req.body || {}

  try {
    const result = await updateAdminUserRecord(username, patchData)
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Admin user not found.' })
    }
    return res.json({ success: true, message: 'Admin user updated successfully.' })
  } catch (err) {
    console.error('[Update Admin User Error]', err)
    return res.status(500).json({ success: false, message: 'Could not update admin user.' })
  }
}

export async function deleteAdminUser(req, res) {
  if (!isAppDbOnline()) return res.status(503).json({ success: false, message: 'Application database unavailable.' })
  const { username } = req.params

  try {
    const existing = await findAdminUserByUsername(username)
    if (existing && existing.avatar_url) {
      await deleteFromCloudinary(existing.avatar_url).catch(() => {})
    }

    const result = await deleteAdminUserRecord(username)
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Admin user not found.' })
    }
    return res.json({ success: true, message: 'Admin user deleted successfully.' })
  } catch (err) {
    console.error('[Delete Admin User Error]', err)
    return res.status(500).json({ success: false, message: 'Could not delete admin user.' })
  }
}
