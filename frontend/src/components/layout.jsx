import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Brain, LayoutDashboard, Upload, BarChart3, Map, MessageCircle, BookOpen, LogOut, Menu, X, TrendingUp, User } from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: Upload, label: 'Upload Resume', id: 'upload' },
  { icon: BarChart3, label: 'Skill Analysis', id: 'analysis' },
  { icon: Map, label: 'Roadmap', id: 'roadmap' },
  { icon: MessageCircle, label: 'AI Mentor', id: 'mentor' },
  { icon: BookOpen, label: 'Courses', id: 'courses' },
  { icon: TrendingUp, label: 'Progress', id: 'progress' },
]

export default function Layout({ children, activePage, setActivePage }) {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{
        width: collapsed ? 68 : 240, background: 'var(--surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', transition: 'width 0.25s', flexShrink: 0, position: 'sticky', top: 0, height: '100vh'
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Brain size={20} color="white" />
          </div>
          {!collapsed && <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 17 }}>SkillBridge</span>}
          <button onClick={() => setCollapsed(!collapsed)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}>
            {collapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(item => {
            const active = activePage === item.id
            return (
              <button key={item.id} onClick={() => setActivePage(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10,
                  background: active ? 'linear-gradient(135deg,#6366f120,#8b5cf620)' : 'transparent',
                  border: active ? '1px solid #6366f133' : '1px solid transparent',
                  color: active ? '#a5b4fc' : 'var(--muted)', cursor: 'pointer', transition: 'all 0.15s',
                  whiteSpace: 'nowrap', overflow: 'hidden'
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface2)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <item.icon size={18} style={{ flexShrink: 0 }} />
                {!collapsed && <span style={{ fontSize: 14, fontWeight: active ? 600 : 400 }}>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--surface2)' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={16} color="white" />
            </div>
            {!collapsed && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>
            )}
            {!collapsed && (
              <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }} title="Logout">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
        {children}
      </div>
    </div>
  )
}
