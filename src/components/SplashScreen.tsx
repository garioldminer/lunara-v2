import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import './SplashScreen.css';

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  const { user } = useUser();
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnterApp = async () => {
    if (!user || !supabase) {
      setError('სისტემური შეცდომა. გთხოვთ, თავიდან შეხვიდეთ აპლიკაციაში.');
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      // 1. ვამოწმებთ, არსებობს თუ არა უკვე ეკონომიკის ჩანაწერი
      const { error: fetchError } = await supabase
        .from('user_economy')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      // 2. თუ შეცდომა არის "0 rows" (PGRST116), ეს ნიშნავს რომ ჩანაწერი არ არსებობს -> ვქმნით ახალს
      if (fetchError && fetchError.code === 'PGRST116') {
        console.log('Creating new economy record for user:', user.id);
        
        const { error: insertError } = await supabase
          .from('user_economy')
          .insert({
            user_id: user.id,
            cosmic_coins: 0,
            xp: 0,
            level: 1,
            cosmic_focus: 3,
            max_focus: 3,
            current_streak: 0,
            longest_streak: 0,
            last_active_date: new Date().toISOString().split('T')[0],
            last_daily_claim: null
          });

        if (insertError) {
          throw new Error(`ჩანაწერის შექმნა ვერ მოხერხდა: ${insertError.message}`);
        }
      } else if (fetchError) {
        throw new Error(`მონაცემების შემოწმება ვერ მოხერხდა: ${fetchError.message}`);
      }

      console.log('Economy initialized successfully. Transitioning to app.');
      onFinish();

    } catch (err: any) {
      console.error('Initialization error:', err);
      setError(err.message || 'სისტემური შეცდომა. გთხოვთ, სცადოთ მოგვიანებით.');
      setIsInitializing(false);
    }
  };

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

      {/* ღილაკების კონტეინერი */}
      <div style={{ 
        position: 'absolute', 
        bottom: '15%', 
        left: '0', 
        right: '0', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '16px', 
        padding: '20px',
        zIndex: 10
      }}>
        {error ? (
          <div style={{ textAlign: 'center', color: '#ef4444', background: 'rgba(0,0,0,0.7)', padding: '16px', borderRadius: '12px', width: '100%', maxWidth: '300px' }}>
            <p style={{ marginBottom: '12px', fontSize: '14px' }}>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: '#C5A059',
                color: '#0a0600',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              თავიდან ცდა
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '280px' }}>
            {isInitializing ? (
              <div className="loader-container" style={{ width: '100%' }}>
                <div className="loader-track">
                  <div className="loader-fill" />
                </div>
                <div className="loader-text">მონაცემების ინიციალიზაცია...</div>
              </div>
            ) : (
              <>
                <button 
                  onClick={handleEnterApp}
                  style={{
                    background: 'linear-gradient(135deg, #C5A059 0%, #ffe566 100%)',
                    color: '#0a0600',
                    border: 'none',
                    padding: '16px',
                    borderRadius: '12px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(197, 160, 89, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  🔮 ტარო
                </button>
                
                <button 
                  onClick={handleEnterApp}
                  style={{
                    background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '16px',
                    borderRadius: '12px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(96, 165, 250, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  ✨ ჰოროსკოპი
                </button>
                
                <button 
                  onClick={handleEnterApp}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '16px',
                    borderRadius: '12px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  🚀 დაწყება
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}