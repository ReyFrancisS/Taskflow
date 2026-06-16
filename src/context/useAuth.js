// Re-export the `useAuth` hook from AuthContext so imports
// from './context/useAuth' work across the codebase.
export { useAuth } from './AuthContext'

// Keep a default export for compatibility if any module imports default.
export default null