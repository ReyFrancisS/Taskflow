import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useDarkMode } from '../context/DarkModeContext'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const { darkMode } = useDarkMode()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ projects: 0, assigned: 0, completed: 0, pending: 0 })
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  const dm = darkMode

  // ── Design tokens (same system as rest of app) ──────────────────────────────
  const pageBg = dm
    ? 'radial-gradient(ellipse at 20% 0%, #0f1629 0%, #0a0c16 40%, #06080f 100%)'
    : '#f0f2f8'
  const surfaceBg   = dm ? 'linear-gradient(145deg, #141828, #0d1020)' : '#ffffff'
  const cardShadow  = dm
    ? '8px 8px 24px rgba(0,0,0,0.5), -2px -2px 8px rgba(255,255,255,0.03)'
    : '8px 8px 20px rgba(26,35,126,0.08), -4px -4px 12px rgba(255,255,255,0.9)'
  const cardHover   = dm
    ? '12px 12px 32px rgba(0,0,0,0.65), -2px -2px 10px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)'
    : '12px 12px 28px rgba(26,35,126,0.14), -4px -4px 14px rgba(255,255,255,0.95)'
  const textPrimary    = dm ? '#e8ecff' : '#1a237e'
  const textSecondary  = dm ? '#6b7db3' : '#8892b0'
  const borderGlow     = dm ? '1px solid rgba(79,110,247,0.12)' : '1px solid rgba(26,35,126,0.07)'
  const dividerColor   = dm ? 'rgba(255,255,255,0.05)' : 'rgba(26,35,126,0.06)'

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data: memberRows } = await supabase
      .from('project_members').select('project_id').eq('user_id', user.id)

    const projectIds = memberRows?.map(r => r.project_id) || []

    if (projectIds.length > 0) {
      const { data: projectData } = await supabase
        .from('projects').select('*').in('id', projectIds)
      setProjects(projectData || [])

      const { data: taskData } = await supabase
        .from('tasks').select('status').eq('assigned_to', user.id)

      const completed = taskData?.filter(t => t.status === 'Done').length || 0
      const assigned  = taskData?.length || 0

      setStats({ projects: projectData?.length || 0, assigned, completed, pending: assigned - completed })
    } else {
      setProjects([])
      setStats({ projects: 0, assigned: 0, completed: 0, pending: 0 })
    }

    setLoading(false)
  }, [user?.id])

  useEffect(() => { fetchData() }, [fetchData])

  const statCards = [
    { label: 'Projects',        value: stats.projects,  icon: 'ti-folders',        color: dm ? '#4f6ef7' : '#3949ab' },
    { label: 'Tasks Assigned',  value: stats.assigned,  icon: 'ti-checklist',      color: dm ? '#34d399' : '#00897b' },
    { label: 'Tasks Completed', value: stats.completed, icon: 'ti-circle-check',   color: dm ? '#34d399' : '#2e7d32' },
    { label: 'Pending Tasks',   value: stats.pending,   icon: 'ti-clock',          color: dm ? '#fb923c' : '#e65100' },
  ]

  const firstName = profile?.name?.split(' ')[0] || 'there'

  const completionRate = stats.assigned > 0
    ? Math.round((stats.completed / stats.assigned) * 100)
    : 0

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: pageBg, fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar />
      <Topbar title={`Welcome back, ${firstName} 👋`} />
      <main style={{ marginLeft: '220px', flex: 1, padding: '2rem 2.5rem', paddingTop: '88px' }}>

        {/* Greeting */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: textPrimary, margin: 0, letterSpacing: '-0.5px' }}>
            Good {getTimeOfDay()}, {firstName} 👋
          </h1>
          <p style={{ color: textSecondary, fontSize: '13px', margin: '5px 0 0' }}>
            Here's what's happening with your projects today.
          </p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {statCards.map(card => (
            <div key={card.label} style={{
              background: surfaceBg, borderRadius: '16px',
              padding: '1.4rem 1.5rem', border: borderGlow, boxShadow: cardShadow,
              display: 'flex', flexDirection: 'column', gap: '10px',
              position: 'relative', overflow: 'hidden'
            }}>
              {/* Ambient glow corner */}
              {dm && (
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  width: '70px', height: '70px',
                  background: `radial-gradient(circle, ${card.color}18 0%, transparent 70%)`,
                  pointerEvents: 'none'
                }} />
              )}
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: card.color + (dm ? '20' : '12'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', color: card.color,
                boxShadow: dm
                  ? 'inset 2px 2px 6px rgba(0,0,0,0.35)'
                  : 'inset 2px 2px 6px rgba(0,0,0,0.05)'
              }}>
                <i className={`ti ${card.icon}`} />
              </div>
              <p style={{ fontSize: '28px', fontWeight: 800, color: textPrimary, margin: 0, lineHeight: 1 }}>
                {card.value}
              </p>
              <p style={{ fontSize: '12px', color: textSecondary, margin: 0, fontWeight: 500 }}>
                {card.label}
              </p>
            </div>
          ))}
        </div>

        {/* Task Completion Progress */}
        <div style={{
          background: surfaceBg, borderRadius: '16px',
          padding: '1.4rem 1.6rem', marginBottom: '2rem',
          boxShadow: cardShadow, border: borderGlow
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, margin: 0 }}>
                Task Completion Rate
              </p>
              <p style={{ fontSize: '11px', color: textSecondary, margin: '2px 0 0' }}>
                {stats.completed} of {stats.assigned} tasks done
              </p>
            </div>
            <span style={{
              fontSize: '20px', fontWeight: 800,
              color: completionRate === 100
                ? (dm ? '#34d399' : '#2e7d32')
                : (dm ? '#4f6ef7' : '#1a237e')
            }}>
              {completionRate}%
            </span>
          </div>
          <div style={{
            background: dm ? 'rgba(0,0,0,0.4)' : 'rgba(26,35,126,0.06)',
            borderRadius: '999px', height: '10px', overflow: 'hidden',
            boxShadow: dm
              ? 'inset 3px 3px 8px rgba(0,0,0,0.5)'
              : 'inset 3px 3px 8px rgba(26,35,126,0.08)'
          }}>
            <div style={{
              height: '100%', borderRadius: '999px',
              background: completionRate === 100
                ? (dm ? 'linear-gradient(90deg, #059669, #34d399)' : 'linear-gradient(90deg, #2e7d32, #43a047)')
                : (dm ? 'linear-gradient(90deg, #3451d1, #4f6ef7, #6b8eff)' : 'linear-gradient(90deg, #1a237e, #3949ab)'),
              width: `${completionRate}%`,
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: dm
                ? `0 0 12px ${completionRate === 100 ? 'rgba(52,211,153,0.5)' : 'rgba(79,110,247,0.5)'}`
                : 'none'
            }} />
          </div>
        </div>

        {/* Projects Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: textPrimary, margin: 0 }}>My Projects</h2>
            <p style={{ fontSize: '12px', color: textSecondary, margin: '3px 0 0' }}>
              {projects.length} project{projects.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => navigate('/projects')} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: dm ? 'linear-gradient(145deg, #141828, #0d1020)' : '#ffffff',
              color: dm ? '#e8ecff' : '#1a237e',
              border: dm ? '1px solid rgba(79,110,247,0.2)' : '1px solid rgba(26,35,126,0.15)',
              borderRadius: '10px', padding: '9px 16px', cursor: 'pointer',
              fontFamily: "'Poppins', sans-serif", fontSize: '12px', fontWeight: 700,
              boxShadow: cardShadow
            }}>
              <i className="ti ti-layout-grid" /> View All
            </button>
            <button onClick={() => navigate('/projects/create')} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: dm
                ? 'linear-gradient(135deg, #4f6ef7, #3451d1)'
                : 'linear-gradient(135deg, #1a237e, #283593)',
              color: '#fff', border: 'none',
              borderRadius: '10px', padding: '9px 18px', cursor: 'pointer',
              fontFamily: "'Poppins', sans-serif", fontSize: '12px', fontWeight: 700,
              boxShadow: dm
                ? '0 4px 16px rgba(79,110,247,0.4)'
                : '0 4px 12px rgba(26,35,126,0.25)'
            }}>
              <i className="ti ti-plus" /> New Project
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                background: surfaceBg, borderRadius: '16px', padding: '1.5rem',
                height: '150px', boxShadow: cardShadow, border: borderGlow
              }} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div style={{
            background: surfaceBg, borderRadius: '20px', padding: '3.5rem',
            textAlign: 'center', boxShadow: cardShadow, border: borderGlow
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
              No projects yet
            </p>
            <p style={{ color: textSecondary, fontSize: '12px', margin: '0 0 20px' }}>
              Create your first project to get started.
            </p>
            <button onClick={() => navigate('/projects/create')} style={{
              background: dm
                ? 'linear-gradient(135deg, #4f6ef7, #3451d1)'
                : 'linear-gradient(135deg, #1a237e, #283593)',
              color: '#fff', border: 'none',
              borderRadius: '10px', padding: '10px 22px', cursor: 'pointer',
              fontFamily: "'Poppins', sans-serif", fontSize: '12px', fontWeight: 700,
              boxShadow: dm ? '0 4px 16px rgba(79,110,247,0.4)' : '0 4px 12px rgba(26,35,126,0.25)'
            }}>
              <i className="ti ti-plus" /> Create Project
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                user={user}
                dm={dm}
                surfaceBg={surfaceBg}
                cardShadow={cardShadow}
                cardHover={cardHover}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
                borderGlow={borderGlow}
                dividerColor={dividerColor}
                onClick={() => navigate(`/projects/${project.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function ProjectCard({ project, user, dm, surfaceBg, cardShadow, cardHover, textPrimary, textSecondary, borderGlow, dividerColor, onClick }) {
  const [hovered, setHovered] = useState(false)

  const isOwner = project.owner_id === user?.id
  const isOverdue = project.end_date && new Date(project.end_date) < new Date()
  const statusLabel = isOverdue ? 'Overdue' : 'Active'
  const statusColor = isOverdue
    ? (dm ? '#f87171' : '#e53935')
    : (dm ? '#34d399' : '#2e7d32')
  const statusBg = isOverdue
    ? (dm ? 'rgba(248,113,113,0.12)' : '#ffebee')
    : (dm ? 'rgba(52,211,153,0.12)' : '#e8f5e9')

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: surfaceBg,
        borderRadius: '18px',
        padding: '1.4rem 1.5rem',
        boxShadow: hovered ? cardHover : cardShadow,
        border: hovered
          ? (dm ? '1px solid rgba(79,110,247,0.3)' : '1px solid rgba(26,35,126,0.15)')
          : borderGlow,
        cursor: 'pointer',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative', overflow: 'hidden'
      }}
    >
      {/* Ambient glow */}
      {dm && (
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: '80px', height: '80px',
          background: 'radial-gradient(circle, rgba(79,110,247,0.07) 0%, transparent 70%)',
          borderRadius: '0 0 80px 0', pointerEvents: 'none'
        }} />
      )}

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '11px',
          background: dm
            ? 'linear-gradient(145deg, #1e2a50, #141e3a)'
            : 'linear-gradient(145deg, #e8eaf6, #c5cae9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '17px', color: dm ? '#4f6ef7' : '#1a237e',
          boxShadow: dm
            ? 'inset 2px 2px 6px rgba(0,0,0,0.4)'
            : 'inset 2px 2px 6px rgba(26,35,126,0.08)'
        }}>
          <i className="ti ti-folder" />
        </div>

        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <span style={{
            fontSize: '10px', background: statusBg, color: statusColor,
            padding: '3px 9px', borderRadius: '20px', fontWeight: 700
          }}>
            {statusLabel}
          </span>
          {isOwner && (
            <span style={{
              fontSize: '10px',
              background: dm ? 'rgba(240,160,75,0.15)' : '#fff8e1',
              color: dm ? '#f0a04b' : '#e65100',
              padding: '3px 9px', borderRadius: '20px', fontWeight: 700
            }}>
              Owner
            </span>
          )}
        </div>
      </div>

      {/* Title + description */}
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, margin: '0 0 6px', lineHeight: 1.3 }}>
        {project.name}
      </h3>
      <p style={{ fontSize: '12px', color: textSecondary, margin: '0 0 14px', lineHeight: 1.6 }}>
        {project.description
          ? (project.description.length > 68 ? project.description.slice(0, 68) + '...' : project.description)
          : 'No description added yet.'}
      </p>

      {/* Divider */}
      <div style={{ height: '1px', background: dividerColor, marginBottom: '12px' }} />

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {project.start_date && (
            <span style={{ fontSize: '11px', color: textSecondary, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <i className="ti ti-calendar" style={{ fontSize: '11px' }} /> {project.start_date}
            </span>
          )}
          {project.end_date && (
            <span style={{ fontSize: '11px', color: textSecondary, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <i className="ti ti-flag" style={{ fontSize: '11px' }} /> {project.end_date}
            </span>
          )}
        </div>
        <div style={{
          width: '26px', height: '26px', borderRadius: '50%',
          background: dm ? 'rgba(79,110,247,0.12)' : 'rgba(26,35,126,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: dm ? '#4f6ef7' : '#1a237e', fontSize: '13px',
          transform: hovered ? 'translateX(2px)' : 'translateX(0)',
          transition: 'transform 0.2s'
        }}>
          <i className="ti ti-arrow-right" />
        </div>
      </div>
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}