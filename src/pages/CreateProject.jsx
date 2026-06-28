import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useDarkMode } from '../context/DarkModeContext'
import Sidebar from '../components/Sidebar'

export default function CreateProject() {
  const { user } = useAuth()
  const { darkMode } = useDarkMode()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', description: '', start_date: '', end_date: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const dm = darkMode

  const pageBg = dm
    ? 'radial-gradient(ellipse at 20% 0%, #0f1629 0%, #0a0c16 40%, #06080f 100%)'
    : '#f0f2f8'

  const surfaceBg = dm ? 'linear-gradient(145deg, #141828, #0d1020)' : '#ffffff'
  const cardShadow = dm
    ? '10px 10px 28px rgba(0,0,0,0.55), -3px -3px 10px rgba(255,255,255,0.03)'
    : '10px 10px 24px rgba(26,35,126,0.09), -5px -5px 14px rgba(255,255,255,0.95)'

  const textPrimary = dm ? '#e8ecff' : '#1a237e'
  const textSecondary = dm ? '#6b7db3' : '#8892b0'
  const borderGlow = dm ? '1px solid rgba(79,110,247,0.12)' : '1px solid rgba(26,35,126,0.08)'
  const inputBg = dm ? 'linear-gradient(145deg, #0a0c16, #0f1220)' : '#ffffff'
  const inputShadow = dm
    ? 'inset 4px 4px 10px rgba(0,0,0,0.5), inset -2px -2px 6px rgba(255,255,255,0.02)'
    : 'inset 4px 4px 10px rgba(26,35,126,0.06), inset -2px -2px 6px rgba(255,255,255,0.9)'

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')

    const { data: project, error: projErr } = await supabase
      .from('projects').insert({ ...form, owner_id: user.id }).select().single()

    if (projErr) { setError(projErr.message); setLoading(false); return }

    await supabase.from('project_members').insert({ project_id: project.id, user_id: user.id })
    await supabase.from('activity_logs').insert({
      project_id: project.id, user_id: user.id, action: 'created this project'
    })

    setLoading(false)
    navigate(`/projects/${project.id}`)
  }

  const sharedInputStyle = {
    width: '100%',
    padding: '11px 14px',
    background: inputBg,
    border: `1.5px solid ${dm ? 'rgba(79,110,247,0.2)' : 'rgba(26,35,126,0.12)'}`,
    boxShadow: inputShadow,
    borderRadius: '11px',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '13px',
    color: textPrimary,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: pageBg, fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '2rem 2.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '560px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '2rem' }}>
            <button onClick={() => navigate('/dashboard')} style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: dm ? 'linear-gradient(145deg, #141828, #0d1020)' : '#ffffff',
              border: borderGlow,
              boxShadow: cardShadow,
              cursor: 'pointer',
              color: textPrimary,
              fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <i className="ti ti-arrow-left" />
            </button>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: textPrimary, margin: 0, letterSpacing: '-0.4px' }}>
                Create Project
              </h1>
              <p style={{ color: textSecondary, fontSize: '12px', margin: '3px 0 0' }}>
                Set up a new collaborative project
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div style={{
            background: surfaceBg,
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: cardShadow,
            border: borderGlow,
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Ambient glow */}
            {dm && (
              <div style={{
                position: 'absolute', top: 0, right: 0,
                width: '120px', height: '120px',
                background: 'radial-gradient(circle, rgba(79,110,247,0.06) 0%, transparent 70%)',
                borderRadius: '0 20px 0 120px',
                pointerEvents: 'none'
              }} />
            )}

            <form onSubmit={handleSubmit}>
              {/* Project Name */}
              <div style={{ marginBottom: '1.4rem' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: textPrimary, display: 'block', marginBottom: '8px', letterSpacing: '0.3px' }}>
                  Project Name <span style={{ color: '#e53935' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Library Management System"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required
                  style={sharedInputStyle}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1.4rem' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: textPrimary, display: 'block', marginBottom: '8px', letterSpacing: '0.3px' }}>
                  Description
                </label>
                <textarea
                  placeholder="What is this project about?"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  style={{ ...sharedInputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.6rem' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: textPrimary, display: 'block', marginBottom: '8px', letterSpacing: '0.3px' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                    style={sharedInputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: textPrimary, display: 'block', marginBottom: '8px', letterSpacing: '0.3px' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                    style={sharedInputStyle}
                  />
                </div>
              </div>

              {/* Divider */}
              <div style={{
                height: '1px',
                background: dm ? 'rgba(255,255,255,0.05)' : 'rgba(26,35,126,0.06)',
                marginBottom: '1.4rem'
              }} />

              {error && (
                <div style={{
                  background: dm ? 'rgba(229,57,53,0.1)' : '#ffebee',
                  border: '1px solid rgba(229,57,53,0.3)',
                  borderRadius: '10px', padding: '10px 14px',
                  marginBottom: '1rem'
                }}>
                  <p style={{ color: '#e53935', fontSize: '12px', margin: 0 }}>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '13px',
                  background: loading
                    ? (dm ? '#2a3060' : '#c5cae9')
                    : (dm
                        ? 'linear-gradient(135deg, #4f6ef7, #3451d1)'
                        : 'linear-gradient(135deg, #1a237e, #283593)'),
                  color: '#fff', border: 'none',
                  borderRadius: '12px',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '13px', fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.5px',
                  boxShadow: loading
                    ? 'none'
                    : (dm
                        ? '0 6px 20px rgba(79,110,247,0.4), 0 1px 0 rgba(255,255,255,0.1) inset'
                        : '0 6px 16px rgba(26,35,126,0.3), 0 1px 0 rgba(255,255,255,0.15) inset'),
                  transition: 'all 0.2s'
                }}
              >
                {loading ? 'Creating...' : '+ Create Project'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}