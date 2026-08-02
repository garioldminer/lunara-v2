import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
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

// The 12 zodiac glyphs, used to build the rotating celestial ring in the header.
const ZODIAC_GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

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
        display_name: user.display_name || 'მაძიებელი',
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

  // Rank 1-3 get a celestial body glyph instead of a generic medal.
  // Sun = 1st, Moon = 2nd, a single star = 3rd — this maps naturally onto
  // LUNARA's existing astrology vocabulary instead of borrowing sports iconography.
  const getRankStyles = (rank: number) => {
    if (rank === 1) return {
      bg: 'linear-gradient(135deg, rgba(251, 191, 36, 0.18), rgba(197, 160, 89, 0.08))',
      border: '1px solid rgba(251, 191, 36, 0.45)',
      badgeBg: 'radial-gradient(circle at 35% 30%, #ffe9a8, #fbbf24 60%, #b8860b)',
      badgeGlow: '0 0 14px rgba(251, 191, 36, 0.65)',
      glyph: '☉',
      glyphColor: '#3a2a05'
    };
    if (rank === 2) return {
      bg: 'linear-gradient(135deg, rgba(203, 213, 225, 0.12), rgba(148, 163, 184, 0.04))',
      border: '1px solid rgba(203, 213, 225, 0.35)',
      badgeBg: 'radial-gradient(circle at 35% 30%, #f1f5f9, #cbd5e1 60%, #64748b)',
      badgeGlow: '0 0 10px rgba(203, 213, 225, 0.4)',
      glyph: '☾',
      glyphColor: '#1e293b'
    };
    if (rank === 3) return {
      bg: 'linear-gradient(135deg, rgba(180, 83, 9, 0.14), rgba(146, 64, 14, 0.05))',
      border: '1px solid rgba(180, 83, 9, 0.38)',
      badgeBg: 'radial-gradient(circle at 35% 30%, #e8a86b, #b45309 65%, #6b3208)',
      badgeGlow: '0 0 10px rgba(180, 83, 9, 0.4)',
      glyph: '✦',
      glyphColor: '#fff'
    };
    return {
      bg: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      badgeBg: 'rgba(255,255,255,0.06)',
      badgeGlow: 'none',
      glyph: null,
      glyphColor: '#c9b98a'
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
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-sm rounded-3xl overflow-hidden flex flex-col"
            style={{
              background: 'linear-gradient(180deg, #171209 0%, #0c0a06 100%)',
              border: '1px solid rgba(197, 160, 89, 0.35)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.9), 0 0 40px rgba(197, 160, 89, 0.1)',
              maxHeight: '90vh'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="relative pt-8 pb-7 px-6 text-center flex-shrink-0 overflow-hidden"
              style={{
                background: 'radial-gradient(120% 100% at 50% 0%, rgba(197, 160, 89, 0.16) 0%, rgba(15,12,8,0) 65%)',
                borderBottom: '1px solid rgba(197, 160, 89, 0.18)'
              }}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full transition-all hover:scale-110 z-10"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8'
                }}
              >
                <X size={18} />
              </button>

              {/* Celestial ring — the signature element: a slow-turning zodiac wheel
                  behind a still central glyph, echoing LUNARA's astrology theme
                  instead of a generic trophy icon. */}
              <div
                className="relative mx-auto mb-4"
                style={{ width: 96, height: 96 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0"
                >
                  {ZODIAC_GLYPHS.map((glyph, i) => {
                    const angle = (360 / ZODIAC_GLYPHS.length) * i;
                    return (
                      <span
                        key={glyph}
                        className="absolute inset-0 flex items-start justify-center"
                        style={{
                          transform: `rotate(${angle}deg)`,
                          fontSize: 11,
                          color: 'rgba(251, 191, 36, 0.55)'
                        }}
                      >
                        {glyph}
                      </span>
                    );
                  })}
                </motion.div>

                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 14px rgba(251, 191, 36, 0.45)',
                      '0 0 26px rgba(251, 191, 36, 0.75)',
                      '0 0 14px rgba(251, 191, 36, 0.45)'
                    ]
                  }}
                  transition={{ duration: 3.2, repeat: Infinity }}
                  className="absolute rounded-full flex items-center justify-center"
                  style={{
                    inset: 20,
                    background: 'radial-gradient(circle at 35% 30%, #ffe9a8, #fbbf24 55%, #a06f0c)',
                    border: '1px solid rgba(251, 191, 36, 0.6)'
                  }}
                >
                  <Sparkles size={26} style={{ color: '#3a2a05' }} />
                </motion.div>
              </div>

              <h2
                className="text-2xl font-bold mb-2 tracking-wide"
                style={{
                  color: '#ffe566',
                  fontFamily: 'Georgia, serif',
                  textShadow: '0 0 20px rgba(255, 229, 102, 0.3)'
                }}
              >
                ვარსკვლავთა რეიტინგი
              </h2>

              {userRank && (
                <div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
                  style={{
                    background: 'rgba(197, 160, 89, 0.15)',
                    border: '1px solid rgba(197, 160, 89, 0.3)'
                  }}
                >
                  <span className="text-xs" style={{ color: '#b3a68c' }}>შენი ადგილი:</span>
                  <span className="text-sm font-bold" style={{ color: '#ffe566' }}>#{userRank}</span>
                </div>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
                    style={{ fontSize: 26, color: '#C5A059', display: 'inline-block' }}
                  >
                    ☾
                  </motion.span>
                  <p className="text-sm mt-3" style={{ color: '#94a3b8' }}>რეიტინგი იტვირთება...</p>
                </div>
              ) : leaders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="relative mx-auto mb-4" style={{ width: 90, height: 60 }}>
                    <svg viewBox="0 0 90 60" width="90" height="60">
                      <g stroke="rgba(197, 160, 89, 0.35)" strokeWidth="1">
                        <line x1="10" y1="45" x2="30" y2="15" />
                        <line x1="30" y1="15" x2="55" y2="25" />
                        <line x1="55" y1="25" x2="80" y2="10" />
                        <line x1="30" y1="15" x2="50" y2="48" />
                      </g>
                      <g fill="#fbbf24">
                        <circle cx="10" cy="45" r="2.2" />
                        <circle cx="30" cy="15" r="2.6" />
                        <circle cx="55" cy="25" r="2.2" />
                        <circle cx="80" cy="10" r="2.2" />
                        <circle cx="50" cy="48" r="2" />
                      </g>
                    </svg>
                  </div>
                  <p className="text-sm" style={{ color: '#94a3b8' }}>ჯერ არავინ დაუტოვებია კვალი</p>
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
                          style={{ background: '#9370db', color: '#fff' }}
                        >
                          შენ
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        {/* Rank badge */}
                        <div
                          className="flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm flex-shrink-0"
                          style={{
                            background: styles.badgeBg,
                            color: styles.glyphColor,
                            boxShadow: styles.badgeGlow
                          }}
                        >
                          {styles.glyph ?? leader.rank}
                        </div>

                        {/* User info */}
                        <div>
                          <div className="text-sm font-bold" style={{ color: '#fff' }}>
                            {leader.display_name}
                          </div>
                          <div className="text-xs" style={{ color: '#94a3b8' }}>
                            დონე {leader.level}
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

            {/* Footer */}
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