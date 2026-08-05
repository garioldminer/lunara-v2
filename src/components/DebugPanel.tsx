import { useState, useEffect } from 'react';
import { 
  Bug, X, CheckCircle, Activity, Settings, Terminal, Copy, Check, 
  Zap, TrendingUp, RotateCcw, Shield, Trash2, ChevronDown, ChevronUp 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';

interface DebugPanelProps {
  showDebug: boolean;
  setShowDebug: (show: boolean) => void;
  user: any;
  economy: any;
  dbDebugInfo: any;
  debugLogs: any[];
  dbStatus: string;
  activeSubscription: any;
  questsLoading: boolean;
  dailyQuests: any[];
  activeDailyQuest: any;
  isClaimingQuest: boolean;
  timeLeft: string;
  showQuestModal: boolean;
  rewardClaimed: boolean;
  isClaiming: boolean;
  currentStreak: number;
  setDebugLogs: React.Dispatch<React.SetStateAction<any[]>>;
  checkDatabaseStatus: () => void;
  refreshUserDataDebug: () => void;
  handleLogoutAndReset: () => void;
  testAddCoins: (amount: number) => void;
  testAddXP: (amount: number) => void;
  testAddEnergy: (amount: number) => void;
  testSpendEnergy: (amount: number) => void;
  testCompleteQuest: () => void;
  reloadFromDatabase: () => void;
  testAddXPWithLevel: (amount: number) => void;
  forceRecalcLevel: () => void;
  xpTestLogs: string[];
}

type TabType = 'overview' | 'quests' | 'actions' | 'xp' | 'smart' | 'logs';

export default function DebugPanel({
  showDebug, setShowDebug, user, economy, dbDebugInfo, debugLogs, dbStatus,
  activeSubscription, questsLoading, dailyQuests, activeDailyQuest, isClaimingQuest,
  timeLeft, showQuestModal, rewardClaimed, isClaiming, currentStreak, setDebugLogs,
  checkDatabaseStatus, refreshUserDataDebug, handleLogoutAndReset, testAddCoins,
  testAddXP, testAddEnergy, testSpendEnergy, testCompleteQuest, reloadFromDatabase,
  testAddXPWithLevel, forceRecalcLevel, xpTestLogs
}: DebugPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // 🆕 Smart Debug State
  const [authStatus, setAuthStatus] = useState<'checking' | 'active' | 'inactive'>('checking');
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  const { user: contextUser } = useUser();

  // 🆕 Check Auth Status dynamically
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setAuthStatus('inactive');
        return;
      }
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        if (error || !authUser) {
          setAuthStatus('inactive');
          setAuthUid(null);
        } else {
          setAuthStatus('active');
          setAuthUid(authUser.id);
        }
      } catch (err) {
        setAuthStatus('inactive');
        setAuthUid(null);
      }
    };
    checkAuth();
  }, [showDebug]); // Re-check when panel opens

  const handleCopyLogs = () => {
    const authInfo = `Auth Status: ${authStatus}\nAuth UID: ${authUid || 'NULL'}\nUser ID: ${user?.id || 'NULL'}\n\n`;
    const logText = debugLogs.map(log => 
      `[${log.timestamp}] [${log.category}] ${log.type.toUpperCase()}: ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`
    ).join('\n\n');
    
    navigator.clipboard.writeText(authInfo + logText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const getXPToNextLevel = (level: number): number => {
    if (level === 1) return 100;
    if (level === 2) return 250;
    if (level === 3) return 500;
    if (level === 4) return 1000;
    if (level === 5) return 2000;
    return Math.floor(2000 * Math.pow(1.8, level - 5));
  };

  const xpToNext = getXPToNextLevel(economy.level || 1);
  const currentLevelXP = (() => {
    let remaining = economy.xp || 0;
    let lvl = 1;
    while (lvl < (economy.level || 1)) {
      remaining -= getXPToNextLevel(lvl);
      lvl++;
    }
    return Math.max(0, remaining);
  })();
  const xpPercent = Math.min((currentLevelXP / xpToNext) * 100, 100);

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Activity },
    { id: 'quests' as TabType, label: 'Quests', icon: CheckCircle },
    { id: 'actions' as TabType, label: 'Actions', icon: Settings },
    { id: 'xp' as TabType, label: 'XP System', icon: Zap },
    { id: 'smart' as TabType, label: 'Smart Debug', icon: Shield }, // 🆕 ახალი ტაბი
    { id: 'logs' as TabType, label: 'Logs', icon: Terminal },
  ];

  return (
    <>
      <button 
        onClick={() => setShowDebug(!showDebug)} 
        style={{ 
          position: 'fixed', bottom: '20px', right: '20px', width: '50px', height: '50px', 
          borderRadius: '50%', background: showDebug ? '#ef4444' : '#3b82f6', 
          border: '3px solid rgba(255,255,255,0.3)', 
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', 
          cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 10001,
          transition: 'background 0.3s ease'
        }}
        title={showDebug ? "Close Debug Panel" : "Open Debug Panel"}
      >
        {showDebug ? <X size={24} /> : <Bug size={24} />}
      </button>

      {showDebug && (
        <div style={{ 
          position: 'fixed', bottom: '80px', right: '10px', left: '10px', zIndex: 10000, 
          maxWidth: '400px', margin: '0 auto', maxHeight: '75vh', 
          background: 'rgba(10, 6, 0, 0.98)', border: '2px solid rgba(255, 229, 102, 0.5)',
          borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          fontFamily: 'monospace', fontSize: '11px', color: '#ffe566',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ 
            padding: '12px 16px', borderBottom: '1px solid rgba(255, 229, 102, 0.3)', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(10, 6, 0, 0.98)'
          }}>
            <strong style={{ fontSize: '14px', color: '#ffe566', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bug size={16} /> ADMIN DEBUG
            </strong>
            <button onClick={() => setShowDebug(false)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px', padding: '10px 12px', borderBottom: '1px solid rgba(255, 229, 102, 0.2)', background: 'rgba(0,0,0,0.3)' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: '1 1 30%', minWidth: '60px', padding: '6px 4px', 
                  background: activeTab === tab.id ? 'rgba(255, 229, 102, 0.2)' : 'transparent',
                  border: activeTab === tab.id ? '1px solid rgba(255, 229, 102, 0.5)' : '1px solid transparent',
                  borderRadius: '8px', color: activeTab === tab.id ? '#ffe566' : '#94a3b8',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                  fontSize: '9px', fontWeight: 'bold', transition: 'all 0.2s'
                }}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  <div style={{ marginBottom: '8px', color: '#60a5fa', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={14} /> ECONOMY STATE
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>💎 Diamonds: <strong>{economy.cosmic_coins}</strong></div>
                    <div>⚡ Energy: <strong>{economy.cosmic_focus}/{economy.max_focus}</strong></div>
                    <div>⭐ Level: <strong>{economy.level}</strong></div>
                    <div>🔥 Streak: <strong>{currentStreak}</strong></div>
                  </div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ marginBottom: '8px', color: '#10b981', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={14} /> DATABASE
                  </div>
                  <div>Status: <strong style={{ color: dbStatus === 'connected' ? '#10b981' : '#ef4444' }}>{dbStatus.toUpperCase()}</strong></div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>User ID: {user?.id}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>Queries Logged: <strong>{dbDebugInfo.queryHistory?.length || 0}</strong></div>
                </div>
              </div>
            )}

            {activeTab === 'quests' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  <div style={{ marginBottom: '8px', color: '#60a5fa', fontWeight: 'bold', fontSize: '12px' }}>📜 DAILY QUESTS BANNER</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>🔄 Loading: <strong>{questsLoading ? 'Yes' : 'No'}</strong></div>
                    <div>⏳ Time Left: <strong>{timeLeft}</strong></div>
                    <div>📋 Total Quests: <strong>{dailyQuests.length}</strong></div>
                    <div>🎯 Active: <strong>{activeDailyQuest ? 'Yes' : 'None'}</strong></div>
                    <div>⚠️ Claiming: <strong>{isClaimingQuest ? 'Yes' : 'No'}</strong></div>
                    <div>🪟 Modal: <strong>{showQuestModal ? 'Open' : 'Closed'}</strong></div>
                  </div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                  <div style={{ marginBottom: '8px', color: '#fbbf24', fontWeight: 'bold', fontSize: '12px' }}>⚡ ACTION BUTTONS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>🎁 Reward: <strong>{rewardClaimed ? 'Claimed' : 'Pending'}</strong></div>
                    <div>🔄 Claiming: <strong>{isClaiming ? 'Yes' : 'No'}</strong></div>
                    <div>🔥 Streak: <strong>{currentStreak}</strong></div>
                    <div>👑 Sub: <strong>{activeSubscription ? 'Active' : 'None'}</strong></div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'actions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                  <div style={{ marginBottom: '8px', color: '#a78bfa', fontWeight: 'bold', fontSize: '12px' }}>⚡ ENERGY TESTS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button onClick={() => testAddEnergy(10)} style={{ padding: '8px', background: '#fbbf24', border: 'none', borderRadius: '6px', color: '#000', cursor: 'pointer', fontWeight: 'bold' }}>+10 ⚡</button>
                    <button onClick={() => testSpendEnergy(2)} style={{ padding: '8px', background: '#ef4444', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Spend 2 ⚡</button>
                  </div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  <div style={{ marginBottom: '8px', color: '#60a5fa', fontWeight: 'bold', fontSize: '12px' }}>💎 DIAMOND TESTS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button onClick={() => testAddCoins(100)} style={{ padding: '8px', background: '#a78bfa', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>+100 💎</button>
                    <button onClick={() => testAddXP(100)} style={{ padding: '8px', background: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>+100 XP</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button onClick={reloadFromDatabase} style={{ padding: '10px', background: '#10b981', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>🔄 RELOAD DB</button>
                  <button onClick={testCompleteQuest} style={{ padding: '10px', background: '#8b5cf6', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>🎯 TEST QUEST</button>
                  <button onClick={checkDatabaseStatus} style={{ padding: '10px', background: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>🩺 CHECK DB</button>
                  <button onClick={refreshUserDataDebug} style={{ padding: '10px', background: '#0ea5e9', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>🔄 REFRESH USER</button>
                </div>
                <button onClick={handleLogoutAndReset} style={{ width: '100%', padding: '10px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={14} style={{ marginRight: '4px' }} /> LOGOUT & RESET
                </button>
              </div>
            )}

            {activeTab === 'xp' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                  <div style={{ marginBottom: '8px', color: '#fbbf24', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp size={14} /> LIVE XP STATS
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                    <div>⭐ Level: <strong style={{ color: '#ffe566', fontSize: '14px' }}>{economy.level}</strong></div>
                    <div>📊 Total XP: <strong style={{ color: '#ffe566' }}>{economy.xp}</strong></div>
                    <div>📈 Level XP: <strong>{currentLevelXP}/{xpToNext}</strong></div>
                    <div>🎯 Next Lvl: <strong>{xpToNext - currentLevelXP} XP</strong></div>
                  </div>
                  <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', width: `${xpPercent}%`, background: 'linear-gradient(90deg, #fbbf24, #ffe566)', 
                      borderRadius: '4px', transition: 'width 0.5s ease', boxShadow: '0 0 8px rgba(251, 191, 36, 0.5)'
                    }} />
                  </div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px', textAlign: 'right' }}>
                    {xpPercent.toFixed(1)}% to Level {(economy.level || 1) + 1}
                  </div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                  <div style={{ marginBottom: '8px', color: '#a78bfa', fontWeight: 'bold', fontSize: '12px' }}>📋 LEVEL THRESHOLDS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', fontSize: '10px' }}>
                    {[1,2,3,4,5,6,7].map(lvl => (
                      <div key={lvl} style={{ 
                        padding: '4px 6px', borderRadius: '4px',
                        background: (economy.level || 1) >= lvl ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                        border: (economy.level || 1) === lvl ? '1px solid #10b981' : '1px solid transparent',
                        color: (economy.level || 1) >= lvl ? '#10b981' : '#94a3b8'
                      }}>
                        L{lvl}: {getXPToNextLevel(lvl)} XP
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  <div style={{ marginBottom: '8px', color: '#60a5fa', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={14} /> ADD XP (with Auto Level)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px' }}>
                    {[50, 100, 500, 2000].map(amount => (
                      <button key={amount} onClick={() => testAddXPWithLevel(amount)} style={{ 
                        padding: '8px 4px', background: amount >= 500 ? 'linear-gradient(135deg, #fbbf24, #d97706)' : '#3b82f6', 
                        border: 'none', borderRadius: '6px', color: amount >= 500 ? '#000' : '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px'
                      }}>
                        +{amount}
                      </button>
                    ))}
                  </div>
                  <button onClick={forceRecalcLevel} style={{ 
                    width: '100%', marginTop: '8px', padding: '10px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', 
                    borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}>
                    <RotateCcw size={12} /> Force Recalculate Level from DB
                  </button>
                </div>
                <div style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ marginBottom: '8px', color: '#f472b6', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Terminal size={14} /> XP TEST LOGS ({xpTestLogs.length})
                  </div>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.5)', borderRadius: '6px', padding: '6px' }}>
                    {xpTestLogs.length === 0 ? (
                      <div style={{ color: '#64748b', fontSize: '10px', textAlign: 'center', padding: '12px' }}>No XP tests yet.</div>
                    ) : (
                      xpTestLogs.slice().reverse().map((log, i) => (
                        <div key={i} style={{ 
                          padding: '4px 6px', marginBottom: '3px', fontSize: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px',
                          color: log.includes('LEVEL UP') ? '#10b981' : log.includes('ERROR') ? '#ef4444' : '#e2e8f0',
                          fontWeight: log.includes('LEVEL UP') ? 'bold' : 'normal'
                        }}>
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 🆕 SMART DEBUG TAB */}
            {activeTab === 'smart' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ marginBottom: '8px', color: '#10b981', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={14} /> AUTH & STATE STATUS
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                    <div>🔑 Auth: <span style={{ color: authStatus === 'active' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{authStatus === 'active' ? 'ACTIVE ✅' : 'INACTIVE ❌'}</span></div>
                    <div>👤 UID: <span style={{ color: authUid ? '#10b981' : '#ef4444', fontSize: '9px', wordBreak: 'break-all' }}>{authUid ? `${authUid.substring(0, 8)}...` : 'NULL'}</span></div>
                    <div>🆔 DB ID: <span style={{ color: user?.id ? '#10b981' : '#ef4444', fontSize: '9px', wordBreak: 'break-all' }}>{user?.id ? `${user.id.substring(0, 8)}...` : 'NULL'}</span></div>
                    <div>🛡️ Is Admin: <span style={{ color: user?.is_admin ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{user?.is_admin ? 'YES ✅' : 'NO ❌'}</span></div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={handleCopyLogs} style={{ flex: 1, padding: '8px', background: copySuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(96, 165, 250, 0.2)', border: `1px solid ${copySuccess ? '#10b981' : '#60a5fa'}`, borderRadius: '6px', color: copySuccess ? '#10b981' : '#60a5fa', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    {copySuccess ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy All Logs</>}
                  </button>
                  <button onClick={() => setDebugLogs([])} style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <Trash2 size={12} /> Clear
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', maxHeight: '250px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', padding: '8px' }}>
                  {debugLogs.length === 0 ? (
                    <div style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', padding: '20px' }}>No logs yet. Try an action!</div>
                  ) : (
                    debugLogs.slice().reverse().map((log, i) => (
                      <div key={i} style={{ padding: '8px', marginBottom: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', borderLeft: `3px solid ${log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : '#fbbf24'}`, cursor: log.data ? 'pointer' : 'default' }} onClick={() => log.data && setExpandedLog(expandedLog === i ? null : i)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ color: '#64748b', fontSize: '9px' }}>{log.timestamp}</span>
                          <span style={{ fontSize: '9px', color: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : '#fbbf24', fontWeight: 'bold' }}>{log.category}</span>
                        </div>
                        <div style={{ color: '#e2e8f0', fontSize: '10px', wordBreak: 'break-word', marginBottom: log.data ? '4px' : '0' }}>{log.message}</div>
                        {log.data && (
                          <div style={{ marginTop: '4px', padding: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', fontSize: '9px', color: '#94a3b8', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', display: expandedLog === i ? 'block' : 'none' }}>
                            {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : log.data}
                          </div>
                        )}
                        {log.data && (
                          <div style={{ textAlign: 'right', marginTop: '2px', color: '#64748b', fontSize: '9px' }}>
                            {expandedLog === i ? '▲ Click to collapse' : '▼ Click to expand'}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ color: '#f472b6', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Terminal size={14} /> RAW LOGS ({debugLogs.length})
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '8px' }}>
                  {debugLogs.length === 0 && <div style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', padding: '20px' }}>No logs yet.</div>}
                  {debugLogs.slice().reverse().map((log, i) => (
                    <div key={i} style={{ padding: '8px', marginBottom: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', borderLeft: `3px solid ${log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : '#fbbf24'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#64748b', fontSize: '9px' }}>{log.timestamp}</span>
                        <span style={{ fontSize: '9px', color: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : '#fbbf24', fontWeight: 'bold' }}>{log.category}</span>
                      </div>
                      <div style={{ color: '#e2e8f0', fontSize: '10px', wordBreak: 'break-word' }}>{log.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}