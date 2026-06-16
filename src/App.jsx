import { Routes, Route, Navigate } from 'react-router-dom'
import { useDarkMode } from './context/DarkModeContext'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import CreateProject from './pages/CreateProject'
import ProjectDetail from './pages/ProjectDetail'
import CreateTask from './pages/CreateTask'
import MyTasks from './pages/MyTasks'
import KanbanBoard from './pages/KanbanBoard'
import Notifications from './pages/Notifications'
import Projects from './pages/Projects'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { darkMode, setDarkMode } = useDarkMode()

  return (
    <>
      {/* BB8 Dark Mode Toggle - Fixed Upper Right */}
      <div style={{
        position: 'fixed', top: '12px', right: '16px', zIndex: 9999,
        transform: 'scale(0.55)', transformOrigin: 'top right'
      }}>
        <label className="bb8-toggle">
          <input
            className="bb8-toggle__checkbox"
            type="checkbox"
            checked={darkMode}
            onChange={e => setDarkMode(e.target.checked)}
          />
          <div className="bb8-toggle__container">
            <div className="bb8-toggle__scenery">
              <div className="bb8-toggle__star"></div>
              <div className="bb8-toggle__star"></div>
              <div className="bb8-toggle__star"></div>
              <div className="bb8-toggle__star"></div>
              <div className="bb8-toggle__star"></div>
              <div className="bb8-toggle__star"></div>
              <div className="bb8-toggle__star"></div>
              <div className="tatto-1"></div>
              <div className="tatto-2"></div>
              <div className="gomrassen"></div>
              <div className="hermes"></div>
              <div className="chenini"></div>
              <div className="bb8-toggle__cloud"></div>
              <div className="bb8-toggle__cloud"></div>
              <div className="bb8-toggle__cloud"></div>
            </div>
            <div className="bb8">
              <div className="bb8__head-container">
                <div className="bb8__antenna"></div>
                <div className="bb8__antenna"></div>
                <div className="bb8__head"></div>
              </div>
              <div className="bb8__body"></div>
            </div>
            <div className="artificial__hidden">
              <div className="bb8__shadow"></div>
            </div>
          </div>
        </label>
      </div>

      <Routes>
      <Route path="/" element={<Navigate to="/auth" />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/projects/create" element={<ProtectedRoute><CreateProject /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
      <Route path="/projects/:id/tasks/create" element={<ProtectedRoute><CreateTask /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><MyTasks /></ProtectedRoute>} />
      <Route path="/projects/:id/kanban" element={<ProtectedRoute><KanbanBoard /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
   </Routes>
    </>
  )
}
export default App