import { useState, useEffect, useCallback } from 'react';
import { 
  Bug, X, Activity, Users, Server, Terminal, Settings, 
  Copy, Check, RefreshCw, Play, Eye, ChevronDown, Heart
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { 
  getAllFunctionStatuses, 
  getRecentLogs, 
  testFunction,
  type FunctionStatus,
  type FunctionLog,
  EDGE_FUNCTIONS
} from '../lib/adminService';

interface DiagnosticResult {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  message: string;
  details?: any;
  timestamp: string;
}

interface HomeDiagnostics {
  results: DiagnosticResult[];
  isRunning: boolean;
  lastRun: string | null;
}

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
  // ახალი props დიაგნოსტიკისთვის
  runHomeDiagnostics: () => Promise<DiagnosticResult[]>;
  diagnostics: HomeDiagnostics;
  testEnergySystem: () => void;
  testLocalStorage: () => void;
  testPremiumGate: () => void;
  testQuestSystem: () => void;
  testDailyCard: () => void;
  testStreakSystem: () => void;
  testXPSystem: () => void;
  testSupabaseConnection: () => void;
}

type TabType = 'system' | 'user' | 'diagnostics' | 'functions' | 'logs' | 'actions';

export default function DebugPanel(props: DebugPanelProps) {
  const {
    showDebug, setShowDebug, user, economy, debugLogs, dbStatus,
    activeSubscription, currentStreak, setDebugLogs,
    checkDatabaseStatus, refreshUserDataDebug, handleLogoutAndReset, 
    testAddCoins, testAddXP, testAddEnergy, testSpendEnergy, 
    testCompleteQuest, reloadFromDatabase, questsLoading, timeLeft, 
    showQuestModal, rewardClaimed, isClaiming,
    runHomeDiagnostics, diagnostics, testEnergySystem, testLocalStorage,
    testPremiumGate, testQuestSystem, testDailyCard, testStreakSystem,
    testXPSystem, testSupabaseConnection
  } = props;

  const [activeTab, setActiveTab] = useState<TabType>('system');
  const [activeCopyTab, setActiveCopyTab] = useState<string | null>(null);
  
  const [authStatus, setAuthStatus] = useState<'checking' | 'active' | 'inactive'>('checking');
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [tgAvailable, setTgAvailable] = useState(false);
  const [hasInitData, setHasInitData] = useState(false);
  const [bootTime, setBootTime] = useState<number>(0);
  const [localStorageData, setLocalStorageData] = useState<Record<string, any>>({});

  const [functionStatuses, setFunctionStatuses] = useState<FunctionStatus[]>([]);
  const [functionsLoading, setFunctionsLoading] = useState(false);
  const [testingFunction, setTestingFunction] = useState<string | null>(null);
  const [expandedFunction, setExpandedFunction] = useState<string | null>(null);
  const [functionLogs, setFunctionLogs] = useState<Record<string, FunctionLog[]>>({});

  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  useEffect(() => {
    if (!showDebug) return;
    const checkSystem = async () => {
      const startTime = performance.now();
      const tg = (window as any).Telegram?.WebApp;
      setTgAvailable(!!tg);
      setHasInitData(!!tg?.initData);

      if (supabase) {
        try {
          const { data: { user: authUser }, error } = await supabase.auth.getUser();
          if (error || !authUser) { setAuthStatus('inactive'); setAuthUid(null); } 
          else { setAuthStatus('active'); setAuthUid(authUser.id); }
        } catch { setAuthStatus('inactive'); setAuthUid(null); }
      } else { setAuthStatus('inactive'); }

      const lsData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try { lsData[key] = localStorage.getItem(key)?.substring(0, 100) || ''; } 
          catch { lsData[key] = '[Error reading]'; }
        }
      }
      setLocalStorageData(lsData);
      setBootTime(Math.round(performance.now() - startTime));
    };
    checkSystem();
  }, [showDebug]);

  const loadFunctionStatuses = useCallback(async () => {
    if (!user?.id) return;
    setFunctionsLoading(true);
    try {
      const statuses = await getAllFunctionStatuses(user.id);
      setFunctionStatuses(statuses);
      const logsMap: Record<string, FunctionLog[]> = {};
      for (const func of EDGE_FUNCTIONS) {
        const logs = await getRecentLogs(user.id, 5);
        logsMap[func.name] = logs.filter(l => l.function_name === func.name);
      }
      setFunctionLogs(logsMap);
    } catch (error) { console.error('Failed to load function statuses:', error); } 
    finally { setFunctionsLoading(false); }
  }, [user?.id]);

  useEffect(() => {
    if (showDebug && activeTab === 'functions') {
      loadFunctionStatuses();
      const interval = setInterval(loadFunctionStatuses, 30000);
      return () => clearInterval(interval);
    }
  }, [showDebug, activeTab, loadFunctionStatuses]);

  const handleTestFunction = async (functionName: string) => {
    if (!user?.id) return;
    setTestingFunction(functionName);
    try {
      const result = await testFunction(user.id, functionName);
      if (result.success) addDebugLog('success', 'FUNCTION_TEST', `✅ ${functionName} executed successfully`, result.log);
      else addDebugLog('error', 'FUNCTION_TEST', `❌ ${functionName} failed: ${result.error}`);
      await loadFunctionStatuses();
    } catch (error: any) { addDebugLog('error', 'FUNCTION_TEST', `💥 ${functionName} exception: ${error.message}`); } 
    finally { setTestingFunction(null); }
  };

  const addDebugLog = (type: 'info' | 'success' | 'error' | 'warning', category: string, message: string, data?: any) => {
    setDebugLogs(prev => [{ id: Date.now(), timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }), type, category, message, data }, ...prev].slice(0, 100));
  };

  const getXPToNextLevel = (level: number): number => {
    if (level === 1) return 100; if (level === 2) return 250; if (level === 3) return 500;
    if (level === 4) return 1000; if (level === 5) return 2000;
    return Math.floor(2000 * Math.pow(1.8, level - 5));
  };

  const xpToNext = getXPToNextLevel(economy.level || 1);
  const currentLevelXP = (() => {
    let remaining = economy.xp || 0; let lvl = 1;
    while (lvl < (economy.level || 1)) { remaining -= getXPToNextLevel(lvl); lvl++; }
    return Math.max(0, remaining);
  })();
  const xpPercent = Math.min((currentLevelXP / xpToNext) * 100, 100);

  const handleCopyTab = (tab: string) => {
    let text = '';
    if (tab === 'system') {
      text = `SYSTEM STATUS
⚡ Boot Time: ${bootTime}ms
🗄️ DB Status: ${dbStatus.toUpperCase()}
🔑 Auth: ${authStatus === 'active' ? 'ACTIVE ✅' : 'INACTIVE ❌'}
🛡️ Admin: ${user?.is_admin ? 'YES ✅' : 'NO ❌'}

TELEGRAM SDK
📱 WebApp: ${tgAvailable ? 'YES ✅' : 'NO ❌'}
🔐 initData: ${hasInitData ? 'YES ✅' : 'NO ❌'}

IDENTITY CHECK
🆔 Auth UID: ${authUid ? authUid.substring(0, 8) + '...' : 'NULL'}
🆔 DB ID: ${user?.id ? user.id.substring(0, 8) + '...' : 'NULL'}
${authUid === user?.id ? '✅ IDs Match' : '❌ IDs Mismatch'}

LOCALSTORAGE (${Object.keys(localStorageData).length} keys)
${Object.entries(localStorageData).map(([key, value]) => `${key}\n${value}`).join('\n\n')}`;
    } else if (tab === 'user') {
      text = `PROFILE
👤 Name: ${user?.display_name || 'N/A'}
📧 Username: ${user?.username || 'N/A'}
♏ Sun Sign: ${user?.sun_sign || 'Not set'}
✅ Onboarding: ${user?.onboarding_completed ? 'Complete' : 'Pending'}

ECONOMY
💎 Gems: ${economy.cosmic_coins}
⚡ Energy: ${economy.cosmic_focus}/${economy.max_focus}
⭐ Level: ${economy.level}
🔥 Streak: ${currentStreak}
📊 XP: ${currentLevelXP}/${xpToNext} (${xpPercent.toFixed(1)}%)

SUBSCRIPTION
Status: ${activeSubscription ? 'Active ✅' : 'None ❌'}
${activeSubscription ? `Plan: ${activeSubscription.plan_type}\nExpires: ${new Date(activeSubscription.expires_at).toLocaleDateString()}` : ''}`;
    } else if (tab === 'diagnostics') {
      text = `HOME DIAGNOSTICS (${diagnostics.results.length} checks)
Last Run: ${diagnostics.lastRun || 'Never'}
Passed: ${diagnostics.results.filter(r => r.status === 'pass').length}/${diagnostics.results.length}

${diagnostics.results.map(r => 
  `${r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : r.status === 'warning' ? '⚠️' : '⏳'} ${r.name}
   Status: ${r.status.toUpperCase()}
   Message: ${r.message}
   Details: ${JSON.stringify(r.details)}
   Time: ${r.timestamp}`
).join('\n\n')}`;
    } else if (tab === 'functions') {
      text = `EDGE FUNCTIONS STATUS
${functionStatuses.map(func => 
  `${func.name}
Runs: ${func.totalRuns} | Success: ${func.successRate.toFixed(0)}% | Avg: ${func.avgResponseTime}ms
Last Run: ${func.lastRun ? new Date(func.lastRun.created_at).toLocaleString() + ' (' + func.lastRun.status + ')' : 'Never'}
Recent Logs:
${functionLogs[func.name]?.map(log => `  - [${log.status}] ${log.response_time_ms}ms: ${log.error_message || 'Success'}`).join('\n') || '  No logs'}
`).join('\n')}`;
    } else if (tab === 'logs') {
      text = `LIVE LOGS (${debugLogs.length})\n\n` + debugLogs.map(log => 
        `[${log.timestamp}] [${log.category}] ${log.type.toUpperCase()}: ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`
      ).join('\n\n');
    } else if (tab === 'actions') {
      text = `ADMIN ACTIONS STATE
Quests Loading: ${questsLoading}
Time Left: ${timeLeft}
Show Quest Modal: ${showQuestModal}
Reward Claimed: ${rewardClaimed}
Is Claiming: ${isClaiming}`;
    }

    navigator.clipboard.writeText(text);
    setActiveCopyTab(tab);
    setTimeout(() => setActiveCopyTab(null), 2000);
  };

  const tabs = [
    { id: 'system' as TabType, label: 'System', icon: Activity },
    { id: 'user' as TabType, label: 'User', icon: Users },
    { id: 'diagnostics' as TabType, label: 'Diag', icon: Heart },
    { id: 'functions' as TabType, label: 'Functions', icon: Server },
    { id: 'logs' as TabType, label: 'Logs', icon: Terminal },
    { id: 'actions' as TabType, label: 'Actions', icon: Settings },
  ];

  const CopyButton = ({ tab }: { tab: string }) => (
    <button 
      onClick={() => handleCopyTab(tab)} 
      style={{ 
        padding: '4px 8px', background: activeCopyTab === tab ? 'rgba(16, 185, 129, 0.3)' : 'rgba(96, 165, 250, 0.2)', 
        border: `1px solid ${activeCopyTab === tab ? '#10b981' : '#60a5fa'}`, borderRadius: '6px', 
        color: activeCopyTab === tab ? '#10b981' : '#60a5fa', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold',
        display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s'
      }}
    >
      {activeCopyTab === tab ? <Check size={12} /> : <Copy size={12} />} 
      {activeCopyTab === tab ? 'Copied!' : 'Copy'}
    </button>
  );

  return (
    <>
      <button onClick={() => setShowDebug(!showDebug)} style={{ position: 'fixed', bottom: '20px', right: '20px', width: '50px', height: '50px', borderRadius: '50%', background: showDebug ? '#ef4444' : '#3b82f6', border: '3px solid rgba(255,255,255,0.3)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 10001, transition: 'background 0.3s ease' }}>
        {showDebug ? <X size={24} /> : <Bug size={24} />}
      </button>

      {showDebug && (
        <div style={{ position: 'fixed', bottom: '80px', right: '10px', left: '10px', zIndex: 10000, maxWidth: '450px', margin: '0 auto', maxHeight: '80vh', background: 'rgba(10, 6, 0, 0.98)', border: '2px solid rgba(255, 229, 102, 0.5)', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.8)', fontFamily: 'monospace', fontSize: '11px', color: '#ffe566', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 229, 102, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(10, 6, 0, 0.98)' }}>
            <strong style={{ fontSize: '14px', color: '#ffe566', display: 'flex', alignItems: 'center', gap: '8px' }}><Bug size={16} /> ADMIN DEBUG</strong>
            <button onClick={() => setShowDebug(false)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><X size={18} /></button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px', padding: '8px 12px', borderBottom: '1px solid rgba(255, 229, 102, 0.2)', background: 'rgba(0,0,0,0.3)' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: '1 1 30%', minWidth: '60px', padding: '6px 4px', background: activeTab === tab.id ? 'rgba(255, 229, 102, 0.2)' : 'transparent', border: activeTab === tab.id ? '1px solid rgba(255, 229, 102, 0.5)' : '1px solid transparent', borderRadius: '8px', color: activeTab === tab.id ? '#ffe566' : '#94a3b8', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '9px', fontWeight: 'bold', transition: 'all 0.2s' }}>
                <tab.icon size={14} />{tab.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            
            {activeTab === 'system' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={14} /> SYSTEM STATUS</span>
                  <CopyButton tab="system" />
                </div>
                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '11px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>⚡ Boot Time: <strong>{bootTime}ms</strong></div>
                  <div>🗄️ DB Status: <strong style={{ color: dbStatus === 'connected' ? '#10b981' : '#ef4444' }}>{dbStatus.toUpperCase()}</strong></div>
                  <div>🔑 Auth: <span style={{ color: authStatus === 'active' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{authStatus === 'active' ? 'ACTIVE ✅' : 'INACTIVE ❌'}</span></div>
                  <div>🛡️ Admin: <span style={{ color: user?.is_admin ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{user?.is_admin ? 'YES ✅' : 'NO ❌'}</span></div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: '11px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>📱 WebApp: <span style={{ color: tgAvailable ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{tgAvailable ? 'YES ✅' : 'NO ❌'}</span></div>
                  <div>🔐 initData: <span style={{ color: hasInitData ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{hasInitData ? 'YES ✅' : 'NO ❌'}</span></div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.3)', fontSize: '11px' }}>
                  <div>🆔 Auth UID: <span style={{ color: authUid ? '#10b981' : '#ef4444', wordBreak: 'break-all' }}>{authUid ? `${authUid.substring(0, 8)}...` : 'NULL'}</span></div>
                  <div>🆔 DB ID: <span style={{ color: user?.id ? '#10b981' : '#ef4444', wordBreak: 'break-all' }}>{user?.id ? `${user.id.substring(0, 8)}...` : 'NULL'}</span></div>
                  <div style={{ marginTop: '4px', padding: '4px', background: authUid === user?.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', borderRadius: '4px', textAlign: 'center' }}>{authUid === user?.id ? '✅ IDs Match' : '❌ IDs Mismatch'}</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.3)', fontSize: '10px', maxHeight: '120px', overflowY: 'auto' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>LOCALSTORAGE ({Object.keys(localStorageData).length} keys)</div>
                  {Object.entries(localStorageData).map(([key, value]) => (
                    <div key={key} style={{ marginBottom: '6px', padding: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>
                      <div style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '9px' }}>{key}</div>
                      <div style={{ color: '#94a3b8', fontSize: '9px', wordBreak: 'break-all' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'user' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14} /> USER & ECONOMY</span>
                  <CopyButton tab="user" />
                </div>
                <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: '11px' }}>
                  <div>👤 Name: <strong>{user?.display_name || 'N/A'}</strong></div>
                  <div>📧 Username: <strong>{user?.username || 'N/A'}</strong></div>
                  <div>♏ Sun Sign: <strong>{user?.sun_sign || 'Not set'}</strong></div>
                  <div>✅ Onboarding: <strong>{user?.onboarding_completed ? 'Complete' : 'Pending'}</strong></div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.3)', fontSize: '11px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <div>💎 Gems: <strong>{economy.cosmic_coins}</strong></div>
                    <div>⚡ Energy: <strong>{economy.cosmic_focus}/{economy.max_focus}</strong></div>
                    <div>⭐ Level: <strong>{economy.level}</strong></div>
                    <div>🔥 Streak: <strong>{currentStreak}</strong></div>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${xpPercent}%`, background: 'linear-gradient(90deg, #fbbf24, #ffe566)', borderRadius: '3px' }} />
                  </div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px', textAlign: 'right' }}>{xpPercent.toFixed(1)}% to Level {(economy.level || 1) + 1}</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '11px' }}>
                  <div>Status: <strong style={{ color: activeSubscription ? '#10b981' : '#ef4444' }}>{activeSubscription ? 'Active ✅' : 'None ❌'}</strong></div>
                  {activeSubscription && <div>Plan: <strong>{activeSubscription.plan_type}</strong> | Expires: <strong>{new Date(activeSubscription.expires_at).toLocaleDateString()}</strong></div>}
                </div>
              </div>
            )}

            {activeTab === 'diagnostics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ color: '#ec4899', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Heart size={14} /> DIAGNOSTICS
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={runHomeDiagnostics} 
                      disabled={diagnostics.isRunning}
                      style={{ 
                        padding: '6px 12px', 
                        background: diagnostics.isRunning ? 'rgba(251, 191, 36, 0.3)' : 'rgba(236, 72, 153, 0.2)', 
                        border: `1px solid ${diagnostics.isRunning ? '#fbbf24' : '#ec4899'}`, 
                        borderRadius: '6px', 
                        color: diagnostics.isRunning ? '#fbbf24' : '#ec4899', 
                        cursor: diagnostics.isRunning ? 'not-allowed' : 'pointer', 
                        fontSize: '10px', 
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <RefreshCw size={12} className={diagnostics.isRunning ? 'animate-spin' : ''} /> 
                      {diagnostics.isRunning ? 'Running...' : 'Run All'}
                    </button>
                    <CopyButton tab="diagnostics" />
                  </div>
                </div>

                {diagnostics.lastRun && (
                  <div style={{ padding: '8px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '6px', border: '1px solid rgba(236, 72, 153, 0.3)', fontSize: '10px', textAlign: 'center' }}>
                    Last run: {diagnostics.lastRun} | {diagnostics.results.filter(r => r.status === 'pass').length}/{diagnostics.results.length} passed
                  </div>
                )}

                {/* Test Buttons Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <button onClick={testEnergySystem} style={{ padding: '8px', background: '#fbbf24', border: 'none', borderRadius: '6px', color: '#000', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}>⚡ Energy</button>
                  <button onClick={testLocalStorage} style={{ padding: '8px', background: '#60a5fa', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}>💾 Storage</button>
                  <button onClick={testPremiumGate} style={{ padding: '8px', background: '#a78bfa', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}>👑 Premium</button>
                  <button onClick={testQuestSystem} style={{ padding: '8px', background: '#10b981', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}>🎯 Quests</button>
                  <button onClick={testDailyCard} style={{ padding: '8px', background: '#f472b6', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}>🃏 Daily</button>
                  <button onClick={testStreakSystem} style={{ padding: '8px', background: '#fb923c', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}>🔥 Streak</button>
                  <button onClick={testXPSystem} style={{ padding: '8px', background: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}>⭐ XP</button>
                  <button onClick={testSupabaseConnection} style={{ padding: '8px', background: '#8b5cf6', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}>🗄️ DB</button>
                </div>

                {/* Results List */}
                {diagnostics.results.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                    {diagnostics.results.map((result, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          padding: '10px', 
                          background: 'rgba(0,0,0,0.3)', 
                          borderRadius: '8px', 
                          border: `1px solid ${
                            result.status === 'pass' ? 'rgba(16, 185, 129, 0.5)' :
                            result.status === 'fail' ? 'rgba(239, 68, 68, 0.5)' :
                            result.status === 'warning' ? 'rgba(251, 191, 36, 0.5)' :
                            'rgba(148, 163, 184, 0.3)'
                          }`
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#e2e8f0' }}>
                            {result.status === 'pass' && '✅'}
                            {result.status === 'fail' && '❌'}
                            {result.status === 'warning' && '⚠️'}
                            {result.status === 'pending' && '⏳'}
                            {' '}{result.name}
                          </div>
                          <div style={{ fontSize: '9px', color: '#94a3b8' }}>{result.timestamp}</div>
                        </div>
                        <div style={{ fontSize: '10px', color: '#cbd5e1', marginBottom: '4px' }}>{result.message}</div>
                        {result.details && (
                          <div style={{ fontSize: '9px', color: '#94a3b8', padding: '4px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflowX: 'auto' }}>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'functions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ color: '#a78bfa', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Server size={14} /> EDGE FUNCTIONS</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={loadFunctionStatuses} disabled={functionsLoading} style={{ padding: '4px 8px', background: 'rgba(139, 92, 246, 0.3)', border: '1px solid rgba(139, 92, 246, 0.5)', borderRadius: '6px', color: '#a78bfa', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <RefreshCw size={10} className={functionsLoading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <CopyButton tab="functions" />
                  </div>
                </div>
                {functionsLoading ? <div style={{ color: '#94a3b8', fontSize: '11px', textAlign: 'center', padding: '20px' }}>Loading...</div> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {functionStatuses.map((func) => (
                      <div key={func.name} style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '11px' }}>{func.name}</div>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '9px', color: '#94a3b8' }}>
                              <span>Runs: {func.totalRuns}</span><span>Success: {func.successRate.toFixed(0)}%</span><span>Avg: {func.avgResponseTime}ms</span>
                            </div>
                          </div>
                          <button onClick={() => handleTestFunction(func.name)} disabled={testingFunction === func.name} style={{ padding: '6px 10px', background: testingFunction === func.name ? 'rgba(251, 191, 36, 0.3)' : 'rgba(16, 185, 129, 0.2)', border: `1px solid ${testingFunction === func.name ? '#fbbf24' : '#10b981'}`, borderRadius: '6px', color: testingFunction === func.name ? '#fbbf24' : '#10b981', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {testingFunction === func.name ? <RefreshCw size={10} className="animate-spin" /> : <Play size={10} />} {testingFunction === func.name ? 'Testing' : 'Test'}
                          </button>
                        </div>
                        {func.lastRun && <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '6px' }}>Last: {new Date(func.lastRun.created_at).toLocaleString()} | <span style={{ color: func.lastRun.status === 'success' ? '#10b981' : '#ef4444' }}>{func.lastRun.status}</span></div>}
                        <button onClick={() => setExpandedFunction(expandedFunction === func.name ? null : func.name)} style={{ width: '100%', padding: '4px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '4px', color: '#94a3b8', cursor: 'pointer', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          {expandedFunction === func.name ? <ChevronDown size={10} /> : <Eye size={10} />} {expandedFunction === func.name ? 'Hide Logs' : 'Show Recent Logs'}
                        </button>
                        {expandedFunction === func.name && functionLogs[func.name] && (
                          <div style={{ marginTop: '6px', maxHeight: '120px', overflowY: 'auto', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', padding: '6px' }}>
                            {functionLogs[func.name].length === 0 ? <div style={{ color: '#64748b', fontSize: '9px', textAlign: 'center' }}>No logs</div> : functionLogs[func.name].map((log, i) => (
                              <div key={i} style={{ padding: '4px', marginBottom: '3px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', fontSize: '9px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: log.status === 'success' ? '#10b981' : '#ef4444' }}>{log.status}</span><span style={{ color: '#64748b' }}>{log.response_time_ms}ms</span></div>
                                {log.error_message && <div style={{ color: '#ef4444', fontSize: '8px', wordBreak: 'break-word' }}>{log.error_message.substring(0, 80)}</div>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'logs' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: '#f472b6', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Terminal size={14} /> LIVE LOGS ({debugLogs.length})</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => setDebugLogs([])} style={{ padding: '4px 8px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>Clear</button>
                    <CopyButton tab="logs" />
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '8px' }}>
                  {debugLogs.length === 0 && <div style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', padding: '20px' }}>No logs yet.</div>}
                  {debugLogs.slice().reverse().map((log, i) => (
                    <div key={i} style={{ padding: '8px', marginBottom: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', borderLeft: `3px solid ${log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : '#fbbf24'}`, cursor: log.data ? 'pointer' : 'default' }} onClick={() => log.data && setExpandedLog(expandedLog === i ? null : i)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#64748b', fontSize: '9px' }}>{log.timestamp}</span>
                        <span style={{ fontSize: '9px', color: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : '#fbbf24', fontWeight: 'bold' }}>{log.category}</span>
                      </div>
                      <div style={{ color: '#e2e8f0', fontSize: '10px', wordBreak: 'break-word', marginBottom: log.data ? '4px' : '0' }}>{log.message}</div>
                      {log.data && <div style={{ marginTop: '4px', padding: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', fontSize: '9px', color: '#94a3b8', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', display: expandedLog === i ? 'block' : 'none' }}>{typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : log.data}</div>}
                      {log.data && <div style={{ textAlign: 'right', marginTop: '2px', color: '#64748b', fontSize: '9px' }}>{expandedLog === i ? '▲ Collapse' : '▼ Expand'}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'actions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ color: '#a78bfa', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Settings size={14} /> ADMIN ACTIONS</span>
                  <CopyButton tab="actions" />
                </div>
                <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                  <div style={{ marginBottom: '8px', color: '#a78bfa', fontWeight: 'bold', fontSize: '12px' }}>⚡ ENERGY</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button onClick={() => testAddEnergy(10)} style={{ padding: '8px', background: '#fbbf24', border: 'none', borderRadius: '6px', color: '#000', cursor: 'pointer', fontWeight: 'bold' }}>+10 ⚡</button>
                    <button onClick={() => testSpendEnergy(2)} style={{ padding: '8px', background: '#ef4444', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Spend 2 ⚡</button>
                  </div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  <div style={{ marginBottom: '8px', color: '#60a5fa', fontWeight: 'bold', fontSize: '12px' }}>💎 ECONOMY</div>
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
                <button onClick={handleLogoutAndReset} style={{ width: '100%', padding: '10px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} style={{ marginRight: '4px' }} /> LOGOUT & RESET</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}