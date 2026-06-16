import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
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

  const isOwner = true
//   useMemo(() => {
//     if (!project || !user) return false
//     return project.owner_id === user.id
//   }, [project, user])

  useEffect(() => { fetchAll() }, [id])

  async function fetchAll() {
    setLoading(true)

    const { data: proj, error: projError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
    console.log('project:', proj, 'error:', projError)
    setProject(proj)

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
      
      const membersWithProfiles = memberData.map(m => ({
        ...m,
        profiles: profileData?.find(p => p.id === m.user_id) || null
      }))
      setMembers(membersWithProfiles)
    } else {
      setMembers([])
    }

    const { data: taskData } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
    setTasks(taskData || [])

    const { data: logData } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(10)
    setLogs(logData || [])

    setLoading(false)
  }

  async function searchUser() {
    setSearchMsg(''); setSearchResult(null)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', searchEmail.trim())
      .single()
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
    await supabase.from('project_members')
      .delete().eq('project_id', id).eq('user_id', memberId)
    await supabase.from('activity_logs').insert({
      project_id: id, user_id: user.id,
      action: `removed ${memberName} from the project`
    })
    fetchAll()
  }

  async function deleteProject() {
    if (!confirm('Are you sure you want to delete this project?')) return
    await supabase.from('projects').delete().eq('id', id)
    navigate('/dashboard')
  }

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'Done').length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const tabs = ['overview', 'members', 'activity']

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2ff', fontFamily: "'Poppins',sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '2rem 2.5rem', color: '#1a237e', fontSize: '14px' }}>Loading...</main>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2ff', fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '2rem 2.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a237e', fontSize: '20px' }}>
              <i className="ti ti-arrow-left" />
            </button>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a237e', margin: 0 }}>{project?.name}</h1>
              <p style={{ color: '#999', fontSize: '12px', margin: '3px 0 0' }}>
                Owner: {project?.profiles?.name} · {project?.start_date} → {project?.end_date}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => navigate(`/projects/${id}/tasks/create`)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#1a237e', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '8px 14px', cursor: 'pointer',
              fontFamily: "'Poppins',sans-serif", fontSize: '12px', fontWeight: 600
            }}>
              <i className="ti ti-plus" /> New Task
            </button>
            <button onClick={() => navigate(`/projects/${id}/kanban`)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#fff', color: '#1a237e', border: '1.5px solid #1a237e',
              borderRadius: '8px', padding: '8px 14px', cursor: 'pointer',
              fontFamily: "'Poppins',sans-serif", fontSize: '12px', fontWeight: 600
            }}>
              <i className="ti ti-layout-kanban" /> Kanban
            </button>
            {isOwner && (
              <button onClick={() => { setActiveTab('members'); setShowAddMember(true); }} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: '#1a237e', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '8px 14px', cursor: 'pointer',
                fontFamily: "'Poppins',sans-serif", fontSize: '12px', fontWeight: 600
              }}>
                <i className="ti ti-user-plus" /> Add Member
              </button>
            )}
            {isOwner && (
              <button onClick={deleteProject} style={{
                background: '#fff', color: '#c62828', border: '1.5px solid #c62828',
                borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontSize: '14px'
              }}>
                <i className="ti ti-trash" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.4rem 1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 12px rgba(26,35,126,0.07)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a237e' }}>Project Progress</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1a237e' }}>{progress}%</span>
          </div>
          <div style={{ background: '#e8eaf6', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '999px',
              background: 'linear-gradient(90deg, #3949ab, #1a237e)',
              width: `${progress}%`, transition: 'width 0.6s ease'
            }} />
          </div>
          <p style={{ fontSize: '11px', color: '#aaa', marginTop: '6px' }}>
            {completedTasks} of {totalTasks} tasks completed
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem', background: '#fff', borderRadius: '10px', padding: '4px', width: 'fit-content', boxShadow: '0 2px 8px rgba(26,35,126,0.06)' }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '7px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontFamily: "'Poppins',sans-serif", fontSize: '12px', fontWeight: 600,
              background: activeTab === tab ? '#1a237e' : 'transparent',
              color: activeTab === tab ? '#fff' : '#888',
              textTransform: 'capitalize', transition: 'all 0.2s'
            }}>
              {tab}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: '1rem' }}>
            {tasks.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '2rem', textAlign: 'center', boxShadow: '0 2px 12px rgba(26,35,126,0.07)', gridColumn: '1/-1' }}>
                <i className="ti ti-clipboard-off" style={{ fontSize: '36px', color: '#c5cae9' }} />
                <p style={{ color: '#aaa', fontSize: '13px', marginTop: '10px' }}>No tasks yet. Create your first task!</p>
              </div>
            ) : tasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(26,35,126,0.07)', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1a237e', margin: 0 }}>Members ({memberList.length})</h3>
              {isOwner && (
                <button onClick={() => setShowAddMember(p => !p)} style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  background: '#e8eaf6', color: '#1a237e', border: 'none',
                  borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
                  fontFamily: "'Poppins',sans-serif", fontSize: '12px', fontWeight: 600
                }}>
                  <i className="ti ti-user-plus" /> Add Member
                </button>
              )}
            </div>

            {showAddMember && isOwner && (
              <div style={{ background: '#f0f2ff', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="email" placeholder="Enter user email..."
                    value={searchEmail} onChange={e => setSearchEmail(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={searchUser} style={{
                    background: '#1a237e', color: '#fff', border: 'none',
                    borderRadius: '8px', padding: '8px 14px', cursor: 'pointer',
                    fontFamily: "'Poppins',sans-serif", fontSize: '12px', fontWeight: 600
                  }}>Search</button>
                </div>
                {searchMsg && <p style={{ color: '#c62828', fontSize: '11px', marginTop: '6px' }}>{searchMsg}</p>}
                {searchResult && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', background: '#fff', borderRadius: '8px', padding: '8px 12px' }}>
                    <span style={{ fontSize: '13px', color: '#333' }}>{searchResult.name} — {searchResult.email}</span>
                    <button onClick={addMember} style={{
                      background: '#1a237e', color: '#fff', border: 'none',
                      borderRadius: '6px', padding: '5px 12px', cursor: 'pointer',
                      fontFamily: "'Poppins',sans-serif", fontSize: '11px', fontWeight: 600
                    }}>Add</button>
                  </div>
                )}
              </div>
            )}

            {memberList.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f2ff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: '#e8eaf6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 600, color: '#1a237e'
                  }}>
                    {m.profiles?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#333', margin: 0 }}>{m.profiles?.name}</p>
                    <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>{m.profiles?.email}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {m.profiles?.id === project?.owner_id && (
                    <span style={{ fontSize: '10px', background: '#e8eaf6', color: '#1a237e', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>Owner</span>
                  )}
                  {isOwner && m.profiles?.id !== project?.owner_id && (
                    <button onClick={() => removeMember(m.profiles.id, m.profiles.name)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: '#e53935', fontSize: '16px'
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
          <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(26,35,126,0.07)', maxWidth: '500px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1a237e', margin: '0 0 1.2rem' }}>Activity Log</h3>
            {logs.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: '13px' }}>No activity yet.</p>
            ) : logs.map(log => (
              <div key={log.id} style={{ display: 'flex', gap: '10px', padding: '10px 0', borderBottom: '1px solid #f0f2ff' }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%', background: '#e8eaf6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 600, color: '#1a237e', flexShrink: 0
                }}>
                  {log.profiles?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#333', margin: 0 }}>
                    <strong>{log.profiles?.name}</strong> {log.action}
                  </p>
                  <p style={{ fontSize: '10px', color: '#aaa', margin: '2px 0 0' }}>
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

function TaskCard({ task }) {
  const statusColors = {
    'To Do': '#757575', 'In Progress': '#1565c0',
    'Review': '#e65100', 'Done': '#2e7d32'
  }
  const priorityColors = { Low: '#43a047', Medium: '#fb8c00', High: '#e53935' }

  return (
    <div style={{
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
      <p style={{ fontSize: '11px', color: '#999', margin: '0 0 10px', lineHeight: 1.5 }}>
        {task.description || 'No description'}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontWeight: 600,
          background: statusColors[task.status] + '18', color: statusColors[task.status]
        }}>{task.status}</span>
        <span style={{ fontSize: '11px', color: '#aaa' }}>
          {task.profiles?.name || 'Unassigned'}
        </span>
      </div>
      {task.due_date && (
        <p style={{ fontSize: '10px', color: '#aaa', margin: '8px 0 0' }}>
          <i className="ti ti-calendar" /> Due: {task.due_date}
        </p>
      )}
    </div>
  )
}

const inputStyle = {
  padding: '9px 12px', border: '1.5px solid #e0e0e0',
  borderRadius: '8px', fontFamily: "'Poppins',sans-serif",
  fontSize: '13px', color: '#333', outline: 'none', boxSizing: 'border-box'
}