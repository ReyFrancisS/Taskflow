import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useDarkMode } from '../context/DarkModeContext'
import Sidebar from '../components/Sidebar'

const STATUSES = ['To Do', 'In Progress', 'Review', 'Done']

export default function KanbanBoard() {
  const { id } = useParams()
  const { user } = useAuth()
  const { darkMode } = useDarkMode()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dragging, setDragging] = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)

  const dm = darkMode

  const pageBg = dm
    ? 'radial-gradient(ellipse at 20% 0%, #0f1629 0%, #0a0c16 40%, #06080f 100%)'
    : '#f0f2f8'

  const colBg = dm
    ? 'linear-gradient(145deg, #0f1220, #0a0c18)'
    : '#ffffff'

  const cardBg = dm
    ? 'linear-gradient(145deg, #141828, #0d1020)'
    : '#ffffff'

  const colShadow = dm
    ? '8px 8px 24px rgba(0,0,0,0.5), -2px -2px 8px rgba(255,255,255,0.02)'
    : '8px 8px 20px rgba(26,35,126,0.07), -4px -4px 12px rgba(255,255,255,0.9)'

  const cardShadow = dm
    ? '6px 6px 18px rgba(0,0,0,0.45), -2px -2px 6px rgba(255,255,255,0.025)'
    : '6px 6px 16px rgba(26,35,126,0.07), -3px -3px 10px rgba(255,255,255,0.9)'

  const textPrimary = dm ? '#e8ecff' : '#1a237e'
  const textSecondary = dm ? '#6b7db3' : '#8892b0'
  const accentBlue = dm ? '#4f6ef7' : '#1a237e'
  const borderGlow = dm ? '1px solid rgba(79,110,247,0.12)' : '1px solid rgba(26,35,126,0.07)'

  const statusConfig = {
    'To Do': {
      color: dm ? '#9e9e9e' : '#757575',
      glow: dm ? 'rgba(158,158,158,0.4)' : 'rgba(117,117,117,0.3)',
      bg: dm ? 'rgba(158,158,158,0.08)' : '#f9f9f9',
      border: dm ? 'rgba(158,158,158,0.2)' : 'rgba(117,117,117,0.15)'
    },
    'In Progress': {
      color: dm ? '#60a5fa' : '#1565c0',
      glow: dm ? 'rgba(96,165,250,0.4)' : 'rgba(21,101,192,0.25)',
      bg: dm ? 'rgba(96,165,250,0.08)' : '#e3f2fd',
      border: dm ? 'rgba(96,165,250,0.2)' : 'rgba(21,101,192,0.15)'
    },
    'Review': {
      color: dm ? '#fb923c' : '#e65100',
      glow: dm ? 'rgba(251,146,60,0.4)' : 'rgba(230,81,0,0.25)',
      bg: dm ? 'rgba(251,146,60,0.08)' : '#fff3e0',
      border: dm ? 'rgba(251,146,60,0.2)' : 'rgba(230,81,0,0.15)'
    },
    'Done': {
      color: dm ? '#34d399' : '#2e7d32',
      glow: dm ? 'rgba(52,211,153,0.4)' : 'rgba(46,125,50,0.25)',
      bg: dm ? 'rgba(52,211,153,0.08)' : '#e8f5e9',
      border: dm ? 'rgba(52,211,153,0.2)' : 'rgba(46,125,50,0.15)'
    }
  }

  const priorityColors = {
    Low: dm ? '#34d399' : '#43a047',
    Medium: dm ? '#fb923c' : '#fb8c00',
    High: dm ? '#f87171' : '#e53935'
  }

  useEffect(() => { fetchAll() }, [id])

  async function fetchAll() {
    setLoading(true)

    const { data: proj } = await supabase.from('projects').select('*').eq('id', id).single()
    setProject(proj)

    const { data: taskData } = await supabase.from('tasks').select('*').eq('project_id', id)
    const { data: memberData } = await supabase.from('project_members').select('*').eq('project_id', id)

    if (memberData && memberData.length > 0) {
      const userIds = memberData.map(m => m.user_id)
      const { data: profileData } = await supabase.from('profiles').select('*').in('id', userIds)
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

  function onDragStart(e, task) {
    if (task.assigned_to !== user?.id && project?.owner_id !== user?.id) {
      e.preventDefault(); return
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
    if (dragging && dragging.status !== status) updateTaskStatus(dragging.id, status)
    setDragging(null); setDragOverCol(null)
  }

  function onDragEnd() { setDragging(null); setDragOverCol(null) }

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: pageBg, fontFamily: "'Poppins',sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '2rem 2.5rem', color: textPrimary }}>Loading...</main>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: pageBg, fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '2rem 2.5rem', overflow: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <button onClick={() => navigate(`/projects/${id}`)} style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: dm ? 'linear-gradient(145deg, #141828, #0d1020)' : '#ffffff',
            border: borderGlow,
            boxShadow: colShadow,
            cursor: 'pointer',
            color: textPrimary,
            fontSize: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <i className="ti ti-arrow-left" />
          </button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: textPrimary, margin: 0, letterSpacing: '-0.4px' }}>
              Kanban Board
            </h1>
            <p style={{ color: textSecondary, fontSize: '12px', margin: '3px 0 0' }}>{project?.name}</p>
          </div>
          <button
            onClick={() => navigate(`/projects/${id}/tasks/create`)}
            style={{
              marginLeft: 'auto',
              display: 'flex', alignItems: 'center', gap: '6px',
              background: dm
                ? 'linear-gradient(135deg, #4f6ef7, #3451d1)'
                : 'linear-gradient(135deg, #1a237e, #283593)',
              color: '#fff', border: 'none',
              borderRadius: '10px', padding: '9px 18px',
              cursor: 'pointer', fontFamily: "'Poppins',sans-serif",
              fontSize: '12px', fontWeight: 700,
              boxShadow: dm
                ? '0 4px 16px rgba(79,110,247,0.4)'
                : '0 4px 12px rgba(26,35,126,0.25)'
            }}
          >
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
            const sc = statusConfig[status]
            const isOver = dragOverCol === status

            return (
              <div
                key={status}
                onDragOver={e => onDragOver(e, status)}
                onDrop={e => onDrop(e, status)}
                style={{
                  background: isOver ? sc.bg : colBg,
                  borderRadius: '18px',
                  border: isOver
                    ? `2px solid ${sc.color}`
                    : borderGlow,
                  padding: '1.2rem',
                  minHeight: '440px',
                  boxShadow: isOver
                    ? `${colShadow}, 0 0 20px ${sc.glow}`
                    : colShadow,
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Ambient glow top */}
                {dm && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                    background: `linear-gradient(90deg, transparent, ${sc.color}60, transparent)`,
                    borderRadius: '18px 18px 0 0',
                    opacity: isOver ? 1 : 0.4,
                    transition: 'opacity 0.2s'
                  }} />
                )}

                {/* Column Header */}
                <div style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', marginBottom: '1.2rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: sc.color,
                      boxShadow: dm ? `0 0 8px ${sc.color}` : 'none'
                    }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: sc.color }}>
                      {status}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 700,
                    background: sc.bg, color: sc.color,
                    padding: '2px 9px', borderRadius: '20px',
                    border: `1px solid ${sc.border}`,
                    boxShadow: dm ? `0 0 6px ${sc.glow}` : 'none'
                  }}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Tasks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {colTasks.length === 0 && (
                    <div style={{
                      border: `2px dashed ${isOver ? sc.color : (dm ? 'rgba(255,255,255,0.08)' : '#e0e0e0')}`,
                      borderRadius: '12px',
                      padding: '1.8rem',
                      textAlign: 'center',
                      color: isOver ? sc.color : textSecondary,
                      fontSize: '12px',
                      fontWeight: isOver ? 600 : 400,
                      background: isOver ? sc.bg : 'transparent',
                      transition: 'all 0.2s'
                    }}>
                      {isOver ? '↓ Drop here' : 'No tasks'}
                    </div>
                  )}
                  {colTasks.map(task => {
                    const pc = priorityColors[task.priority] || '#999'
                    const isDragging = dragging?.id === task.id
                    const canDrag = task.assigned_to === user?.id || project?.owner_id === user?.id

                    return (
                      <div
                        key={task.id}
                        draggable={canDrag}
                        onDragStart={e => onDragStart(e, task)}
                        onDragEnd={onDragEnd}
                        style={{
                          background: isDragging
                            ? (dm ? 'linear-gradient(145deg, #1e2a50, #141e3a)' : '#e8eaf6')
                            : cardBg,
                          borderRadius: '12px',
                          padding: '1rem',
                          boxShadow: isDragging
                            ? (dm
                                ? `12px 12px 30px rgba(0,0,0,0.6), 0 0 20px ${sc.glow}`
                                : '12px 12px 28px rgba(26,35,126,0.18)')
                            : cardShadow,
                          cursor: canDrag ? 'grab' : 'default',
                          opacity: isDragging ? 0.75 : 1,
                          borderLeft: `3px solid ${sc.color}`,
                          border: `1px solid ${isDragging ? sc.color : (dm ? 'rgba(79,110,247,0.1)' : 'rgba(26,35,126,0.06)')}`,
                          borderLeft: `3px solid ${sc.color}`,
                          transform: isDragging ? 'rotate(2deg) scale(1.02)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, margin: '0 0 6px', lineHeight: 1.3 }}>
                          {task.task_name}
                        </p>

                        {task.description && (
                          <p style={{ fontSize: '11px', color: textSecondary, margin: '0 0 10px', lineHeight: 1.5 }}>
                            {task.description.length > 60 ? task.description.substring(0, 60) + '...' : task.description}
                          </p>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '10px', padding: '2px 9px', borderRadius: '20px', fontWeight: 700,
                            background: pc + (dm ? '20' : '18'), color: pc
                          }}>{task.priority}</span>

                          {task.assignee && (
                            <div style={{
                              width: '24px', height: '24px', borderRadius: '50%',
                              background: dm
                                ? 'linear-gradient(135deg, #1e2a50, #141e3a)'
                                : 'linear-gradient(135deg, #e8eaf6, #c5cae9)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '10px', fontWeight: 700, color: dm ? '#4f6ef7' : '#1a237e',
                              boxShadow: dm ? 'inset 1px 1px 4px rgba(0,0,0,0.4)' : 'inset 1px 1px 4px rgba(26,35,126,0.08)'
                            }} title={task.assignee.name}>
                              {task.assignee.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {task.due_date && (
                          <p style={{ fontSize: '10px', color: textSecondary, margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <i className="ti ti-calendar" /> {task.due_date}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}