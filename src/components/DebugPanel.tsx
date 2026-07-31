import { CheckCircle, XCircle, RefreshCw, Copy, LogOut, Bug } from 'lucide-react';

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
  if (!showDebug) return null;

  return (
    <div style={{ position: 'fixed', bottom: '80px', right: '16px', zIndex: 10000, maxWidth: '450px', maxHeight: '70vh', overflow: 'auto' }}>
      <button 
        onClick={() => setShowDebug(false)} 
        style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#10b981', border: '3px solid rgba(255,255,255,0.3)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.6)', marginBottom: '12px' }}
      >
        <Bug size={28} />
      </button>
      
      <div style={{ background: 'rgba(10, 6, 0, 0.98)', border: '2px solid rgba(255, 229, 102, 0.5)', borderRadius: '16px', padding: '16px', color: '#ffe566', fontFamily: 'monospace', fontSize: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid rgba(255, 229, 102, 0.3)' }}>
          <strong style={{ fontSize: '14px', color: '#ffe566' }}>🔧 HOME DEBUG PANEL</strong>
          <button onClick={() => setShowDebug(false)} style={{ padding: '2px 6px', background: '#ef4444', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '8px' }}>✕</button>
        </div>
        
        <div style={{ marginBottom: '12px', padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <div style={{ marginBottom: '6px', color: '#3b82f6', fontWeight: 'bold' }}>🗄️ DATABASE CONNECTION</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            {dbStatus === 'connected' ? <CheckCircle size={14} color="#10b981" /> : dbStatus === 'error' ? <XCircle size={14} color="#ef4444" /> : <RefreshCw size={14} color="#fbbf24" />}
            <span>Status: <strong style={{ color: dbStatus === 'connected' ? '#10b981' : dbStatus === 'error' ? '#ef4444' : '#fbbf24' }}>{dbStatus.toUpperCase()}</strong></span>
          </div>
          <div style={{ fontSize: '9px', color: '#94a3b8' }}>User ID: {user?.id?.slice(0, 8)}...</div>
        </div>

        <div style={{ marginBottom: '12px', padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div style={{ marginBottom: '6px', color: '#10b981', fontWeight: 'bold' }}>💰 ECONOMY (FROM DB)</div>
          {dbDebugInfo.economyData ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <div>🪙 Coins: <strong>{dbDebugInfo.economyData.cosmic_coins}</strong></div>
              <div>⭐ XP: <strong>{dbDebugInfo.economyData.xp}</strong></div>
              <div>🎯 Level: <strong>{dbDebugInfo.economyData.level}</strong></div>
              <div>🔥 Streak: <strong>{dbDebugInfo.economyData.current_streak}</strong></div>
              <div>⚡ Energy: <strong>{dbDebugInfo.economyData.cosmic_focus || 0} / {dbDebugInfo.economyData.max_focus || 20}</strong></div>
            </div>
          ) : (
            <div style={{ color: '#64748b' }}>No data loaded yet</div>
          )}
        </div>

        {lastDbQuery && (
          <div style={{ marginBottom: '12px', padding: '8px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <div style={{ marginBottom: '6px', color: '#8b5cf6', fontWeight: 'bold' }}>📡 LAST QUERY</div>
            <div style={{ fontSize: '9px', marginBottom: '4px' }}><strong>Table:</strong> {lastDbQuery.table}</div>
            <div style={{ fontSize: '9px', marginBottom: '4px' }}><strong>Operation:</strong> {lastDbQuery.operation}</div>
            <div style={{ fontSize: '9px', color: '#64748b', wordBreak: 'break-all' }}><strong>Params:</strong> {JSON.stringify(lastDbQuery.params)}</div>
            {dbDebugInfo.lastResponse && (
              <div style={{ marginTop: '4px', fontSize: '9px', color: '#10b981', wordBreak: 'break-all' }}>
                <strong>Response:</strong> {JSON.stringify(dbDebugInfo.lastResponse).slice(0, 100)}...
              </div>
            )}
          </div>
        )}

        <div style={{ marginBottom: '12px', padding: '8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <div style={{ marginBottom: '6px', color: '#f59e0b', fontWeight: 'bold' }}>🧪 QUICK TESTS</div>
          
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <button onClick={() => testAddEnergy(5)} style={{ padding: '4px 8px', background: '#fbbf24', border: 'none', borderRadius: '4px', color: '#000', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold' }}>+5 ⚡</button>
            <button onClick={() => testAddEnergy(10)} style={{ padding: '4px 8px', background: '#f59e0b', border: 'none', borderRadius: '4px', color: '#000', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold' }}>+10 ⚡</button>
            <button onClick={() => testSpendEnergy(2)} style={{ padding: '4px 8px', background: '#ef4444', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold' }}>Spend 2 ⚡</button>
          </div>

          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <button onClick={() => testAddCoins(10)} style={{ padding: '4px 8px', background: 'rgba(251, 191, 36, 0.3)', border: '1px solid #fbbf24', borderRadius: '4px', color: '#fbbf24', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold' }}>+10 🪙</button>
            <button onClick={() => testAddXP(50)} style={{ padding: '4px 8px', background: 'rgba(167, 139, 250, 0.3)', border: '1px solid #a78bfa', borderRadius: '4px', color: '#a78bfa', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold' }}>+50 ⭐</button>
          </div>
          
          <button onClick={reloadFromDatabase} style={{ width: '100%', padding: '6px', background: '#3b82f6', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold' }}>🔄 RELOAD ALL FROM DB</button>
        </div>

        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <button onClick={checkDatabaseStatus} style={{ flex: '1', minWidth: '80px', padding: '4px 8px', background: 'rgba(16, 185, 129, 0.3)', border: '1px solid #10b981', borderRadius: '6px', color: '#10b981', cursor: 'pointer', fontSize: '9px' }}>🩺 CHECK DB</button>
          <button onClick={refreshUserDataDebug} style={{ flex: '1', minWidth: '80px', padding: '4px 8px', background: 'rgba(59, 130, 246, 0.3)', border: '1px solid #3b82f6', borderRadius: '6px', color: '#3b82f6', cursor: 'pointer', fontSize: '9px' }}>🔄 REFRESH USER</button>
          <button onClick={testCompleteQuest} style={{ flex: '1', minWidth: '80px', padding: '4px 8px', background: 'rgba(16, 185, 129, 0.3)', border: '1px solid #10b981', borderRadius: '6px', color: '#10b981', cursor: 'pointer', fontSize: '9px' }}>🎯 TEST QUEST</button>
          <button onClick={handleLogoutAndReset} style={{ flex: '1', minWidth: '80px', padding: '4px 8px', background: 'rgba(239, 68, 68, 0.3)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><LogOut size={12} /> LOGOUT</button>
        </div>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
          <button onClick={copyAllDebugInfo} style={{ flex: 1, padding: '6px', background: copySuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(96, 165, 250, 0.3)', border: `1px solid ${copySuccess ? '#10b981' : '#60a5fa'}`, borderRadius: '6px', color: copySuccess ? '#10b981' : '#60a5fa', cursor: 'pointer', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <Copy size={12} /> {copySuccess ? 'COPIED!' : 'COPY ALL'}
          </button>
          <button onClick={() => setDebugLogs([])} style={{ flex: 1, padding: '6px', background: 'rgba(239, 68, 68, 0.3)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '9px' }}>🗑️ CLEAR LOGS</button>
        </div>

        {energyTransactions.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ marginBottom: '6px', color: '#f472b6', fontWeight: 'bold' }}>⚡ RECENT ENERGY TX ({energyTransactions.length})</div>
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {energyTransactions.slice(0, 5).map((tx: any, idx: number) => (
                <div key={idx} style={{ padding: '6px', marginBottom: '4px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', borderLeft: `3px solid ${tx.amount > 0 ? '#10b981' : '#ef4444'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#94a3b8' }}>
                    <span>{new Date(tx.created_at).toLocaleTimeString()}</span>
                    <span style={{ color: tx.amount > 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} ⚡
                    </span>
                  </div>
                  <div style={{ fontSize: '9px', color: '#e2e8f0' }}>{tx.transaction_type} {tx.reference_id ? `(${tx.reference_id})` : ''}</div>
                  <div style={{ fontSize: '8px', color: '#64748b' }}>Balance after: {tx.balance_after}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div style={{ marginBottom: '6px', color: '#f472b6', fontWeight: 'bold' }}>📝 LOGS ({debugLogs.length})</div>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {debugLogs.slice(0, 20).map((log: any) => (
              <div key={log.id} style={{ padding: '6px', marginBottom: '4px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', borderLeft: `3px solid ${log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : log.type === 'warning' ? '#fbbf24' : '#60a5fa'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ color: '#64748b', fontSize: '9px' }}>{log.timestamp}</span>
                  <span style={{ fontSize: '9px', color: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : log.type === 'warning' ? '#fbbf24' : '#60a5fa', fontWeight: 'bold' }}>{log.category}</span>
                </div>
                <div style={{ color: '#fff', fontSize: '9px' }}>{log.message}</div>
                {log.data && (
                  <div style={{ marginTop: '4px', fontSize: '8px', color: '#94a3b8', wordBreak: 'break-all' }}>
                    {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2).slice(0, 200) : log.data}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}