import { useEffect, useState } from 'react'
import axios from 'axios'
import { API } from '../context/AuthContext'
import { CheckCircle, XCircle, TrendingUp, FileText, Target, Star, AlertTriangle, RefreshCw } from 'lucide-react'

function Tag({ label, type }) {
  const s = { have: 'badge-green', missing: 'badge-red', neutral: 'badge-blue', weak: 'badge-yellow' }
  const i = { have: <CheckCircle size={11} />, missing: <XCircle size={11} />, weak: <AlertTriangle size={11} /> }
  return <span className={`badge ${s[type]}`} style={{ margin: '3px' }}>{i[type]}{label}</span>
}

function Ring({ score, color, label, size = 100 }) {
  const r = (size - 12) / 2, circ = 2 * Math.PI * r, dash = (score / 100) * circ
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1c2333" strokeWidth={10} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 20, fontWeight: 800, color, fontFamily: 'Space Grotesk' }}>{score}%</span>
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>{label}</p>
    </div>
  )
}

export default function AnalysisPage({ latestAnalysis, setActivePage }) {
  const [data, setData] = useState(latestAnalysis)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(!latestAnalysis)

  useEffect(() => {
    axios.get(`${API}/analysis/history`).then(r => setHistory(r.data))
    if (!latestAnalysis) {
      setLoading(true)
      axios.get(`${API}/dashboard`).then(r => {
        if (r.data.latest_analysis_id) {
          axios.get(`${API}/analysis/${r.data.latest_analysis_id}`).then(res => {
            setData(res.data.report_json)
          }).finally(() => setLoading(false))
        } else setLoading(false)
      })
    }
  }, [])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><div className="spin" style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} /></div>

  if (!data) return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h2 style={{ marginBottom: 12 }}>No analysis yet</h2>
      <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Upload your resume to get started</p>
      <button className="btn btn-primary" onClick={() => setActivePage('upload')}>Upload Resume</button>
    </div>
  )

  const report = data.report_json || data

  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Skill Gap Analysis</h1>
          <p style={{ color: 'var(--muted)' }}>Target: <strong style={{ color: '#a5b4fc' }}>{report.target_role || data.target_role}</strong></p>
        </div>
        <button className="btn btn-outline" onClick={() => setActivePage('upload')} style={{ fontSize: 13 }}>
          <RefreshCw size={14} /> New Analysis
        </button>
      </div>

      {/* Score Rings */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 24, padding: '8px 0' }}>
          <Ring score={report.readiness_score || 0} color="#6366f1" label="Job Readiness" />
          <Ring score={report.ats_score || 0} color="#10b981" label="ATS Score" />
          <Ring score={report.skill_match_percent || 0} color="#06b6d4" label="Skill Match" />
        </div>
        {report.summary && <p style={{ textAlign: 'center', color: 'var(--muted2)', fontSize: 14, marginTop: 16, padding: '0 20px', lineHeight: 1.7 }}>{report.summary}</p>}
      </div>

      {/* Skills Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={16} /> Skills You Have ({(report.matching_skills || report.current_skills || []).length})
          </h3>
          <div>{(report.matching_skills || report.current_skills || []).map(s => <Tag key={s} label={s} type="have" />)}</div>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <XCircle size={16} /> Skills to Learn ({(report.missing_skills || []).length})
          </h3>
          <div>{(report.missing_skills || []).map(s => <Tag key={s} label={s} type="missing" />)}</div>
        </div>
      </div>

      {/* ATS */}
      {(report.ats_issues?.length > 0 || report.ats_suggestions?.length > 0) && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} color="#06b6d4" /> ATS Optimization
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600, marginBottom: 8 }}>⚠️ ISSUES FOUND</p>
              {(report.ats_issues || []).map((i, idx) => <p key={idx} style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 4 }}>• {i}</p>)}
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, marginBottom: 8 }}>✅ SUGGESTIONS</p>
              {(report.ats_suggestions || []).map((s, idx) => <p key={idx} style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 4 }}>• {s}</p>)}
            </div>
          </div>
        </div>
      )}

      {/* Strengths */}
      {report.strengths?.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={18} color="#f59e0b" /> Your Strengths
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {report.strengths.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 8, fontSize: 13, color: 'var(--muted2)' }}>
                <span style={{ color: '#f59e0b', flexShrink: 0 }}>⚡</span>{s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Salary */}
      {report.salary_prediction && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="var(--green)" /> Salary Prediction
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[['Fresher', report.salary_prediction.fresher, '#6366f1'], ['Mid Level', report.salary_prediction.mid_level, '#10b981'], ['Senior', report.salary_prediction.senior, '#f59e0b']].map(([l, v, c]) => (
              <div key={l} style={{ textAlign: 'center', padding: '16px', background: 'var(--surface2)', borderRadius: 10, border: `1px solid ${c}33` }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: c, fontFamily: 'Space Grotesk' }}>{v}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
