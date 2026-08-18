import React, { useState } from 'react'
import { admin } from '../../api'

export default function DeleteConfirmModal({ application, onClose, onDeleteSuccess }) {
  const [deleting, setDeleting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!application) return null

  const handleDelete = async () => {
    setDeleting(true)
    setErrorMsg('')
    try {
      const targetId = application.application_id || application._id
      const res = await admin.deleteApplication(targetId)
      if (res.data?.success || res.status === 200) {
        onDeleteSuccess()
        onClose()
      } else {
        setErrorMsg(res.data?.message || 'Could not delete application record.')
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error executing delete command.')
    } finally {
      setDeleting(false)
    }
  }

  const candName = application.voter?.name || 'Candidate'
  const appId = application.application_id || application._id

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 16
    }}>
      <div style={{
        background: '#FFFFFF', borderRadius: 18, border: '1px solid #FCA5A5',
        width: '100%', maxWidth: 440, boxShadow: '0 20px 40px -10px rgba(220,38,38,0.25)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px', background: '#FEF2F2', borderBottom: '1px solid #FEE2E2',
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: '#DC2626', color: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800
          }}>
            ⚠️
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#991B1B', fontFamily: 'Outfit, sans-serif' }}>
              Delete Candidate Record
            </h3>
            <span style={{ fontSize: 11, color: '#B91C1C', fontWeight: 600 }}>
              Action cannot be undone
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: 20 }}>
          {errorMsg && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
              {errorMsg}
            </div>
          )}

          <p style={{ margin: 0, fontSize: 13.5, color: '#334155', lineHeight: 1.5 }}>
            Are you sure you want to permanently delete candidate application record for <strong>{candName}</strong> (<span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#DC2626' }}>{appId}</span>)?
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '9px 16px', borderRadius: 10, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              style={{ padding: '9px 20px', borderRadius: 10, background: '#DC2626', border: 'none', color: '#FFFFFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
            >
              {deleting ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
