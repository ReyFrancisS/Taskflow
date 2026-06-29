import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

// ─── Wave paths ───────────────────────────────────────────────
const LOGIN_WAVE = [60,0, 20,115, 50,230, 80,345, 60,460, 420,460, 420,0]
const REG_WAVE   = [0,0, -60,115, -30,230, 0,345, -20,460, 420,460, 420,0]

function parsePath(d)    { return d.match(/-?\d+\.?\d*/g).map(Number) }
function buildPath(n)    { return `M${n[0]},${n[1]} Q${n[2]},${n[3]} ${n[4]},${n[5]} Q${n[6]},${n[7]} ${n[8]},${n[9]} L${n[10]},${n[11]} L${n[12]},${n[13]} Z` }
function ease(t)         { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2 }

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode]                 = useState('login')
  const [waveAnimating, setWaveAnimating] = useState(false)
  const rafRef   = useRef(null)
  const waveDRef = useRef(buildPath(LOGIN_WAVE))
  const [waveD, setWaveD] = useState(buildPath(LOGIN_WAVE))

  const [loginForm,    setLoginForm]    = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  // ── animated particles state ──
  const [particles] = useState(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      dur: 8 + Math.random() * 12,
      delay: Math.random() * 8,
      opacity: 0.04 + Math.random() * 0.1,
    }))
  )

  function animateWave(toMode) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const fromNums = parsePath(waveDRef.current)
    const toNums   = toMode === 'register' ? REG_WAVE : LOGIN_WAVE
    const duration = 900
    setWaveAnimating(true)
    let start = null
    function step(ts) {
      if (!start) start = ts
      const t    = Math.min((ts - start) / duration, 1)
      const et   = ease(t)
      const nums = fromNums.map((v, i) => v + (toNums[i] - v) * et)
      const d    = buildPath(nums)
      waveDRef.current = d
      setWaveD(d)
      if (t < 1) { rafRef.current = requestAnimationFrame(step) }
      else        { rafRef.current = null; setWaveAnimating(false); setMode(toMode) }
    }
    rafRef.current = requestAnimationFrame(step)
  }

  useEffect(() => () => rafRef.current && cancelAnimationFrame(rafRef.current), [])

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email, password: loginForm.password,
    })
    setLoading(false)
    if (error) return setError(error.message)
    navigate('/dashboard')
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (registerForm.password !== registerForm.confirm) return setError('Passwords do not match.')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: registerForm.email, password: registerForm.password,
      options: { data: { name: registerForm.name } }
    })
    setLoading(false)
    if (error) return setError(error.message)
    setSuccess('Account created! Redirecting to login...')
    setTimeout(() => {
      setRegisterForm({ name: '', email: '', password: '', confirm: '' })
      animateWave('login')
    }, 1500)
  }

  const isReg = mode === 'register'

  return (
    <>
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0px) scale(1);   opacity: var(--op); }
          50%  { transform: translateY(-22px) scale(1.15); opacity: calc(var(--op) * 1.6); }
          100% { transform: translateY(0px) scale(1);   opacity: var(--op); }
        }
        @keyframes orbitSlow {
          from { transform: rotate(0deg) translateX(28px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(28px) rotate(-360deg); }
        }
        @keyframes pulseBadge {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.25); }
          50%       { box-shadow: 0 0 0 8px rgba(255,255,255,0); }
        }
        @keyframes gradShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .auth-input-wrap { border-bottom: 1.5px solid rgba(26,35,126,0.15); transition: border-color 0.25s; }
        .auth-input-wrap:focus-within { border-color: #3949ab; }
        .auth-input-wrap:focus-within .auth-icon { color: #3949ab; }
        .mode-link { color: #3949ab; font-weight: 700; cursor: pointer; transition: opacity 0.2s; }
        .mode-link:hover { opacity: 0.7; }
        .auth-submit { position: relative; overflow: hidden; }
        .auth-submit::after {
          content: '';
          position: absolute; top: 0; left: -60%;
          width: 40%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          transform: skewX(-15deg);
          animation: shimmer 3.5s infinite;
        }
        .auth-submit:hover { opacity: 0.92; transform: translateY(-1px); }
        .auth-submit:active { transform: translateY(0); }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e8ecff 0%, #c5cae9 50%, #d1d9ff 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradShift 12s ease infinite',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Poppins', sans-serif", padding: '1rem',
        position: 'relative',
      }}>

        {/* Background floating orbs */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          {[
            { w: 400, h: 400, top: '-10%', left: '-8%',  bg: 'radial-gradient(circle, rgba(57,73,171,0.12), transparent 70%)' },
            { w: 320, h: 320, top: '60%',  left: '80%', bg: 'radial-gradient(circle, rgba(121,134,203,0.1), transparent 70%)' },
            { w: 260, h: 260, top: '30%',  left: '55%', bg: 'radial-gradient(circle, rgba(26,35,126,0.07), transparent 70%)' },
          ].map((o, i) => (
            <div key={i} style={{
              position: 'absolute', width: o.w, height: o.h, top: o.top, left: o.left,
              background: o.bg, borderRadius: '50%',
              transform: `translateX(0)`,
            }} />
          ))}
        </div>

        {/* Main card */}
        <div style={{
          width: '100%', maxWidth: '820px', height: '500px',
          background: '#ffffff',
          borderRadius: '24px', overflow: 'hidden',
          position: 'relative', zIndex: 1,
          boxShadow: '0 24px 80px rgba(26,35,126,0.18), 0 4px 16px rgba(26,35,126,0.08)',
          animation: 'fadeSlideIn 0.5s ease forwards',
        }}>

          {/* ── LOGIN FORM ── */}
          <FormPanel side="left" visible={!isReg}>
            <BrandLogo small />
            <h2 style={headingStyle}>Welcome back</h2>
            <p style={subStyle}>Sign in to continue to TaskFlow</p>
            <form onSubmit={handleLogin} style={{ width: '100%' }}>
              <AuthField icon="ti-mail"  placeholder="Email address" type="email"
                value={loginForm.email}    onChange={v => setLoginForm(p => ({...p, email: v}))} />
              <AuthField icon="ti-lock"  placeholder="Password"      type="password"
                value={loginForm.password} onChange={v => setLoginForm(p => ({...p, password: v}))} />
              {error && !isReg && <ErrorMsg>{error}</ErrorMsg>}
              <SubmitButton loading={loading}>Sign In</SubmitButton>
            </form>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#888', cursor: 'pointer' }}>
                <input type="checkbox" style={{ accentColor: '#1a237e', width: '13px', height: '13px' }} /> Remember me
              </label>
              <span style={{ fontSize: '11px', color: '#3949ab', cursor: 'pointer', fontWeight: 600 }}>Forgot password?</span>
            </div>
            <p style={switchStyle}>
              New here?{' '}
              <span className="mode-link" onClick={() => animateWave('register')}>Create an account</span>
            </p>
          </FormPanel>

          {/* ── REGISTER FORM ── */}
          <FormPanel side="right" visible={isReg}>
            <BrandLogo small />
            <h2 style={headingStyle}>Create account</h2>
            <p style={subStyle}>Join TaskFlow and start collaborating</p>
            <form onSubmit={handleRegister} style={{ width: '100%' }}>
              <AuthField icon="ti-user"  placeholder="Full name"        type="text"
                value={registerForm.name}    onChange={v => setRegisterForm(p => ({...p, name: v}))} />
              <AuthField icon="ti-mail"  placeholder="Email address"    type="email"
                value={registerForm.email}   onChange={v => setRegisterForm(p => ({...p, email: v}))} />
              <AuthField icon="ti-lock"  placeholder="Password"         type="password"
                value={registerForm.password} onChange={v => setRegisterForm(p => ({...p, password: v}))} />
              <AuthField icon="ti-lock-check" placeholder="Confirm password" type="password"
                value={registerForm.confirm} onChange={v => setRegisterForm(p => ({...p, confirm: v}))} />
              {error   && isReg && <ErrorMsg>{error}</ErrorMsg>}
              {success && isReg && <SuccessMsg>{success}</SuccessMsg>}
              <SubmitButton loading={loading}>Create Account</SubmitButton>
            </form>
            <p style={switchStyle}>
              Already have an account?{' '}
              <span className="mode-link" onClick={() => animateWave('login')}>Sign in</span>
            </p>
          </FormPanel>

          {/* ── ANIMATED BLUE PANEL ── */}
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: '52%', height: '100%', zIndex: 3,
            transition: 'transform 1.05s cubic-bezier(0.86,0,0.07,1)',
            transform: isReg ? 'translateX(-92%)' : 'translateX(0)',
          }}>
            {/* SVG wave */}
            <svg viewBox="0 0 420 500" preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
              <defs>
                <clipPath id="waveClip">
                  <path d={waveD} />
                </clipPath>
                <linearGradient id="panelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%"   stopColor="#1a237e" />
                  <stop offset="55%"  stopColor="#283593" />
                  <stop offset="100%" stopColor="#3949ab" />
                </linearGradient>
                <radialGradient id="glow1" cx="70%" cy="20%" r="50%">
                  <stop offset="0%"   stopColor="rgba(92,107,192,0.4)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                <radialGradient id="glow2" cx="30%" cy="80%" r="50%">
                  <stop offset="0%"   stopColor="rgba(57,73,171,0.5)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>

              {/* Base fill */}
              <rect x="0" y="0" width="420" height="500" fill="url(#panelGrad)" clipPath="url(#waveClip)" />
              {/* Glow layers */}
              <rect x="0" y="0" width="420" height="500" fill="url(#glow1)" clipPath="url(#waveClip)" />
              <rect x="0" y="0" width="420" height="500" fill="url(#glow2)" clipPath="url(#waveClip)" />

              {/* Floating particles */}
              {particles.map(p => (
                <circle key={p.id}
                  cx={`${p.x}%`} cy={`${p.y}%`} r={p.size}
                  fill="white"
                  style={{
                    opacity: p.opacity,
                    animation: `floatUp ${p.dur}s ${p.delay}s ease-in-out infinite`,
                    '--op': p.opacity,
                  }}
                  clipPath="url(#waveClip)"
                />
              ))}

              {/* Grid dots */}
              {Array.from({ length: 8 }, (_, row) =>
                Array.from({ length: 6 }, (_, col) => (
                  <circle key={`${row}-${col}`}
                    cx={60 + col * 55} cy={40 + row * 60} r="1.5"
                    fill="rgba(255,255,255,0.12)"
                    clipPath="url(#waveClip)"
                  />
                ))
              )}

              {/* Decorative rings */}
              <circle cx="340" cy="90"  r="48" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" clipPath="url(#waveClip)" />
              <circle cx="340" cy="90"  r="70" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" clipPath="url(#waveClip)" />
              <circle cx="290" cy="400" r="60" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" clipPath="url(#waveClip)" />
              <circle cx="290" cy="400" r="90" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" clipPath="url(#waveClip)" />

              {/* Accent blobs */}
              <circle cx="350" cy="380" r="80" fill="rgba(57,73,171,0.35)" clipPath="url(#waveClip)" />
              <circle cx="310" cy="80"  r="50" fill="rgba(255,255,255,0.04)" clipPath="url(#waveClip)" />
            </svg>

            {/* Panel content */}
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '0', zIndex: 4,
              paddingLeft: isReg ? '6%' : '18%',
              transition: 'padding 1.1s cubic-bezier(0.86,0,0.07,1)',
            }}>

              {/* Icon badge */}
              <div style={{
                width: '68px', height: '68px',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '18px',
                animation: 'pulseBadge 3s ease-in-out infinite',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              }}>
                <i className="ti ti-layout-kanban" style={{ fontSize: '32px', color: '#fff' }} />
              </div>

              {/* Brand name */}
              <p style={{
                color: '#fff', fontSize: '28px', fontWeight: 800,
                letterSpacing: '1.5px', margin: '0 0 8px',
                textShadow: '0 2px 12px rgba(0,0,0,0.2)',
              }}>
                TaskFlow
              </p>

              {/* Tagline */}
              <p style={{
                color: 'rgba(255,255,255,0.65)', fontSize: '12px',
                fontWeight: 400, textAlign: 'center',
                maxWidth: '145px', lineHeight: 1.7, margin: '0 0 28px',
              }}>
                Where teamwork gets things done
              </p>

              {/* Feature pills */}
              {[
                { icon: 'ti-layout-kanban', label: 'Kanban Boards' },
                { icon: 'ti-users',          label: 'Team Collaboration' },
                { icon: 'ti-chart-bar',      label: 'Progress Tracking' },
              ].map(f => (
                <div key={f.label} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: '30px', padding: '6px 14px',
                  marginBottom: '8px', width: '155px',
                }}>
                  <i className={`ti ${f.icon}`} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }} />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function FormPanel({ children, side, visible }) {
  return (
    <div style={{
      width: '52%', height: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center',
      padding: '2.5rem 3rem',
      position: 'absolute', top: 0,
      [side === 'left' ? 'left' : 'right']: 0,
      background: '#fff', zIndex: 2,
      opacity: visible ? 1 : 0,
      transform: visible
        ? 'translateX(0)'
        : side === 'left' ? 'translateX(-24px)' : 'translateX(24px)',
      pointerEvents: visible ? 'all' : 'none',
      transition: 'opacity 0.55s ease, transform 0.55s ease',
    }}>
      {children}
    </div>
  )
}

function BrandLogo({ small }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
      <div style={{
        width: small ? '28px' : '36px', height: small ? '28px' : '36px',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #1a237e, #3949ab)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(26,35,126,0.3)',
      }}>
        <i className="ti ti-layout-kanban" style={{ fontSize: small ? '14px' : '18px', color: '#fff' }} />
      </div>
      <span style={{
        fontSize: small ? '15px' : '18px', fontWeight: 800,
        color: '#1a237e', letterSpacing: '0.5px'
      }}>TaskFlow</span>
    </div>
  )
}

