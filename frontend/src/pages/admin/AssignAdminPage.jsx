import { useState, useEffect, useMemo } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { admin } from '../../api'
import '../../styles/admin.css'

const TN_38_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri',
  'Dindigul', 'Erode', 'Kallakurichi', 'Kancheepuram', 'Kanniyakumari', 'Karur',
  'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris',
  'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga',
  'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Thiruvallur', 'Tiruchirappalli',
  'Tirunelveli', 'Tirupathur', 'Tiruppur', 'Tiruvannamalai', 'Tiruvarur',
  'Vellore', 'Viluppuram', 'Virudhunagar'
]

export default function AssignAdminPage() {
  const navigate = useNavigate()
  const context = useOutletContext() || {}
  const userSession = context.userSession || { role: 'super_admin' }
  const isSuperAdmin = userSession.role === 'super_admin'

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [role, setRole] = useState('district_admin')
  const [assignedDistrict, setAssignedDistrict] = useState('')
  const [status, setStatus] = useState('active')
  const [avatarFile, setAvatarFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const loadUsers = async () => {
    if (!isSuperAdmin) return
    setLoading(true)
    try {
      const res = await admin.getAdminUsers()
      if (res?.users) {
        setUsers(res.users)
      }
    } catch (err) {
      setError(err?.message || 'Failed to load dynamic admin users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [isSuperAdmin])

  const handleOpenCreateModal = () => {
    setEditingUser(null)
    setUsername('')
    setPassword('')
    setRole('district_admin')
    setAssignedDistrict('')
    setStatus('active')
    setAvatarFile(null)
    setError('')
    setModalOpen(true)
  }

  const handleOpenEditModal = (user) => {
    setEditingUser(user)
    setUsername(user.username)
    setPassword('') // Leave blank unless changing
    setRole(user.role || 'district_admin')
    setAssignedDistrict(user.assigned_district || '')
    setStatus(user.status || 'active')
    setAvatarFile(null)
    setError('')
    setModalOpen(true)
  }

  const handleSaveUser = async (e) => {
    e?.preventDefault()
    if (!username.trim()) {
      setError('Username is required.')
      return
    }
    if (!editingUser && !password) {
      setError('Password is required for new admin user.')
      return
    }

    setSaving(true)
    setError('')
    try {
      if (editingUser) {
        const patchData = {
          role,
          assigned_district: role === 'district_admin' ? assignedDistrict : '',
          status,
        }
        if (password) patchData.password = password

        const res = await admin.updateAdminUser(editingUser.username, patchData)
        if (res?.success) {
          setMsg(`✅ Admin "${editingUser.username}" updated successfully.`)
          setModalOpen(false)
          loadUsers()
        }
      } else {
        const formData = new FormData()
        formData.append('username', username.trim().toLowerCase())
        formData.append('password', password)
        formData.append('role', role)
        formData.append('assigned_district', role === 'district_admin' ? assignedDistrict : '')
        formData.append('status', status)
        if (avatarFile) formData.append('file', avatarFile)

        const res = await admin.createAdminUser(formData)
        if (res?.success) {
          setMsg(`✅ Admin "${username}" created successfully.`)
          setModalOpen(false)
          loadUsers()
        }
      }
    } catch (err) {
      setError(err?.message || 'Failed to save admin user.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async (targetUsername) => {
    if (!window.confirm(`Are you sure you want to delete admin account "${targetUsername}"?`)) return
    try {
      const res = await admin.deleteAdminUser(targetUsername)
      if (res?.success) {
        setMsg(`✅ Admin account "${targetUsername}" deleted.`)
        loadUsers()
      }
    } catch (err) {
      setError(err?.message || 'Failed to delete admin user.')
    }
  }

  const handleToggleStatus = async (targetUser) => {
    const nextStatus = targetUser.status === 'active' ? 'suspended' : 'active'
    try {
      const res = await admin.updateAdminUser(targetUser.username, { status: nextStatus })
      if (res?.success) {
        setMsg(`✅ Account "${targetUser.username}" set to ${nextStatus}.`)
        loadUsers()
      }
    } catch (err) {
      setError(err?.message || 'Failed to update status.')
    }
  }

  const stateAdminsCount = useMemo(() => users.filter(u => u.role === 'state_admin').length, [users])
  const distAdminsCount = useMemo(() => users.filter(u => u.role === 'district_admin').length, [users])

  if (!isSuperAdmin) {
    return (
      <div className="admin-page-container">
        <div className="admin-card" style={{ padding: 40, textAlign: 'center' }}>
          <i className="bi bi-shield-slash-fill text-danger" style={{ fontSize: 48 }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '16px 0 8px 0', color: 'var(--text-primary)' }}>Access Restricted</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>Only Super Admins can access the Admin Assignment Management Suite.</p>
          <button className="btn-admin-primary" onClick={() => navigate('/admin/dashboard')} style={{ marginTop: 16 }}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page-container">
      {/* Page Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <span className="bjp-badge-pill role-badge-super_admin" style={{ fontSize: 10.5, marginBottom: 4, display: 'inline-block' }}>
            SUPER ADMIN MASTER CONTROL
          </span>
          <h1 style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: 0 }}>
            <i className="bi bi-person-plus-fill me-2" style={{ color: 'var(--role-accent)' }} />
            Assign Admin Suite
          </h1>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Create and manage dynamic State & District Admin credentials across DB3 & Cloudinary
          </p>
        </div>

        <button type="button" className="btn-admin-primary" onClick={handleOpenCreateModal} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
          <i className="bi bi-plus-lg" /> Assign New Admin Account
        </button>
      </div>

      {msg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 12, padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#047857', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{msg}</span>
          <button type="button" onClick={() => setMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, color: '#047857' }}>✕</button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="stat-cards-grid mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-card-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <i className="bi bi-people-fill" />
            </div>
            <span className="stat-card-badge role-badge-super_admin">Real DB3 Data</span>
          </div>
          <div className="stat-card-value">{users.length}</div>
          <div className="stat-card-label">Total Assigned Admins</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-card-icon" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
              <i className="bi bi-sliders" />
            </div>
            <span className="stat-card-badge role-badge-state_admin">State Suite</span>
          </div>
          <div className="stat-card-value">{stateAdminsCount}</div>
          <div className="stat-card-label">State Operations Admins</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-card-icon" style={{ background: '#F0F9FF', color: '#0284C7' }}>
              <i className="bi bi-geo-alt-fill" />
            </div>
            <span className="stat-card-badge role-badge-district_admin">District Suite</span>
          </div>
          <div className="stat-card-value">{distAdminsCount}</div>
          <div className="stat-card-label">District Scoped Admins</div>
        </div>
      </div>

      {/* Admin User Register Table */}
      <div className="admin-card mb-4" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="bi bi-shield-lock-fill" style={{ color: 'var(--role-accent)' }} />
            Active Dynamic Admin Registry
          </h3>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
            Showing {users.length} Account(s)
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: 'var(--bg-surface-2)', borderRadius: 16 }}>
            <i className="bi bi-person-plus" style={{ fontSize: 36, color: 'var(--text-muted)' }} />
            <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-muted)', marginTop: 8 }}>No custom admin accounts created yet.</p>
            <button className="btn-admin-primary" onClick={handleOpenCreateModal} style={{ marginTop: 8 }}>
              + Create First Admin Account
            </button>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Admin Profile</th>
                  <th>Username</th>
                  <th>Role Tier</th>
                  <th>District Scope</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.username}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: '1.5px solid var(--border-dim)', background: '#F1F5F9', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <i className="bi bi-person-fill" style={{ fontSize: 18, color: 'var(--text-muted)' }} />
                          )}
                        </div>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                          {u.username}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                      {u.username}
                    </td>
                    <td>
                      <span className={`bjp-badge-pill ${u.role === 'state_admin' ? 'role-badge-state_admin' : 'role-badge-district_admin'}`}>
                        {u.role === 'state_admin' ? '⚡ State Admin' : '📍 District Admin'}
                      </span>
                    </td>
                    <td>
                      {u.assigned_district ? (
                        <span style={{ background: '#F1F5F9', border: '1px solid var(--border-dim)', padding: '3px 8px', borderRadius: 8, fontSize: 11, fontWeight: 800, color: 'var(--text-primary)' }}>
                          📍 {u.assigned_district}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                          🌐 State-Wide
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 8,
                        background: u.status === 'suspended' ? '#FEE2E2' : '#DCFCE7',
                        color: u.status === 'suspended' ? '#DC2626' : '#166534',
                      }}>
                        {u.status === 'suspended' ? '⛔ Suspended' : '✓ Active'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-admin-secondary"
                          onClick={() => handleOpenEditModal(u)}
                          style={{ padding: '4px 8px', fontSize: 11 }}
                          title="Edit Account"
                        >
                          <i className="bi bi-pencil-square" />
                        </button>

                        <button
                          type="button"
                          className="btn-admin-secondary"
                          onClick={() => handleToggleStatus(u)}
                          style={{ padding: '4px 8px', fontSize: 11 }}
                          title={u.status === 'suspended' ? 'Activate Account' : 'Suspend Account'}
                        >
                          <i className={`bi bi-${u.status === 'suspended' ? 'check-circle' : 'slash-circle'}`} />
                        </button>

                        <button
                          type="button"
                          className="btn-admin-secondary"
                          onClick={() => handleDeleteUser(u.username)}
                          style={{ padding: '4px 8px', fontSize: 11, color: '#DC2626' }}
                          title="Delete Account"
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Admin User Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', zIndex: 1150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: 520, margin: 0, padding: 28, borderRadius: 24, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--border-dim)' }}>
              <h3 style={{ margin: 0, fontWeight: 900, fontFamily: 'var(--font-heading)', fontSize: 18, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="bi bi-person-plus-fill" style={{ color: 'var(--role-accent)' }} />
                {editingUser ? `Edit Admin Account (${editingUser.username})` : 'Assign New Admin Account'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-dim)', width: 32, height: 32, borderRadius: 8, fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>✕</button>
            </div>

            {error && (
              <div role="alert" style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 10, padding: '8px 12px', fontSize: 12.5, color: '#DC2626', marginBottom: 14 }}>
                <i className="bi bi-exclamation-circle-fill me-1" /> {error}
              </div>
            )}

            <form onSubmit={handleSaveUser}>
              {/* Username Input */}
              <div className="admin-form-group">
                <label className="admin-form-label">Username</label>
                <input
                  type="text"
                  className="admin-form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. chennai_admin"
                  disabled={editingUser || saving}
                />
              </div>

              {/* Password Input */}
              <div className="admin-form-group">
                <label className="admin-form-label">{editingUser ? 'Password (Leave blank to keep unchanged)' : 'Password'}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="admin-form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    disabled={saving}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <i className={`bi bi-${showPass ? 'eye-slash' : 'eye'}`} />
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div className="admin-form-group">
                <label className="admin-form-label">Admin Role</label>
                <select className="admin-form-control" value={role} onChange={(e) => setRole(e.target.value)} disabled={saving}>
                  <option value="district_admin">District Admin (Read-Only Scoped)</option>
                  <option value="state_admin">State Admin (Operations Suite)</option>
                </select>
              </div>

              {/* District Scope Assignment */}
              {role === 'district_admin' && (
                <div className="admin-form-group">
                  <label className="admin-form-label">Assigned District</label>
                  <select className="admin-form-control" value={assignedDistrict} onChange={(e) => setAssignedDistrict(e.target.value)} disabled={saving}>
                    <option value="">Select District</option>
                    {TN_38_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d} District</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Avatar File Upload */}
              {!editingUser && (
                <div className="admin-form-group">
                  <label className="admin-form-label">Profile Avatar Photo (Cloudinary)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="admin-form-control"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    disabled={saving}
                    style={{ padding: '8px 12px' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn-admin-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-admin-primary" disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-1" /> Saving…</> : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
