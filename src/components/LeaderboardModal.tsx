import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Crown, Medal, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

interface LeaderboardUser {
  id: string;
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
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, display_name, xp, level')
        .order('xp', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedLeaders = (data || []).map((user: any, index: number) => ({
        id: user.id,
        display_name: user.display_name || 'Seeker',
        level: user.level || 1,
        xp: user.xp || 0,
        rank: index + 1
      }));

      setLeaders(formattedLeaders);

      const userCurrentXp = data?.find((u: any) => u.id === currentUserId)?.xp || 0;
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gt('xp', userCurrentXp);
      
      setUserRank(count !== null ? count + 1 : 99);

    } catch (err) {
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankStyles = (rank: number) => {
    if (rank === 1) return {
      bg: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(197, 160, 89, 0.1))',
      border: '1px solid rgba(251, 191, 36, 0.5)',
      badge: '#fbbf24',
      badgeText: '#0f0c08',
      icon: <Crown size={18} style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.8))' }} />
    };
    if (rank === 2) return {
      bg: 'linear-gradient(135deg, rgba(148, 163, 184, 0.15), rgba(100, 116, 139, 0.05))',
      border: '1px solid rgba(148, 163, 184, 0.4)',
      badge: '#94a3b8',
      badgeText: '#0f0c08',
      icon: <Medal size={18} style={{ color: '#94a3b8' }} />
    };
    if (rank === 3) return {
      bg: 'linear-gradient(135deg, rgba(180, 83, 9, 0.15), rgba(146, 64, 14, 0.05))',
      border: '1px solid rgba(180, 83, 9, 0.4)',
      badge: '#b45309',
      badgeText: '#fff',
      icon: <Medal size={18} style={{ color: '#b45309' }} />
    };
    return {
      bg: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      badge: 'rgba(255,255,255,0.1)',
      badgeText: '#94a3b8',
      icon: <Zap size={16} style={{ color: '#94a3b8' }} />
    };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm rounded-3xl overflow-hidden flex flex-col"
            style={{ 
              background: 'linear-gradient(135deg, #1a1510 0%, #0f0c08 100%)',
              border: '1px solid rgba(197, 160, 89, 0.4)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.9), 0 0 40px rgba(197, 160, 89, 0.1)',
              maxHeight: '90vh'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ჰედერი */}
            <div 
              className="relative pt-8 pb-6 px-6 text-center flex-shrink-0"
              style={{ 
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(197, 160, 89, 0.1) 100%)',
                borderBottom: '1px solid rgba(197, 160, 89, 0.2)'
              }}
            >
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full transition-all hover:scale-110"
                style={{ 
                  background: 'rgba(0,0,0,0.4)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8'
                }}
              >
                <X size={18} />
              </button>

              <motion.div 
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  filter: [
                    'drop-shadow(0 0 15px rgba(251, 191, 36, 0.6))',
                    'drop-shadow(0 0 25px rgba(251, 191, 36, 0.9))',
                    'drop-shadow(0 0 15px rgba(251, 191, 36, 0.6))'
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(197, 160, 89, 0.2))',
                  border: '2px solid rgba(251, 191, 36, 0.5)'
                }}
              >
                <Trophy size={40} style={{ color: '#fbbf24' }} />
              </motion.div>

              <h2 
                className="text-3xl font-bold mb-2 tracking-wide" 
                style={{ 
                  color: '#ffe566', 
                  fontFamily: 'Georgia, serif',
                  textShadow: '0 0 20px rgba(255, 229, 102, 0.3)'
                }}
              >
                ლიდერბორდი
              </h2>
              
              {userRank && (
                <div 
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
                  style={{ 
                    background: 'rgba(197, 160, 89, 0.15)',
                    border: '1px solid rgba(197, 160, 89, 0.3)'
                  }}
                >
                  <span className="text-xs" style={{ color: '#b3a68c' }}>თქვენი ადგილი:</span>
                  <span className="text-sm font-bold" style={{ color: '#ffe566' }}>#{userRank}</span>
                </div>
              )}
            </div>

            {/* მომხმარებლების სია */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 rounded-full border-2 border-t-transparent mb-3"
                    style={{ borderColor: '#C5A059', borderTopColor: 'transparent' }}
                  />
                  <p className="text-sm" style={{ color: '#94a3b8' }}>ლიდერები იტვირთება...</p>
                </div>
              ) : leaders.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy size={40} className="mx-auto mb-3" style={{ color: '#4b5563' }} />
                  <p className="text-sm" style={{ color: '#94a3b8' }}>ჯერ არავინ არ არის</p>
                </div>
              ) : (
                leaders.map((leader, index) => {
                  const styles = getRankStyles(leader.rank);
                  const isCurrentUser = leader.id === currentUserId;
                  
                  return (
                    <motion.div 
                      key={leader.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-xl transition-all relative"
                      style={{ 
                        background: styles.bg,
                        border: isCurrentUser 
                          ? '1px solid rgba(147, 112, 219, 0.5)' 
                          : styles.border,
                        boxShadow: isCurrentUser ? '0 0 15px rgba(147, 112, 219, 0.2)' : 'none'
                      }}
                    >
                      {isCurrentUser && (
                        <div 
                          className="absolute -top-2 right-3 px-2 py-0.5 rounded text-[9px] font-bold"
                          style={{ 
                            background: '#9370db',
                            color: '#fff'
                          }}
                        >
                          ეს შენ ხარ
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        {/* რეიტინგის ბეჯი */}
                        <div 
                          className="flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm flex-shrink-0"
                          style={{ 
                            background: styles.badge,
                            color: styles.badgeText,
                            boxShadow: leader.rank <= 3 ? `0 0 10px ${styles.badge}40` : 'none'
                          }}
                        >
                          {leader.rank <= 3 ? styles.icon : leader.rank}
                        </div>
                        
                        {/* მომხმარებლის ინფო */}
                        <div>
                          <div className="text-sm font-bold flex items-center gap-1.5" style={{ color: '#fff' }}>
                            {leader.display_name}
                            {leader.rank <= 3 && leader.rank > 1 && <Crown size={12} style={{ color: '#fbbf24' }} />}
                          </div>
                          <div className="text-xs flex items-center gap-1" style={{ color: '#94a3b8' }}>
                            <Zap size={10} />
                            <span>Level {leader.level}</span>
                          </div>
                        </div>
                      </div>

                      {/* XP */}
                      <div className="text-right">
                        <div className="text-sm font-bold" style={{ color: '#ffe566' }}>
                          {leader.xp.toLocaleString()}
                        </div>
                        <div className="text-[10px]" style={{ color: '#94a3b8' }}>XP</div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* ქვედა ღილაკი */}
            <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(197, 160, 89, 0.15)' }}>
              <button 
                onClick={onClose}
                className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ 
                  background: 'linear-gradient(135deg, #C5A059 0%, #8B6914 100%)',
                  color: '#0f0c08',
                  boxShadow: '0 4px 20px rgba(197, 160, 89, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                }}
              >
                დახურვა
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}