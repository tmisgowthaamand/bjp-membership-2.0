import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { admin } from '../../api'
import '../../styles/admin.css'

export default function LoginPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState(1) // 1: Email input, 2: OTP verification
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // Resend cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // Mask email for display (e.g. gok*****@gmail.com)
  const maskEmail = (em = '') => {
    if (!em || !em.includes('@')) return em
    const [user, domain] = em.split('@')
    if (user.length <= 3) return `${user.slice(0, 1)}***@${domain}`
    return `${user.slice(0, 3)}*****@${domain}`
  }

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e?.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid administrator email address.')
      return
    }

    setError('')
    setSuccessMsg('')
    setLoading(true)

    try {
      const res = await admin.sendOtp(cleanEmail)
      if (res && res.success === true) {
        setStep(2)
        setCooldown(60)
        setSuccessMsg(`Login code sent to ${maskEmail(cleanEmail)}`)
      } else {
        setError(res?.message || 'Could not dispatch OTP email. Please try again.')
      }
    } catch (err) {
      setError(err?.message || 'This email is not registered as an authorized administrator.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault()
    const cleanOtp = otp.trim()
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the 6-digit OTP code sent to your email.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await admin.verifyOtp(email.trim().toLowerCase(), cleanOtp)
      if (data && data.success === true) {
        navigate('/admin/dashboard', { replace: true })
      } else {
        setError(data?.message || 'Invalid or expired OTP.')
      }
    } catch (err) {
      setError(err?.message || 'Invalid or expired OTP.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        {/* BJP Lotus Brand Logo */}
        <div className="admin-login-logo">
          <img src="/bjp_logo.svg" alt="BJP" onError={(e) => { e.target.src = '/bjp_logo.png' }} />
        </div>
        <h1 className="admin-login-title">BJP TAMIL NADU</h1>
        <p className="admin-login-subtitle">Election Admin Portal — Executive Sign In</p>

        {/* Error Alert */}
        {error && (
          <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #F87171', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="bi bi-exclamation-circle-fill" /> {error}
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div role="status" style={{ background: '#F0FDF4', border: '1px solid #4ADE80', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#16A34A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="bi bi-check-circle-fill" /> {successMsg}
          </div>
        )}

        {step === 1 ? (
          /* ── STEP 1: Email Address Input ── */
          <form onSubmit={handleSendOtp}>
            <div className="admin-form-group">
              <label htmlFor="admin-email" className="admin-form-label">
                <i className="bi bi-envelope-fill me-1" style={{ color: '#2563EB' }} /> Email Address
              </label>
              <input
                id="admin-email"
                className="admin-form-control"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                autoComplete="email"
                disabled={loading}
                autoFocus
                required
              />
            </div>

            <button
              className="admin-login-btn"
              type="submit"
              disabled={loading}
              style={{
                background: '#2563EB',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                marginTop: 6,
              }}
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" /> Sending Code…</>
              ) : (
                <><i className="bi bi-send-fill me-2" /> Send Login OTP</>
              )}
            </button>
          </form>
        ) : (
          /* ── STEP 2: 6-Digit OTP Verification ── */
          <form onSubmit={handleVerifyOtp}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Sending code to </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{maskEmail(email)}</span>
              </div>
              <button
                type="button"
                onClick={() => { setStep(1); setOtp(''); setError(''); setSuccessMsg('') }}
                style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Change
              </button>
            </div>

            <div className="admin-form-group">
              <label htmlFor="admin-otp" className="admin-form-label">
                <i className="bi bi-shield-lock-fill me-1" style={{ color: '#2563EB' }} /> Enter 6-Digit OTP Code
              </label>
              <input
                id="admin-otp"
                className="admin-form-control"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                style={{
                  letterSpacing: 6,
                  fontSize: 20,
                  fontWeight: 800,
                  textAlign: 'center',
                }}
                disabled={loading}
                autoFocus
                required
              />
            </div>

            <button
              className="admin-login-btn"
              type="submit"
              disabled={loading || otp.length < 6}
              style={{
                background: '#2563EB',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                marginTop: 4,
              }}
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" /> Verifying Code…</>
              ) : (
                <><i className="bi bi-box-arrow-in-right me-2" /> Sign In to Admin Portal</>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={cooldown > 0 || loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: cooldown > 0 ? '#94A3B8' : '#2563EB',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: cooldown > 0 ? 'default' : 'pointer',
                }}
              >
                {cooldown > 0 ? (
                  <>Resend code in <strong>{cooldown}s</strong></>
                ) : (
                  <><i className="bi bi-arrow-clockwise me-1" /> Resend Login OTP</>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer Security Badge */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-dim)', textAlign: 'center', fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600 }}>
          <i className="bi bi-shield-lock-fill me-1" style={{ color: '#2563EB' }} /> 
          Multi-Tier RBAC Encrypted Session
        </div>
      </div>
    </div>
  )
}
