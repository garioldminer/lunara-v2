import { Bug, X, CheckCircle, XCircle, RefreshCw, Copy, LogOut } from 'lucide-react';

interface DebugPanelProps {
  showDebug: boolean;
  setShowDebug: (show: boolean) => void;
  user: any;
  dbDebugInfo: any;
  debugLogs: any[];
  energyTransactions: any[];
  dbStatus: string;
  lastDbQuery: any;
  copySuccess: boolean;
  copyAllDebugInfo: () => void;
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

export default function DebugPanel({
  showDebug,
  setShowDebug,
  user,
  dbDebugInfo,
  debugLogs,
  energyTransactions,
  dbStatus,
  lastDbQuery,
  copySuccess,
  copyAllDebugInfo,
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
  return (
    <>
      {/* ✅ ეს ღილაკი ყოველთვის ჩანს, რათა პანელის გახსნა/დახურვა შეძლო */}
      <button 
        onClick={() => setShowDebug(!showDebug)} 
        style={{ 
          position: 'fixed', 
          bottom: '20px', 
          right: '20px', 
          width: '50px', 
          height: '50px', 
          borderRadius: '50%', 
          background: showDebug ? '#ef4444' : '#3b82f6', // წითელი თუ ღიაა, ლურჯი თუ დახურულია
          border: '3px solid rgba(255,255,255,0.3)', 
          color: '#fff', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          cursor: 'pointer', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 10001,
          transition: 'background 0.3s ease'
        }}
        title={showDebug ? 'Close Debug Panel' : 'Open Debug Panel'}
      >
        <Bug size={24} />
      </button>

      {/* ✅ თავად პანელი ჩანს მხოლოდ მაშინ, როცა showDebug არის true */}
      {showDebug && (
        <div style={{ 
          position: 'fixed', 
          bottom: '80px', 
          right: '20px', 
          zIndex: 10000, 
          maxWidth: '450px', 
          maxHeight: '70vh', 
          overflow: 'auto',
          background: 'rgba(10, 6, 0, 0.98)',
          border: '2px solid rgba(255, 229, 102, 0.5)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#ffe566'
        }}>
          <div style={{ 
            padding: '12px 16px', 
            borderBottom: '1px solid rgba(255, 229, 102, 0.3)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            background: 'rgba(10, 6, 0, 0.98)',
            zIndex: 1
          }}>
            <strong style={{ fontSize: '14px', color: '#ffe566', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bug size={16} /> ADMIN DEBUG
            </strong>
            <button 
              onClick={() => setShowDebug(false)} 
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>
          
          <div style={{ padding: '16px' }}>
            {/* Database Status */}
            <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <div style={{ marginBottom: '8px', color: '#60a5fa', fontWeight: 'bold', fontSize: '11px' }}>🗄️ DATABASE CONNECTION</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                {dbStatus === 'connected' ? <CheckCircle size={14} color="#10b981" /> : dbStatus === 'error' ? <XCircle size={14} color="#ef4444" /> : <RefreshCw size={14} color="#fbbf24" />}
                <span>Status: <strong style={{ color: dbStatus === 'connected' ? '#10b981' : dbStatus === 'error' ? '#ef4444' : '#fbbf24' }}>{dbStatus.toUpperCase()}</strong></span>
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>User ID: {user?.id?.slice(0, 8)}...</div>
            </div>

            {/* Economy Status */}
            <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ marginBottom: '8px', color: '#10b981', fontWeight: 'bold', fontSize: '11px' }}>💰 ECONOMY STATE</div>
              {dbDebugInfo.economyData ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ fontSize: '11px' }}>🪙 Coins: <strong>{dbDebugInfo.economyData.cosmic_coins}</strong></div>
                  <div style={{ fontSize: '11px' }}>⭐ XP: <strong>{dbDebugInfo.economyData.xp}</strong></div>
                  <div style={{ fontSize: '11px' }}>🎯 Level: <strong>{dbDebugInfo.economyData.level}</strong></div>
                  <div style={{ fontSize: '11px' }}>🔥 Streak: <strong>{dbDebugInfo.economyData.current_streak}</strong></div>
                  <div style={{ fontSize: '11px', gridColumn: '1 / -1' }}>⚡ Energy: <strong>{dbDebugInfo.economyData.cosmic_focus || 0} / {dbDebugInfo.economyData.max_focus || 20}</strong></div>
                </div>
              ) : (
                <div style={{ color: '#64748b', fontSize: '11px' }}>No data loaded yet</div>
              )}
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px', color: '#fbbf24', fontWeight: 'bold', fontSize: '11px' }}>🧪 QUICK TESTS</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <button onClick={() => testAddEnergy(5)} style={{ padding: '6px 10px', background: '#fbbf24', border: 'none', borderRadius: '6px', color: '#000', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>+5 ⚡</button>
                <button onClick={() => testAddEnergy(10)} style={{ padding: '6px 10px', background: '#f59e0b', border: 'none', borderRadius: '6px', color: '#000', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>+10 ⚡</button>
                <button onClick={() => testSpendEnergy(2)} style={{ padding: '6px 10px', background: '#ef4444', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>Spend 2 ⚡</button>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <button onClick={() => testAddCoins(10)} style={{ padding: '6px 10px', background: 'rgba(251, 191, 36, 0.2)', border: '1px solid #fbbf24', borderRadius: '6px', color: '#fbbf24', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>+10 🪙</button>
                <button onClick={() => testAddXP(50)} style={{ padding: '6px 10px', background: 'rgba(167, 139, 250, 0.2)', border: '1px solid #a78bfa', borderRadius: '6px', color: '#a78bfa', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>+50 ⭐</button>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button onClick={reloadFromDatabase} style={{ flex: 1, padding: '8px', background: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>🔄 RELOAD DB</button>
                <button onClick={testCompleteQuest} style={{ flex: 1, padding: '8px', background: '#10b981', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>🎯 TEST QUEST</button>
              </div>
            </div>

            {/* System Actions */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <button onClick={checkDatabaseStatus} style={{ flex: 1, padding: '6px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', borderRadius: '6px', color: '#10b981', cursor: 'pointer', fontSize: '10px' }}>🩺 CHECK DB</button>
              <button onClick={refreshUserDataDebug} style={{ flex: 1, padding: '6px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', borderRadius: '6px', color: '#3b82f6', cursor: 'pointer', fontSize: '10px' }}>🔄 REFRESH USER</button>
              <button onClick={handleLogoutAndReset} style={{ flex: 1, padding: '6px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><LogOut size={12} /> LOGOUT</button>
            </div>

            {/* Copy / Clear */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
              <button onClick={copyAllDebugInfo} style={{ flex: 1, padding: '8px', background: copySuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(96, 165, 250, 0.2)', border: `1px solid ${copySuccess ? '#10b981' : '#60a5fa'}`, borderRadius: '6px', color: copySuccess ? '#10b981' : '#60a5fa', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Copy size={12} /> {copySuccess ? 'COPIED!' : 'COPY ALL'}
              </button>
              <button onClick={() => setDebugLogs([])} style={{ flex: 1, padding: '8px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '10px' }}>🗑️ CLEAR LOGS</button>
            </div>

            {/* Logs List */}
            <div>
              <div style={{ marginBottom: '8px', color: '#f472b6', fontWeight: 'bold', fontSize: '11px' }}>📝 LOGS ({debugLogs.length})</div>
              <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '8px' }}>
                {debugLogs.length === 0 && <div style={{ color: '#64748b', fontSize: '11px', textAlign: 'center' }}>No logs yet.</div>}
                {debugLogs.slice(0, 30).map((log: any, i: number) => (
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
          </div>
        </div>
      )}
    </>
  );
}