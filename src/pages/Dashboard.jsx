import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ projects: 0, assigned: 0, completed: 0, pending: 0 })
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
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
      setProjects(projectData || [])

      const { data: taskData } = await supabase
        .from('tasks')
        .select('status')
        .eq('assigned_to', user.id)

      const completed = taskData?.filter(t => t.status === 'Done').length || 0
      const assigned = taskData?.length || 0

      setStats({
        projects: projectData?.length || 0,
        assigned,
        completed,
        pending: assigned - completed
      })
    } else {
      setProjects([])
      setStats({ projects: 0, assigned: 0, completed: 0, pending: 0 })
    }

    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const statCards = [
    { label: 'Projects', value: stats.projects, icon: 'ti-folder', color: '#3949ab' },
    { label: 'Tasks Assigned', value: stats.assigned, icon: 'ti-checklist', color: '#00897b' },
    { label: 'Tasks Completed', value: stats.completed, icon: 'ti-circle-check', color: '#2e7d32' },
    { label: 'Pending Tasks', value: stats.pending, icon: 'ti-clock', color: '#e65100' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2ff', fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '2rem 2.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a237e', margin: 0 }}>
            Welcome back, {profile?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 0' }}>
            Here's what's happening with your projects.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {statCards.map(card => (
            <div key={card.label} style={{
              background: '#fff', borderRadius: '14px',
              padding: '1.4rem 1.5rem',
              boxShadow: '0 2px 12px rgba(26,35,126,0.07)',
              display: 'flex', flexDirection: 'column', gap: '8px'
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: card.color + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <i className={`ti ${card.icon}`} style={{ fontSize: '20px', color: card.color }} />
              </div>
              <p style={{ fontSize: '26px', fontWeight: 700, color: '#1a237e', margin: 0 }}>{card.value}</p>
              <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>{card.label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1a237e', margin: 0 }}>My Projects</h2>
          <button onClick={() => navigate('/projects/create')} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#1a237e', color: '#fff', border: 'none',
            borderRadius: '8px', padding: '8px 16px', cursor: 'pointer',
            fontFamily: "'Poppins', sans-serif", fontSize: '12px', fontWeight: 600
          }}>
            <i className="ti ti-plus" /> Create Project
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#aaa', fontSize: '13px' }}>Loading projects...</p>
        ) : projects.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: '14px', padding: '3rem',
            textAlign: 'center', boxShadow: '0 2px 12px rgba(26,35,126,0.07)'
          }}>
            <i className="ti ti-folder-off" style={{ fontSize: '40px', color: '#c5cae9' }} />
            <p style={{ color: '#aaa', fontSize: '13px', marginTop: '12px' }}>No projects found. Create your first project!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {projects.map(project => (
              <div key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                style={{
                  background: '#fff', borderRadius: '14px', padding: '1.4rem 1.5rem',
                  boxShadow: '0 2px 12px rgba(26,35,126,0.07)', cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  borderLeft: '4px solid #1a237e'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,35,126,0.13)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(26,35,126,0.07)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1a237e', margin: '0 0 6px' }}>{project.name}</h3>
                  <i className="ti ti-chevron-right" style={{ color: '#c5cae9', fontSize: '16px' }} />
                </div>
                <p style={{ fontSize: '12px', color: '#999', margin: '0 0 12px', lineHeight: 1.5 }}>
                  {project.description || 'No description'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: '#e8eaf6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', color: '#1a237e', fontWeight: 600
                  }}>
                    {project.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <span style={{ fontSize: '11px', color: '#aaa' }}>{project.name || 'Unknown'}</span>
                  {project.owner_id === user?.id && (
                    <span style={{
                      marginLeft: 'auto', fontSize: '10px', background: '#e8eaf6',
                      color: '#1a237e', padding: '2px 8px', borderRadius: '20px', fontWeight: 600
                    }}>Owner</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}