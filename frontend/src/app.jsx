import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import UploadPage from './pages/UploadPage'
import AnalysisPage from './pages/AnalysisPage'
import RoadmapPage from './pages/RoadmapPage'
import MentorPage from './pages/MentorPage'
import { CoursesPage, ProgressPage } from './pages/OtherPages'
import './index.css'

function AppInner() {
  const { user, loading } = useAuth()
  const [activePage, setActivePage] = useState('dashboard')
  const [latestAnalysis, setLatestAnalysis] = useState(null)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spin" style={{ width: 48, height: 48, border: '4px solid #1c2333', borderTopColor: '#6366f1', borderRadius: '50%' }} />
    </div>
  )

  if (!user) return <AuthPage />

  const pages = {
    dashboard: <Dashboard setActivePage={setActivePage} />,
    upload: <UploadPage setActivePage={setActivePage} setLatestAnalysis={setLatestAnalysis} />,
    analysis: <AnalysisPage latestAnalysis={latestAnalysis} setActivePage={setActivePage} />,
    roadmap: <RoadmapPage latestAnalysis={latestAnalysis} setActivePage={setActivePage} />,
    mentor: <MentorPage />,
    courses: <CoursesPage setActivePage={setActivePage} />,
    progress: <ProgressPage setActivePage={setActivePage} />,
  }

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {pages[activePage] || pages.dashboard}
    </Layout>
  )
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>
}
