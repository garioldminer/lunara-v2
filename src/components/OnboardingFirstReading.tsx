import { useEffect } from 'react';
import './OnboardingFirstReading.css';

interface Props {
  onFinish: () => void;
}

export default function OnboardingFirstReading({ onFinish }: Props) {
  useEffect(() => {
    console.log('💀 OnboardingFirstReading mounted');
  }, []);

  return (
    <div className="screen-container first-reading">
      {/* ვიდეო ფონი */}
      <video 
        className="background-video"
        autoPlay 
        loop 
        muted 
        playsInline
      >
        <source src="/videos/first-reading.mp4" type="video/mp4" />
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

      {/* BEGIN YOUR JOURNEY ღილაკი */}
      <button 
        className="btn-begin" 
        onClick={() => {
          console.log('⬆️ BEGIN YOUR JOURNEY clicked, going to home');
          onFinish();
        }}
      >
        BEGIN YOUR JOURNEY
      </button>
    </div>
  );
}