import './BottomNav.css';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'home', icon: '🏠', label: 'HOME' },
  { id: 'cards', icon: '🃏', label: 'CARDS' },
  { id: 'reading', icon: '🔮', label: 'READING' },
  { id: 'astro', icon: '', label: 'ASTRO' },
  { id: 'profile', icon: '👤', label: 'PROFILE' },
];

export default function BottomNav({ activeTab, onTabChange }: Props) {
  return (
    <div className="bottom-nav-container">
      {/* Glow effect behind nav */}
      <div className="nav-glow"></div>
      
      {/* Main nav bar */}
      <div className="bottom-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {/* 3D icon container */}
            <div className="icon-wrapper">
              <span className="nav-icon">{tab.icon}</span>
              <div className="icon-glow"></div>
            </div>
            
            {/* Label */}
            <span className="nav-label">{tab.label}</span>
            
            {/* Active indicator */}
            {activeTab === tab.id && (
              <>
                <div className="nav-dot"></div>
                <div className="nav-shimmer"></div>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}