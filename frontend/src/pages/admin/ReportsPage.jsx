import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { admin } from '../../api'
import { RURAL_POSITIONS, URBAN_POSITIONS } from '../../data/localBodies.js'
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

const PER_PAGE = 15

function Pagination({ page, total, onChange }) {
  const pages = Math.max(1, Math.ceil(total / PER_PAGE))
  if (pages <= 1) return null

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-dim)', flexWrap: 'wrap', gap: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
        Showing page {page} of {pages} ({total} total records)
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
          onClick={() => onChange(Math.min(pages, page + 1))}
          disabled={page >= pages}
          style={{ padding: '6px 12px', fontSize: 12 }}
        >
          Next →
        </button>
      </div>
    </div>
  )
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`

function localBodyText(a) {
  const lb = a.local_body || {}
  if (a.body_type === 'urban') return [lb.local_body_type, lb.local_body, lb.ward && `Ward ${lb.ward}`].filter(Boolean).join(' / ')
  if (a.body_type === 'rural') return [lb.panchayat_union, lb.village_panchayat, lb.ward && `Ward ${lb.ward}`].filter(Boolean).join(' / ')
  return ''
}

function socialText(a) {
  const s = a.social_media || {}
  return ['facebook', 'instagram', 'twitter', 'youtube'].map((k) => (s[k] ? `${k}: ${s[k]}` : '')).filter(Boolean).join(' | ')
}

let reportsDefaultCache = null

export default function ReportsPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState(() => reportsDefaultCache?.rows || [])
  const [total, setTotal] = useState(() => reportsDefaultCache?.total || 0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(() => !reportsDefaultCache)
  const [exporting, setExporting] = useState(false)

  // Filter States
  const [bodyType, setBodyType] = useState('all')
  const [position, setPosition] = useState('')
  const [district, setDistrict] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')

  const [applied, setApplied] = useState({
    bodyType: 'all',
    position: '',
    district: '',
    from: '',
    to: '',
    search: ''
  })

  const positionOptions = bodyType === 'rural' ? RURAL_POSITIONS
    : bodyType === 'urban' ? URBAN_POSITIONS
    : [...RURAL_POSITIONS, ...URBAN_POSITIONS]

  const buildParams = (extra = {}) => ({
    ...(applied.bodyType !== 'all' ? { body_type: applied.bodyType } : {}),
    ...(applied.position ? { position: applied.position } : {}),
    ...(applied.district ? { district: applied.district } : {}),
    ...(applied.from ? { from: applied.from } : {}),
    ...(applied.to ? { to: applied.to } : {}),
    ...(applied.search ? { search: applied.search } : {}),
    ...extra,
  })

  const load = useCallback(async () => {
    const isDefault = page === 1 && applied.bodyType === 'all' && !applied.position && !applied.district && !applied.from && !applied.to && !applied.search
    if (!reportsDefaultCache || !isDefault) {
      setLoading(true)
    }
    try {
      const res = await admin.getReports(buildParams({ page, page_size: PER_PAGE }))
      const fetchedRows = res.applications || []
      const fetchedTotal = res.total || 0
      setRows(fetchedRows)
      setTotal(fetchedTotal)
      if (isDefault) {
        reportsDefaultCache = { rows: fetchedRows, total: fetchedTotal }
      }
    } catch {
      setRows([]); setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, applied])

  const [districtCounts, setDistrictCounts] = useState({})

  useEffect(() => {
    admin.getDistrictAnalytics()
      .then((res) => {
        if (res?.district_counts) setDistrictCounts(res.district_counts)
      })
      .catch(() => {})
  }, [])

  const dynamicDistricts = useMemo(() => {
    const dbDists = Object.keys(districtCounts || {})
    const set = new Set([...TN_DISTRICTS, ...dbDists])
    return Array.from(set).sort()
  }, [districtCounts])

  useEffect(() => { load() }, [load])

  const applyFilters = (e) => {
    e?.preventDefault()
    setPage(1)
    setApplied({ bodyType, position, district, from, to, search: search.trim() })
  }

  const resetFilters = () => {
    setBodyType('all')
    setPosition('')
    setDistrict('')
    setFrom('')
    setTo('')
    setSearch('')
    setPage(1)
    setApplied({ bodyType: 'all', position: '', district: '', from: '', to: '', search: '' })
  }

  const handleDownloadCSV = async () => {
    setExporting(true)
    try {
      const res = await admin.getReports(buildParams({ page: 1, page_size: 5000 }))
      const data = res.applications || []
      const headers = [
        'Application ID', 'Submitted At', 'Candidate Name', 'Relation Name', 'Age', 'Gender',
        'Mobile', 'Membership ID', 'EPIC No', 'Assembly No', 'Assembly Name', 'District',
        'Part No', 'Booth', 'Body Type', 'Local Body Details',
        '1st Preference', '2nd Preference', '3rd Preference',
        'Social Media', 'Work & Experience', 'Local Area Understanding',
      ]
      const lines = [headers.map(csvCell).join(',')]
      data.forEach((a) => {
        const v = a.voter || {}
        const prefs = a.position_preferences || []
        lines.push([
          a.application_id,
          a.submitted_at ? new Date(a.submitted_at).toLocaleString('en-IN') : '',
          v.name, v.relation_name, v.age, v.gender,
          a.mobile, a.membership_id, a.epic_no || v.epic_no,
          v.assembly_no, v.assembly_name, v.district || a.district,
          v.part_no, v.booth_name,
          a.body_type, localBodyText(a),
          prefs[0] || '', prefs[1] || '', prefs[2] || '',
          socialText(a), a.work_experience, a.local_area_understanding,
        ].map(csvCell).join(','))
      })

      const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const stamp = new Date().toISOString().slice(0, 10)
      link.href = url
      link.setAttribute('download', `BJP_LocalBody_Report_${stamp}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      alert('Could not generate the report. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const positionText = (a) => (a.position_preferences || []).join(', ')

  return (
    <div className="admin-page-container">
      {/* Page Title & Export Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Candidate Reports & Analytics</h1>
          <p className="admin-page-desc">
            Filter candidate applications by District, Local Body Type, Position, and Date Range to generate downloadable CSV / Excel reports.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="btn-admin-primary"
            onClick={handleDownloadCSV}
            disabled={exporting || total === 0}
          >
            {exporting ? (
              <><span className="spinner-border spinner-border-sm me-2" /> Generating Report…</>
            ) : (
              <><i className="bi bi-download" /> Download CSV Report ({total})</>
            )}
          </button>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="admin-card mb-4" style={{ padding: '20px 24px' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="bi bi-funnel-fill" style={{ color: 'var(--role-accent, #2563EB)' }} />
          Advanced Report Filters
        </div>

        <form onSubmit={applyFilters} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, alignItems: 'end' }}>
          {/* Local Body Type Filter */}
          <div>
            <label className="admin-form-label">Local Body Type</label>
            <select
              className="admin-form-control"
              value={bodyType}
              onChange={(e) => { setBodyType(e.target.value); setPosition('') }}
            >
              <option value="all">All Body Types</option>
              <option value="rural">Rural Local Bodies</option>
              <option value="urban">Urban Local Bodies</option>
            </select>
          </div>

          {/* Position Filter */}
          <div>
            <label className="admin-form-label">Position Preference</label>
            <select
              className="admin-form-control"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            >
              <option value="">All Positions</option>
              {positionOptions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* District Filter Dropdown */}
          <div>
            <label className="admin-form-label">District</label>
            <select
              className="admin-form-control"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            >
              <option value="">All 38 Districts</option>
              {dynamicDistricts.map((d) => (
                <option key={d} value={d}>{d} District</option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="admin-form-label">From Date</label>
            <input
              type="date"
              className="admin-form-control"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          {/* To Date */}
          <div>
            <label className="admin-form-label">To Date</label>
            <input
              type="date"
              className="admin-form-control"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          {/* Search Input */}
          <div>
            <label className="admin-form-label">Search Query</label>
            <input
              type="text"
              className="admin-form-control"
              placeholder="Candidate Name, ID, Mobile, EPIC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn-admin-primary" style={{ flex: 1, padding: '10px 14px', justifyContent: 'center' }}>
              <i className="bi bi-funnel" /> Apply
            </button>
            <button type="button" className="btn-admin-secondary" onClick={resetFilters} title="Reset filters" style={{ padding: '10px 14px' }}>
              <i className="bi bi-arrow-counterclockwise" />
            </button>
          </div>
        </form>
      </div>

      {/* Report Results Table Card */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h6 className="admin-card-title">
            <i className="bi bi-table" style={{ color: 'var(--color-saffron)' }} />
            Filtered Report Results ({total} Records)
          </h6>
        </div>

        {loading ? (
          <div className="admin-table-wrap" style={{ opacity: 0.7 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Candidate Name</th>
                  <th>Mobile</th>
                  <th>District</th>
                  <th>Body Type</th>
                  <th>Position</th>
                  <th>EPIC No</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((idx) => (
                  <tr key={idx}>
                    <td colSpan={8} style={{ padding: '16px' }}>
                      <div style={{ height: 20, background: 'var(--bg-surface-2)', borderRadius: 6, animation: 'pulse 1.5s infinite ease-in-out' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <i className="bi bi-clipboard-x" style={{ fontSize: 40, color: 'var(--text-muted)', display: 'block', marginBottom: 10 }} />
            <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: 14 }}>
              No candidate records match the selected report filters.
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
                              width: 34,
                              height: 34,
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
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                          {a.voter?.district || a.voter?.district_name || a.district || a.local_body?.district || '—'}
                        </span>
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
                        style={{ maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12.5 }}
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
                        <button
                          type="button"
                          style={{
                            background: 'var(--bg-surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border-dim)',
                            borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer'
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/admin/applications/${a.application_id || a._id}`)
                          }}
                        >
                          <i className="bi bi-eye-fill" /> View Details
                        </button>
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
