import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { icon: 'ti-layout-dashboard', label: 'Dashboard', path: '/dashboard' },
  { icon: 'ti-folder', label: 'Projects', path: '/projects' },
  { icon: 'ti-checklist', label: 'My Tasks', path: '/tasks' },
  { icon: 'ti-bell', label: 'Notifications', path: '/notifications' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  return (
    <aside style={{
      width: '220px', minHeight: '100vh',
      background: '#1a237e', display: 'flex',
      flexDirection: 'column', padding: '1.5rem 0',
      fontFamily: "'Poppins', sans-serif",
      position: 'fixed', top: 0, left: 0, zIndex: 100
    }}>
      {/* Logo */}
      <div style={{ padding: '0 1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', background: 'rgba(255,255,255,0.15)',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <i className="ti ti-layout-kanban" style={{ color: '#fff', fontSize: '18px' }} />
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px', letterSpacing: '0.5px' }}>TaskFlow</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '1.5rem 0' }}>
        {navItems.map(item => {
          const active = location.pathname === item.path
          return (
            <div key={item.path} onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '0.75rem 1.5rem', cursor: 'pointer',
                background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                borderLeft: active ? '3px solid #fff' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <i className={`ti ${item.icon}`} style={{ color: active ? '#fff' : 'rgba(255,255,255,0.65)', fontSize: '18px' }} />
              <span style={{ color: active ? '#fff' : 'rgba(255,255,255,0.65)', fontSize: '13px', fontWeight: active ? 600 : 400 }}>
                {item.label}
              </span>
            </div>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 600, fontSize: '13px'
          }}>
            {profile?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <p style={{ color: '#fff', fontSize: '12px', fontWeight: 600, margin: 0 }}>{profile?.name || 'User'}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', margin: 0 }}>{profile?.email || ''}</p>
          </div>
        </div>
        <div onClick={handleSignOut}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            cursor: 'pointer', padding: '6px 0'
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <i className="ti ti-logout" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px' }} />
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>Sign out</span>
        </div>
      </div>
    </aside>
  )
}