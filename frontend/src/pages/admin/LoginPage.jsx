import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { admin } from '../../api'
import '../../styles/admin.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!username.trim() || !password) {
      setError('Enter your username and password.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await admin.login(username.trim(), password)
      if (data && data.success === true) {
        navigate('/admin/dashboard', { replace: true })
      } else {
        setError(data?.message || 'Invalid username or password.')
      }
    } catch (err) {
      setError(err?.message || 'Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        {/* Logo Branding */}
        <div className="admin-login-logo">
          <img src="/bjp_logo.svg" alt="BJP" onError={(e) => { e.target.src = '/bjp_logo.png' }} />
        </div>
        <h1 className="admin-login-title">BJP TAMIL NADU</h1>
        <p className="admin-login-subtitle">Election Admin Portal — Executive Sign In</p>

        <form onSubmit={handleSubmit}>
          {/* Username Input */}
          <div className="admin-form-group">
            <label htmlFor="admin-username" className="admin-form-label">
              <i className="bi bi-person-fill me-1" style={{ color: '#2563EB' }} /> Username
            </label>
            <input
              id="admin-username"
              className="admin-form-control"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Password Input with Show/Hide Eye Toggle */}
          <div className="admin-form-group">
            <label htmlFor="admin-password" className="admin-form-label">
              <i className="bi bi-lock-fill me-1" style={{ color: '#2563EB' }} /> Password
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                id="admin-password"
                className="admin-form-control"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                disabled={loading}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                  borderRadius: 6,
                  zIndex: 2,
                }}
              >
                <i className={`bi bi-${showPass ? 'eye-slash-fill' : 'eye-fill'}`} />
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" style={{ background: 'var(--color-red-bg)', border: '1px solid var(--color-red)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: 'var(--color-red)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="bi bi-exclamation-circle-fill" /> {error}
            </div>
          )}

          <button
            className="admin-login-btn"
            type="submit"
            disabled={loading}
            style={{
              background: '#2563EB',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
              marginTop: 4,
            }}
          >
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-2" /> Authenticating…</>
            ) : (
              <><i className="bi bi-box-arrow-in-right me-2" /> Sign In to Admin Portal</>
            )}
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-dim)', textAlign: 'center', fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600 }}>
          <i className="bi bi-shield-lock-fill me-1" style={{ color: '#2563EB' }} /> 
          Multi-Tier RBAC Encrypted Session
        </div>
      </div>
    </div>
  )
}
