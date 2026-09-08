import { useState, useEffect } from 'react';

// ==========================================
// 🕐 ISOLATED COUNTDOWN TIMER
// ==========================================
export function CountdownTimer({ style }: { style?: React.CSSProperties }) {
  const [timeLeft, setTimeLeft] = useState('00:00:00');
  
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  
  return <span style={style}>{timeLeft}</span>;
}