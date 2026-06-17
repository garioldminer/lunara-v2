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
      {/* სტატიკური სურათი ფონად */}
      <div 
        className="background-image"
        style={{ backgroundImage: "url('/images/welcome.png')" }}
      />

      {/* CSS ნაწილაკები */}
      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i} 
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
            }}
          />
        ))}
      </div>

      {/* ღილაკი - ხილვადი */}
      <button 
        className="btn-get-started" 
        onClick={() => {
          console.log(' GET STARTED clicked, going to zodiac');
          onFinish();
        }}
      >
        GET STARTED
      </button>
    </div>
  );
}