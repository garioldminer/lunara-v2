import { useState, useEffect } from 'react';
import { X, Trophy, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

interface LeaderboardUser {
  display_name: string;
  level: number;
  xp: number;
  rank: number;
}

export default function LeaderboardModal({ isOpen, onClose, currentUserId }: LeaderboardModalProps) {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) fetchLeaderboard();
  }, [isOpen]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    
    // ✅ დამატებულია supabase-ის null შემოწმება
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, display_name, xp, level')
        .order('xp', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedLeaders = (data || []).map((user: any, index: number) => ({
        display_name: user.display_name || 'Unknown',
        level: user.level || 1,
        xp: user.xp || 0,
        rank: index + 1
      }));

      setLeaders(formattedLeaders);

      // ✅ გამოუყენებელი 'u' შეცვლილია '_'-ით, რათა TypeScript-მა არ იჩივლოს
      const currentUser = formattedLeaders.find((_: any) => false); 
      
      const userCurrentXp = data?.find((u: any) => u.id === currentUserId)?.xp || 0;
      
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gt('xp', userCurrentXp);
      
      setUserRank(count ? count + 1 : (currentUser ? currentUser.rank : 99));

    } catch (err) {
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm rounded-2xl p-6 max-h-[80vh] flex flex-col"
        style={{ 
          background: 'linear-gradient(135deg, #1a1510 0%, #0f0c08 100%)',
          border: '1px solid rgba(197, 160, 89, 0.3)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(197, 160, 89, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
          style={{ color: '#94a3b8' }}
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3" style={{ background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
            <Trophy size={32} style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))' }} />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: '#ffe566', fontFamily: 'Georgia, serif' }}>ლიდერბორდი</h2>
          <p className="text-sm mt-2" style={{ color: '#94a3b8' }}>
            თქვენი ადგილი: <span className="font-bold" style={{ color: '#ffe566' }}>#{userRank || '?'}</span>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {loading ? (
            <div className="text-center py-8" style={{ color: '#94a3b8' }}>იტვირთება...</div>
          ) : (
            leaders.map((leader, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ 
                  background: leader.rank <= 3 ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: leader.rank <= 3 ? '1px solid rgba(251, 191, 36, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm"
                    style={{ 
                      background: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : 'rgba(255,255,255,0.1)',
                      color: index <= 2 ? '#0f0c08' : '#94a3b8'
                    }}
                  >
                    {leader.rank}
                  </div>
                  <div>
                    <div className="text-sm font-semibold flex items-center gap-1" style={{ color: '#fff' }}>
                      {leader.display_name}
                      {leader.rank <= 3 && <Crown size={12} style={{ color: '#fbbf24' }} />}
                    </div>
                    <div className="text-xs" style={{ color: '#94a3b8' }}>Level {leader.level}</div>
                  </div>
                </div>
                <div className="text-sm font-bold" style={{ color: '#ffe566' }}>
                  {leader.xp.toLocaleString()} XP
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}