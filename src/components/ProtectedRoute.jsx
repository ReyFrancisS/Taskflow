import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Poppins', sans-serif", color: '#1a237e', fontSize: '14px'
    }}>
      Loading...
    </div>
  )

  if (!user) return <Navigate to="/auth" />
  return children
}