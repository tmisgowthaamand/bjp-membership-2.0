import React, { useState } from 'react'
import { admin } from '../../api'

export default function EditApplicationModal({ application, onClose, onSaveSuccess }) {
  const [candName, setCandName] = useState(application?.voter?.name || '')
  const [epicNo, setEpicNo] = useState(application?.epic_no || application?.voter?.epic_no || '')
  const [membershipId, setMembershipId] = useState(application?.membership_id || '')
  const [positionPref, setPositionPref] = useState(application?.position_preferences?.[0] || 'Town Panchayat Ward Member')
  const [localBodyName, setLocalBodyName] = useState(
    typeof application?.local_body === 'string'
      ? application?.local_body
      : application?.local_body?.local_body || application?.local_body?.urbanBody || ''
  )
  const [wardNo, setWardNo] = useState(application?.local_body?.ward || application?.local_body?.urbanWard || '')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!application) return null

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')
    try {
      const patchData = {
        'voter.name': candName.trim(),
        epic_no: epicNo.trim(),
        membership_id: membershipId.trim(),
        position_preferences: [positionPref],
        'local_body.local_body': localBodyName.trim(),
        'local_body.ward': wardNo.trim(),
      }
      const targetId = application.application_id || application._id
      const res = await admin.updateApplication(targetId, patchData)
      if (res.data?.success || res.status === 200) {
        onSaveSuccess()
        onClose()
      } else {
        setErrorMsg(res.data?.message || 'Failed to update record.')
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error saving application changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 16
    }}>
      <div style={{
        background: '#FFFFFF', borderRadius: 18, border: '1px solid #E2E8F0',
        width: '100%', maxWidth: 520, boxShadow: '0 20px 40px -10px rgba(15,23,42,0.25)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
              Edit Candidate Application
            </h3>
            <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'monospace', fontWeight: 700 }}>
              ID: {application.application_id}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, color: '#64748B', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {errorMsg && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', fontSize: 12, fontWeight: 600 }}>
              {errorMsg}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Candidate Name</label>
            <input
              type="text"
              required
              value={candName}
              onChange={(e) => setCandName(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 600, color: '#0F172A', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>EPIC / Voter ID</label>
              <input
                type="text"
                value={epicNo}
                onChange={(e) => setEpicNo(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 600, color: '#0F172A', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Membership ID</label>
              <input
                type="text"
                value={membershipId}
                onChange={(e) => setMembershipId(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700, color: '#2563EB', fontFamily: 'monospace', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Contest Preference</label>
            <input
              type="text"
              value={positionPref}
              onChange={(e) => setPositionPref(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 600, color: '#0F172A', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Local Body</label>
              <input
                type="text"
                value={localBodyName}
                onChange={(e) => setLocalBodyName(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 600, color: '#0F172A', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Ward No</label>
              <input
                type="text"
                value={wardNo}
                onChange={(e) => setWardNo(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 600, color: '#0F172A', outline: 'none' }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '9px 16px', borderRadius: 10, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ padding: '9px 20px', borderRadius: 10, background: '#2563EB', border: 'none', color: '#FFFFFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
