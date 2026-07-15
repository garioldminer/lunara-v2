import { useEffect, useState } from 'react';
import './SplashScreen.css';

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log('🌙 SplashScreen mounted');
    setMounted(true);

    // 4.3 წამიანი ტაიმერი
    const timer = setTimeout(() => {
      console.log('⏰ Timer finished, transitioning to welcome');
      onFinish();
    }, 4300); // 4.3 წამი

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!mounted) return null;

  return (
    <div className="screen-container splash">
      {/* ვიდეო ფონი */}
      <video 
        className="background-video"
        autoPlay 
        loop 
        muted 
        playsInline
      >
        <source src="/videos/splash.mp4" type="video/mp4" />
      </video>

      {/* Loading bar */}
      <div className="loader-container">
        <div className="loader-track">
          <div className="loader-fill" />
        </div>
        <div className="loader-text">LOADING</div>
      </div>
    </div>
  );
}