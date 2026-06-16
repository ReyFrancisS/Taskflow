import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) fetchNotifications() }, [user])

  async function fetchNotifications() {
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setNotifications(data || [])
    setLoading(false)
  }

  async function markAsRead(id) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllAsRead() {
    await supabase.from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function deleteNotification(id) {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2ff', fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '2rem 2.5rem' }}>
        <div style={{ maxWidth: '600px' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a237e', margin: 0 }}>
                Notifications
                {unreadCount > 0 && (
                  <span style={{
                    marginLeft: '10px', fontSize: '12px', background: '#e53935',
                    color: '#fff', padding: '2px 8px', borderRadius: '20px', fontWeight: 600
                  }}>{unreadCount} new</span>
                )}
              </h1>
              <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 0' }}>
                Stay updated with your tasks and projects.
              </p>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{
                background: '#e8eaf6', color: '#1a237e', border: 'none',
                borderRadius: '8px', padding: '8px 14px', cursor: 'pointer',
                fontFamily: "'Poppins',sans-serif", fontSize: '12px', fontWeight: 600
              }}>
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          {loading ? (
            <p style={{ color: '#aaa', fontSize: '13px' }}>Loading...</p>
          ) : notifications.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: '14px', padding: '3rem',
              textAlign: 'center', boxShadow: '0 2px 12px rgba(26,35,126,0.07)'
            }}>
              <i className="ti ti-bell-off" style={{ fontSize: '40px', color: '#c5cae9' }} />
              <p style={{ color: '#aaa', fontSize: '13px', marginTop: '12px' }}>No notifications yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notifications.map(notif => (
                <div key={notif.id} style={{
                  background: '#fff', borderRadius: '12px',
                  padding: '1rem 1.2rem',
                  boxShadow: '0 2px 8px rgba(26,35,126,0.07)',
                  borderLeft: `4px solid ${notif.is_read ? '#e0e0e0' : '#1a237e'}`,
                  display: 'flex', alignItems: 'flex-start',
                  justifyContent: 'space-between', gap: '12px'
                }}>
                  <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                      background: notif.is_read ? '#f5f5f5' : '#e8eaf6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <i className="ti ti-bell" style={{
                        fontSize: '16px',
                        color: notif.is_read ? '#aaa' : '#1a237e'
                      }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: '13px', color: notif.is_read ? '#888' : '#1a237e',
                        fontWeight: notif.is_read ? 400 : 600, margin: '0 0 4px'
                      }}>
                        {notif.message}
                      </p>
                      <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {!notif.is_read && (
                      <button onClick={() => markAsRead(notif.id)} style={{
                        background: '#e8eaf6', border: 'none', borderRadius: '6px',
                        padding: '5px 10px', cursor: 'pointer', fontSize: '11px',
                        color: '#1a237e', fontWeight: 600,
                        fontFamily: "'Poppins',sans-serif"
                      }}>Read</button>
                    )}
                    <button onClick={() => deleteNotification(notif.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#e53935', fontSize: '16px', padding: '4px'
                    }}>
                      <i className="ti ti-trash" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}