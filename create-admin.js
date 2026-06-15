import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dkkgxlnolbcbocyqottw.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createAdmin() {
  try {
    console.log('Creating admin user...')
    
    // Create user via admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'adminrey19@gmail.com',
      password: 'adminrey180148',
      email_confirm: true, // Auto-confirm email
    })

    if (error) {
      console.error('Error creating user:', error)
      return
    }

    console.log('✅ Admin user created:', data.user.id)

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: data.user.id,
        name: 'Admin',
        email: 'adminrey19@gmail.com',
      }])

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return
    }

    console.log('✅ Admin profile created')
    console.log('\n✨ Admin account ready! You can now login with:')
    console.log('Email: adminrey19@gmail.com')
    console.log('Password: adminrey180148')

  } catch (err) {
    console.error('Error:', err.message)
  }
}

createAdmin()
