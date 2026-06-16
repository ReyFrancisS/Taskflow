import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'

const STATUSES = ['To Do', 'In Progress', 'Review', 'Done']

const statusColors = {
  'To Do': { bg: '#f5f5f5', border: '#757575', text: '#757575' },
  'In Progress': { bg: '#e3f2fd', border: '#1565c0', text: '#1565c0' },
  'Review': { bg: '#fff3e0', border: '#e65100', text: '#e65100' },
  'Done': { bg: '#e8f5e9', border: '#2e7d32', text: '#2e7d32' },
}

const priorityColors = {
  Low: '#43a047', Medium: '#fb8c00', High: '#e53935'
}

export default function KanbanBoard() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [project, setProject] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [dragging, setDragging] = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)

  useEffect(() => { fetchAll() }, [id])

  async function fetchAll() {
    setLoading(true)

    const { data: proj } = await supabase
      .from('projects').select('*').eq('id', id).single()
    setProject(proj)

    const { data: taskData } = await supabase
      .from('tasks').select('*').eq('project_id', id)
    
    const { data: memberData } = await supabase
      .from('project_members').select('*').eq('project_id', id)

    if (memberData && memberData.length > 0) {
      const userIds = memberData.map(m => m.user_id)
      const { data: profileData } = await supabase
        .from('profiles').select('*').in('id', userIds)
      setMembers(profileData || [])

      const tasksWithProfiles = (taskData || []).map(t => ({
        ...t,
        assignee: profileData?.find(p => p.id === t.assigned_to) || null
      }))
      setTasks(tasksWithProfiles)
    } else {
      setTasks(taskData || [])
    }

    setLoading(false)
  }

  async function updateTaskStatus(taskId, newStatus) {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    await supabase.from('activity_logs').insert({
      project_id: id, user_id: user.id,
      action: `moved a task to "${newStatus}"`
    })
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
  }

  // Drag handlers
  function onDragStart(e, task) {
    // Only allow drag if assigned to current user or user is owner
    if (task.assigned_to !== user?.id && project?.owner_id !== user?.id) {
      e.preventDefault()
      return
    }
    setDragging(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e, status) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCol(status)
  }

  function onDrop(e, status) {
    e.preventDefault()
    if (dragging && dragging.status !== status) {
      updateTaskStatus(dragging.id, status)
    }
    setDragging(null)
    setDragOverCol(null)
  }

  function onDragEnd() {
    setDragging(null)
    setDragOverCol(null)
  }

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2ff', fontFamily: "'Poppins',sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '2rem 2.5rem', color: '#1a237e' }}>Loading...</main>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2ff', fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '2rem 2.5rem', overflow: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <button onClick={() => navigate(`/projects/${id}`)} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#1a237e', fontSize: '20px'
          }}>
            <i className="ti ti-arrow-left" />
          </button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a237e', margin: 0 }}>
              Kanban Board
            </h1>
            <p style={{ color: '#999', fontSize: '12px', margin: '3px 0 0' }}>{project?.name}</p>
          </div>
          <button onClick={() => navigate(`/projects/${id}/tasks/create`)}
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px',
              background: '#1a237e', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '8px 14px', cursor: 'pointer',
              fontFamily: "'Poppins',sans-serif", fontSize: '12px', fontWeight: 600
            }}>
            <i className="ti ti-plus" /> New Task
          </button>
        </div>

        {/* Kanban Columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          minHeight: '70vh',
          alignItems: 'start'
        }}>
          {STATUSES.map(status => {
            const colTasks = tasks.filter(t => t.status === status)
            const colors = statusColors[status]
            const isOver = dragOverCol === status

            return (
              <div key={status}
                onDragOver={e => onDragOver(e, status)}
                onDrop={e => onDrop(e, status)}
                style={{
                  background: isOver ? colors.bg : '#fff',
                  borderRadius: '14px',
                  border: `2px solid ${isOver ? colors.border : '#e8eaf6'}`,
                  padding: '1rem',
                  minHeight: '400px',
                  transition: 'all 0.2s'
                }}>

                {/* Column Header */}
                <div style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: colors.border
                    }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>
                      {status}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 600,
                    background: colors.bg, color: colors.text,
                    padding: '2px 8px', borderRadius: '20px',
                    border: `1px solid ${colors.border}30`
                  }}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Tasks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {colTasks.length === 0 && (
                    <div style={{
                      border: `2px dashed ${isOver ? colors.border : '#e0e0e0'}`,
                      borderRadius: '10px', padding: '1.5rem',
                      textAlign: 'center', color: '#ccc', fontSize: '12px'
                    }}>
                      {isOver ? 'Drop here' : 'No tasks'}
                    </div>
                  )}
                  {colTasks.map(task => (
                    <div key={task.id}
                      draggable={task.assigned_to === user?.id || project?.owner_id === user?.id}
                      onDragStart={e => onDragStart(e, task)}
                      onDragEnd={onDragEnd}
                      style={{
                        background: dragging?.id === task.id ? '#f0f2ff' : '#fff',
                        borderRadius: '10px', padding: '1rem',
                        boxShadow: dragging?.id === task.id
                          ? '0 8px 24px rgba(26,35,126,0.15)'
                          : '0 2px 8px rgba(26,35,126,0.07)',
                        cursor: task.assigned_to === user?.id || project?.owner_id === user?.id ? 'grab' : 'default',
                        opacity: dragging?.id === task.id ? 0.7 : 1,
                        borderLeft: `3px solid ${colors.border}`,
                        transition: 'all 0.15s'
                      }}>

                      {/* Task Name */}
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a237e', margin: '0 0 6px' }}>
                        {task.task_name}
                      </p>

                      {/* Description */}
                      {task.description && (
                        <p style={{ fontSize: '11px', color: '#999', margin: '0 0 10px', lineHeight: 1.5 }}>
                          {task.description.length > 60
                            ? task.description.substring(0, 60) + '...'
                            : task.description}
                        </p>
                      )}

                      {/* Footer */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 600,
                          background: priorityColors[task.priority] + '18',
                          color: priorityColors[task.priority]
                        }}>{task.priority}</span>

                        {task.assignee && (
                          <div style={{
                            width: '24px', height: '24px', borderRadius: '50%',
                            background: '#e8eaf6', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: '#1a237e'
                          }} title={task.assignee.name}>
                            {task.assignee.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {task.due_date && (
                        <p style={{ fontSize: '10px', color: '#aaa', margin: '8px 0 0' }}>
                          <i className="ti ti-calendar" /> {task.due_date}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}