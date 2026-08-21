import crypto from 'crypto'
import dotenv from 'dotenv'

const RESEND_API_URL = 'https://api.resend.com/emails'
const OTP_TTL_MS = 10 * 60 * 1000       // 10 minutes TTL
const RESEND_COOLDOWN_MS = 60 * 1000    // 60 seconds resend cooldown
const MAX_VERIFY_ATTEMPTS = 5           // Max 5 attempts before invalidation

// In-memory session store: normalizedEmail -> { otp, sentAt, attempts }
const emailOtpSessions = new Map()

function cleanupExpired() {
  const now = Date.now()
  for (const [email, s] of emailOtpSessions) {
    if (now - s.sentAt > OTP_TTL_MS) {
      emailOtpSessions.delete(email)
    }
  }
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export function isValidEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return re.test(normalizeEmail(email))
}

function getEmailHtmlTemplate(otp, roleName = 'Admin') {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BJP Admin Login OTP</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="540" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">BHARATIYA JANATA PARTY</h1>
              <p style="margin: 6px 0 0 0; color: #fed7aa; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Tamil Nadu Election Admin Portal</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 28px;">
              <p style="margin: 0 0 16px 0; color: #334155; font-size: 15px; line-height: 24px;">
                Hello <strong>${roleName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 22px;">
                Use the following 6-digit One-Time Password (OTP) to securely sign in to your Election Management Console.
              </p>

              <!-- OTP Code Display -->
              <div style="background-color: #fff7ed; border: 2px dashed #f97316; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #c2410c; display: inline-block;">
                  ${otp}
                </span>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #9a3412; font-weight: 500;">
                  Valid for 10 minutes • Do not share this code with anyone
                </p>
              </div>

              <!-- Security Notice -->
              <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 4px; margin: 24px 0 0 0;">
                <p style="margin: 0; font-size: 12px; color: #475569; line-height: 18px;">
                  🔒 <strong>Security Alert:</strong> If you did not request this login code, please immediately check your account security or contact the IT Department.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 16px;">
                © 2026 Bharatiya Janata Party Tamil Nadu. All rights reserved.<br>
                Secure Multi-Tier RBAC Authentication Gateway
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export async function sendAdminEmailOtp(email, roleName = 'Admin') {
  // Dynamically refresh latest .env so manual server restarts are never required
  dotenv.config({ override: true })
  cleanupExpired()
  const normEmail = normalizeEmail(email)

  if (!isValidEmail(normEmail)) {
    return { success: false, message: 'Please enter a valid email address.' }
  }

  const existing = emailOtpSessions.get(normEmail)
  if (existing) {
    const waited = Date.now() - existing.sentAt
    if (waited < RESEND_COOLDOWN_MS) {
      const secs = Math.ceil((RESEND_COOLDOWN_MS - waited) / 1000)
      return {
        success: false,
        cooldown: secs,
        message: `Please wait ${secs}s before requesting another OTP.`
      }
    }
  }

  // Generate cryptographically secure 6-digit OTP
  const otp = String(crypto.randomInt(100000, 999999))

  // Dynamically resolve individual Resend API key for this specific admin from .env
  let apiKey = process.env.RESEND_API_KEY
  const superEmail = normalizeEmail(process.env.SUPER_ADMIN_EMAIL || '')
  const stateEmail = normalizeEmail(process.env.STATE_ADMIN_EMAIL || '')
  const distEmail  = normalizeEmail(process.env.DISTRICT_ADMIN_EMAIL || '')

  if (superEmail && normEmail === superEmail && process.env.SUPER_ADMIN_RESEND_API_KEY) {
    apiKey = process.env.SUPER_ADMIN_RESEND_API_KEY
  } else if (stateEmail && normEmail === stateEmail && process.env.STATE_ADMIN_RESEND_API_KEY) {
    apiKey = process.env.STATE_ADMIN_RESEND_API_KEY
  } else if (distEmail && normEmail === distEmail && process.env.DISTRICT_ADMIN_RESEND_API_KEY) {
    apiKey = process.env.DISTRICT_ADMIN_RESEND_API_KEY
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'BJP Admin Portal <onboarding@resend.dev>'

  if (!apiKey) {
    console.error('[Resend Error] No RESEND_API_KEY configured for this admin in .env')
    return { success: false, message: 'Email OTP service is not configured on the server.' }
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [normEmail],
        subject: `🔐 BJP Tamil Nadu Admin Login OTP: ${otp}`,
        html: getEmailHtmlTemplate(otp, `${roleName} (${normEmail})`),
      }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      console.error('[Resend API Error]', data)

      // In development mode, if Resend sandbox blocks sending to non-account emails,
      // save the session and log the OTP to the terminal so local testing is never blocked.
      if (process.env.NODE_ENV !== 'production' && data?.statusCode === 403) {
        emailOtpSessions.set(normEmail, {
          otp,
          sentAt: Date.now(),
          attempts: 0,
        })

        console.log(`\n${'='.repeat(62)}`)
        console.log(`🔐 [ADMIN EMAIL OTP GENERATED - DEV SANDBOX]`)
        console.log(`Role:      ${roleName}`)
        console.log(`Email:     ${normEmail}`)
        console.log(`OTP Code:  \x1b[1m\x1b[32m${otp}\x1b[0m (Valid for 10 mins)`)
        console.log(`Note:      Resend free sandbox allows delivery to swwbwja@gmail.com.`)
        console.log(`           To deliver to ${normEmail}, verify domain at resend.com/domains.`)
        console.log(`${'='.repeat(62)}\n`)

        return {
          success: true,
          message: `Login OTP dispatched! (Dev Sandbox: check terminal or verify domain in Resend).`,
        }
      }

      return {
        success: false,
        message: data?.message || 'Failed to deliver OTP email. Please try again.'
      }
    }

    // Save active session
    emailOtpSessions.set(normEmail, {
      otp,
      sentAt: Date.now(),
      attempts: 0,
    })

    // High-visibility terminal logging for development & admin monitoring
    console.log(`\n${'='.repeat(62)}`)
    console.log(`🔐 [ADMIN EMAIL OTP DISPATCHED]`)
    console.log(`Role:      ${roleName}`)
    console.log(`Email:     ${normEmail}`)
    console.log(`OTP Code:  \x1b[1m\x1b[32m${otp}\x1b[0m (Valid for 10 mins)`)
    console.log(`Resend ID: ${data?.id || 'Sent via Resend'}`)
    console.log(`${'='.repeat(62)}\n`)

    return {
      success: true,
      message: 'Login OTP sent to your registered email address.',
    }
  } catch (err) {
    console.error('[Resend Network Error]', err)
    return {
      success: false,
      message: 'Could not connect to the email dispatch service. Please try again.'
    }
  }
}

export function verifyAdminEmailOtp(email, inputOtp) {
  cleanupExpired()
  const normEmail = normalizeEmail(email)
  const code = String(inputOtp || '').trim()

  const session = emailOtpSessions.get(normEmail)
  if (!session) {
    return { success: false, message: 'OTP expired or not requested. Please request a new OTP.' }
  }

  if (Date.now() - session.sentAt > OTP_TTL_MS) {
    emailOtpSessions.delete(normEmail)
    return { success: false, message: 'OTP has expired. Please request a new OTP.' }
  }

  if (session.attempts >= MAX_VERIFY_ATTEMPTS) {
    emailOtpSessions.delete(normEmail)
    return { success: false, message: 'Too many incorrect attempts. Please request a new OTP.' }
  }

  session.attempts += 1

  // Constant-time comparison to prevent timing attacks
  const expectedBuf = Buffer.from(session.otp)
  const inputBuf = Buffer.from(code)

  const isMatch = (expectedBuf.length === inputBuf.length) && crypto.timingSafeEqual(expectedBuf, inputBuf)

  if (isMatch) {
    emailOtpSessions.delete(normEmail)

    console.log(`\n${'='.repeat(62)}`)
    console.log(`✅ [ADMIN EMAIL OTP VERIFIED]`)
    console.log(`Email:     ${normEmail}`)
    console.log(`Status:    AUTHENTICATED & SESSION TOKEN ISSUED`)
    console.log(`${'='.repeat(62)}\n`)

    return { success: true, message: 'Email OTP verified successfully.' }
  }

  const remaining = MAX_VERIFY_ATTEMPTS - session.attempts
  console.log(`⚠️ [ADMIN OTP FAILED] Email: ${normEmail} | Remaining attempts: ${remaining}`)
  return {
    success: false,
    message: `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
  }
}