function AuthField({ icon, placeholder, type, value, onChange }) {
  return (
    <div className="auth-input-wrap" style={{
      display: 'flex', alignItems: 'center',
      marginBottom: '1rem', paddingBottom: '7px', gap: '10px',
    }}>
      <i className={`ti ${icon} auth-icon`} style={{
        fontSize: '15px', color: '#c5cae9',
        transition: 'color 0.25s', flexShrink: 0
      }} />
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        required
        style={{
          border: 'none', outline: 'none', background: 'transparent',
          fontFamily: "'Poppins', sans-serif", fontSize: '12.5px',
          color: '#1a237e', width: '100%', padding: '2px 0',
        }}
      />
    </div>
  )
}

function SubmitButton({ children, loading }) {
  return (
    <button type="submit" disabled={loading} className="auth-submit" style={{
      width: '100%', padding: '12px',
      background: 'linear-gradient(135deg, #1a237e, #3949ab)',
      color: '#fff', border: 'none', borderRadius: '10px',
      fontFamily: "'Poppins', sans-serif",
      fontSize: '12px', fontWeight: 700,
      cursor: loading ? 'not-allowed' : 'pointer',
      letterSpacing: '1.5px', marginTop: '6px',
      boxShadow: '0 6px 20px rgba(26,35,126,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
      transition: 'opacity 0.2s, transform 0.15s',
      opacity: loading ? 0.7 : 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    }}>
      {loading && (
        <span style={{
          width: '13px', height: '13px', borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.35)',
          borderTopColor: '#fff',
          animation: 'spin 0.7s linear infinite',
          display: 'inline-block', flexShrink: 0,
        }} />
      )}
      {loading ? 'Please wait...' : children.toUpperCase()}
    </button>
  )
}

