import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  isAdmin?: boolean; // 🆕 Added for admin-only debug access
}

interface LeaderboardUser {
  id: string;
  display_name: string;
  level: number;
  xp: number;
  rank: number;
}

const ZODIAC_GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

export default function LeaderboardModal({ isOpen, onClose, currentUserId, isAdmin = false }: LeaderboardModalProps) {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  
  // 🆕 Debug states
  const [showDebug, setShowDebug] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);

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
      // 1. Fetch top 10 users from user_economy
      const { data: economyData, error: economyError } = await supabase
        .from('user_economy')
        .select('user_id, xp, level')
        .order('level', { ascending: false })
        .order('xp', { ascending: false })
        .limit(10);

      // 2. Fetch display names for these users separately
      const userIds = economyData?.map((item: any) => item.user_id) || [];
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, display_name')
        .in('id', userIds);

      // 🆕 Save raw data for the debug panel
      setDebugData({
        economyData,
        economyError,
        usersData,
        usersError,
        currentUserId
      });

      if (economyError) throw economyError;
      if (!economyData || economyData.length === 0) {
        setLeaders([]);
        setUserRank(null);
        setLoading(false);
        return;
      }

      // 3. Create a map of user_id -> display_name
      const nameMap: Record<string, string> = {};
      if (usersData) {
        usersData.forEach((u: any) => {
          nameMap[u.id] = u.display_name || 'Seeker';
        });
      }

      // 4. Combine the data
      const formattedLeaders: LeaderboardUser[] = economyData.map((item: any, index: number) => ({
        id: item.user_id,
        display_name: nameMap[item.user_id] || 'Seeker',
        level: item.level || 1,
        xp: item.xp || 0,
        rank: index + 1
      }));

      setLeaders(formattedLeaders);

      // 5. Calculate current user's exact rank
      const { data: currentUserData } = await supabase
        .from('user_economy')
        .select('xp, level')
        .eq('user_id', currentUserId)
        .single();

      if (currentUserData) {
        const userCurrentXp = currentUserData.xp || 0;
        const userCurrentLevel = currentUserData.level || 1;

        const { count } = await supabase
          .from('user_economy')
          .select('*', { count: 'exact', head: true })
          .or(`level.gt.${userCurrentLevel},and(level.eq.${userCurrentLevel},xp.gt.${userCurrentXp})`);

        setUserRank(count !== null ? count + 1 : 99);
      }

    } catch (err) {
      console.error('❌ Leaderboard fetch error:', err);
      setDebugData((prev: any) => ({ ...prev, fetchError: err }));
    } finally {
      setLoading(false);
    }
  };

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
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 10005,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '360px',
              maxHeight: '85vh',
              borderRadius: '20px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(180deg, #171209 0%, #0c0a06 100%)',
              border: '1px solid rgba(197, 160, 89, 0.35)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.9), 0 0 40px rgba(197, 160, 89, 0.1)'
            }}
          >
            {/* Header */}
            <div
              style={{
                position: 'relative',
                padding: '24px 20px 20px 20px',
                textAlign: 'center',
                flexShrink: 0,
                overflow: 'hidden',
                background: 'radial-gradient(120% 100% at 50% 0%, rgba(197, 160, 89, 0.16) 0%, rgba(15,12,8,0) 65%)',
                borderBottom: '1px solid rgba(197, 160, 89, 0.18)'
              }}
            >
              <button
                onClick={onClose}
                style={{
                  position: 'absolute', top: '12px', right: '12px', zIndex: 10,
                  padding: '6px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.4)', color: '#94a3b8', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>

              <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 12px auto' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                  style={{ position: 'absolute', inset: 0 }}
                >
                  {ZODIAC_GLYPHS.map((glyph, i) => {
                    const angle = (360 / ZODIAC_GLYPHS.length) * i;
                    return (
                      <span
                        key={glyph}
                        style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                          transform: `rotate(${angle}deg)`,
                          fontSize: 10,
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
                      '0 0 10px rgba(251, 191, 36, 0.45)',
                      '0 0 20px rgba(251, 191, 36, 0.75)',
                      '0 0 10px rgba(251, 191, 36, 0.45)'
                    ]
                  }}
                  transition={{ duration: 3.2, repeat: Infinity }}
                  style={{
                    position: 'absolute', inset: 16, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'radial-gradient(circle at 35% 30%, #ffe9a8, #fbbf24 55%, #a06f0c)',
                    border: '1px solid rgba(251, 191, 36, 0.6)'
                  }}
                >
                  <Sparkles size={22} style={{ color: '#3a2a05' }} />
                </motion.div>
              </div>

              <h2
                style={{
                  margin: '0 0 6px 0',
                  fontSize: '20px',
                  fontWeight: 700,
                  letterSpacing: '0.3px',
                  color: '#ffe566',
                  fontFamily: 'Georgia, serif',
                  textShadow: '0 0 20px rgba(255, 229, 102, 0.3)'
                }}
              >
                Celestial Rankings
              </h2>

              {userRank && (
                <div
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    background: 'rgba(197, 160, 89, 0.15)',
                    border: '1px solid rgba(197, 160, 89, 0.3)'
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#b3a68c' }}>Your Rank:</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffe566' }}>#{userRank}</span>
                </div>
              )}
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
                    style={{ fontSize: 22, color: '#C5A059', display: 'inline-block' }}
                  >
                    ☾
                  </motion.span>
                  <p style={{ fontSize: '12px', marginTop: '8px', color: '#94a3b8' }}>Loading rankings...</p>
                </div>
              ) : leaders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ margin: '0 auto 12px auto', width: 70, height: 45 }}>
                    <svg viewBox="0 0 90 60" width="100%" height="100%">
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
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>No one has left their mark yet</p>
                </div>
              ) : (
                leaders.map((leader, index) => {
                  const styles = getRankStyles(leader.rank);
                  const isCurrentUser = leader.id === currentUserId;

                  return (
                    <motion.div
                      key={leader.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      style={{
                        position: 'relative',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        background: styles.bg,
                        border: isCurrentUser ? '1px solid rgba(147, 112, 219, 0.5)' : styles.border,
                        boxShadow: isCurrentUser ? '0 0 15px rgba(147, 112, 219, 0.2)' : 'none'
                      }}
                    >
                      {isCurrentUser && (
                        <div
                          style={{
                            position: 'absolute', top: '-6px', right: '10px',
                            padding: '2px 6px', borderRadius: '4px',
                            fontSize: '8px', fontWeight: 700,
                            background: '#9370db', color: '#fff'
                          }}
                        >
                          YOU
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '36px', height: '36px', borderRadius: '50%',
                            fontWeight: 700, fontSize: '13px', flexShrink: 0,
                            background: styles.badgeBg,
                            color: styles.glyphColor,
                            boxShadow: styles.badgeGlow
                          }}
                        >
                          {styles.glyph ?? leader.rank}
                        </div>

                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                            {leader.display_name}
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                            Level {leader.level}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffe566' }}>
                          {leader.xp.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '9px', color: '#94a3b8' }}>XP</div>
                      </div>
                    </motion.div>
                  );
                })
              )}

              {/* 🆕 ADMIN ONLY DEBUG PANEL */}
              {isAdmin && debugData && (
                <div style={{ marginTop: '16px', borderTop: '1px solid rgba(239, 68, 68, 0.3)', paddingTop: '12px' }}>
                  <button
                    onClick={() => setShowDebug(!showDebug)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      color: '#ef4444',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    <Bug size={12} />
                    {showDebug ? 'Hide Debug Data' : 'Show Debug Data'}
                    {showDebug ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  {showDebug && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px',
                      background: 'rgba(0,0,0,0.6)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      fontFamily: 'monospace',
                      fontSize: '10px',
                      color: '#fca5a5'
                    }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {JSON.stringify(debugData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 16px 16px 16px', flexShrink: 0, borderTop: '1px solid rgba(197, 160, 89, 0.15)' }}>
              <button
                onClick={onClose}
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                  fontSize: '13px', fontWeight: 700, letterSpacing: '0.3px', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #C5A059 0%, #8B6914 100%)',
                  color: '#0f0c08',
                  boxShadow: '0 4px 15px rgba(197, 160, 89, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                }}
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}