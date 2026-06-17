import { useDarkMode } from '../context/DarkModeContext'

export default function Topbar({ title, actions }) {
  const { darkMode, setDarkMode } = useDarkMode()

  return (
    <div style={{
      position: 'fixed', top: 0, left: '220px', right: 0,
      height: '60px', zIndex: 100,
      background: darkMode ? '#1a1a19' : '#fff',
      borderBottom: `1px solid ${darkMode ? '#3a3a38' : '#e8eaf6'}`,
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      boxShadow: '0 2px 8px rgba(26,35,126,0.06)',
      fontFamily: "'Poppins', sans-serif"
    }}>
      {/* Left: Title */}
      <h1 style={{
        fontSize: '18px', fontWeight: 700,
        color: darkMode ? '#e8eaf6' : '#1a237e', margin: 0
      }}>
        {title}
      </h1>

      {/* Right: Actions + BB8 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {actions}

        {/* BB8 Toggle */}
        <div style={{ transform: 'scale(0.5)', transformOrigin: 'center right' }}>
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
      </div>
    </div>
  )
}