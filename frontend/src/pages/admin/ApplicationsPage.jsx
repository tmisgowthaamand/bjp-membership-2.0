import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom'
import { admin } from '../../api'
import '../../styles/admin.css'

const TN_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri',
  'Dindigul', 'Erode', 'Kallakurichi', 'Kancheepuram', 'Kanniyakumari', 'Karur',
  'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris',
  'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga',
  'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Thiruvallur', 'Tiruchirappalli',
  'Tirunelveli', 'Tirupathur', 'Tiruppur', 'Tiruvannamalai', 'Tiruvarur',
  'Vellore', 'Viluppuram', 'Virudhunagar'
]

// Modal Component: Executive District Selection Suite
function DistrictSelectionSuiteModal({ isOpen, onClose, activeDistrict, districtCounts, onSelectDistrict }) {
  const [search, setSearch] = useState('')

  if (!isOpen) return null

  const filteredDistricts = TN_DISTRICTS.filter((d) =>
    d.toLowerCase().includes(search.trim().toLowerCase())
  )

  const getCount = (distName) => {
    if (!districtCounts) return 0
    const keys = Object.keys(districtCounts)
    const matchKey = keys.find(k => k.toLowerCase() === distName.toLowerCase())
    return matchKey ? districtCounts[matchKey] : 0
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', zIndex: 1150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="admin-card" style={{ width: '100%', maxWidth: 760, maxHeight: '85vh', display: 'flex', flexDirection: 'column', margin: 0, padding: 28, borderRadius: 24, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)' }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-dim)' }}>
          <div>
            <h4 style={{ margin: 0, fontWeight: 900, fontFamily: 'Outfit, sans-serif', fontSize: 20, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="bi bi-geo-alt-fill" style={{ color: 'var(--role-accent, #2563EB)' }} />
              Select Tamil Nadu District Filter
            </h4>
            <p style={{ margin: '4px 0 0 0', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)' }}>
              Choose a district to instantly filter candidate applications across Tamil Nadu
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-dim)', width: 34, height: 34, borderRadius: 10, fontSize: 16, fontWeight: 800, cursor: 'pointer', color: 'var(--text-primary)' }}>✕</button>
        </div>

        {/* Modal Search Input */}
        <div style={{ marginBottom: 16, position: 'relative' }}>
          <i className="bi bi-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Type district name (e.g. Chennai, Sivaganga, Thiruvallur)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-form-control"
            style={{ paddingLeft: 38, borderRadius: 12 }}
            autoFocus
          />
        </div>

        {/* All Districts Reset Quick Button */}
        <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <button
            type="button"
            onClick={() => { onSelectDistrict(''); onClose() }}
            style={{
              padding: '8px 14px', borderRadius: 12, fontSize: 12, fontWeight: 800, cursor: 'pointer',
              background: !activeDistrict ? 'var(--color-saffron)' : 'var(--bg-surface-2)',
              color: !activeDistrict ? '#FFFFFF' : 'var(--text-primary)',
              border: !activeDistrict ? 'none' : '1px solid var(--border-dim)',
              boxShadow: !activeDistrict ? '0 4px 12px rgba(247,98,1,0.25)' : 'none',
              width: '100%'
            }}
          >
            🌐 All 38 Districts (State-Wide View)
          </button>
        </div>

        {/* 38 Districts Cards Grid — Always 2-Column on Mobile */}
        <div className="district-suite-grid" style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
          {filteredDistricts.map((dist) => {
            const isSel = activeDistrict.toLowerCase() === dist.toLowerCase()
            const cnt = getCount(dist)
            return (
              <button
                key={dist}
                type="button"
                onClick={() => { onSelectDistrict(dist); onClose() }}
                style={{
                  padding: '10px 12px', borderRadius: 14, textAlign: 'left', cursor: 'pointer',
                  background: isSel ? 'var(--color-saffron-bg)' : 'var(--bg-surface)',
                  border: isSel ? '2px solid var(--color-saffron)' : '1px solid var(--border-dim)',
                  boxShadow: isSel ? '0 4px 14px rgba(247,98,1,0.15)' : 'var(--shadow-sm)',
                  transition: 'all 0.15s ease',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 12, color: isSel ? 'var(--color-saffron)' : 'var(--text-primary)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {dist}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6,
                    background: cnt > 0 ? 'var(--color-saffron)' : 'var(--bg-surface-2)',
                    color: cnt > 0 ? '#FFFFFF' : 'var(--text-muted)'
                  }}>
                    {cnt} {cnt === 1 ? 'App' : 'Apps'}
                  </span>
                  {isSel && <span style={{ fontSize: 11, color: 'var(--color-saffron)' }}>✓</span>}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Modal: Edit Application
function EditApplicationModal({ application, onClose, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    membership_id: application.membership_id || '',
    epic_no: application.epic_no || application.voter?.epic_no || '',
    district: application.voter?.district || application.local_body?.district || '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErr('')
    try {
      const res = await admin.updateApplication(application.application_id || application._id, formData)
      if (res && res.success) {
        onSaveSuccess()
        onClose()
      } else {
        setErr(res?.message || 'Failed to update candidate record.')
      }
    } catch (ex) {
      setErr(ex?.message || 'Error occurred while updating record.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="admin-card" style={{ width: '100%', maxWidth: 500, margin: 0, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h5 style={{ margin: 0, fontWeight: 800, fontFamily: 'Outfit, sans-serif', fontSize: 18, color: 'var(--text-primary)' }}>
            <i className="bi bi-pencil-square me-2" style={{ color: 'var(--color-saffron)' }} />
            Edit Candidate Application
          </h5>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4, color: 'var(--text-primary)' }}>Application ID</label>
            <input type="text" value={application.application_id || application._id} disabled style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: 'var(--bg-surface-2)', border: '1px solid var(--border-dim)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4, color: 'var(--text-primary)' }}>Candidate Name</label>
            <input type="text" value={application.voter?.name || '—'} disabled style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: 'var(--bg-surface-2)', border: '1px solid var(--border-dim)', fontSize: 13 }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4, color: 'var(--text-primary)' }}>Membership ID</label>
            <input
              type="text"
              value={formData.membership_id}
              onChange={(e) => setFormData({ ...formData, membership_id: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 13 }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4, color: 'var(--text-primary)' }}>EPIC Number</label>
            <input
              type="text"
              value={formData.epic_no}
              onChange={(e) => setFormData({ ...formData, epic_no: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 13 }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4, color: 'var(--text-primary)' }}>District Name</label>
            <input
              type="text"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 13 }}
            />
          </div>

          {err && (
            <div style={{ background: 'var(--color-red-bg)', border: '1px solid var(--color-red)', padding: '8px 12px', borderRadius: 8, color: 'var(--color-red)', fontSize: 12, marginBottom: 16 }}>
              {err}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-admin-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-admin-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal: Delete Confirmation
function DeleteConfirmModal({ application, onClose, onDeleteSuccess }) {
  const [deleting, setDeleting] = useState(false)
  const [err, setErr] = useState('')

  const handleDelete = async () => {
    setDeleting(true)
    setErr('')
    try {
      const res = await admin.deleteApplication(application.application_id || application._id)
      if (res && res.success) {
        onDeleteSuccess()
        onClose()
      } else {
        setErr(res?.message || 'Failed to delete candidate record.')
      }
    } catch (ex) {
      setErr(ex?.message || 'Error occurred while deleting record.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="admin-card" style={{ width: '100%', maxWidth: 450, margin: 0, padding: 28 }}>
        <h5 style={{ margin: '0 0 12px 0', fontWeight: 800, fontFamily: 'Outfit, sans-serif', fontSize: 18, color: 'var(--color-red)' }}>
          <i className="bi bi-exclamation-triangle-fill me-2" />
          Confirm Record Deletion
        </h5>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          Are you sure you want to permanently delete candidate application <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>{application.application_id || application._id}</strong> ({application.voter?.name})?
        </p>

        {err && (
          <div style={{ background: 'var(--color-red-bg)', border: '1px solid var(--color-red)', padding: '8px 12px', borderRadius: 8, color: 'var(--color-red)', fontSize: 12, marginBottom: 16 }}>
            {err}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn-admin-secondary" onClick={onClose} disabled={deleting}>Cancel</button>
          <button type="button" onClick={handleDelete} disabled={deleting} style={{ background: 'var(--color-red)', color: '#FFFFFF', border: 'none', padding: '10px 18px', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>
            {deleting ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Pagination({ page, total, onChange }) {
  const pageSize = 10
  const totalPages = Math.ceil(total / pageSize) || 1
  if (totalPages <= 1) return null

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-dim)', flexWrap: 'wrap', gap: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
        Showing page {page} of {totalPages} ({total} total candidates)
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          className="btn-admin-secondary"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          style={{ padding: '6px 12px', fontSize: 12 }}
        >
          ← Prev
        </button>
        <button
          className="btn-admin-secondary"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          style={{ padding: '6px 12px', fontSize: 12 }}
        >
          Next →
        </button>
      </div>
    </div>
  )
}

export default function ApplicationsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const context = useOutletContext() || {}
  const userSession = context.userSession || { role: 'super_admin' }
  const canManage = userSession.role === 'super_admin' || userSession.role === 'state_admin'

  const queryParams = new URLSearchParams(location.search)
  const initialDistrict = queryParams.get('district') || ''

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [bodyTypeFilter, setBodyTypeFilter] = useState('all')
  const [districtFilter, setDistrictFilter] = useState(initialDistrict)
  const [districtCounts, setDistrictCounts] = useState({})
  const [suiteOpen, setSuiteOpen] = useState(false)
  const [editApp, setEditApp] = useState(null)
  const [deleteApp, setDeleteApp] = useState(null)

  // Sync URL district query param with local districtFilter state
  useEffect(() => {
    const qDistrict = new URLSearchParams(location.search).get('district') || ''
    setDistrictFilter(qDistrict)
    setPage(1)
  }, [location.search])

  // Fetch live district counts for the District Suite Modal
  useEffect(() => {
    admin.getDistrictAnalytics()
      .then((res) => {
        if (res && res.success && res.district_counts) {
          setDistrictCounts(res.district_counts)
        }
      })
      .catch(() => {})
  }, [])

  const activeDistrict = districtFilter || initialDistrict

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await admin.getApplications({
        page,
        page_size: 10,
        query,
        body_type: bodyTypeFilter === 'all' ? '' : bodyTypeFilter,
        district: activeDistrict,
      })
      if (data && data.success) {
        setRows(data.applications || [])
        setTotal(data.total || 0)
      }
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [page, query, bodyTypeFilter, activeDistrict])

  useEffect(() => {
    load()
  }, [load])

  const submitSearch = (e) => {
    e?.preventDefault()
    setPage(1)
    setQuery(search.trim())
  }

  const handleDistrictSelect = (dist) => {
    setDistrictFilter(dist)
    setPage(1)
    if (dist) {
      navigate(`/admin/applications?district=${encodeURIComponent(dist)}`)
    } else {
      navigate('/admin/applications')
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    if (!rows.length) return
    const headers = ['Application ID', 'Candidate Name', 'Mobile', 'Membership ID', 'EPIC No', 'District', 'Body Type', 'Position Preferences', 'Submitted At']
    const csvRows = [headers.join(',')]

    rows.forEach((a) => {
      const prefs = (a.position_preferences || []).join(' | ')
      const row = [
        `"${a.application_id || ''}"`,
        `"${a.voter?.name || ''}"`,
        `"${a.mobile || ''}"`,
        `"${a.membership_id || ''}"`,
        `"${a.epic_no || a.voter?.epic_no || ''}"`,
        `"${a.voter?.district || a.district || ''}"`,
        `"${a.body_type || ''}"`,
        `"${prefs}"`,
        `"${a.submitted_at ? new Date(a.submitted_at).toLocaleString('en-IN') : ''}"`,
      ]
      csvRows.push(row.join(','))
    })

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `BJP_LocalBody_Candidates_${Date.now()}.csv`)
    document.body.appendChild(link)
    document.body.removeChild(link)
  }

  const positionText = (app) => {
    const prefs = app.position_preferences || []
    if (prefs.length) return prefs.join(', ')
    return app.position || '—'
  }

  return (
    <div className="admin-page-container">
      {/* District Selection Suite Modal */}
      <DistrictSelectionSuiteModal
        isOpen={suiteOpen}
        onClose={() => setSuiteOpen(false)}
        activeDistrict={activeDistrict}
        districtCounts={districtCounts}
        onSelectDistrict={handleDistrictSelect}
      />

      {/* Edit Modal */}
      {editApp && (
        <EditApplicationModal
          application={editApp}
          onClose={() => setEditApp(null)}
          onSaveSuccess={load}
        />
      )}

      {/* Delete Modal */}
      {deleteApp && (
        <DeleteConfirmModal
          application={deleteApp}
          onClose={() => setDeleteApp(null)}
          onDeleteSuccess={load}
        />
      )}

      {/* Page Title & Export Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Candidate Applications Directory</h1>
          <p className="admin-page-desc">
            {activeDistrict
              ? `Displaying candidate applications for ${activeDistrict} District.`
              : 'State-wide candidate registry management dashboard across all 38 districts.'}
          </p>
        </div>
        <div>
          <button type="button" className="btn-admin-secondary" onClick={handleExportCSV}>
            <i className="bi bi-download" /> Export CSV Report
          </button>
        </div>
      </div>

      {/* Executive District Selector Suite Bar */}
      <div className="admin-card mb-3" style={{ padding: '18px 22px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22, color: 'var(--color-saffron)' }}>📍</span>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                {activeDistrict ? `District Filter: ${activeDistrict.toUpperCase()}` : 'District Filter: State-Wide (All 38 Districts)'}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                {activeDistrict
                  ? `${total} Candidate Applications found in ${activeDistrict}`
                  : `Showing candidate applications across all 38 Tamil Nadu districts (${total} Total)`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {activeDistrict && (
              <button
                type="button"
                onClick={() => handleDistrictSelect('')}
                style={{ background: 'var(--color-red-bg)', color: 'var(--color-red)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 12, padding: '8px 14px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}
              >
                Clear Filter ✕
              </button>
            )}

            <button
              type="button"
              onClick={() => setSuiteOpen(true)}
              className="btn-admin-primary"
              style={{ padding: '10px 18px', fontSize: 13 }}
            >
              <i className="bi bi-grid-3x3-gap-fill" />
              Open District Selector Suite (38 Districts) ▾
            </button>
          </div>
        </div>
      </div>

      {/* 100% Full-Width Responsive Search & Filter Bar */}
      <div className="admin-card mb-4" style={{ padding: '20px 22px' }}>
        <form onSubmit={submitSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'center' }}>
          {/* Search Input Box */}
          <div style={{ position: 'relative' }}>
            <i className="bi bi-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search Candidate Name, App ID, Mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-form-control"
              style={{ paddingLeft: 38, width: '100%' }}
            />
          </div>

          {/* Quick Select District Dropdown */}
          <div>
            <select
              value={activeDistrict}
              onChange={(e) => handleDistrictSelect(e.target.value)}
              className="admin-form-control"
              style={{ width: '100%', fontWeight: 700 }}
            >
              <option value="">All 38 Districts</option>
              {TN_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d} District</option>
              ))}
            </select>
          </div>

          {/* Body Type Dropdown Selector */}
          <div>
            <select
              value={bodyTypeFilter}
              onChange={(e) => { setBodyTypeFilter(e.target.value); setPage(1) }}
              className="admin-form-control"
              style={{ width: '100%', fontWeight: 700 }}
            >
              <option value="all">All Body Types</option>
              <option value="urban">Urban Local Bodies</option>
              <option value="rural">Rural Local Bodies</option>
            </select>
          </div>

          {/* Search Button */}
          <div>
            <button type="submit" className="btn-admin-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px 18px' }}>
              <i className="bi bi-search" /> Search
            </button>
          </div>
        </form>
      </div>

      {/* Main Candidate Applications Table */}
      <div className="admin-card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner-border text-danger" role="status" style={{ width: '2.5rem', height: '2.5rem' }} />
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <i className="bi bi-inbox" style={{ fontSize: 40, color: 'var(--text-muted)', display: 'block', marginBottom: 10 }} />
            <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: 14 }}>
              No candidate application records found for {activeDistrict ? `${activeDistrict} District` : 'the selected criteria'}.
            </p>
          </div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Application ID</th>
                    <th>Candidate Name</th>
                    <th>Mobile</th>
                    <th>Membership ID</th>
                    <th>District</th>
                    <th>Body Type</th>
                    <th>Position Preferences</th>
                    <th>Submitted Date</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr
                      key={a.application_id || a._id}
                      className="table-row-hover"
                      onClick={() => navigate(`/admin/applications/${a.application_id || a._id}`)}
                    >
                      <td>
                        <span className="app-id-pill">
                          {a.application_id || a._id}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img
                            src={a.photo_url || a.photoUrl || '/bjp_logo.png'}
                            alt="Candidate Avatar"
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              objectPosition: 'center top',
                              border: '1.5px solid var(--color-saffron)',
                              flexShrink: 0,
                              background: '#F8FAFC'
                            }}
                            onError={(e) => { e.target.onerror = null; e.target.src = '/bjp_logo.png' }}
                          />
                          <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{a.voter?.name || '—'}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{a.mobile}</td>
                      <td>
                        <span style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-dim)', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                          {a.membership_id || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{a.voter?.district || a.local_body?.district || a.district || '—'}</span>
                      </td>
                      <td>
                        <span style={{
                          fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8,
                          background: a.body_type === 'urban' ? 'var(--color-saffron-bg)' : 'var(--color-green-bg)',
                          color: a.body_type === 'urban' ? 'var(--color-saffron)' : 'var(--color-green)'
                        }}>
                          {a.body_type === 'urban' ? '🏙️ Urban' : '🌾 Rural'}
                        </span>
                      </td>
                      <td
                        style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12.5 }}
                        title={positionText(a)}
                      >
                        {positionText(a) || '—'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {a.submitted_at
                          ? new Date(a.submitted_at).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                          {canManage && (
                            <>
                              <button
                                type="button"
                                title="Edit Candidate Record"
                                style={{
                                  background: 'var(--color-blue-bg)', color: 'var(--color-blue)', border: '1px solid rgba(37,99,235,0.3)',
                                  borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 800, cursor: 'pointer'
                                }}
                                onClick={() => setEditApp(a)}
                              >
                                <i className="bi bi-pencil-square" /> Edit
                              </button>

                              <button
                                type="button"
                                title="Delete Candidate Record"
                                style={{
                                  background: 'var(--color-red-bg)', color: 'var(--color-red)', border: '1px solid rgba(220,38,38,0.3)',
                                  borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 800, cursor: 'pointer'
                                }}
                                onClick={() => setDeleteApp(a)}
                              >
                                <i className="bi bi-trash3-fill" />
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            style={{
                              background: 'var(--bg-surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border-dim)',
                              borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 800, cursor: 'pointer'
                            }}
                            onClick={() => navigate(`/admin/applications/${a.application_id || a._id}`)}
                          >
                            <i className="bi bi-eye-fill" /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={total} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
