import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import {
  postSendOtp, postVerifyOtp, postLookupVoter,
  postSubmitApplication, getApplication,
  postUploadMedia, postOrganiserMessage, getMediaProxy,
  postUpdateApplicationPhoto,
} from '../controllers/chatController.js'

const router = Router()

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/jpg',
  'video/mp4', 'video/quicktime', 'video/webm',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword'
]

// In-memory storage with MIME type validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB (videos)
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file format. Only JPG, PNG, WEBP, MP4, WEBM, PDF, and DOCX files are allowed.'))
    }
  },
})

// Tighter limit on OTP send to avoid SMS abuse
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many OTP requests. Please try again later.' },
})

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
})

router.post('/send-otp', otpLimiter, postSendOtp)
router.post('/verify-otp', generalLimiter, postVerifyOtp)
router.post('/lookup-voter', generalLimiter, postLookupVoter)
router.post('/submit-application', generalLimiter, postSubmitApplication)
router.get('/application/:id', generalLimiter, getApplication)
router.post('/application/:id/photo', generalLimiter, upload.single('file'), postUpdateApplicationPhoto)
router.post('/upload/media', generalLimiter, upload.single('file'), postUploadMedia)
router.post('/organiser-message', generalLimiter, postOrganiserMessage)
// Public read-only media proxy (streams private B2 objects). Key may contain
// slashes, so use a wildcard. Left unthrottled — responses are cache-friendly.
router.get('/media/*', getMediaProxy)

export default router
