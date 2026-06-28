import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useDarkMode } from '../context/DarkModeContext'
import Sidebar from '../components/Sidebar'

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { darkMode } = useDarkMode()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [members, setMembers] = useState([])
  const [tasks, setTasks] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddMember, setShowAddMember] = useState(false)
  const [searchEmail, setSearchEmail] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searchMsg, setSearchMsg] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  const dm = darkMode

  // Design tokens
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
  const inputBorder = dm ? 'rgba(79,110,247,0.2)' : 'rgba(26,35,126,0.15)'
  const inputShadow = dm
    ? 'inset 4px 4px 10px rgba(0,0,0,0.4), inset -2px -2px 6px rgba(255,255,255,0.02)'
    : 'inset 4px 4px 10px rgba(26,35,126,0.06), inset -2px -2px 6px rgba(255,255,255,0.9)'
  const dividerColor = dm ? 'rgba(255,255,255,0.05)' : 'rgba(26,35,126,0.06)'

  const memberList = useMemo(() => {
    if (!project) return members
    const ownerId = project.owner_id
    const ownerProfile = project.profiles
    const otherMembers = members.filter(m => m.profiles?.id !== ownerId)
    if (!ownerProfile) return members
    return [
      { id: `owner-${ownerId}`, user_id: ownerId, profiles: ownerProfile },
      ...otherMembers
    ]
  }, [project, members])

  const isOwner = useMemo(() => {
    if (!project || !user) return false
    return project.owner_id === user.id
  }, [project, user])

  useEffect(() => { fetchAll() }, [id])

  async function fetchAll() {
    setLoading(true)

    const { data: proj } = await supabase
      .from('projects').select('*').eq('id', id).single()
    setProject(proj)

    const { data: memberData } = await supabase
      .from('project_members').select('*').eq('project_id', id)

    if (memberData && memberData.length > 0) {
      const userIds = memberData.map(m => m.user_id)
      const { data: profileData } = await supabase
        .from('profiles').select('*').in('id', userIds)
      const membersWithProfiles = memberData.map(m => ({
        ...m,
        profiles: profileData?.find(p => p.id === m.user_id) || null
      }))
      setMembers(membersWithProfiles)
    } else {
      setMembers([])
    }

    const { data: taskData } = await supabase
      .from('tasks').select('*').eq('project_id', id).order('created_at', { ascending: false })
    setTasks(taskData || [])

    const { data: logData } = await supabase
      .from('activity_logs').select('*').eq('project_id', id)
      .order('created_at', { ascending: false }).limit(10)
    setLogs(logData || [])

    setLoading(false)
  }

  async function searchUser() {
    setSearchMsg(''); setSearchResult(null)
    const { data } = await supabase.from('profiles').select('*').eq('email', searchEmail.trim()).single()
    if (!data) return setSearchMsg('No user found with that email.')
    if (project && data.id === project.owner_id) return setSearchMsg('Owner is already a member.')
    const alreadyMember = members.some(m => m.profiles?.id === data.id)
    if (alreadyMember) return setSearchMsg('User is already a member.')
    setSearchResult(data)
  }

  async function addMember() {
    if (!searchResult) return
    await supabase.from('project_members').insert({ project_id: id, user_id: searchResult.id })
    await supabase.from('activity_logs').insert({
      project_id: id, user_id: user.id,
      action: `added ${searchResult.name} as a member`
    })
    setSearchEmail(''); setSearchResult(null); setShowAddMember(false)
    fetchAll()
  }

  async function removeMember(memberId, memberName) {
    await supabase.from('project_members').delete().eq('project_id', id).eq('user_id', memberId)
    await supabase.from('activity_logs').insert({
      project_id: id, user_id: user.id,
      action: `removed ${memberName} from the project`
    })
    fetchAll()
  }

  async function deleteProject() {
    if (!confirm('Delete this project? This cannot be undone.')) return
    await supabase.from('projects').delete().eq('id', id)
    navigate('/dashboard')
  }

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'Done').length
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length
  const reviewTasks = tasks.filter(t => t.status === 'Review').length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const tabs = ['overview', 'members', 'activity']

  const btnPrimary = {
    background: dm
      ? 'linear-gradient(135deg, #4f6ef7, #3451d1)'
      : 'linear-gradient(135deg, #1a237e, #283593)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '9px 16px',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '12px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: dm
      ? '0 4px 16px rgba(79,110,247,0.35)'
      : '0 4px 12px rgba(26,35,126,0.25)'
  }

  const btnOutline = {
    background: dm ? 'linear-gradient(145deg, #141828, #0d1020)' : '#ffffff',
    color: dm ? '#e8ecff' : '#1a237e',
    border: dm ? '1px solid rgba(79,110,247,0.25)' : '1px solid rgba(26,35,126,0.2)',
    borderRadius: '10px',
    padding: '9px 16px',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '12px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: dm ? cardShadow : cardShadow
  }

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: pageBg, fontFamily: "'Poppins',sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '2rem 2.5rem', color: textPrimary, fontSize: '14px' }}>
        Loading...
      </main>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: pageBg, fontFamily: "'Poppins',sans-serif", color: textPrimary }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '2rem 2.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button onClick={() => navigate('/dashboard')} style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: dm ? 'linear-gradient(145deg, #141828, #0d1020)' : '#ffffff',
              border: borderGlow,
              boxShadow: dm ? cardShadow : cardShadow,
              cursor: 'pointer',
              color: textPrimary,
              fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <i className="ti ti-arrow-left" />
            </button>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: textPrimary, margin: 0, letterSpacing: '-0.4px' }}>
                {project?.name}
              </h1>
              <p style={{ color: textSecondary, fontSize: '12px', margin: '3px 0 0' }}>
                {project?.start_date} → {project?.end_date || 'No end date'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={() => navigate(`/projects/${id}/tasks/create`)} style={btnPrimary}>
              <i className="ti ti-plus" /> New Task
            </button>
            <button onClick={() => navigate(`/projects/${id}/kanban`)} style={btnOutline}>
              <i className="ti ti-layout-kanban" /> Kanban
            </button>
            {isOwner && (
              <button onClick={() => { setActiveTab('members'); setShowAddMember(true) }} style={btnPrimary}>
                <i className="ti ti-user-plus" /> Add Member
              </button>
            )}
            {isOwner && (
              <button onClick={deleteProject} style={{
                ...btnOutline,
                color: '#e53935',
                border: dm ? '1px solid rgba(229,57,53,0.3)' : '1px solid rgba(229,57,53,0.4)'
              }}>
                <i className="ti ti-trash" />
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.8rem' }}>
          {[
            { label: 'Total', value: totalTasks, color: dm ? '#4f6ef7' : '#1a237e', icon: 'ti-clipboard-list' },
            { label: 'In Progress', value: inProgressTasks, color: dm ? '#60a5fa' : '#1565c0', icon: 'ti-loader' },
            { label: 'In Review', value: reviewTasks, color: dm ? '#fb923c' : '#e65100', icon: 'ti-eye' },
            { label: 'Completed', value: completedTasks, color: dm ? '#34d399' : '#2e7d32', icon: 'ti-circle-check' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: surfaceBg,
              borderRadius: '14px',
              padding: '1rem 1.2rem',
              border: borderGlow,
              boxShadow: cardShadow,
              display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: stat.color + (dm ? '20' : '12'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '17px', color: stat.color,
                boxShadow: dm
                  ? 'inset 2px 2px 5px rgba(0,0,0,0.3)'
                  : 'inset 2px 2px 5px rgba(0,0,0,0.04)'
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

        {/* Progress Bar */}
        <div style={{
          background: surfaceBg, borderRadius: '16px',
          padding: '1.4rem 1.6rem', marginBottom: '1.8rem',
          boxShadow: cardShadow, border: borderGlow
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>Project Progress</span>
            <span style={{
              fontSize: '13px', fontWeight: 800,
              color: progress === 100
                ? (dm ? '#34d399' : '#2e7d32')
                : (dm ? '#4f6ef7' : '#1a237e')
            }}>
              {progress}%
            </span>
          </div>
          <div style={{
            background: dm ? 'rgba(0,0,0,0.4)' : 'rgba(26,35,126,0.06)',
            borderRadius: '999px', height: '10px', overflow: 'hidden',
            boxShadow: dm
              ? 'inset 3px 3px 8px rgba(0,0,0,0.5)'
              : 'inset 3px 3px 8px rgba(26,35,126,0.08)'
          }}>
            <div style={{
              height: '100%', borderRadius: '999px',
              background: progress === 100
                ? (dm ? 'linear-gradient(90deg, #059669, #34d399)' : 'linear-gradient(90deg, #2e7d32, #43a047)')
                : (dm ? 'linear-gradient(90deg, #3451d1, #4f6ef7, #6b8eff)' : 'linear-gradient(90deg, #1a237e, #3949ab)'),
              width: `${progress}%`,
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: dm
                ? `0 0 12px ${progress === 100 ? 'rgba(52,211,153,0.5)' : 'rgba(79,110,247,0.5)'}`
                : 'none'
            }} />
          </div>
          <p style={{ fontSize: '11px', color: textSecondary, marginTop: '8px' }}>
            {completedTasks} of {totalTasks} tasks completed
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '4px', marginBottom: '1.8rem',
          background: surfaceBg,
          borderRadius: '12px', padding: '5px',
          width: 'fit-content',
          boxShadow: cardShadow, border: borderGlow
        }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 22px', border: 'none', borderRadius: '9px', cursor: 'pointer',
              fontFamily: "'Poppins',sans-serif", fontSize: '12px', fontWeight: 700,
              background: activeTab === tab
                ? dm ? 'linear-gradient(135deg, #4f6ef7, #3451d1)' : 'linear-gradient(135deg, #1a237e, #283593)'
                : 'transparent',
              color: activeTab === tab ? '#fff' : textSecondary,
              textTransform: 'capitalize',
              transition: 'all 0.2s',
              boxShadow: activeTab === tab
                ? (dm ? '0 4px 12px rgba(79,110,247,0.35)' : '0 4px 10px rgba(26,35,126,0.25)')
                : 'none'
            }}>
              {tab}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1rem' }}>
            {tasks.length === 0 ? (
              <div style={{
                background: surfaceBg, borderRadius: '16px', padding: '2.5rem',
                textAlign: 'center', boxShadow: cardShadow, border: borderGlow, gridColumn: '1/-1'
              }}>
                <i className="ti ti-clipboard-off" style={{ fontSize: '36px', color: dm ? '#4f6ef7' : '#c5cae9' }} />
                <p style={{ color: textSecondary, fontSize: '13px', marginTop: '10px' }}>
                  No tasks yet. Add your first task to get started!
                </p>
              </div>
            ) : tasks.map(task => (
              <TaskCard key={task.id} task={task} darkMode={dm}
                surfaceBg={surfaceBg} cardShadow={cardShadow}
                textPrimary={textPrimary} textSecondary={textSecondary} borderGlow={borderGlow} />
            ))}
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div style={{
            background: surfaceBg, borderRadius: '18px',
            padding: '1.6rem', boxShadow: cardShadow,
            border: borderGlow, maxWidth: '520px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, margin: 0 }}>
                Team Members <span style={{
                  fontSize: '11px', background: dm ? 'rgba(79,110,247,0.15)' : '#e8eaf6',
                  color: dm ? '#4f6ef7' : '#1a237e', padding: '2px 8px',
                  borderRadius: '20px', marginLeft: '6px'
                }}>{memberList.length}</span>
              </h3>
              {isOwner && (
                <button onClick={() => setShowAddMember(p => !p)} style={{
                  ...btnPrimary, padding: '7px 14px'
                }}>
                  <i className="ti ti-user-plus" /> Add
                </button>
              )}
            </div>

            {showAddMember && isOwner && (
              <div style={{
                background: dm ? 'rgba(0,0,0,0.3)' : '#f0f2f8',
                borderRadius: '12px', padding: '1rem', marginBottom: '1.2rem',
                border: borderGlow,
                boxShadow: dm
                  ? 'inset 4px 4px 10px rgba(0,0,0,0.3)'
                  : 'inset 4px 4px 10px rgba(26,35,126,0.05)'
              }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="email"
                    placeholder="Enter user email..."
                    value={searchEmail}
                    onChange={e => setSearchEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchUser()}
                    style={{
                      flex: 1, padding: '9px 12px',
                      background: inputBg, border: `1.5px solid ${inputBorder}`,
                      boxShadow: inputShadow,
                      borderRadius: '9px',
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '12px', color: textPrimary, outline: 'none'
                    }}
                  />
                  <button onClick={searchUser} style={{ ...btnPrimary, padding: '9px 14px' }}>
                    Search
                  </button>
                </div>
                {searchMsg && <p style={{ color: '#e53935', fontSize: '11px', marginTop: '6px' }}>{searchMsg}</p>}
                {searchResult && (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginTop: '8px', background: surfaceBg, borderRadius: '10px',
                    padding: '10px 12px', boxShadow: cardShadow, border: borderGlow
                  }}>
                    <span style={{ fontSize: '13px', color: textPrimary }}>{searchResult.name} · {searchResult.email}</span>
                    <button onClick={addMember} style={{ ...btnPrimary, padding: '6px 12px' }}>Add</button>
                  </div>
                )}
              </div>
            )}

            {memberList.map(m => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 0', borderBottom: `1px solid ${dividerColor}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: dm
                      ? 'linear-gradient(135deg, #1e2a50, #141e3a)'
                      : 'linear-gradient(135deg, #e8eaf6, #c5cae9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, color: dm ? '#4f6ef7' : '#1a237e',
                    boxShadow: dm
                      ? 'inset 2px 2px 6px rgba(0,0,0,0.4)'
                      : 'inset 2px 2px 6px rgba(26,35,126,0.08)'
                  }}>
                    {m.profiles?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, margin: 0 }}>{m.profiles?.name}</p>
                    <p style={{ fontSize: '11px', color: textSecondary, margin: 0 }}>{m.profiles?.email}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {m.profiles?.id === project?.owner_id && (
                    <span style={{
                      fontSize: '10px',
                      background: dm ? 'rgba(240,160,75,0.15)' : '#fff8e1',
                      color: dm ? '#f0a04b' : '#e65100',
                      padding: '3px 9px', borderRadius: '20px', fontWeight: 700
                    }}>Owner</span>
                  )}
                  {isOwner && m.profiles?.id !== project?.owner_id && (
                    <button onClick={() => removeMember(m.profiles.id, m.profiles.name)} style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: dm ? 'rgba(229,57,53,0.1)' : '#ffebee',
                      border: dm ? '1px solid rgba(229,57,53,0.2)' : '1px solid rgba(229,57,53,0.1)',
                      cursor: 'pointer', color: '#e53935', fontSize: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <i className="ti ti-user-minus" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <div style={{
            background: surfaceBg, borderRadius: '18px',
            padding: '1.6rem', boxShadow: cardShadow,
            border: borderGlow, maxWidth: '520px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, margin: '0 0 1.4rem' }}>Activity Log</h3>
            {logs.length === 0 ? (
              <p style={{ color: textSecondary, fontSize: '13px' }}>No activity yet.</p>
            ) : logs.map((log, i) => (
              <div key={log.id} style={{
                display: 'flex', gap: '12px',
                padding: '12px 0',
                borderBottom: i < logs.length - 1 ? `1px solid ${dividerColor}` : 'none'
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  background: dm ? 'linear-gradient(135deg, #1e2a50, #141e3a)' : 'linear-gradient(135deg, #e8eaf6, #c5cae9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700, color: dm ? '#4f6ef7' : '#1a237e',
                  boxShadow: dm ? 'inset 2px 2px 5px rgba(0,0,0,0.3)' : 'inset 2px 2px 5px rgba(26,35,126,0.06)'
                }}>
                  {log.profiles?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: textPrimary, margin: 0, lineHeight: 1.5 }}>
                    <strong>{log.profiles?.name}</strong> {log.action}
                  </p>
                  <p style={{ fontSize: '10px', color: textSecondary, margin: '3px 0 0' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function TaskCard({ task, darkMode: dm, surfaceBg, cardShadow, textPrimary, textSecondary, borderGlow }) {
  const [hovered, setHovered] = useState(false)

  const statusColors = {
    'To Do': { text: '#9e9e9e', bg: dm ? '#1a1a1a' : '#f5f5f5' },
    'In Progress': { text: dm ? '#60a5fa' : '#1565c0', bg: dm ? '#0f1e30' : '#e3f2fd' },
    'Review': { text: dm ? '#fb923c' : '#e65100', bg: dm ? '#2a1500' : '#fff3e0' },
    'Done': { text: dm ? '#34d399' : '#2e7d32', bg: dm ? '#0a1f14' : '#e8f5e9' },
  }

  const priorityColors = {
    Low: dm ? '#34d399' : '#43a047',
    Medium: dm ? '#fb923c' : '#fb8c00',
    High: dm ? '#f87171' : '#e53935'
  }

  const sc = statusColors[task.status] || statusColors['To Do']
  const pc = priorityColors[task.priority] || '#999'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: surfaceBg,
        borderRadius: '14px',
        padding: '1.2rem',
        border: hovered
          ? dm ? '1px solid rgba(79,110,247,0.25)' : '1px solid rgba(26,35,126,0.12)'
          : borderGlow,
        boxShadow: hovered
          ? dm
            ? '10px 10px 28px rgba(0,0,0,0.55), -2px -2px 10px rgba(255,255,255,0.04)'
            : '10px 10px 24px rgba(26,35,126,0.1), -4px -4px 12px rgba(255,255,255,0.95)'
          : cardShadow,
        borderTop: `3px solid ${sc.text}`,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, margin: 0, lineHeight: 1.3, flex: 1 }}>
          {task.task_name}
        </h4>
        <span style={{
          fontSize: '10px', padding: '2px 9px', borderRadius: '20px', fontWeight: 700, marginLeft: '8px',
          background: pc + (dm ? '20' : '18'), color: pc
        }}>{task.priority}</span>
      </div>
      <p style={{ fontSize: '11px', color: textSecondary, margin: '0 0 12px', lineHeight: 1.6 }}>
        {task.description || 'No description'}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontWeight: 700,
          background: sc.bg, color: sc.text
        }}>{task.status}</span>
        {task.due_date && (
          <span style={{ fontSize: '10px', color: textSecondary, display: 'flex', alignItems: 'center', gap: '3px' }}>
            <i className="ti ti-calendar" /> {task.due_date}
          </span>
        )}
      </div>
    </div>
  )
}