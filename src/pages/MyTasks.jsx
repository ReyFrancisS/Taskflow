import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useDarkMode } from '../context/DarkModeContext'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

const STATUSES = ['To Do', 'In Progress', 'Review', 'Done']

export default function MyTasks() {
  const { user } = useAuth()
  const { darkMode } = useDarkMode()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterPriority, setFilterPriority] = useState('All')

  const dm = darkMode

  const pageBg = dm
    ? 'radial-gradient(ellipse at 20% 0%, #0f1629 0%, #0a0c16 40%, #06080f 100%)'
    : '#f0f2f8'
  const surfaceBg = dm ? 'linear-gradient(145deg, #141828, #0d1020)' : '#ffffff'
  const cardShadow = dm
    ? '8px 8px 24px rgba(0,0,0,0.5), -2px -2px 8px rgba(255,255,255,0.03)'
    : '8px 8px 20px rgba(26,35,126,0.08), -4px -4px 12px rgba(255,255,255,0.9)'
  const textPrimary = dm ? '#e8ecff' : '#1a237e'
  const textSecondary = dm ? '#6b7db3' : '#8892b0'
  const accentBlue = dm ? '#4f6ef7' : '#1a237e'
  const borderGlow = dm ? '1px solid rgba(79,110,247,0.12)' : '1px solid rgba(26,35,126,0.07)'
  const inputBg = dm ? 'linear-gradient(145deg, #0a0c16, #0f1220)' : '#ffffff'
  const inputShadow = dm
    ? 'inset 4px 4px 10px rgba(0,0,0,0.4), inset -2px -2px 6px rgba(255,255,255,0.02)'
    : 'inset 4px 4px 10px rgba(26,35,126,0.06), inset -2px -2px 6px rgba(255,255,255,0.9)'

  const statusConfig = {
    'To Do':       { color: dm ? '#9e9e9e' : '#757575', bg: dm ? 'rgba(158,158,158,0.1)' : '#f5f5f5' },
    'In Progress': { color: dm ? '#60a5fa' : '#1565c0', bg: dm ? 'rgba(96,165,250,0.1)'  : '#e3f2fd' },
    'Review':      { color: dm ? '#fb923c' : '#e65100', bg: dm ? 'rgba(251,146,60,0.1)'  : '#fff3e0' },
    'Done':        { color: dm ? '#34d399' : '#2e7d32', bg: dm ? 'rgba(52,211,153,0.1)'  : '#e8f5e9' },
  }
  const priorityColors = {
    Low:    dm ? '#34d399' : '#43a047',
    Medium: dm ? '#fb923c' : '#fb8c00',
    High:   dm ? '#f87171' : '#e53935',
  }

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
      project_id: projectId, user_id: user.id,
      action: `updated task status to "${newStatus}"`
    })
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
  }

  const filtered = tasks.filter(t => {
    const byStatus = filterStatus === 'All' || t.status === filterStatus
    const byPriority = filterPriority === 'All' || t.priority === filterPriority
    return byStatus && byPriority
  })

  const totalTasks   = tasks.length
  const doneTasks    = tasks.filter(t => t.status === 'Done').length
  const activeTasks  = tasks.filter(t => t.status === 'In Progress').length
  const highPriority = tasks.filter(t => t.priority === 'High').length

  const filterBtnStyle = (active) => ({
    padding: '7px 14px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '11px',
    fontWeight: 700,
    background: active
      ? (dm ? 'linear-gradient(135deg, #4f6ef7, #3451d1)' : 'linear-gradient(135deg, #1a237e, #283593)')
      : (dm ? 'linear-gradient(145deg, #141828, #0d1020)' : '#ffffff'),
    color: active ? '#fff' : textSecondary,
    boxShadow: active
      ? (dm ? '0 4px 12px rgba(79,110,247,0.35)' : '0 4px 10px rgba(26,35,126,0.2)')
      : (dm ? cardShadow : cardShadow),
    border: active ? 'none' : borderGlow,
    transition: 'all 0.2s',
  })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: pageBg, fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar />
      <Topbar title="My Tasks" />
      <main style={{ marginLeft: '220px', flex: 1, padding: '2rem 2.5rem', paddingTop: '88px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: textPrimary, margin: 0, letterSpacing: '-0.5px' }}>My Tasks</h1>
            <p style={{ color: textSecondary, fontSize: '13px', margin: '4px 0 0' }}>All tasks assigned to you across projects.</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Tasks',   value: totalTasks,   icon: 'ti-clipboard-list', color: dm ? '#4f6ef7' : '#1a237e' },
            { label: 'In Progress',   value: activeTasks,  icon: 'ti-loader',          color: dm ? '#60a5fa' : '#1565c0' },
            { label: 'Completed',     value: doneTasks,    icon: 'ti-circle-check',    color: dm ? '#34d399' : '#2e7d32' },
            { label: 'High Priority', value: highPriority, icon: 'ti-alert-triangle',  color: dm ? '#f87171' : '#e53935' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: surfaceBg, borderRadius: '14px',
              padding: '1rem 1.2rem', border: borderGlow, boxShadow: cardShadow,
              display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '11px',
                background: stat.color + (dm ? '20' : '12'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', color: stat.color,
                boxShadow: dm ? 'inset 2px 2px 5px rgba(0,0,0,0.3)' : 'inset 2px 2px 5px rgba(0,0,0,0.04)'
              }}>
                <i className={`ti ${stat.icon}`} />
              </div>
              <div>
                <p style={{ fontSize: '20px', fontWeight: 800, color: textPrimary, margin: 0, lineHeight: 1 }}>{stat.value}</p>
                <p style={{ fontSize: '11px', color: textSecondary, margin: '2px 0 0', fontWeight: 500 }}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: textSecondary, fontWeight: 600, marginRight: '4px' }}>Status:</span>
          {['All', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={filterBtnStyle(filterStatus === s)}>
              {s}
            </button>
          ))}
          <span style={{ fontSize: '12px', color: textSecondary, fontWeight: 600, margin: '0 4px 0 12px' }}>Priority:</span>
          {['All', 'Low', 'Medium', 'High'].map(p => (
            <button key={p} onClick={() => setFilterPriority(p)} style={filterBtnStyle(filterPriority === p)}>
              {p}
            </button>
          ))}
        </div>

        {/* Task Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '1rem' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{
                background: surfaceBg, borderRadius: '14px', padding: '1.5rem', height: '180px',
                boxShadow: cardShadow, border: borderGlow
              }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
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
              <i className="ti ti-clipboard-off" style={{ fontSize: '28px', color: dm ? '#4f6ef7' : '#c5cae9' }} />
            </div>
            <p style={{ color: textPrimary, fontSize: '14px', fontWeight: 600, margin: '0 0 6px' }}>No tasks found</p>
            <p style={{ color: textSecondary, fontSize: '12px', margin: 0 }}>
              {tasks.length > 0 ? 'Try adjusting the filters.' : 'No tasks have been assigned to you yet.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '1rem' }}>
            {filtered.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                dm={dm}
                surfaceBg={surfaceBg}
                cardShadow={cardShadow}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
                borderGlow={borderGlow}
                inputBg={inputBg}
                inputShadow={inputShadow}
                statusConfig={statusConfig}
                priorityColors={priorityColors}
                onStatusChange={updateStatus}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function TaskCard({ task, dm, surfaceBg, cardShadow, textPrimary, textSecondary, borderGlow, inputBg, inputShadow, statusConfig, priorityColors, onStatusChange }) {
  const [hovered, setHovered] = useState(false)
  const sc = statusConfig[task.status] || statusConfig['To Do']
  const pc = priorityColors[task.priority] || '#999'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: surfaceBg,
        borderRadius: '16px',
        padding: '1.3rem',
        border: hovered
          ? (dm ? '1px solid rgba(79,110,247,0.3)' : '1px solid rgba(26,35,126,0.15)')
          : borderGlow,
        borderTop: `3px solid ${sc.color}`,
        boxShadow: hovered
          ? (dm
              ? '10px 10px 28px rgba(0,0,0,0.55), -2px -2px 10px rgba(255,255,255,0.04)'
              : '10px 10px 24px rgba(26,35,126,0.1), -4px -4px 12px rgba(255,255,255,0.95)')
          : cardShadow,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative', overflow: 'hidden'
      }}
    >
      {dm && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: '60px', height: '60px',
          background: `radial-gradient(circle, ${sc.color}10 0%, transparent 70%)`,
          pointerEvents: 'none'
        }} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, margin: 0, lineHeight: 1.3, flex: 1 }}>
          {task.task_name}
        </h4>
        <span style={{
          fontSize: '10px', padding: '3px 9px', borderRadius: '20px', fontWeight: 700, marginLeft: '8px',
          background: pc + (dm ? '20' : '18'), color: pc, flexShrink: 0
        }}>{task.priority}</span>
      </div>

      <p style={{ fontSize: '11px', color: textSecondary, margin: '0 0 12px', lineHeight: 1.6 }}>
        {task.description || 'No description provided.'}
      </p>

      {task.due_date && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          fontSize: '11px', color: textSecondary,
          background: dm ? 'rgba(255,255,255,0.04)' : 'rgba(26,35,126,0.05)',
          padding: '4px 10px', borderRadius: '8px',
          marginBottom: '12px', border: borderGlow
        }}>
          <i className="ti ti-calendar" style={{ fontSize: '12px' }} />
          Due: {task.due_date}
        </div>
      )}

      {/* Divider */}
      <div style={{
        height: '1px',
        background: dm ? 'rgba(255,255,255,0.05)' : 'rgba(26,35,126,0.06)',
        marginBottom: '12px'
      }} />

      {/* Status Selector */}
      <div>
        <label style={{ fontSize: '11px', color: textSecondary, fontWeight: 600, display: 'block', marginBottom: '6px', letterSpacing: '0.3px' }}>
          Update Status
        </label>
        <div style={{ position: 'relative' }}>
          <select
            value={task.status}
            onChange={e => onStatusChange(task.id, e.target.value, task.project_id)}
            style={{
              width: '100%',
              padding: '9px 32px 9px 12px',
              background: inputBg,
              border: `1.5px solid ${sc.color}60`,
              boxShadow: inputShadow,
              borderRadius: '10px',
              fontFamily: "'Poppins', sans-serif",
              fontSize: '12px',
              color: sc.color,
              fontWeight: 700,
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none',
            }}
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <i className="ti ti-chevron-down" style={{
            position: 'absolute', right: '10px', top: '50%',
            transform: 'translateY(-50%)', fontSize: '13px',
            color: sc.color, pointerEvents: 'none'
          }} />
        </div>
      </div>
    </div>
  )
}