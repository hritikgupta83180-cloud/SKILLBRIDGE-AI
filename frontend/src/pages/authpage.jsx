import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Brain, Mail, Lock, User, Eye, EyeOff, Zap } from 'lucide-react'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, register } = useAuth()

  const handle = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (isLogin) await login(form.email, form.password)
      else await register(form.name, form.email, form.password)
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'radial-gradient(ellipse at top, #0f1729 0%, #060912 60%)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', marginBottom: 16, boxShadow: '0 0 40px #6366f155' }}>
            <Brain size={32} color="white" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>SkillBridge</h1>
          <p style={{ color: '#7d8590', fontSize: 14 }}>From Resume to Dream Role</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{isLogin ? 'Welcome back!' : 'Create account'}</h2>
          <p style={{ color: '#7d8590', fontSize: 13, marginBottom: 24 }}>{isLogin ? 'Login to continue your journey' : 'Start your career transformation today'}</p>

          {error && <div style={{ padding: '10px 14px', background: '#1f0a0a', border: '1px solid #ef444433', borderRadius: 8, color: '#fca5a5', fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <form onSubmit={handle}>
            {!isLogin && (
              <div style={{ marginBottom: 14, position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#7d8590' }} />
                <input style={{ paddingLeft: 42 }} placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
            )}
            <div style={{ marginBottom: 14, position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#7d8590' }} />
              <input style={{ paddingLeft: 42 }} type="email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div style={{ marginBottom: 20, position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#7d8590' }} />
              <input style={{ paddingLeft: 42, paddingRight: 42 }} type={showPass ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#7d8590' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '13px' }} disabled={loading}>
              {loading ? <><span className="spin" style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} /> Processing...</> : isLogin ? 'Login →' : 'Create Account →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#7d8590' }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setIsLogin(!isLogin); setError('') }} style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontWeight: 600 }}>
              {isLogin ? 'Sign up' : 'Login'}
            </button>
          </div>
        </div>

        {/* Features */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 24, flexWrap: 'wrap' }}>
          {['AI Analysis', 'ATS Score', 'Roadmap', 'Mentor'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#7d8590' }}>
              <Zap size={12} color="#6366f1" /> {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
