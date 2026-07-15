import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import './SplashScreen.css';

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  const { user } = useUser();
  const [showButton, setShowButton] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ვიდეოს ჩვენება 3.5 წამის განმავლობაში, შემდეგ ღილაკის გამოჩენა
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 3500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleEnterApp = async () => {
    if (!user) {
      setError('მომხმარებელი ვერ მოიძებნა. გთხოვთ, თავიდან შეხვიდეთ აპლიკაციაში.');
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      // 1. ვამოწმებთ, არსებობს თუ არა უკვე ეკონომიკის ჩანაწერი
      const { data: existingData, error: fetchError } = await supabase
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
        // სხვა ტიპის შეცდომა (მაგ. ქსელის პრობლემა)
        throw new Error(`მონაცემების შემოწმება ვერ მოხერხდა: ${fetchError.message}`);
      }

      // 3. ყველაფერი წარმატებით დასრულდა (ან უკვე არსებობდა, ან ახლა შეიქმნა)
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

      {/* შიგთავსი */}
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
        {!showButton ? (
          // Loading bar (ვიდეოს დროს)
          <div className="loader-container">
            <div className="loader-track">
              <div className="loader-fill" />
            </div>
            <div className="loader-text">LOADING</div>
          </div>
        ) : (
          // ღილაკი ან შეცდომა (ვიდეოს შემდეგ)
          error ? (
            <div style={{ textAlign: 'center', color: '#ef4444', background: 'rgba(0,0,0,0.7)', padding: '16px', borderRadius: '12px' }}>
              <p style={{ marginBottom: '12px', fontSize: '14px' }}>{error}</p>
              <button 
                onClick={handleEnterApp}
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
            <button 
              onClick={handleEnterApp}
              disabled={isInitializing}
              style={{
                background: isInitializing ? '#555' : 'linear-gradient(135deg, #C5A059 0%, #ffe566 100%)',
                color: '#0a0600',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: isInitializing ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(197, 160, 89, 0.4)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                minWidth: '250px'
              }}
              onMouseEnter={(e) => {
                if (!isInitializing) {
                  (e.target as HTMLElement).style.transform = 'scale(1.05)';
                  (e.target as HTMLElement).style.boxShadow = '0 6px 20px rgba(197, 160, 89, 0.6)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isInitializing) {
                  (e.target as HTMLElement).style.transform = 'scale(1)';
                  (e.target as HTMLElement).style.boxShadow = '0 4px 15px rgba(197, 160, 89, 0.4)';
                }
              }}
            >
              {isInitializing ? 'მონაცემების ინიციალიზაცია...' : 'დაიწყე მოგზაურობა ✨'}
            </button>
          )
        )}
      </div>
    </div>
  );
}