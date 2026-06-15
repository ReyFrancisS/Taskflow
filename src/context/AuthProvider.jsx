import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadProfile = async (userId) => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!mounted) return
      setProfile(data)
    }

    const createProfile = async (userId, userMetadata) => {
      try {
        const { error } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            name: userMetadata?.name || 'User',
            email: userMetadata?.email || '',
            created_at: new Date().toISOString()
          }])
        
        if (!error && mounted) {
          loadProfile(userId)
        }
      } catch (err) {
        console.error('Error creating profile:', err)
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setProfile(null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        if (_event === 'SIGNED_UP') {
          // Auto-create profile for new users
          await createProfile(session.user.id, session.user.user_metadata)
        } else {
          loadProfile(session.user.id)
        }
      }
      else setProfile(null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

