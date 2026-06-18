import { useEffect } from 'react';
import './OnboardingWelcome.css';

interface Props {
  onFinish: () => void;
}

export default function OnboardingWelcome({ onFinish }: Props) {
  useEffect(() => {
    console.log('🤲 OnboardingWelcome mounted');
  }, []);

  return (
    <div className="screen-container welcome">
      {/* ვიდეო ფონი */}
      <video 
        className="background-video"
        autoPlay 
        loop 
        muted 
        playsInline
      >
        <source src="/videos/welcome.mp4" type="video/mp4" />
      </video>

      {/* CSS ნაწილაკები (დამატებითი ეფექტი) */}
      <div className="particles-container">
        {[...Array(10)].map((_, i) => (
          <div 
            key={i} 
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
              width: `${2 + Math.random() * 2}px`,
              height: `${2 + Math.random() * 2}px`,
            }}
          />
        ))}
      </div>

      {/* GET STARTED ღილაკი */}
      <button 
        className="btn-get-started" 
        onClick={() => {
          console.log('⬆️ GET STARTED clicked, going to zodiac');
          onFinish();
        }}
      >
        GET STARTED
      </button>
    </div>
  );
}