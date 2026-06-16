import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'

const STATUSES = ['To Do', 'In Progress', 'Review', 'Done']

export default function MyTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) fetchTasks() }, [user])

  async function fetchTasks() {
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }

  async function updateStatus(taskId, newStatus, projectId) {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    await supabase.from('activity_logs').insert({
      project_id: projectId,
      user_id: user.id,
      action: `updated task status to "${newStatus}"`
    })
    fetchTasks()
  }

  const statusColors = {
    'To Do': '#757575', 'In Progress': '#1565c0',
    'Review': '#e65100', 'Done': '#2e7d32'
  }
  const priorityColors = { Low: '#43a047', Medium: '#fb8c00', High: '#e53935' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2ff', fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '2rem 2.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a237e', margin: 0 }}>My Tasks</h1>
          <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 0' }}>All tasks assigned to you.</p>
        </div>

        {loading ? (
          <p style={{ color: '#aaa', fontSize: '13px' }}>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '3rem', textAlign: 'center', boxShadow: '0 2px 12px rgba(26,35,126,0.07)' }}>
            <i className="ti ti-clipboard-off" style={{ fontSize: '40px', color: '#c5cae9' }} />
            <p style={{ color: '#aaa', fontSize: '13px', marginTop: '12px' }}>No tasks assigned to you yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '1rem' }}>
            {tasks.map(task => (
              <div key={task.id} style={{
                background: '#fff', borderRadius: '12px', padding: '1.2rem',
                boxShadow: '0 2px 10px rgba(26,35,126,0.07)',
                borderTop: `3px solid ${statusColors[task.status] || '#ccc'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#1a237e', margin: 0 }}>{task.task_name}</h4>
                  <span style={{
                    fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 600,
                    background: priorityColors[task.priority] + '18', color: priorityColors[task.priority]
                  }}>{task.priority}</span>
                </div>
                <p style={{ fontSize: '11px', color: '#999', margin: '0 0 12px', lineHeight: 1.5 }}>
                  {task.description || 'No description'}
                </p>
                {task.due_date && (
                  <p style={{ fontSize: '11px', color: '#aaa', margin: '0 0 12px' }}>
                    <i className="ti ti-calendar" /> Due: {task.due_date}
                  </p>
                )}
                <div>
                  <label style={{ fontSize: '11px', color: '#888', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Update Status:</label>
                  <select value={task.status}
                    onChange={e => updateStatus(task.id, e.target.value, task.project_id)}
                    style={{
                      width: '100%', padding: '7px 10px',
                      border: `1.5px solid ${statusColors[task.status]}`,
                      borderRadius: '6px', fontFamily: "'Poppins',sans-serif",
                      fontSize: '12px', color: statusColors[task.status],
                      fontWeight: 600, outline: 'none', background: '#fff', cursor: 'pointer'
                    }}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}