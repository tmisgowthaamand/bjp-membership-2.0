import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { admin } from '../../api'
import '../../styles/admin.css'

const NAV_ITEMS = [
  { path: '/admin/dashboard',    icon: 'grid-1x2-fill',              label: 'Dashboard' },
  { path: '/admin/applications', icon: 'card-checklist',             label: 'Applications' },
  { path: '/admin/reports',      icon: 'file-earmark-bar-graph-fill', label: 'Reports' },
]

function LiveClock() {
  const [timeStr, setTimeStr] = useState('')

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setTimeStr(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  return <span>{timeStr}</span>
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const [checking, setChecking]       = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 1024)
  const [userSession, setUserSession] = useState({ user: 'Admin', role: 'super_admin', assigned_district: '' })

  useEffect(() => {
    admin.getSession()
      .then((res) => {
        const data = res.data || res
        if (data && data.success === true) {
          setUserSession({
            user: data.user || 'Admin',
            role: data.role || 'super_admin',
            assigned_district: data.assigned_district || '',
          })
          setChecking(false)
        } else {
          navigate('/admin/login', { replace: true })
        }
      })
      .catch(() => navigate('/admin/login', { replace: true }))
  }, [navigate])

  // Lock body scroll when mobile sidebar drawer is open
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      if (sidebarOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  const handleLogout = () => {
    admin.logout()
    navigate('/admin/login', { replace: true })
  }

  if (checking) {
    return (
      <div className="page-loader" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div className="spinner-border text-danger" role="status" style={{ width: '3rem', height: '3rem' }} />
      </div>
    )
  }

  const roleLabel =
    userSession.role === 'district_admin'
      ? 'District Admin (Read Only)'
      : userSession.role === 'state_admin'
      ? 'State Admin — Operations'
      : 'Super Admin — Master Control'

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 1024
  const showBackdrop = isMobile && sidebarOpen

  return (
    <div className={`admin-layout role-layout-${userSession.role}`} data-admin-role={userSession.role}>
      {/* Mobile Sidebar Backdrop (Active on screens <= 1024px) */}
      <div
        className={`admin-sidebar-backdrop ${showBackdrop ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="admin-sidebar-header">
          <img src="/bjp_logo.svg" alt="BJP" className="admin-logo"
            onError={(e) => { e.target.src = '/bjp_logo.png' }} />
          {sidebarOpen && (
            <div>
              <div className="admin-brand">BJP Tamil Nadu</div>
              <div className="admin-tagline" style={{ color: 'var(--role-accent)' }}>Election Admin Portal</div>
            </div>
          )}
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => isMobile && setSidebarOpen(false)}
              className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}
              title={!sidebarOpen ? item.label : undefined}
              style={({ isActive }) => isActive ? { background: 'var(--role-accent)', color: '#FFF' } : undefined}
            >
              <i className={`bi bi-${item.icon}`} />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}

          {/* Super-Admin Only Navigation Link */}
          {userSession.role === 'super_admin' && (
            <NavLink
              to="/admin/assign"
              onClick={() => isMobile && setSidebarOpen(false)}
              className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}
              title={!sidebarOpen ? 'Assign Admin' : undefined}
              style={({ isActive }) => isActive ? { background: 'var(--role-accent)', color: '#FFF' } : undefined}
            >
              <i className="bi bi-person-plus-fill" />
              {sidebarOpen && <span>Assign Admin</span>}
            </NavLink>
          )}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-logout-btn" onClick={handleLogout} title="Logout">
            <i className="bi bi-box-arrow-right" />
            <span>Logout Panel</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button className="admin-toggle-btn" onClick={() => setSidebarOpen((o) => !o)} aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
              <i className={`bi bi-${sidebarOpen ? 'layout-sidebar-reverse' : 'layout-sidebar'}`} />
            </button>

            <div className="admin-topbar-brand" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="/bjp_logo.svg"
                alt="BJP Logo"
                style={{ width: 30, height: 30, objectFit: 'contain' }}
                onError={(e) => { e.target.src = '/bjp_logo.png' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`bjp-badge-pill role-badge-${userSession.role}`}>{roleLabel}</span>
                <span style={{ fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>BJP TN 2026</span>
              </div>
            </div>
          </div>

          <div className="admin-topbar-right">
            <div className="admin-topbar-clock">
              <i className="bi bi-clock-history" style={{ color: 'var(--role-accent)' }} />
              <LiveClock />
            </div>

            <div className="admin-user-badge">
              <div className="admin-avatar" style={{ background: 'var(--role-accent)' }}>
                <i className="bi bi-person-fill" />
              </div>
              <div className="admin-user-info">
                <span className="admin-name">{userSession.user}</span>
                <span className="admin-role">{roleLabel}</span>
              </div>
            </div>

            <button className="admin-topbar-logout-btn" onClick={handleLogout} title="Logout of Admin Panel">
              <i className="bi bi-box-arrow-right" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="admin-content">
          <Outlet context={{ userSession }} />
        </main>
      </div>
    </div>
  )
}
