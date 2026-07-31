import { useState } from 'react';
import { 
  Bug, X, CheckCircle, XCircle, RefreshCw, Copy, Check, 
  Database, Zap, FileJson, Terminal, User 
} from 'lucide-react';

interface DebugPanelProps {
  showDebug: boolean;
  setShowDebug: (show: boolean) => void;
  user: any;
  economy: any; // ✅ დამატებულია ცოცხალი ეკონომიკის სტეიტი
  dbDebugInfo: any;
  debugLogs: any[];
  dbStatus: string;
  activeSubscription: any;
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

type TabType = 'overview' | 'profile_banner' | 'actions' | 'logs' | 'raw';

export default function DebugPanel({
  showDebug,
  setShowDebug,
  user,
  economy, // ✅ მიღება
  dbDebugInfo,
  debugLogs,
  dbStatus,
  activeSubscription,
  setDebugLogs,
  checkDatabaseStatus,
  refreshUserDataDebug,
  handleLogoutAndReset,
  testAddCoins,
  testAddXP,
  testAddEnergy,
  testSpendEnergy,
  testCompleteQuest,
  reloadFromDatabase,
}: DebugPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => handleCopy(text, id)}
      style={{
        background: 'none',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '4px',
        padding: '4px',
        color: copiedItem === id ? '#10b981' : '#94a3b8',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s'
      }}
      title="Copy to clipboard"
    >
      {copiedItem === id ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Database },
    { id: 'profile_banner', label: 'Banner', icon: User },
    { id: 'actions', label: 'Actions', icon: Zap },
    { id: 'logs', label: 'Logs', icon: Terminal },
    { id: 'raw', label: 'Raw Data', icon: FileJson },
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
          position: 'fixed', bottom: '80px', right: '20px', zIndex: 10000, 
          width: '450px', maxWidth: '90vw', maxHeight: '70vh', 
          background: 'rgba(10, 6, 0, 0.98)', border: '2px solid rgba(255, 229, 102, 0.5)',
          borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          fontFamily: 'monospace', fontSize: '11px', color: '#ffe566',
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ 
            padding: '12px 16px', borderBottom: '1px solid rgba(255, 229, 102, 0.3)', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(10, 6, 0, 0.98)', borderRadius: '14px 14px 0 0'
          }}>
            <strong style={{ fontSize: '14px', color: '#ffe566', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bug size={16} /> ADMIN DEBUG
            </strong>
            <button onClick={() => setShowDebug(false)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 229, 102, 0.2)', background: 'rgba(0,0,0,0.3)', overflowX: 'auto' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, minWidth: '60px', padding: '10px 4px', background: 'none', border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #fbbf24' : '2px solid transparent',
                  color: activeTab === tab.id ? '#fbbf24' : '#94a3b8',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  fontSize: '9px', fontWeight: 'bold', transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            
            {activeTab === 'profile_banner' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  <div style={{ marginBottom: '8px', color: '#60a5fa', fontWeight: 'bold', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                    👤 USER INFO <CopyBtn text={JSON.stringify(user, null, 2)} id="banner-user" />
                  </div>
                  <div style={{ fontSize: '11px', marginBottom: '4px' }}>Name: <strong>{user?.display_name || 'N/A'}</strong></div>
                  <div style={{ fontSize: '11px', marginBottom: '4px' }}>Username: <strong>{user?.username || 'N/A'}</strong></div>
                  <div style={{ fontSize: '11px', wordBreak: 'break-all' }}>ID: <strong>{user?.id || 'N/A'}</strong></div>
                </div>

                <div style={{ padding: '12px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                  <div style={{ marginBottom: '8px', color: '#fbbf24', fontWeight: 'bold', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                    💎 ECONOMY & STATS (LIVE) <CopyBtn text={JSON.stringify(economy, null, 2)} id="banner-economy" />
                  </div>
                  {/* ✅ აქ ვიყენებთ ცოცხალ economy სტეიტს და არა dbDebugInfo-ს */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                    <div>🪙 Coins: <strong>{economy?.cosmic_coins || 0}</strong></div>
                    <div>⚡ Energy: <strong>{economy?.cosmic_focus || 0} / {economy?.max_focus || 20}</strong></div>
                    <div>⭐ Level: <strong>{economy?.level || 1}</strong></div>
                    <div>🔥 Streak: <strong>{economy?.current_streak || 0}</strong></div>
                  </div>
                </div>

                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ marginBottom: '8px', color: '#10b981', fontWeight: 'bold', fontSize: '11px' }}>
                    👑 SUBSCRIPTION STATUS
                  </div>
                  {activeSubscription ? (
                    <div style={{ fontSize: '11px' }}>
                      <div style={{ marginBottom: '4px' }}>Status: <strong style={{ color: '#10b981' }}>ACTIVE</strong></div>
                      <div style={{ marginBottom: '4px' }}>Plan: <strong>{activeSubscription.plan_name || 'N/A'}</strong></div>
                      <div>Expires: <strong>{activeSubscription.expires_at ? new Date(activeSubscription.expires_at).toLocaleDateString() : 'N/A'}</strong></div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>No active subscription (Free Tier)</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  <div style={{ marginBottom: '8px', color: '#60a5fa', fontWeight: 'bold', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                    🗄️ DATABASE <CopyBtn text={`Status: ${dbStatus}\nUser: ${user?.id}`} id="db-overview" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    {dbStatus === 'connected' ? <CheckCircle size={14} color="#10b981" /> : dbStatus === 'error' ? <XCircle size={14} color="#ef4444" /> : <RefreshCw size={14} color="#fbbf24" />}
                    <span>Status: <strong style={{ color: dbStatus === 'connected' ? '#10b981' : dbStatus === 'error' ? '#ef4444' : '#fbbf24' }}>{dbStatus.toUpperCase()}</strong></span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>User ID: {user?.id}</div>
                </div>
              </div>
            )}

            {activeTab === 'actions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ marginBottom: '8px', color: '#fbbf24', fontWeight: 'bold', fontSize: '11px' }}>🧪 ECONOMY TESTS</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <button onClick={() => testAddEnergy(5)} style={{ padding: '8px 12px', background: '#fbbf24', border: 'none', borderRadius: '6px', color: '#000', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>+5 ⚡</button>
                    <button onClick={() => testAddEnergy(10)} style={{ padding: '8px 12px', background: '#f59e0b', border: 'none', borderRadius: '6px', color: '#000', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>+10 ⚡</button>
                    <button onClick={() => testSpendEnergy(2)} style={{ padding: '8px 12px', background: '#ef4444', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Spend 2 ⚡</button>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button onClick={() => testAddCoins(10)} style={{ padding: '8px 12px', background: 'rgba(251, 191, 36, 0.2)', border: '1px solid #fbbf24', borderRadius: '6px', color: '#fbbf24', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>+10 🪙</button>
                    <button onClick={() => testAddXP(50)} style={{ padding: '8px 12px', background: 'rgba(167, 139, 250, 0.2)', border: '1px solid #a78bfa', borderRadius: '6px', color: '#a78bfa', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>+50 ⭐</button>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                  <div style={{ marginBottom: '8px', color: '#60a5fa', fontWeight: 'bold', fontSize: '11px' }}>⚙️ SYSTEM ACTIONS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button onClick={reloadFromDatabase} style={{ padding: '10px', background: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>🔄 RELOAD DB</button>
                    <button onClick={testCompleteQuest} style={{ padding: '10px', background: '#10b981', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>🎯 TEST QUEST</button>
                    <button onClick={checkDatabaseStatus} style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', borderRadius: '6px', color: '#10b981', cursor: 'pointer', fontSize: '11px' }}>🩺 CHECK DB</button>
                    <button onClick={refreshUserDataDebug} style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', borderRadius: '6px', color: '#3b82f6', cursor: 'pointer', fontSize: '11px' }}>🔄 REFRESH USER</button>
                  </div>
                  <button onClick={handleLogoutAndReset} style={{ width: '100%', marginTop: '8px', padding: '10px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <X size={14} /> LOGOUT & RESET
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ marginBottom: '8px', color: '#f472b6', fontWeight: 'bold', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  📝 LOGS ({debugLogs.length})
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <CopyBtn text={debugLogs.map((l: any) => `[${l.timestamp}] ${l.category}: ${l.message}`).join('\n')} id="logs-text" />
                    <button onClick={() => setDebugLogs([])} style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', padding: '4px 8px', fontSize: '10px' }}>Clear</button>
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '8px', maxHeight: '350px' }}>
                  {debugLogs.length === 0 && <div style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', padding: '20px' }}>No logs yet.</div>}
                  {debugLogs.slice(0, 50).map((log: any, i: number) => (
                    <div key={i} style={{ padding: '6px', marginBottom: '4px', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', borderLeft: `3px solid ${log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : log.type === 'warning' ? '#fbbf24' : '#60a5fa'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ color: '#64748b', fontSize: '9px' }}>{log.timestamp}</span>
                        <span style={{ fontSize: '9px', color: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : log.type === 'warning' ? '#fbbf24' : '#60a5fa', fontWeight: 'bold' }}>{log.category}</span>
                      </div>
                      <div style={{ color: '#e2e8f0', fontSize: '10px', wordBreak: 'break-word' }}>{log.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'raw' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ marginBottom: '8px', color: '#a78bfa', fontWeight: 'bold', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  📦 RAW JSON DATA
                  <CopyBtn text={JSON.stringify({ user: { id: user?.id }, economy: economy, lastQuery: dbDebugInfo.lastQuery }, null, 2)} id="raw-json" />
                </div>
                <pre style={{ 
                  flex: 1, overflow: 'auto', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '12px', 
                  fontSize: '9px', color: '#e2e8f0', maxHeight: '350px', border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  {JSON.stringify({
                    user: { id: user?.id, name: user?.display_name },
                    economy: economy, // ✅ აქაც ცოცხალი სტეიტი
                    lastQuery: dbDebugInfo.lastQuery
                  }, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}