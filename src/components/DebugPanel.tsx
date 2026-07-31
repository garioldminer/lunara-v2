import { useState } from 'react';
import { Bug, X, CheckCircle, Activity, Settings, Terminal, Copy, Check } from 'lucide-react';

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
}

type TabType = 'overview' | 'quests' | 'actions' | 'logs';

export default function DebugPanel({
  showDebug, setShowDebug, user, economy, dbDebugInfo, debugLogs, dbStatus,
  activeSubscription, questsLoading, dailyQuests, activeDailyQuest, isClaimingQuest,
  timeLeft, showQuestModal, rewardClaimed, isClaiming, currentStreak, setDebugLogs,
  checkDatabaseStatus, refreshUserDataDebug, handleLogoutAndReset, testAddCoins,
  testAddXP, testAddEnergy, testSpendEnergy, testCompleteQuest, reloadFromDatabase
}: DebugPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyLogs = () => {
    const logText = debugLogs.map(log => 
      `[${log.timestamp}] [${log.category}] ${log.type.toUpperCase()}: ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`
    ).join('\n\n');
    
    navigator.clipboard.writeText(logText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Activity },
    { id: 'quests' as TabType, label: 'Quests', icon: CheckCircle },
    { id: 'actions' as TabType, label: 'Actions', icon: Settings },
    { id: 'logs' as TabType, label: 'Logs', icon: Terminal },
  ];

  if (!showDebug) return null;

  return (
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

      {/* Tabs - No horizontal scroll, wraps nicely for mobile */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', padding: '12px', borderBottom: '1px solid rgba(255, 229, 102, 0.2)', background: 'rgba(0,0,0,0.3)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: '1 1 40%', minWidth: '80px', padding: '8px', 
              background: activeTab === tab.id ? 'rgba(255, 229, 102, 0.2)' : 'transparent',
              border: activeTab === tab.id ? '1px solid rgba(255, 229, 102, 0.5)' : '1px solid transparent',
              borderRadius: '8px', color: activeTab === tab.id ? '#ffe566' : '#94a3b8',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              fontSize: '10px', fontWeight: 'bold', transition: 'all 0.2s'
            }}
          >
            <tab.icon size={16} />
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

        {activeTab === 'logs' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ color: '#f472b6', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Terminal size={14} /> LOGS ({debugLogs.length})
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                  onClick={() => setDebugLogs([])} 
                  style={{ padding: '6px 10px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}
                >
                  Clear
                </button>
                <button 
                  onClick={handleCopyLogs} 
                  style={{ 
                    padding: '6px 10px', background: copySuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(96, 165, 250, 0.2)', 
                    border: `1px solid ${copySuccess ? '#10b981' : '#60a5fa'}`, borderRadius: '6px', 
                    color: copySuccess ? '#10b981' : '#60a5fa', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  {copySuccess ? <Check size={12} /> : <Copy size={12} />} {copySuccess ? 'Copied!' : 'Copy All'}
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '8px' }}>
              {debugLogs.length === 0 && <div style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', padding: '20px' }}>No logs yet. Try an action!</div>}
              {debugLogs.slice().reverse().map((log, i) => (
                <div key={i} style={{ padding: '8px', marginBottom: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', borderLeft: `3px solid ${log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : '#fbbf24'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '9px' }}>{log.timestamp}</span>
                    <span style={{ fontSize: '9px', color: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : '#fbbf24', fontWeight: 'bold' }}>{log.category}</span>
                  </div>
                  <div style={{ color: '#e2e8f0', fontSize: '10px', wordBreak: 'break-word', marginBottom: log.data ? '4px' : '0' }}>{log.message}</div>
                  {log.data && (
                    <pre style={{ margin: 0, fontSize: '9px', color: '#94a3b8', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px', overflowX: 'auto' }}>
                      {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : log.data}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}