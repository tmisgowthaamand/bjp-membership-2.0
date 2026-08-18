import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { admin } from '../../api'
import TamilNaduMap from '../../components/admin/TamilNaduMap'
import '../../styles/admin.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
)

function StatCard({ icon, label, value, color, bg, subtitle }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-card-icon" style={{ backgroundColor: bg || 'var(--color-saffron-bg)', color: color || 'var(--color-saffron)' }}>
          <i className={`bi bi-${icon}`} />
        </div>
        {subtitle && <span className="stat-card-badge">{subtitle}</span>}
      </div>
      <div className="stat-card-value">{value ?? '—'}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const context = useOutletContext() || {}
  const userSession = context.userSession || { role: 'super_admin', assigned_district: '' }
  const isDark = context.theme === 'dark'

  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDistrict, setSelectedDistrict] = useState('')

  const handleSelectDistrict = (distName) => {
    setSelectedDistrict(distName)
    if (distName) {
      navigate(`/admin/applications?district=${encodeURIComponent(distName)}`)
    }
  }

  useEffect(() => {
    Promise.allSettled([admin.getStats(), admin.getApplications({ page: 1, page_size: 6 })])
      .then(([s, r]) => {
        if (s.status === 'fulfilled') setStats(s.value)
        if (r.status === 'fulfilled') setRecent(r.value.applications || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const s = stats || {}
  const vs = s.voterDbStats || {}

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
        <div className="spinner-border text-warning" role="status" style={{ width: '3rem', height: '3rem' }} />
      </div>
    )
  }

  const role = userSession.role || 'super_admin'
  const isSuperAdmin = role === 'super_admin'
  const isStateAdmin = role === 'state_admin'
  const isDistrictAdmin = role === 'district_admin'

  // Doughnut Chart Data (Rural vs Urban)
  const ruralCount = s.rural || 0
  const urbanCount = s.urban || 0
  const totalCount = s.total || (ruralCount + urbanCount)

  const doughnutData = {
    labels: ['Rural Candidates', 'Urban Candidates'],
    datasets: [
      {
        data: [ruralCount, urbanCount],
        backgroundColor: ['#10B981', '#F76201'],
        hoverBackgroundColor: ['#059669', '#E05500'],
        borderWidth: 2,
        borderColor: isDark ? '#18181B' : '#FFFFFF',
      },
    ],
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' },
          color: isDark ? '#F8FAFC' : '#0F172A',
          padding: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.raw || 0
            const pct = totalCount ? Math.round((val / totalCount) * 100) : 0
            return ` ${context.label}: ${val} (${pct}%)`
          },
        },
      },
    },
  }

  // Bar Chart Data (Top Assemblies)
  const topAssemblies = s.topAssemblies || []
  const barLabels = topAssemblies.length
    ? topAssemblies.map((d) => d.assembly_name || `AC ${d.assembly_no}`)
    : ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem', 'Tirunelveli']
  const barValues = topAssemblies.length
    ? topAssemblies.map((d) => d.count)
    : [0, 0, 0, 0, 0, 0]

  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: 'Applications',
        data: barValues,
        backgroundColor: 'rgba(247, 98, 1, 0.85)',
        hoverBackgroundColor: '#F76201',
        borderRadius: 8,
        barThickness: 24,
      },
    ],
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#27272A' : '#0F172A',
        titleFont: { size: 13, weight: '700' },
        bodyFont: { size: 12 },
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' }, color: isDark ? '#94A3B8' : '#475569' },
      },
      y: {
        grid: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
        ticks: { precision: 0, font: { family: 'Plus Jakarta Sans', size: 11 }, color: isDark ? '#94A3B8' : '#475569' },
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="admin-dashboard-view">
      {/* Dynamic Role Title Header with Design MD Tokens */}
      <div
        className={`admin-card hero-role-card hero-role-${role}`}
        style={{
          padding: '28px 32px',
          marginBottom: 24,
          background: isSuperAdmin
            ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)'
            : isStateAdmin
            ? 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)'
            : 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
          color: isSuperAdmin ? '#1E40AF' : isStateAdmin ? '#3730A3' : '#0369A1',
          borderRadius: 24,
          boxShadow: 'var(--shadow-card)',
          border: `1px solid ${isSuperAdmin ? '#BFDBFE' : isStateAdmin ? '#C7D2FE' : '#BAE6FD'}`
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className={`bjp-badge-pill role-badge-${role}`}>
                {isSuperAdmin ? '⚡ SUPER ADMIN — MASTER CONTROL' : isStateAdmin ? '🏛️ STATE ADMIN — OPERATIONS' : '📍 DISTRICT ADMIN — READ-ONLY INSPECTION'}
              </span>
              {isDistrictAdmin && (
                <span style={{ fontSize: 11, fontWeight: 800, color: '#0284C7', background: '#F0F9FF', padding: '4px 10px', borderRadius: 8, border: '1px solid #BAE6FD' }}>
                  🔒 Read Only View Scope
                </span>
              )}
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 900, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              {isSuperAdmin ? 'SUPER ADMIN MASTER CONTROL DASHBOARD' : isStateAdmin ? 'STATE OPERATIONS & ELECTION ANALYTICS' : 'DISTRICT INSPECTION & REGISTRY PORTAL'}
            </h1>

            <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-muted)', margin: '6px 0 0 0' }}>
              Real-time multi-tier election analytics for BJP Local Body Candidates 2026
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => navigate('/admin/applications')}
              className="btn-admin-primary"
              style={{
                padding: '12px 20px', borderRadius: 14, fontSize: 13.5, fontWeight: 800,
                background: 'var(--role-accent)',
                color: '#FFFFFF', border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.25)'
              }}
            >
              Candidate Registry →
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="stat-cards-grid">
        <StatCard
          icon="card-checklist"
          label="Total Applications"
          value={s.total}
          color="var(--color-saffron)"
          bg="var(--color-saffron-bg)"
          subtitle="Real DB3 Submissions"
        />
        <StatCard
          icon="calendar-check-fill"
          label="Today's Applicants"
          value={s.today}
          color="var(--color-purple)"
          bg="var(--color-purple-bg)"
          subtitle="24h IST Activity"
        />
        <StatCard
          icon="tree-fill"
          label="Rural Panchayat"
          value={s.rural}
          color="var(--color-green)"
          bg="var(--color-green-bg)"
          subtitle="Union / Village"
        />
        <StatCard
          icon="building-fill"
          label="Urban Body"
          value={s.urban}
          color="var(--color-blue)"
          bg="var(--color-blue-bg)"
          subtitle="Corporation / Municipality"
        />
      </div>

      {/* Tamil Nadu Interactive District Map */}
      <div style={{ marginTop: 24 }}>
        <TamilNaduMap selectedDistrict={selectedDistrict} onSelectDistrict={handleSelectDistrict} />
      </div>

      {/* Candidate Demographics Section */}
      <div style={{ marginTop: 28, marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-purple)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="bi bi-people-fill" /> Candidate Demographics (Live Applications DB3)
        </div>
        <div className="stat-cards-grid">
          <StatCard
            icon="gender-male"
            label="Male Candidates"
            value={vs.maleCandidates ?? 0}
            color="var(--color-blue)"
            bg="var(--color-blue-bg)"
            subtitle={s.total ? `${Math.round(((vs.maleCandidates || 0) / s.total) * 100)}% of Submissions` : '0%'}
          />
          <StatCard
            icon="gender-female"
            label="Female Candidates"
            value={vs.femaleCandidates ?? 0}
            color="#EC4899"
            bg="rgba(236, 72, 153, 0.14)"
            subtitle={s.total ? `${Math.round(((vs.femaleCandidates || 0) / s.total) * 100)}% of Submissions` : '0%'}
          />
          <StatCard
            icon="person-arms-up"
            label="Third Gender / Other"
            value={vs.thirdGenderCandidates ?? 0}
            color="var(--color-purple)"
            bg="var(--color-purple-bg)"
            subtitle="Registered Applicants"
          />
          <StatCard
            icon="building-check"
            label="Assembly Constituencies"
            value={`${vs.assemblyCount || 0} ACs`}
            color="var(--color-blue)"
            bg="var(--color-blue-bg)"
            subtitle="DB1 Live Collections"
          />
        </div>
      </div>

      {/* Master Ward Data DB (DB2) Analytics Cards */}
      <div style={{ marginTop: 24, marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-green)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="bi bi-diagram-3-fill" /> Tamil Nadu Local Body & Ward Master Database (DB2)
        </div>
        <div className="stat-cards-grid">
          <StatCard
            icon="building-fill"
            label="Municipal Corporations"
            value={`${vs.corporationsCount || 0} Corps`}
            color="#F59E0B"
            bg="rgba(245, 158, 11, 0.14)"
            subtitle="Live Collection (DB2)"
          />
          <StatCard
            icon="buildings-fill"
            label="Municipalities"
            value={`${vs.municipalitiesCount || 0} Munis`}
            color="var(--color-blue)"
            bg="var(--color-blue-bg)"
            subtitle="Live Collection (DB2)"
          />
          <StatCard
            icon="houses-fill"
            label="Town Panchayats"
            value={`${vs.townPanchayatsCount || 0} TPs`}
            color="var(--color-purple)"
            bg="var(--color-purple-bg)"
            subtitle="Live Collection (DB2)"
          />
          <StatCard
            icon="award-fill"
            label="District Panchayat Wards"
            value={`${vs.districtPanchayatsCount || 0} Districts`}
            color="var(--color-green)"
            bg="var(--color-green-bg)"
            subtitle="36 Rural Districts"
          />
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginTop: 24 }}>
        {/* Doughnut Chart */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h6 className="admin-card-title">
              <i className="bi bi-pie-chart-fill" style={{ color: 'var(--color-saffron)' }} /> Rural vs Urban Distribution
            </h6>
          </div>
          <div style={{ position: 'relative', height: 260, padding: 12 }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h6 className="admin-card-title">
              <i className="bi bi-bar-chart-line-fill" style={{ color: 'var(--color-saffron)' }} /> Top Assemblies by Submissions
            </h6>
          </div>
          <div style={{ height: 260, padding: 12 }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Recent Applications Table */}
      <div className="admin-card" style={{ marginTop: 24 }}>
        <div className="admin-card-header">
          <h6 className="admin-card-title">
            <i className="bi bi-clock-history" style={{ color: 'var(--color-saffron)' }} /> Recent Applications
          </h6>
          <button
            type="button"
            onClick={() => navigate('/admin/applications')}
            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-dim)', color: 'var(--text-primary)', padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
          >
            View Full Registry →
          </button>
        </div>

        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 36, color: 'var(--text-muted)', fontSize: 13 }}>
            <i className="bi bi-inbox" style={{ fontSize: 40, display: 'block', marginBottom: 8, opacity: 0.4 }} />
            No application submissions recorded yet.
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Candidate Name</th>
                  <th>Mobile Number</th>
                  <th>Body Type</th>
                  <th>District / Ward</th>
                  <th>Submitted Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((a) => (
                  <tr
                    key={a.application_id}
                    className="table-row-hover"
                    onClick={() => navigate(`/admin/applications/${a.application_id}`)}
                  >
                    <td>
                      <span className="app-id-pill">{a.application_id}</span>
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{a.voter?.name || '—'}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{a.mobile}</td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8,
                        background: a.body_type === 'urban' ? 'var(--color-saffron-bg)' : 'var(--color-green-bg)',
                        color: a.body_type === 'urban' ? 'var(--color-saffron)' : 'var(--color-green)'
                      }}>
                        {a.body_type === 'urban' ? '🏙️ Urban' : '🌾 Rural'}
                      </span>
                    </td>
                    <td>{a.voter?.district || a.local_body?.ward || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {a.submitted_at
                        ? new Date(a.submitted_at).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/admin/applications/${a.application_id}`)
                        }}
                        style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-dim)', color: 'var(--text-primary)', padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                      >
                        <i className="bi bi-eye-fill" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
