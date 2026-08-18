import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAdmin, requireRole } from '../middleware/adminAuth.js'
import multer from 'multer'
import {
  postLogin, getSession, postLogout,
  getDashboardStats, getDistrictAnalytics, getReports, getApplications, getApplicationDetail,
  updateApplication, deleteApplication, updateApplicationPhoto, updateApplicationMembershipId,
  getAdminUsers, postAdminUser, putAdminUser, deleteAdminUser,
} from '../controllers/adminController.js'

const router = Router()
const upload = multer({ limits: { fileSize: 15 * 1024 * 1024 } })

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
})

router.post('/login', loginLimiter, postLogin)
router.get('/session', requireAdmin, getSession)
router.post('/logout', postLogout)

router.get('/stats', requireAdmin, getDashboardStats)
router.get('/district-analytics', requireAdmin, getDistrictAnalytics)
router.get('/reports', requireAdmin, getReports)
router.get('/applications', requireAdmin, getApplications)
router.get('/applications/:id', requireAdmin, getApplicationDetail)

// Application Management: Edit & Delete (Super Admin & State Admin Only)
router.put('/applications/:id', requireRole(['super_admin', 'state_admin']), updateApplication)
router.delete('/applications/:id', requireRole(['super_admin', 'state_admin']), deleteApplication)

// Supporting Updates
router.post('/applications/:id/photo', requireRole(['super_admin', 'state_admin']), upload.single('file'), updateApplicationPhoto)
router.post('/applications/:id/membership', requireRole(['super_admin', 'state_admin']), updateApplicationMembershipId)

// Admin User Management: Super Admin Only
router.get('/users', requireRole(['super_admin']), getAdminUsers)
router.post('/users', requireRole(['super_admin']), upload.single('file'), postAdminUser)
router.put('/users/:username', requireRole(['super_admin']), putAdminUser)
router.delete('/users/:username', requireRole(['super_admin']), deleteAdminUser)

export default router
