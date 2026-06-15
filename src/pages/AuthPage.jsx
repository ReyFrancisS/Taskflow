import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [waveAnimating, setWaveAnimating] = useState(false)
  const rafRef = useRef(null)

  const waveDRef = useRef('M60,0 Q20,115 50,230 Q80,345 60,460 L420,460 L420,0 Z')
  const [waveD, setWaveD] = useState('M60,0 Q20,115 50,230 Q80,345 60,460 L420,460 L420,0 Z')


  const targetModeRef = useRef('login')
  const fromModeRef = useRef('login')
  const navigate = useNavigate()


  const [loginForm, setLoginForm] = useState({ email: '', password: '', remember: false })
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const LOGIN_WAVE  = [60,0, 20,115, 50,230, 80,345, 60,460, 420,460, 420,0]
  const REG_WAVE    = [0,0, -60,115, -30,230, 0,345, -20,460, 420,460, 420,0]

  function parsePath(d) { return d.match(/-?\d+\.?\d*/g).map(Number) }
  function buildPath(n) {
    return `M${n[0]},${n[1]} Q${n[2]},${n[3]} ${n[4]},${n[5]} Q${n[6]},${n[7]} ${n[8]},${n[9]} L${n[10]},${n[11]} L${n[12]},${n[13]} Z`
  }
  function ease(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2 }

  function animateWave(toMode) {
    if (waveAnimating) {
      // stop previous to keep the curve continuous
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    targetModeRef.current = toMode

    const fromNums = parsePath(waveDRef.current)
    const toNums = toMode === 'register' ? REG_WAVE : LOGIN_WAVE
    const duration = 900

    setWaveAnimating(true)

    let start = null
    function step(ts) {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = ease(progress)
      const nums = fromNums.map((v, i) => v + (toNums[i] - v) * eased)
      const nextD = buildPath(nums)
      waveDRef.current = nextD
      setWaveD(nextD)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        rafRef.current = null
        setWaveAnimating(false)
        // mode switch is handled by UI; keep in sync here too
        setMode(toMode)
        fromModeRef.current = toMode
      }
    }

    rafRef.current = requestAnimationFrame(step)
  }


  useEffect(() => () => rafRef.current && cancelAnimationFrame(rafRef.current), [])

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    })
    setLoading(false)
    if (error) return setError(error.message)
    navigate('/dashboard')
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (registerForm.password !== registerForm.confirm)
      return setError('Passwords do not match.')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: registerForm.email,
      password: registerForm.password,
      options: { data: { name: registerForm.name } }
    })
    setLoading(false)
    if (error) return setError(error.message)
    setSuccess('Account created! Please check your email to confirm.')
  }

  const isRegister = mode === 'register'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Poppins', sans-serif", padding: '1rem'
    }}>
      <div style={{
        width: '100%', maxWidth: '780px', height: '460px',
        background: '#fff', borderRadius: '20px',
        overflow: 'hidden', position: 'relative',
        boxShadow: '0 20px 60px rgba(26,35,126,0.15)'
      }}>

        {/* LOGIN FORM */}
        <div style={{
          width: '52%', height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '2.5rem 3rem', position: 'absolute', top: 0, left: 0,
          background: '#fff', zIndex: 2,
          opacity: isRegister ? 0 : 1,
          transform: isRegister ? 'translateX(-30px)' : 'translateX(0)',
          pointerEvents: isRegister ? 'none' : 'all',
          transition: 'opacity 0.6s ease, transform 0.6s ease'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1a237e', marginBottom: '1.4rem' }}>Login</h2>
          <form onSubmit={handleLogin}>
            <Field icon="ti-mail" placeholder="Email address" type="email"
              value={loginForm.email} onChange={v => setLoginForm(p => ({...p, email: v}))} />
            <Field icon="ti-lock" placeholder="Password" type="password"
              value={loginForm.password} onChange={v => setLoginForm(p => ({...p, password: v}))} />
            {error && !isRegister && <p style={{ color: '#c62828', fontSize: '11px', marginBottom: '8px' }}>{error}</p>}
            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? 'Logging in...' : 'LOGIN'}
            </button>
          </form>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#777', cursor: 'pointer' }}>
              <input type="checkbox" style={{ accentColor: '#1a237e' }} /> Remember me
            </label>
            <span style={{ fontSize: '11px', color: '#1a237e', cursor: 'pointer' }}>Forgot Password?</span>
          </div>
          <p style={{ textAlign: 'center', marginTop: '13px', fontSize: '11px', color: '#888' }}>
            Need an account?{' '}
            <span onClick={() => animateWave('register')}
              style={{ color: '#1a237e', fontWeight: 600, cursor: 'pointer' }}>
              Register here
            </span>
          </p>
        </div>

        {/* REGISTER FORM */}
        <div style={{
          width: '52%', height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '2.5rem 3rem', position: 'absolute', top: 0, right: 0,
          background: '#fff', zIndex: 2,
          opacity: isRegister ? 1 : 0,
          transform: isRegister ? 'translateX(0)' : 'translateX(30px)',
          pointerEvents: isRegister ? 'all' : 'none',
          transition: 'opacity 0.6s ease, transform 0.6s ease'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1a237e', marginBottom: '1.2rem' }}>Create Account</h2>
          <form onSubmit={handleRegister}>
            <Field icon="ti-user" placeholder="Full Name" type="text"
              value={registerForm.name} onChange={v => setRegisterForm(p => ({...p, name: v}))} />
            <Field icon="ti-mail" placeholder="Email address" type="email"
              value={registerForm.email} onChange={v => setRegisterForm(p => ({...p, email: v}))} />
            <Field icon="ti-lock" placeholder="Password" type="password"
              value={registerForm.password} onChange={v => setRegisterForm(p => ({...p, password: v}))} />
            <Field icon="ti-lock" placeholder="Confirm Password" type="password"
              value={registerForm.confirm} onChange={v => setRegisterForm(p => ({...p, confirm: v}))} />
            {error && isRegister && <p style={{ color: '#c62828', fontSize: '11px', marginBottom: '8px' }}>{error}</p>}
            {success && <p style={{ color: '#2e7d32', fontSize: '11px', marginBottom: '8px' }}>{success}</p>}
            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? 'Creating...' : 'CREATE ACCOUNT'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '11px', color: '#888' }}>
            Already have an account?{' '}
            <span onClick={() => animateWave('login')}
              style={{ color: '#1a237e', fontWeight: 600, cursor: 'pointer' }}>
              Sign in
            </span>
          </p>
        </div>

        {/* BLUE WAVE PANEL */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: '52%', height: '100%', zIndex: 3,
          transition: 'transform 1.05s cubic-bezier(0.86,0,0.07,1)',
          transform: isRegister ? 'translateX(-92%)' : 'translateX(0)'
        }}>

          <svg viewBox="0 0 420 460" preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
            <defs>
              <clipPath id="waveClip">
                <path d={waveD} />
              </clipPath>
            </defs>
            <rect x="0" y="0" width="420" height="460" fill="#1a237e" clipPath="url(#waveClip)" />
            <circle cx="320" cy="80" r="60" fill="rgba(255,255,255,0.06)" clipPath="url(#waveClip)" />
            <circle cx="360" cy="340" r="90" fill="rgba(255,255,255,0.05)" clipPath="url(#waveClip)" />
            <circle cx="280" cy="420" r="50" fill="rgba(92,107,192,0.3)" clipPath="url(#waveClip)" />
            <text x="310" y="50" fill="rgba(255,255,255,0.1)" fontSize="28" clipPath="url(#waveClip)">+</text>
            <text x="170" y="130" fill="rgba(255,255,255,0.08)" fontSize="22" clipPath="url(#waveClip)">○</text>
            <text x="350" y="280" fill="rgba(255,255,255,0.08)" fontSize="18" clipPath="url(#waveClip)">△</text>
          </svg>
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '10px', paddingLeft: isRegister ? '6%' : '18%',
            transition: 'padding 1.1s cubic-bezier(0.86,0,0.07,1)', zIndex: 4
          }}>
            <div style={{
              width: '56px', height: '56px', background: 'rgba(255,255,255,0.12)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '6px'
            }}>
              <i className="ti ti-layout-kanban" style={{ fontSize: '28px', color: 'rgba(255,255,255,0.9)' }} />
            </div>
            <p style={{ color: '#fff', fontFamily: "'Poppins',sans-serif", fontSize: '26px', fontWeight: 700, letterSpacing: '1px' }}>
              TaskFlow
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Poppins',sans-serif", fontSize: '12px', fontWeight: 300, textAlign: 'center', maxWidth: '160px', lineHeight: 1.6 }}>
              Where teamwork gets things done
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

function Field({ icon, placeholder, type, value, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      borderBottom: '1.5px solid #c5cae9',
      marginBottom: '1rem', paddingBottom: '5px', gap: '8px'
    }}>
      <i className={`ti ${icon}`} style={{ fontSize: '15px', color: '#9fa8da' }} />
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        required
        style={{
          border: 'none', outline: 'none', background: 'transparent',
          fontFamily: "'Poppins',sans-serif", fontSize: '13px',
          color: '#333', width: '100%', padding: '3px 0'
        }}
      />
    </div>
  )
}

const btnStyle = {
  width: '100%', padding: '11px',
  background: '#1a237e', color: '#fff',
  border: 'none', borderRadius: '8px',
  fontFamily: "'Poppins',sans-serif",
  fontSize: '13px', fontWeight: 600,
  cursor: 'pointer', letterSpacing: '1px',
  marginTop: '4px'
}