function ErrorMsg({ children }) {
  return (
    <div style={{
      background: '#ffebee', border: '1px solid rgba(229,57,53,0.25)',
      borderRadius: '8px', padding: '8px 12px', marginBottom: '10px',
      display: 'flex', alignItems: 'center', gap: '7px',
      animation: 'fadeSlideIn 0.3s ease forwards',
    }}>
      <i className="ti ti-alert-circle" style={{ color: '#e53935', fontSize: '14px', flexShrink: 0 }} />
      <p style={{ color: '#c62828', fontSize: '11px', margin: 0 }}>{children}</p>
    </div>
  )
}

function SuccessMsg({ children }) {
  return (
    <div style={{
      background: '#e8f5e9', border: '1px solid rgba(46,125,50,0.25)',
      borderRadius: '8px', padding: '8px 12px', marginBottom: '10px',
      display: 'flex', alignItems: 'center', gap: '7px',
      animation: 'fadeSlideIn 0.3s ease forwards',
    }}>
      <i className="ti ti-circle-check" style={{ color: '#2e7d32', fontSize: '14px', flexShrink: 0 }} />
      <p style={{ color: '#2e7d32', fontSize: '11px', margin: 0 }}>{children}</p>
    </div>
  )
}

const headingStyle = {
  fontSize: '22px', fontWeight: 800, color: '#1a237e',
  margin: '0 0 4px', letterSpacing: '-0.4px',
}
const subStyle = {
  fontSize: '12px', color: '#8892b0',
  margin: '0 0 20px', fontWeight: 400,
}
const switchStyle = {
  textAlign: 'center', marginTop: '14px',
  fontSize: '11px', color: '#8892b0', width: '100%',
}