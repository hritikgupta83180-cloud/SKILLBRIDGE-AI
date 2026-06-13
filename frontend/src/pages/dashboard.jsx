import { useEffect, useState } from 'react'
import axios from 'axios'
import { API } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'
import { TrendingUp, FileText, Target, Brain, CheckCircle, BarChart3, Zap, ArrowRight } from 'lucide-react'

function ScoreRing({ score, color, size = 80 }) {
  const r = (size - 10) / 2, circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1c2333" strokeWidth={8} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
    </svg>
  )
}

export default function Dashboard({ setActivePage }) {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/dashboard`).then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spin" style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
    </div>
  )

  const cards = [
    { label: 'Job Readiness', value: data?.readiness_score || 0, color: '#6366f1', icon: TrendingUp, suffix: '%' },
    { label: 'ATS Score', value: data?.ats_score || 0, color: '#10b981', icon: FileText, suffix: '%' },
    { label: 'Skill Match', value: data?.skill_match || 0, color: '#06b6d4', icon: Target, suffix: '%' },
    { label: 'Skills Missing', value: data?.missing_skills_count || 0, color: '#f59e0b', icon: Brain, suffix: '' },
  ]

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Good day, {user?.name?.split(' ')[0]}! 👋</h1>
        <p style={{ color: 'var(--muted)' }}>
          {data?.target_role ? `Tracking your journey to ${data.target_role}` : 'Upload your resume to get started'}
        </p>
      </div>

      {/* Score Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {cards.map((c, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ScoreRing score={c.suffix === '%' ? c.value : Math.min(c.value * 10, 100)} color={c.color} size={64} />
              <span style={{ position: 'absolute', fontSize: 13, fontWeight: 800, color: c.color, fontFamily: 'Space Grotesk' }}>{c.value}{c.suffix}</span>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color, fontFamily: 'Space Grotesk' }}>{c.value}{c.suffix}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Analyses', value: data?.total_analyses || 0, icon: BarChart3, color: '#6366f1' },
          { label: 'Resumes Uploaded', value: data?.total_resumes || 0, icon: FileText, color: '#10b981' },
          { label: 'Skills Completed', value: data?.completed_skills || 0, icon: CheckCircle, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: s.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Space Grotesk' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      {!data?.latest_analysis_id ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 32px', background: 'linear-gradient(135deg,#0f1729,#111827)', border: '1px solid #6366f133' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Zap size={28} color="white" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Start Your Analysis</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>Upload your resume and select your dream role to get AI-powered skill gap analysis</p>
          <button className="btn btn-primary" onClick={() => setActivePage('upload')}>
            Upload Resume <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => setActivePage('analysis')}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={18} color="var(--accent)" /> View Skill Analysis
            </h3>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>See your detailed skill gap report</p>
          </div>
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => setActivePage('roadmap')}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color="#10b981" /> Your Learning Roadmap
            </h3>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Track your personalized learning path</p>
          </div>
        </div>
      )}
    </div>
  )
}
