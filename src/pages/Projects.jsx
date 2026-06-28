import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useDarkMode } from '../context/DarkModeContext'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

export default function Projects() {
  const { user } = useAuth()
  const { darkMode } = useDarkMode()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchProjects = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data: memberRows } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id)

    const projectIds = memberRows?.map(r => r.project_id) || []

    if (projectIds.length > 0) {
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds)
        .order('created_at', { ascending: false })
      setProjects(projectData || [])
    } else {
      setProjects([])
    }

    setLoading(false)
  }, [user?.id])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const dm = darkMode

  // Design tokens
  const pageBg = dm
    ? 'radial-gradient(ellipse at 20% 0%, #0f1629 0%, #0a0c16 40%, #06080f 100%)'
    : '#f0f2f8'

  const cardBg = dm
    ? 'linear-gradient(145deg, #141828, #0d1020)'
    : '#ffffff'

  const cardShadowLight = '8px 8px 20px rgba(26,35,126,0.08), -4px -4px 12px rgba(255,255,255,0.9)'
  const cardShadowDark = '8px 8px 24px rgba(0,0,0,0.5), -2px -2px 8px rgba(255,255,255,0.03)'

  const cardHoverLight = '12px 12px 28px rgba(26,35,126,0.14), -4px -4px 14px rgba(255,255,255,0.95), inset 0 1px 0 rgba(255,255,255,0.8)'
  const cardHoverDark = '12px 12px 32px rgba(0,0,0,0.65), -2px -2px 10px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)'

  const statBg = dm
    ? 'linear-gradient(145deg, #1a2040, #111830)'
    : '#ffffff'

  const inputBg = dm
    ? 'linear-gradient(145deg, #0a0c16, #0f1220)'
    : '#ffffff'

  const textPrimary = dm ? '#e8ecff' : '#1a237e'
  const textSecondary = dm ? '#6b7db3' : '#8892b0'
  const accentBlue = dm ? '#4f6ef7' : '#1a237e'
  const borderGlow = dm ? '1px solid rgba(79,110,247,0.15)' : '1px solid rgba(26,35,126,0.08)'

  const totalProjects = projects.length
  const ownedProjects = projects.filter(p => p.owner_id === user?.id).length
  const memberProjects = totalProjects - ownedProjects

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: pageBg,
      fontFamily: "'Poppins', sans-serif"
    }}>
      <Sidebar />
      <Topbar title="Projects" />
      <main style={{
        marginLeft: '220px', flex: 1,
        padding: '2rem 2.5rem', paddingTop: '88px',
      }}>

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: textPrimary, margin: 0, letterSpacing: '-0.5px' }}>
              Projects
            </h1>
            <p style={{ color: textSecondary, fontSize: '13px', margin: '4px 0 0' }}>
              Manage and track all your collaborative work
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <i className="ti ti-search" style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                color: textSecondary, fontSize: '14px', pointerEvents: 'none'
              }} />
              <input
                placeholder="Search projects..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  background: inputBg,
                  border: borderGlow,
                  boxShadow: dm
                    ? 'inset 4px 4px 10px rgba(0,0,0,0.4), inset -2px -2px 6px rgba(255,255,255,0.02)'
                    : 'inset 4px 4px 10px rgba(26,35,126,0.06), inset -2px -2px 6px rgba(255,255,255,0.9)',
                  borderRadius: '10px',
                  padding: '9px 12px 9px 36px',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '12px',
                  color: textPrimary,
                  outline: 'none',
                  width: '200px'
                }}
              />
            </div>

            <button
              onClick={() => navigate('/projects/create')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: dm
                  ? 'linear-gradient(135deg, #4f6ef7, #3451d1)'
                  : 'linear-gradient(135deg, #1a237e, #283593)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '9px 18px',
                cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif",
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: dm
                  ? '0 4px 16px rgba(79,110,247,0.4), 0 1px 0 rgba(255,255,255,0.1) inset'
                  : '0 4px 16px rgba(26,35,126,0.3), 0 1px 0 rgba(255,255,255,0.15) inset',
                letterSpacing: '0.3px'
              }}
            >
              <i className="ti ti-plus" style={{ fontSize: '15px' }} /> New Project
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem', maxWidth: '720px' }}>
          {[
            { label: 'Total Projects', value: totalProjects, icon: 'ti-folders', color: dm ? '#4f6ef7' : '#1a237e' },
            { label: 'Owned by Me', value: ownedProjects, icon: 'ti-crown', color: dm ? '#f0a04b' : '#e65100' },
            { label: 'Member Of', value: memberProjects, icon: 'ti-users', color: dm ? '#34d399' : '#2e7d32' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: statBg,
              borderRadius: '16px',
              padding: '1.2rem 1.4rem',
              border: borderGlow,
              boxShadow: dm ? cardShadowDark : cardShadowLight,
              display: 'flex', alignItems: 'center', gap: '14px'
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: stat.color + (dm ? '22' : '12'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', color: stat.color,
                boxShadow: dm
                  ? `inset 2px 2px 6px rgba(0,0,0,0.3), inset -1px -1px 4px rgba(255,255,255,0.04)`
                  : `inset 2px 2px 6px rgba(0,0,0,0.04), inset -1px -1px 4px rgba(255,255,255,0.8)`
              }}>
                <i className={`ti ${stat.icon}`} />
              </div>
              <div>
                <p style={{ fontSize: '22px', fontWeight: 800, color: textPrimary, margin: 0, lineHeight: 1 }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: '11px', color: textSecondary, margin: '3px 0 0', fontWeight: 500 }}>
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1rem' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{
                background: dm ? 'linear-gradient(145deg, #141828, #0d1020)' : '#fff',
                borderRadius: '16px', padding: '1.5rem', height: '160px',
                boxShadow: dm ? cardShadowDark : cardShadowLight,
                animation: 'pulse 1.5s ease infinite'
              }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            background: dm ? 'linear-gradient(145deg, #141828, #0d1020)' : '#fff',
            borderRadius: '20px',
            padding: '3.5rem',
            textAlign: 'center',
            boxShadow: dm ? cardShadowDark : cardShadowLight,
            border: borderGlow
          }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '16px',
              background: dm ? '#1a2040' : '#e8eaf6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: dm ? 'inset 3px 3px 8px rgba(0,0,0,0.4)' : 'inset 3px 3px 8px rgba(26,35,126,0.08)'
            }}>
              <i className="ti ti-folder-off" style={{ fontSize: '28px', color: dm ? '#4f6ef7' : '#c5cae9' }} />
            </div>
            <p style={{ color: textPrimary, fontSize: '14px', fontWeight: 600, margin: '0 0 6px' }}>
              {search ? 'No results found' : 'No projects yet'}
            </p>
            <p style={{ color: textSecondary, fontSize: '12px', margin: 0 }}>
              {search ? 'Try a different search term' : 'Create your first project to get started'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1rem' }}>
            {filtered.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                user={user}
                darkMode={dm}
                cardBg={cardBg}
                cardShadow={dm ? cardShadowDark : cardShadowLight}
                cardHover={dm ? cardHoverDark : cardHoverLight}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
                borderGlow={borderGlow}
                accentBlue={accentBlue}
                onClick={() => navigate(`/projects/${project.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function ProjectCard({ project, user, darkMode: dm, cardBg, cardShadow, cardHover, textPrimary, textSecondary, borderGlow, accentBlue, onClick }) {
  const [hovered, setHovered] = useState(false)

  const statusColor = project.end_date
    ? new Date(project.end_date) < new Date()
      ? { bg: dm ? '#2d0f0f' : '#ffebee', text: '#e53935', label: 'Overdue' }
      : { bg: dm ? '#0f2d1a' : '#e8f5e9', text: '#2e7d32', label: 'Active' }
    : { bg: dm ? '#1a1a2d' : '#ede7f6', text: dm ? '#9c8af5' : '#4a148c', label: 'No Deadline' }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: cardBg,
        borderRadius: '18px',
        padding: '1.5rem',
        boxShadow: hovered ? cardHover : cardShadow,
        border: hovered
          ? dm ? '1px solid rgba(79,110,247,0.3)' : '1px solid rgba(26,35,126,0.15)'
          : borderGlow,
        cursor: 'pointer',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Accent glow top-left */}
      {dm && (
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: '80px', height: '80px',
          background: 'radial-gradient(circle, rgba(79,110,247,0.08) 0%, transparent 70%)',
          borderRadius: '0 0 80px 0',
          pointerEvents: 'none'
        }} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        {/* Project icon */}
        <div style={{
          width: '40px', height: '40px', borderRadius: '11px',
          background: dm
            ? 'linear-gradient(145deg, #1e2a50, #141e3a)'
            : 'linear-gradient(145deg, #e8eaf6, #c5cae9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', color: accentBlue,
          boxShadow: dm
            ? 'inset 2px 2px 6px rgba(0,0,0,0.4), inset -1px -1px 4px rgba(255,255,255,0.03)'
            : 'inset 2px 2px 6px rgba(26,35,126,0.08), inset -1px -1px 4px rgba(255,255,255,0.9)'
        }}>
          <i className="ti ti-folder" />
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{
            fontSize: '10px',
            background: statusColor.bg,
            color: statusColor.text,
            padding: '3px 9px',
            borderRadius: '20px',
            fontWeight: 700,
            letterSpacing: '0.3px'
          }}>
            {statusColor.label}
          </span>
          {project.owner_id === user?.id && (
            <span style={{
              fontSize: '10px',
              background: dm ? 'rgba(240,160,75,0.15)' : '#fff8e1',
              color: dm ? '#f0a04b' : '#e65100',
              padding: '3px 9px',
              borderRadius: '20px',
              fontWeight: 700
            }}>
              Owner
            </span>
          )}
        </div>
      </div>

      <h3 style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, margin: '12px 0 6px', lineHeight: 1.3 }}>
        {project.name}
      </h3>

      <p style={{ fontSize: '12px', color: textSecondary, margin: '0 0 14px', lineHeight: 1.6 }}>
        {project.description ? (project.description.length > 72 ? project.description.slice(0, 72) + '...' : project.description) : 'No description added yet.'}
      </p>

      {/* Divider */}
      <div style={{
        height: '1px',
        background: dm ? 'rgba(255,255,255,0.05)' : 'rgba(26,35,126,0.06)',
        marginBottom: '12px'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          {project.start_date && (
            <span style={{ fontSize: '11px', color: textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <i className="ti ti-calendar" style={{ fontSize: '12px' }} />
              {project.start_date}
            </span>
          )}
          {project.end_date && (
            <span style={{ fontSize: '11px', color: textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <i className="ti ti-flag" style={{ fontSize: '12px' }} />
              {project.end_date}
            </span>
          )}
        </div>
        <div style={{
          width: '26px', height: '26px', borderRadius: '50%',
          background: dm ? 'rgba(79,110,247,0.12)' : 'rgba(26,35,126,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accentBlue, fontSize: '13px',
          transform: hovered ? 'translateX(2px)' : 'translateX(0)',
          transition: 'transform 0.2s'
        }}>
          <i className="ti ti-arrow-right" />
        </div>
      </div>
    </div>
  )
}