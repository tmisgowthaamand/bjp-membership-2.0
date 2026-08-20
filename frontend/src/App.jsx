import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LanguageProvider } from './i18n/LanguageContext'

// Lazy-load ALL route components with Suspense
const ChatbotPage = lazy(() => import('./pages/ChatbotPage'))
const CandidateVerificationPage = lazy(() => import('./pages/CandidateVerificationPage'))
const ReferralPage = lazy(() => import('./pages/ReferralPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const LoginPage = lazy(() => import('./pages/admin/LoginPage'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const ApplicationsPage = lazy(() => import('./pages/admin/ApplicationsPage'))
const ApplicationDetailPage = lazy(() => import('./pages/admin/ApplicationDetailPage'))
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'))
const AssignAdminPage = lazy(() => import('./pages/admin/AssignAdminPage'))

const PageFallback = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF8F1' }}>
    <div style={{ width: 36, height: 36, border: '3px solid #FED7AA', borderTopColor: '#F76201', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>
)

export default function App() {
  return (
    <LanguageProvider>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<ChatbotPage />} />
          <Route path="/verify" element={<CandidateVerificationPage />} />
          <Route path="/verify/:id" element={<CandidateVerificationPage />} />
          <Route path="/r/:ntCode" element={<ReferralPage />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="applications/:id" element={<ApplicationDetailPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="assign" element={<AssignAdminPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </LanguageProvider>
  )
}
