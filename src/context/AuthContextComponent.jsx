import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  // This file only exports the AuthProvider component.
  // The actual context and auth logic live in AuthContext.js to satisfy react-refresh ESLint.
  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>
}

