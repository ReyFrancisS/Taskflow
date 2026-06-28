import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useDarkMode } from '../context/DarkModeContext'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

export default function Notifications() {
  const { user } = useAuth()
  const { darkMode } = useDarkMode()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All') // All | Unread | Read

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
  const borderGlow = dm ? '1px solid rgba(79,110,247,0.12)' : '1px solid rgba(26,35,126,0.07)'

  useEffect(() => { if (user) fetchNotifications() }, [user])

  async function fetchNotifications() {
    setLoading(true)
    const { data } = await supabase
      .from('notifications').select('*')
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
    await supabase.from('notifications').update({ is_read: true })
      .eq('user_id', user.id).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function deleteNotification(id) {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length
  const readCount   = notifications.filter(n => n.is_read).length

  const filtered = notifications.filter(n => {
    if (filter === 'Unread') return !n.is_read
    if (filter === 'Read')   return n.is_read
    return true
  })

  const filterBtnStyle = (active) => ({
    padding: '7px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif", fontSize: '11px', fontWeight: 700,
    background: active
      ? (dm ? 'linear-gradient(135deg, #4f6ef7, #3451d1)' : 'linear-gradient(135deg, #1a237e, #283593)')
      : (dm ? 'linear-gradient(145deg, #141828, #0d1020)' : '#ffffff'),
    color: active ? '#fff' : textSecondary,
    boxShadow: active
      ? (dm ? '0 4px 12px rgba(79,110,247,0.35)' : '0 4px 10px rgba(26,35,126,0.2)')
      : cardShadow,
    border: active ? 'none' : borderGlow,
    transition: 'all 0.2s',
  })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: pageBg, fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar />
      <Topbar title="Notifications" />
      <main style={{ marginLeft: '220px', flex: 1, padding: '2rem 2.5rem', paddingTop: '88px' }}>
        <div style={{ maxWidth: '640px' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: textPrimary, margin: 0, letterSpacing: '-0.5px' }}>
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <span style={{
                    fontSize: '11px', background: dm ? 'rgba(229,57,53,0.2)' : '#ffebee',
                    color: '#e53935', padding: '3px 10px', borderRadius: '20px',
                    fontWeight: 700, border: '1px solid rgba(229,57,53,0.25)'
                  }}>{unreadCount} new</span>
                )}
              </div>
              <p style={{ color: textSecondary, fontSize: '13px', margin: '4px 0 0' }}>
                Stay updated with your tasks and projects.
              </p>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: dm
                  ? 'linear-gradient(145deg, #141828, #0d1020)'
                  : '#ffffff',
                color: dm ? '#4f6ef7' : '#1a237e',
                border: dm ? '1px solid rgba(79,110,247,0.25)' : '1px solid rgba(26,35,126,0.15)',
                borderRadius: '10px', padding: '9px 16px', cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif", fontSize: '12px', fontWeight: 700,
                boxShadow: cardShadow
              }}>
                <i className="ti ti-checks" /> Mark all read
              </button>
            )}
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.8rem' }}>
            {[
              { label: 'Total',  value: notifications.length, icon: 'ti-bell',     color: dm ? '#4f6ef7' : '#1a237e' },
              { label: 'Unread', value: unreadCount,           icon: 'ti-bell-ringing', color: dm ? '#f87171' : '#e53935' },
              { label: 'Read',   value: readCount,             icon: 'ti-bell-check',   color: dm ? '#34d399' : '#2e7d32' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: surfaceBg, borderRadius: '14px',
                padding: '1rem 1.2rem', border: borderGlow, boxShadow: cardShadow,
                display: 'flex', alignItems: 'center', gap: '12px'
              }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: stat.color + (dm ? '20' : '12'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '17px', color: stat.color,
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

          {/* Filter Tabs */}
          <div style={{
            display: 'flex', gap: '6px', marginBottom: '1.5rem',
            background: surfaceBg, borderRadius: '12px', padding: '5px',
            width: 'fit-content', boxShadow: cardShadow, border: borderGlow
          }}>
            {['All', 'Unread', 'Read'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={filterBtnStyle(filter === f)}>
                {f}
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1,2,3].map(i => (
                <div key={i} style={{
                  background: surfaceBg, borderRadius: '14px', padding: '1.2rem',
                  height: '80px', boxShadow: cardShadow, border: borderGlow
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
                <i className="ti ti-bell-off" style={{ fontSize: '28px', color: dm ? '#4f6ef7' : '#c5cae9' }} />
              </div>
              <p style={{ color: textPrimary, fontSize: '14px', fontWeight: 600, margin: '0 0 6px' }}>
                {filter === 'All' ? 'No notifications yet' : `No ${filter.toLowerCase()} notifications`}
              </p>
              <p style={{ color: textSecondary, fontSize: '12px', margin: 0 }}>
                {filter === 'All' ? "You're all caught up!" : 'Try a different filter.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filtered.map(notif => (
                <NotificationRow
                  key={notif.id}
                  notif={notif}
                  dm={dm}
                  surfaceBg={surfaceBg}
                  cardShadow={cardShadow}
                  textPrimary={textPrimary}
                  textSecondary={textSecondary}
                  borderGlow={borderGlow}
                  onMarkRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function NotificationRow({ notif, dm, surfaceBg, cardShadow, textPrimary, textSecondary, borderGlow, onMarkRead, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const isUnread = !notif.is_read

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: surfaceBg,
        borderRadius: '14px',
        padding: '1rem 1.2rem',
        boxShadow: hovered
          ? (dm
              ? '10px 10px 28px rgba(0,0,0,0.55), -2px -2px 10px rgba(255,255,255,0.04)'
              : '10px 10px 24px rgba(26,35,126,0.1), -4px -4px 12px rgba(255,255,255,0.95)')
          : cardShadow,
        borderLeft: `4px solid ${isUnread
          ? (dm ? '#4f6ef7' : '#1a237e')
          : (dm ? 'rgba(255,255,255,0.06)' : 'rgba(26,35,126,0.1)')}`,
        border: `1px solid ${isUnread
          ? (dm ? 'rgba(79,110,247,0.25)' : 'rgba(26,35,126,0.12)')
          : (dm ? 'rgba(255,255,255,0.05)' : 'rgba(26,35,126,0.06)')}`,
        borderLeft: `4px solid ${isUnread
          ? (dm ? '#4f6ef7' : '#1a237e')
          : (dm ? 'rgba(255,255,255,0.1)' : 'rgba(26,35,126,0.12)')}`,
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: '12px',
        transform: hovered ? 'translateX(2px)' : 'translateX(0)',
        transition: 'all 0.2s ease',
        opacity: isUnread ? 1 : 0.72
      }}
    >
      {/* Icon */}
      <div style={{
        width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
        background: isUnread
          ? (dm ? 'rgba(79,110,247,0.15)' : '#e8eaf6')
          : (dm ? 'rgba(255,255,255,0.05)' : '#f5f5f5'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: dm ? 'inset 2px 2px 5px rgba(0,0,0,0.3)' : 'inset 2px 2px 5px rgba(26,35,126,0.06)'
      }}>
        <i className={isUnread ? 'ti ti-bell-ringing' : 'ti ti-bell'} style={{
          fontSize: '16px',
          color: isUnread ? (dm ? '#4f6ef7' : '#1a237e') : textSecondary
        }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '13px',
          color: isUnread ? textPrimary : textSecondary,
          fontWeight: isUnread ? 600 : 400,
          margin: '0 0 4px',
          lineHeight: 1.5
        }}>
          {notif.message}
        </p>
        <p style={{ fontSize: '10px', color: textSecondary, margin: 0 }}>
          {new Date(notif.created_at).toLocaleString()}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
        {isUnread && (
          <button onClick={() => onMarkRead(notif.id)} style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: dm ? 'rgba(79,110,247,0.12)' : '#e8eaf6',
            border: dm ? '1px solid rgba(79,110,247,0.2)' : '1px solid rgba(26,35,126,0.1)',
            borderRadius: '8px', padding: '5px 10px', cursor: 'pointer',
            fontSize: '11px', color: dm ? '#4f6ef7' : '#1a237e',
            fontWeight: 700, fontFamily: "'Poppins', sans-serif"
          }}>
            <i className="ti ti-check" style={{ fontSize: '12px' }} /> Read
          </button>
        )}
        <button onClick={() => onDelete(notif.id)} style={{
          width: '30px', height: '30px', borderRadius: '8px',
          background: dm ? 'rgba(229,57,53,0.08)' : '#ffebee',
          border: dm ? '1px solid rgba(229,57,53,0.15)' : '1px solid rgba(229,57,53,0.1)',
          cursor: 'pointer', color: '#e53935', fontSize: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <i className="ti ti-trash" />
        </button>
      </div>
    </div>
  )
}