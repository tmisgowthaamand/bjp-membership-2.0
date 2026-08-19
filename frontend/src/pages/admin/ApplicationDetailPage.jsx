import { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { admin } from '../../api'
import '../../styles/admin.css'

function DetailRow({ icon, label, value, compact }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="detail-row">
      <div className="detail-label-col">
        {icon && <i className={`bi bi-${icon}`} style={{ color: 'var(--role-accent, #2563EB)' }} />}
        <span>{label}</span>
      </div>
      <div
        className="detail-value-col"
        style={compact ? { fontSize: '11px', flexShrink: 1, whiteSpace: 'nowrap' } : {}}
        title={String(value)}
      >
        {value}
      </div>
    </div>
  )
}

function DetailSection({ title, icon, children }) {
  return (
    <div className="admin-card detail-card">
      <div className="admin-card-header">
        <h6 className="admin-card-title">
          <i className={`bi bi-${icon}`} style={{ color: 'var(--role-accent, #2563EB)' }} /> {title}
        </h6>
      </div>
      <div className="detail-card-body">{children}</div>
    </div>
  )
}

export default function ApplicationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const context = useOutletContext() || {}
  const userSession = context.userSession || { role: 'super_admin' }
  const canManage = userSession.role === 'super_admin' || userSession.role === 'state_admin'

  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    admin
      .getApplication(id)
      .then((res) => setApp(res.application))
      .catch((err) => setError(err?.message || 'Failed to load application details.'))
      .finally(() => setLoading(false))
  }, [id])

  const handlePrint = () => {
    window.print()
  }

  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState('')

  const [isEditingMembership, setIsEditingMembership] = useState(false)
  const [membershipInput, setMembershipInput] = useState('')
  const [savingMembership, setSavingMembership] = useState(false)
  const [membershipMsg, setMembershipMsg] = useState('')

  const handleSaveMembership = async () => {
    if (!membershipInput.trim()) return
    setSavingMembership(true)
    setMembershipMsg('')
    try {
      const res = await admin.updateMembershipId(id, membershipInput.trim())
      if (res?.success && res?.membership_id) {
        setApp((prev) => ({ ...prev, membership_id: res.membership_id }))
        setIsEditingMembership(false)
        setMembershipMsg('✅ BJP Membership ID updated successfully.')
      } else {
        setMembershipMsg(`❌ ${res?.message || 'Failed to update Membership ID.'}`)
      }
    } catch (err) {
      setMembershipMsg(`❌ ${err?.message || 'Error updating Membership ID.'}`)
    } finally {
      setSavingMembership(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    setPhotoError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await admin.updatePhoto(id, formData)
      if (res?.success && res?.photo_url) {
        setApp((prev) => ({ ...prev, photo_url: res.photo_url }))
      } else {
        setPhotoError(res?.message || 'Failed to upload photo.')
      }
    } catch (err) {
      setPhotoError(err?.message || 'Error uploading photo.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const role = userSession.role || 'super_admin'

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div className="spinner-border text-danger" role="status" style={{ width: '3rem', height: '3rem' }} />
      </div>
    )
  }

  if (error || !app) {
    return (
      <div className="admin-page-container">
        <button
          type="button"
          className="btn-admin-secondary"
          onClick={() => navigate('/admin/applications')}
          style={{ marginBottom: 20 }}
        >
          ← Back to Registry
        </button>
        <div className="admin-card" style={{ padding: 40, textAlign: 'center' }}>
          <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: 40 }} />
          <p style={{ marginTop: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{error || 'Application record not found.'}</p>
        </div>
      </div>
    )
  }

  const v = app.voter || {}
  const lb = app.local_body || {}
  const social = app.social_media || {}
  const prefs = app.position_preferences || []

  return (
    <div className="admin-page-container">
      {/* Header Bar */}
      <div className="detail-header-bar">
        <div>
          <button
            type="button"
            className="btn-admin-secondary"
            onClick={() => navigate('/admin/applications')}
            style={{ marginBottom: 8 }}
          >
            ← Back to Registry
          </button>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <h1 className="monospace-title">{app.application_id}</h1>
            <span className="submission-time-badge">
              Submitted on{' '}
              {app.submitted_at
                ? new Date(app.submitted_at).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" className="btn-admin-primary" onClick={handlePrint}>
            <i className="bi bi-printer-fill" /> Print Record
          </button>
          <span style={{ background: 'var(--color-green-bg)', color: 'var(--color-green)', border: '1px solid rgba(5,150,105,0.3)', padding: '6px 12px', borderRadius: 10, fontSize: 11.5, fontWeight: 800 }}>
            ✓ Verified
          </span>
        </div>
      </div>

      {/* 2-COLUMN MOBILE RESPONSIVE CANDIDATE PROFILE HERO CARD */}
      <div className="admin-card mb-4" style={{ padding: '20px 24px' }}>
        <div className="candidate-hero-card-inner">
          {/* Left Column: Circular Candidate Photo Avatar */}
          <div className="candidate-hero-avatar-wrap">
            <img
              src={app.photo_url || app.photoUrl || '/bjp_logo.png'}
              alt="Candidate Photo"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
              onError={(e) => { e.target.onerror = null; e.target.src = '/bjp_logo.png' }}
            />
          </div>

          {/* Right Column: Candidate Profile Summary Badges */}
          <div className="candidate-hero-details">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
              <span className={`bjp-badge-pill role-badge-${role} candidate-hero-pill`} style={{ fontSize: 10.5, padding: '3px 8px' }}>
                ID: {app.application_id}
              </span>
              <span className="candidate-hero-pill" style={{
                fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 8,
                background: app.body_type === 'urban' ? 'var(--role-accent-bg, #EFF6FF)' : 'var(--color-green-bg)',
                color: app.body_type === 'urban' ? 'var(--role-accent, #2563EB)' : 'var(--color-green)'
              }}>
                {app.body_type === 'urban' ? '🏙️ Urban' : '🌾 Rural'}
              </span>
            </div>

            <h2 className="candidate-hero-name">
              {v.name || 'Candidate Application'}
            </h2>

            <div className="candidate-hero-pills" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {(v.district || app.district) && (
                <span className="candidate-hero-pill" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-dim)', padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center' }}>
                  <i className="bi bi-geo-alt-fill" style={{ color: 'var(--color-saffron)', marginRight: 4 }} /> {v.district || app.district}
                </span>
              )}

              <span className="candidate-hero-pill" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-dim)', padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 800, color: app.membership_id ? 'var(--color-green)' : '#D97706', fontFamily: 'JetBrains Mono, monospace' }}>
                🆔 #{app.membership_id || 'Not Set'}
              </span>

              {app.mobile && (
                <span className="candidate-hero-pill" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-dim)', padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                  📞 {app.mobile}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="detail-cards-grid">
        {/* Personal & Voter Info */}
        <DetailSection title="Personal & Voter Details" icon="person-badge-fill">
          <DetailRow icon="person" label="Candidate Name" value={v.name} />
          <DetailRow icon="people" label="Relation Name" value={v.relation_name} />
          <DetailRow icon="gender-ambiguous" label="Age / Gender" value={[v.age, v.gender].filter(Boolean).join(' / ')} />
          <DetailRow icon="card-text" label="EPIC Number" value={app.epic_no || v.epic_no} />
          <DetailRow icon="building" label="Assembly Constituency" value={[v.assembly_name, v.assembly_no && `(${v.assembly_no})`].filter(Boolean).join(' ') || v.assembly_no} />
          <DetailRow icon="geo-alt" label="District" value={v.district || app.district} />
          <DetailRow icon="signpost-2" label="Part / Booth" value={[v.part_no, v.booth_name].filter(Boolean).join(' — ')} />
          
          <div className="detail-row" style={{ alignItems: 'center' }}>
            <div className="detail-label-col">
              <i className="bi bi-shield-lock" style={{ color: 'var(--role-accent, #2563EB)' }} />
              <span>Membership ID</span>
            </div>
            <div className="detail-value-col">
              {isEditingMembership ? (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <input
                    type="text"
                    value={membershipInput}
                    onChange={(e) => setMembershipInput(e.target.value)}
                    placeholder="ID"
                    className="admin-form-control"
                    style={{ width: 110, padding: '4px 8px', fontSize: 12 }}
                  />
                  <button
                    type="button"
                    className="btn-admin-primary"
                    onClick={handleSaveMembership}
                    disabled={savingMembership || !membershipInput.trim()}
                    style={{ padding: '4px 8px', fontSize: 11 }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn-admin-secondary"
                    onClick={() => { setIsEditingMembership(false); setMembershipMsg('') }}
                    disabled={savingMembership}
                    style={{ padding: '4px 6px', fontSize: 11 }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                  <span style={{ fontWeight: 800, color: app.membership_id ? 'var(--color-green)' : '#D97706', fontFamily: 'JetBrains Mono, monospace' }}>
                    {app.membership_id || 'Not Set'}
                  </span>
                  {canManage && (
                    <button
                      type="button"
                      className="btn-admin-secondary"
                      onClick={() => {
                        setMembershipInput(app.membership_id || '')
                        setIsEditingMembership(true)
                        setMembershipMsg('')
                      }}
                      style={{ padding: '2px 6px', fontSize: 10.5 }}
                    >
                      <i className="bi bi-pencil-square" /> Edit ID
                    </button>
                  )}
                </div>
              )}
              {membershipMsg && <div style={{ fontSize: 11, marginTop: 2 }}>{membershipMsg}</div>}
            </div>
          </div>
        </DetailSection>

        {/* Candidate Passport Photo Upload Section */}
        <DetailSection title="Candidate Passport Photo Management" icon="person-bounding-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {/* Passport Size Rectangle Frame */}
            <div style={{
              width: 100,
              height: 125,
              borderRadius: 12,
              overflow: 'hidden',
              border: '2.5px solid var(--role-accent, #2563EB)',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.18)',
              background: 'var(--bg-surface-2)',
              flexShrink: 0
            }}>
              <img
                src={app.photo_url || app.photoUrl || '/bjp_logo.png'}
                alt="Candidate Passport Photo"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }}
                onError={(e) => { e.target.onerror = null; e.target.src = '/bjp_logo.png' }}
              />
            </div>
            <div>
              {app.photo_url || app.photoUrl ? (
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-green)', marginBottom: 6 }}>
                  <i className="bi bi-check-circle-fill me-1" /> Photo Uploaded
                </div>
              ) : (
                <div style={{ fontSize: 12, fontWeight: 800, color: '#D97706', marginBottom: 6 }}>
                  <i className="bi bi-exclamation-circle-fill me-1" /> Photo Pending
                </div>
              )}

              {canManage && (
                <label className="btn-admin-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, padding: '6px 12px' }}>
                  <i className={`bi ${uploadingPhoto ? 'bi-hourglass-split' : 'bi-camera-fill'}`} />
                  {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    style={{ display: 'none' }}
                  />
                </label>
              )}

              {photoError && <div style={{ fontSize: 11, color: 'var(--color-red)', marginTop: 4 }}>{photoError}</div>}
            </div>
          </div>
        </DetailSection>

        {/* Local Body & Position Preferences */}
        <DetailSection title="Local Body & Position Preferences" icon="award-fill">
          <DetailRow icon="building" label="Body Type" value={app.body_type === 'urban' ? 'Urban Body' : 'Rural Panchayat'} />
          {app.body_type === 'urban' ? (
            <>
              <DetailRow icon="buildings" label="Local Body" value={lb.local_body || lb.local_body_type} />
              <DetailRow icon="hash" label="Ward / Zone" value={lb.ward && `Ward ${lb.ward}`} />
            </>
          ) : (
            <>
              <DetailRow icon="tree" label="Panchayat Union" value={lb.panchayat_union} />
              <DetailRow icon="house" label="Village Panchayat" value={lb.village_panchayat} />
              <DetailRow icon="hash" label="Ward Number" value={lb.ward && `Ward ${lb.ward}`} />
            </>
          )}
          <DetailRow icon="1-circle-fill" label="1st Pref Position" value={prefs[0]} compact />
          <DetailRow icon="2-circle-fill" label="2nd Pref Position" value={prefs[1]} compact />
          <DetailRow icon="3-circle-fill" label="3rd Pref Position" value={prefs[2]} compact />
        </DetailSection>

        {/* Official Social Media Handles */}
        <DetailSection title="Official Social Media Handles" icon="share-fill">
          <DetailRow icon="facebook" label="Facebook" value={social.facebook} />
          <DetailRow icon="instagram" label="Instagram" value={social.instagram} />
          <DetailRow icon="twitter-x" label="Twitter / X" value={social.twitter} />
          <DetailRow icon="youtube" label="YouTube Channel" value={social.youtube} />
        </DetailSection>

        {/* Work & Political Experience */}
        {app.work_experience && (
          <DetailSection title="Work & Party Experience" icon="briefcase-fill">
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {app.work_experience}
            </div>
          </DetailSection>
        )}

        {/* Local Area Understanding & Vision */}
        {app.local_area_understanding && (
          <DetailSection title="Local Area Understanding & Vision" icon="journal-text">
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {app.local_area_understanding}
            </div>
          </DetailSection>
        )}
      </div>
    </div>
  )
}
