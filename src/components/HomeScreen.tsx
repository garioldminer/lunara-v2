import './HomeScreen.css'

export default function HomeScreen() {
  return (
    <div className="phone">
      <div className="status-bar">
        <div className="sb-left">
          <div className="avatar">A</div>
          <span className="username">ArcanaSeeker</span>
        </div>
        <div className="sb-right">
          <div className="badge">🔮 2,450</div>
          <div className="badge">⚡ 50</div>
        </div>
      </div>

      <div className="scroll-area">
        <div className="app-title">ARCANA</div>
        <div className="app-sub">✦ YOUR MYSTIC COMPANION ✦</div>
        <div className="divider" />

        <div className="section-title">✦ CARD OF THE DAY ✦</div>
        <div className="daily-card">
          <div className="mini-card">
            <div className="mc-num">XIII</div>
            <div className="mc-sym">⚖️</div>
            <div className="mc-name">DEATH</div>
          </div>
          <div className="card-info">
            <div className="card-title">DEATH</div>
            <div className="card-zodiac">SCORPIO ♏ · WATER</div>
            <div className="card-desc">
              Endings bring new beginnings. Release what no longer serves your path.
            </div>
            <button className="btn-gold">READ MORE</button>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-box">
            <div className="stat-icon">🎴</div>
            <div className="stat-val">17</div>
            <div className="stat-lbl">CARDS</div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">🔥</div>
            <div className="stat-val">7</div>
            <div className="stat-lbl">STREAK</div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">⭐</div>
            <div className="stat-val">LVL 4</div>
            <div className="stat-lbl">MYSTIC</div>
          </div>
        </div>

        <div className="section-title">✦ DAILY QUESTS ✦</div>
        {[
          { icon: '🎴', text: 'Draw your daily card', progress: 100, reward: '+50 🔮' },
          { icon: '🌙', text: 'Complete a spread reading', progress: 0, reward: '+120 🔮' },
          { icon: '👥', text: 'Invite a friend', progress: 40, reward: '+200 🔮' },
        ].map((q, i) => (
          <div className="quest-item" key={i}>
            <div className="q-icon">{q.icon}</div>
            <div className="q-text">
              <div className="q-title">{q.text}</div>
              <div className="q-bar">
                <div className="q-fill" style={{ width: `${q.progress}%` }} />
              </div>
            </div>
            <div className="q-reward">{q.reward}</div>
          </div>
        ))}
      </div>

      <div className="bottom-nav">
        {[
          { icon: '🏠', label: 'HOME', active: true },
          { icon: '🎴', label: 'CARDS' },
          { icon: '🔮', label: 'READING' },
          { icon: '⭐', label: 'ASTRO' },
          { icon: '👤', label: 'PROFILE' },
        ].map((tab) => (
          <div className={`nav-item ${tab.active ? 'active' : ''}`} key={tab.label}>
            <div className="nav-icon">{tab.icon}</div>
            <div className="nav-label">{tab.label}</div>
            {tab.active && <div className="nav-dot" />}
          </div>
        ))}
      </div>
    </div>
  )
}