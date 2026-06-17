import { useEffect } from 'react';
import './OnboardingZodiac.css';

interface Props {
  onFinish: () => void;
}

export default function OnboardingZodiac({ onFinish }: Props) {
  useEffect(() => {
    console.log('♏ OnboardingZodiac mounted');
  }, []);

  return (
    <div className="screen-container zodiac">
      {/* ვიდეო ფონი */}
      <video 
        className="background-video"
        autoPlay 
        loop 
        muted 
        playsInline
      >
        <source src="/videos/zodiac.mp4" type="video/mp4" />
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

      {/* CONTINUE ღილაკი */}
      <button 
        className="btn-continue" 
        onClick={() => {
          console.log('⬆️ CONTINUE clicked, going to first-reading');
          onFinish();
        }}
      >
        CONTINUE
      </button>
    </div>
  );
}