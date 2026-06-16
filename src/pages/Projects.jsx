import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'

export default function Projects() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2ff', fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '2rem 2.5rem' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a237e', margin: 0 }}>Projects</h1>
            <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 0' }}>All your projects in one place.</p>
          </div>
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
            <p style={{ color: '#aaa', fontSize: '13px', marginTop: '12px' }}>No projects yet. Create your first project!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {projects.map(project => (
              <div key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                style={{
                  background: '#fff', borderRadius: '14px', padding: '1.4rem 1.5rem',
                  boxShadow: '0 2px 12px rgba(26,35,126,0.07)', cursor: 'pointer',
                  borderLeft: '4px solid #1a237e',
                  transition: 'transform 0.2s, box-shadow 0.2s'
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
                <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#aaa' }}>
                  {project.start_date && <span><i className="ti ti-calendar" /> {project.start_date}</span>}
                  {project.end_date && <span>→ {project.end_date}</span>}
                </div>
                {project.owner_id === user?.id && (
                  <span style={{
                    display: 'inline-block', marginTop: '10px',
                    fontSize: '10px', background: '#e8eaf6',
                    color: '#1a237e', padding: '2px 8px', borderRadius: '20px', fontWeight: 600
                  }}>Owner</span>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}