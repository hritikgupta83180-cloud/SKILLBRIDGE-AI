import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { API } from '../context/AuthContext'
import { Upload, CheckCircle, AlertCircle, Loader2, Brain, Target, ChevronRight } from 'lucide-react'

const ROLES = ["AI Engineer","Data Scientist","Software Engineer","Full Stack Developer","Frontend Developer","Backend Developer","Cloud Engineer","DevOps Engineer","Cybersecurity Analyst","Product Manager","Machine Learning Engineer","Android Developer","iOS Developer","Data Analyst","Blockchain Developer","UI/UX Designer"]
const ROLE_ICONS = {"AI Engineer":"🤖","Data Scientist":"📊","Software Engineer":"💻","Full Stack Developer":"🔄","Frontend Developer":"🎨","Backend Developer":"⚙️","Cloud Engineer":"☁️","DevOps Engineer":"🔧","Cybersecurity Analyst":"🔒","Product Manager":"📋","Machine Learning Engineer":"🧠","Android Developer":"📱","iOS Developer":"🍎","Data Analyst":"📈","Blockchain Developer":"⛓️","UI/UX Designer":"✏️"}

export default function UploadPage({ setActivePage, setLatestAnalysis }) {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState(null)
  const [resumeId, setResumeId] = useState(null)
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadMsg, setLoadMsg] = useState(0)
  const inputRef = useRef()

  const msgs = ['Reading your resume...','Extracting skills...','Comparing with job requirements...','Running ATS check...','Generating roadmap...','Almost done...']
  useEffect(() => {
    if (!loading) return
    const t = setInterval(() => setLoadMsg(m => (m + 1) % msgs.length), 2000)
    return () => clearInterval(t)
  }, [loading])

  const handleFile = (f) => {
    if (f?.type === 'application/pdf') { setFile(f); setError('') }
    else setError('Please upload a PDF file.')
  }

  const uploadResume = async () => {
    setLoading(true); setError('')
    try {
      const form = new FormData(); form.append('file', file)
      const r = await axios.post(`${API}/resume/upload`, form)
      setResumeId(r.data.resume_id); setStep(2)
    } catch (e) { setError(e.response?.data?.detail || 'Upload failed') }
    setLoading(false)
  }

  const runAnalysis = async () => {
    setLoading(true); setError(''); setStep(3)
    try {
      const r = await axios.post(`${API}/analyze`, { resume_id: resumeId, target_role: role })
      setLatestAnalysis(r.data); setActivePage('analysis')
    } catch (e) { setError(e.response?.data?.detail || 'Analysis failed'); setStep(2) }
    setLoading(false)
  }

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Upload Resume</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 32 }}>Upload your resume and select your target role for AI analysis</p>

      {/* Steps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
        {['Upload PDF', 'Select Role', 'AI Analysis'].map((s, i) => {
          const done = i + 1 < step, active = i + 1 === step
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'var(--green)' : active ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'var(--surface2)', fontSize: 13, fontWeight: 700, color: 'white', border: active || done ? 'none' : '1px solid var(--border)' }}>
                  {done ? <CheckCircle size={16} /> : i + 1}
                </div>
                <span style={{ fontSize: 13, color: active ? '#a5b4fc' : done ? 'var(--green)' : 'var(--muted)', fontWeight: active ? 600 : 400 }}>{s}</span>
              </div>
              {i < 2 && <ChevronRight size={16} color="var(--border)" style={{ margin: '0 12px' }} />}
            </div>
          )
        })}
      </div>

      {error && <div style={{ padding: '10px 14px', background: '#1f0a0a', border: '1px solid #ef444433', borderRadius: 8, color: '#fca5a5', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={14} />{error}</div>}

      {/* Step 1 */}
      {step === 1 && (
        <div>
          <div className="card"
            onDragOver={e => { e.preventDefault() }}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
            onClick={() => !file && inputRef.current.click()}
            style={{ border: `2px dashed ${file ? 'var(--green)' : 'var(--border)'}`, background: file ? '#0d1f17' : 'var(--surface)', cursor: file ? 'default' : 'pointer', textAlign: 'center', padding: '52px 32px', transition: 'all 0.2s' }}>
            <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            {file ? (
              <div>
                <CheckCircle size={44} color="var(--green)" style={{ marginBottom: 12 }} />
                <p style={{ fontWeight: 700, color: 'var(--green)', fontSize: 16 }}>{file.name}</p>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB</p>
                <button onClick={e => { e.stopPropagation(); setFile(null) }} style={{ marginTop: 12, background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>Change</button>
              </div>
            ) : (
              <div>
                <Upload size={44} color="var(--accent)" style={{ marginBottom: 12 }} />
                <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Drop your resume here</p>
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>or click to browse • PDF only • Max 10MB</p>
              </div>
            )}
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 16, padding: '14px' }} disabled={!file || loading} onClick={uploadResume}>
            {loading ? <><Loader2 size={16} className="spin" /> Uploading...</> : 'Continue →'}
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle size={16} /> Resume uploaded successfully!</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Now select your target role</p>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>What's your dream role?</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 20 }}>
            {ROLES.map(r => (
              <button key={r} onClick={() => setRole(r)}
                style={{ background: role === r ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'var(--surface2)', border: `1px solid ${role === r ? 'var(--accent)' : 'var(--border)'}`, color: role === r ? 'white' : 'var(--muted2)', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: role === r ? 600 : 400, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}>
                <span style={{ fontSize: 18 }}>{ROLE_ICONS[r] || '💼'}</span>{r}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary" style={{ flex: 1, padding: '13px' }} disabled={!role} onClick={runAnalysis}>
              🚀 Analyze with AI
            </button>
          </div>
        </div>
      )}

      {/* Step 3 - Loading */}
      {step === 3 && (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 28px' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid var(--border)' }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Brain size={30} color="var(--accent)" /></div>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>AI is analyzing your profile</h2>
          <p style={{ color: 'var(--accent)', fontSize: 15, fontWeight: 500 }}>{msgs[loadMsg]}</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
    </div>
  )
}
