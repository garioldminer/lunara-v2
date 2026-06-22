import { ArrowLeft } from 'lucide-react';
import './ThreeCardReadingScreen.css';

interface Props {
  onNavigate?: (screen: string) => void;
}

export default function ThreeCardReadingScreen({ onNavigate }: Props) {
  return (
    <div className="three-card-screen">
      <div className="tcr-header">
        {onNavigate && (
          <button className="tcr-back-btn" onClick={() => onNavigate('home')}>
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="tcr-header-center">
          <div className="tcr-ornament">✦</div>
          <h1 className="tcr-title">Three Card Reading</h1>
          <div className="tcr-ornament">✦</div>
        </div>
        <div className="tcr-header-spacer" />
      </div>

      <div className="tcr-intro">
        <div className="tcr-intro-icon">🔮</div>
        <h2 className="tcr-intro-title">Coming Soon</h2>
        <p className="tcr-intro-text">
          Three Card Reading feature is under development. Check back soon!
        </p>
        <button className="tcr-begin-btn" onClick={() => onNavigate && onNavigate('home')}>
          <span>Back to Home</span>
        </button>
      </div>
    </div>
  );
}