import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'

export default function CreateProject() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', description: '', start_date: '', end_date: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')

    const { data: project, error: projErr } = await supabase
      .from('projects')
      .insert({ ...form, owner_id: user.id })
      .select()
      .single()

    if (projErr) { setError(projErr.message); setLoading(false); return }

    // Auto-add owner as member
    await supabase.from('project_members').insert({ project_id: project.id, user_id: user.id })

    // Log activity
    await supabase.from('activity_logs').insert({
      project_id: project.id, user_id: user.id,
      action: 'created this project'
    })

    setLoading(false)
    navigate(`/projects/${project.id}`)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2ff', fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '2rem 2.5rem' }}>
        <div style={{ maxWidth: '560px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
            <button onClick={() => navigate('/dashboard')} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#1a237e', fontSize: '20px'
            }}>
              <i className="ti ti-arrow-left" />
            </button>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a237e', margin: 0 }}>Create Project</h1>
          </div>

          <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(26,35,126,0.07)' }}>
            <form onSubmit={handleSubmit}>
              <FormField label="Project Name" required>
                <input type="text" placeholder="e.g. Library Management System"
                  value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                  required style={inputStyle} />
              </FormField>

              <FormField label="Description">
                <textarea placeholder="What is this project about?"
                  value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                  rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField label="Start Date">
                  <input type="date" value={form.start_date}
                    onChange={e => setForm(p => ({...p, start_date: e.target.value}))}
                    style={inputStyle} />
                </FormField>
                <FormField label="End Date">
                  <input type="date" value={form.end_date}
                    onChange={e => setForm(p => ({...p, end_date: e.target.value}))}
                    style={inputStyle} />
                </FormField>
              </div>

              {error && <p style={{ color: '#c62828', fontSize: '12px', marginBottom: '12px' }}>{error}</p>}

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '12px',
                background: '#1a237e', color: '#fff', border: 'none',
                borderRadius: '8px', fontFamily: "'Poppins', sans-serif",
                fontSize: '13px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.5px'
              }}>
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

function FormField({ label, children, required }) {
  return (
    <div style={{ marginBottom: '1.2rem' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '6px' }}>
        {label} {required && <span style={{ color: '#c62828' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid #e0e0e0', borderRadius: '8px',
  fontFamily: "'Poppins', sans-serif", fontSize: '13px',
  color: '#333', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s'
}