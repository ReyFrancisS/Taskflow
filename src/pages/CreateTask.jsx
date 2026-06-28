import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useDarkMode } from '../context/DarkModeContext'
import Sidebar from '../components/Sidebar'

const PRIORITIES = ['Low', 'Medium', 'High']
const priorityColors = {
  Low:    { light: '#43a047', dark: '#34d399' },
  Medium: { light: '#fb8c00', dark: '#fb923c' },
  High:   { light: '#e53935', dark: '#f87171' },
}

export default function CreateTask() {
  const { id } = useParams()
  const { user } = useAuth()
  const { darkMode } = useDarkMode()
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [form, setForm] = useState({
    task_name: '', description: '',
    priority: 'Medium', due_date: '', assigned_to: ''
  })
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
  const inputBorder = dm ? 'rgba(79,110,247,0.2)' : 'rgba(26,35,126,0.12)'

  useEffect(() => { fetchMembers() }, [id])

  async function fetchMembers() {
    const { data: memberData } = await supabase
      .from('project_members').select('*').eq('project_id', id)
    if (memberData && memberData.length > 0) {
      const userIds = memberData.map(m => m.user_id)
      const { data: profileData } = await supabase
        .from('profiles').select('*').in('id', userIds)
      setMembers(profileData || [])
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')

    const { error: taskError } = await supabase.from('tasks').insert({
      project_id: id,
      task_name: form.task_name,
      description: form.description,
      priority: form.priority,
      due_date: form.due_date || null,
      assigned_to: form.assigned_to || null,
      status: 'To Do'
    })

    if (taskError) { setError(taskError.message); setLoading(false); return }

    const assignedMember = members.find(m => m.id === form.assigned_to)
    await supabase.from('activity_logs').insert({
      project_id: id, user_id: user.id,
      action: `created task "${form.task_name}"${assignedMember ? ` and assigned it to ${assignedMember.name}` : ''}`
    })

    if (form.assigned_to) {
      await supabase.from('notifications').insert({
        user_id: form.assigned_to,
        message: `You have been assigned a new task: "${form.task_name}"`
      })
    }

    setLoading(false)
    navigate(`/projects/${id}`)
  }

  const sharedInputStyle = {
    width: '100%', padding: '11px 14px',
    background: inputBg,
    border: `1.5px solid ${inputBorder}`,
    boxShadow: inputShadow,
    borderRadius: '11px',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '13px', color: textPrimary,
    outline: 'none', boxSizing: 'border-box',
  }

  const selectedPriority = priorityColors[form.priority]
  const pc = dm ? selectedPriority?.dark : selectedPriority?.light

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: pageBg, fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '2rem 2.5rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '580px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '2rem' }}>
            <button onClick={() => navigate(`/projects/${id}`)} style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: dm ? 'linear-gradient(145deg, #141828, #0d1020)' : '#ffffff',
              border: borderGlow, boxShadow: cardShadow,
              cursor: 'pointer', color: textPrimary, fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <i className="ti ti-arrow-left" />
            </button>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: textPrimary, margin: 0, letterSpacing: '-0.4px' }}>
                Create Task
              </h1>
              <p style={{ color: textSecondary, fontSize: '12px', margin: '3px 0 0' }}>
                Add a new task to this project
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div style={{
            background: surfaceBg, borderRadius: '20px',
            padding: '2rem', boxShadow: cardShadow, border: borderGlow,
            position: 'relative', overflow: 'hidden'
          }}>
            {dm && (
              <div style={{
                position: 'absolute', top: 0, right: 0,
                width: '120px', height: '120px',
                background: 'radial-gradient(circle, rgba(79,110,247,0.06) 0%, transparent 70%)',
                borderRadius: '0 20px 0 120px', pointerEvents: 'none'
              }} />
            )}

            <form onSubmit={handleSubmit}>

              {/* Task Name */}
              <Field label="Task Name" required textPrimary={textPrimary}>
                <input
                  type="text" placeholder="e.g. Design the Login Page"
                  value={form.task_name}
                  onChange={e => setForm(p => ({ ...p, task_name: e.target.value }))}
                  required style={sharedInputStyle}
                />
              </Field>

              {/* Description */}
              <Field label="Description" textPrimary={textPrimary}>
                <textarea
                  placeholder="Describe what needs to be done..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3} style={{ ...sharedInputStyle, resize: 'vertical' }}
                />
              </Field>

              {/* Priority Selector (visual pills) */}
              <Field label="Priority" textPrimary={textPrimary}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {PRIORITIES.map(p => {
                    const pColor = dm ? priorityColors[p].dark : priorityColors[p].light
                    const isActive = form.priority === p
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, priority: p }))}
                        style={{
                          flex: 1, padding: '9px 0',
                          borderRadius: '10px', cursor: 'pointer',
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: '12px', fontWeight: 700,
                          border: isActive ? 'none' : borderGlow,
                          background: isActive
                            ? pColor
                            : (dm ? 'linear-gradient(145deg, #0a0c16, #0f1220)' : '#ffffff'),
                          color: isActive ? '#fff' : pColor,
                          boxShadow: isActive
                            ? `0 4px 14px ${pColor}50`
                            : (dm ? cardShadow : cardShadow),
                          transition: 'all 0.2s'
                        }}
                      >
                        {p}
                      </button>
                    )
                  })}
                </div>
              </Field>

              {/* Due Date */}
              <Field label="Due Date" textPrimary={textPrimary}>
                <div style={{ position: 'relative' }}>
                  <i className="ti ti-calendar" style={{
                    position: 'absolute', left: '12px', top: '50%',
                    transform: 'translateY(-50%)', fontSize: '14px',
                    color: textSecondary, pointerEvents: 'none'
                  }} />
                  <input
                    type="date" value={form.due_date}
                    onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                    style={{ ...sharedInputStyle, paddingLeft: '36px' }}
                  />
                </div>
              </Field>

              {/* Assign To */}
              <Field label="Assign To" textPrimary={textPrimary}>
                <div style={{ position: 'relative' }}>
                  <i className="ti ti-user" style={{
                    position: 'absolute', left: '12px', top: '50%',
                    transform: 'translateY(-50%)', fontSize: '14px',
                    color: textSecondary, pointerEvents: 'none'
                  }} />
                  <select
                    value={form.assigned_to}
                    onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))}
                    style={{
                      ...sharedInputStyle,
                      paddingLeft: '36px',
                      paddingRight: '32px',
                      appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer'
                    }}
                  >
                    <option value="">— Unassigned —</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                    ))}
                  </select>
                  <i className="ti ti-chevron-down" style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)', fontSize: '13px',
                    color: textSecondary, pointerEvents: 'none'
                  }} />
                </div>
              </Field>

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
                  borderRadius: '10px', padding: '10px 14px', marginBottom: '1rem'
                }}>
                  <p style={{ color: '#e53935', fontSize: '12px', margin: 0 }}>{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit" disabled={loading}
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
                  boxShadow: loading ? 'none'
                    : (dm
                        ? '0 6px 20px rgba(79,110,247,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
                        : '0 6px 16px rgba(26,35,126,0.3), inset 0 1px 0 rgba(255,255,255,0.15)'),
                  transition: 'all 0.2s'
                }}
              >
                {loading ? 'Creating Task...' : '+ Create Task'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

function Field({ label, children, required, textPrimary }) {
  return (
    <div style={{ marginBottom: '1.4rem' }}>
      <label style={{
        fontSize: '12px', fontWeight: 700, color: textPrimary,
        display: 'block', marginBottom: '8px', letterSpacing: '0.3px'
      }}>
        {label} {required && <span style={{ color: '#e53935' }}>*</span>}
      </label>
      {children}
    </div>
  )
}