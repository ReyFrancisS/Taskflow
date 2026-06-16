import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'

export default function CreateTask() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [form, setForm] = useState({
    task_name: '',
    description: '',
    priority: 'Medium',
    due_date: '',
    assigned_to: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchMembers() }, [id])

  async function fetchMembers() {
    const { data: memberData } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', id)

    if (memberData && memberData.length > 0) {
      const userIds = memberData.map(m => m.user_id)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)
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
      project_id: id,
      user_id: user.id,
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2ff', fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '2rem 2.5rem' }}>
        <div style={{ maxWidth: '560px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
            <button onClick={() => navigate(`/projects/${id}`)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#1a237e', fontSize: '20px'
            }}>
              <i className="ti ti-arrow-left" />
            </button>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a237e', margin: 0 }}>Create Task</h1>
          </div>

          <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(26,35,126,0.07)' }}>
            <form onSubmit={handleSubmit}>
              <FormField label="Task Name" required>
                <input type="text" placeholder="e.g. Design Login Page"
                  value={form.task_name}
                  onChange={e => setForm(p => ({...p, task_name: e.target.value}))}
                  required style={inputStyle} />
              </FormField>

              <FormField label="Description">
                <textarea placeholder="Describe this task..."
                  value={form.description}
                  onChange={e => setForm(p => ({...p, description: e.target.value}))}
                  rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField label="Priority">
                  <select value={form.priority}
                    onChange={e => setForm(p => ({...p, priority: e.target.value}))}
                    style={inputStyle}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </FormField>

                <FormField label="Due Date">
                  <input type="date" value={form.due_date}
                    onChange={e => setForm(p => ({...p, due_date: e.target.value}))}
                    style={inputStyle} />
                </FormField>
              </div>

              <FormField label="Assign To">
                <select value={form.assigned_to}
                  onChange={e => setForm(p => ({...p, assigned_to: e.target.value}))}
                  style={inputStyle}>
                  <option value="">— Unassigned —</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                  ))}
                </select>
              </FormField>

              {error && <p style={{ color: '#c62828', fontSize: '12px', marginBottom: '12px' }}>{error}</p>}

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '12px',
                background: '#1a237e', color: '#fff', border: 'none',
                borderRadius: '8px', fontFamily: "'Poppins', sans-serif",
                fontSize: '13px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.5px'
              }}>
                {loading ? 'Creating...' : 'Create Task'}
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
  background: '#fff'
}