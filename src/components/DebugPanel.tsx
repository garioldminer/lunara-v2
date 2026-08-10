import { useState, useEffect, useCallback } from 'react';
import { 
  Bug, X, Activity, Users, Server, Terminal, Settings, 
  Copy, Check, RefreshCw, Play, Eye, ChevronDown, Heart, Crown, Zap, Flame, Shield
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

interface ProfileCheck {
  id: string;
  element: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: string;
}

interface EnergyTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  reference_id: string | null;
  balance_after: number;
  created_at: string;
}

interface ReadingCost {
  reading_type: string;
  energy_cost: number;
  description: string;
}

interface EnergyCheckData {
  uiEnergy: number;
  uiMax: number;
  dbEnergy: number;
  dbMax: number;
  lastUpdate: string | null;
  boostMultiplier: number;
  minutesPassed: number;
  energyToRegen: number;
  minutesUntilNext: number;
  transactions: EnergyTransaction[];
  costs: ReadingCost[];
  match: boolean;
}

// 🆕 🔐 AUTH SECURITY DATA TYPE
interface AuthSecurityInfo {
  signatureVerified: boolean | null;
  tokenAge: number | null;
  expiresIn: number | null;
  authMethod: 'signIn' | 'createUser' | 'unknown';
  rawDataHash: string | null;
  authDate: string | null;
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
  runHomeDiagnostics?: () => Promise<DiagnosticResult[]>;
  diagnostics?: HomeDiagnostics;
  testEnergySystem?: () => void;
  testLocalStorage?: () => void;
  testPremiumGate?: () => void;
  testQuestSystem?: () => void;
  testDailyCard?: () => void;
  testStreakSystem?: () => void;
  testXPSystem?: () => void;
  testSupabaseConnection?: () => void;
}

type TabType = 'system' | 'user' | 'streak' | 'profile' | 'energy' | 'diagnostics' | 'functions' | 'logs' | 'actions';

export default function DebugPanel(props: DebugPanelProps) {
  const {
    showDebug, setShowDebug, user, economy, debugLogs, dbStatus,
    activeSubscription, currentStreak, setDebugLogs,
    checkDatabaseStatus, refreshUserDataDebug, handleLogoutAndReset, 
    testAddCoins, testAddXP, testAddEnergy, testSpendEnergy, 
    testCompleteQuest, reloadFromDatabase, questsLoading, timeLeft, 
    showQuestModal, rewardClaimed, isClaiming,
    runHomeDiagnostics = async () => [],
    diagnostics = { results: [], isRunning: false, lastRun: null },
    testEnergySystem = () => {},
    testLocalStorage = () => {},
    testPremiumGate = () => {},
    testQuestSystem = () => {},
    testDailyCard = () => {},
    testStreakSystem = () => {},
    testXPSystem = () => {},
    testSupabaseConnection = () => {}
  } = props;

  const [activeTab, setActiveTab] = useState<TabType>('system');
  const [activeCopyTab, setActiveCopyTab] = useState<string | null>(null);
  
  const [authStatus, setAuthStatus] = useState<'checking' | 'active' | 'inactive'>('checking');
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [tgAvailable, setTgAvailable] = useState(false);
  const [hasInitData, setHasInitData] = useState(false);
  const [bootTime, setBootTime] = useState<number>(0);
  const [localStorageData, setLocalStorageData] = useState<Record<string, any>>({});

  // 🆕 🔐 AUTH SECURITY STATE
  const [authSecurity, setAuthSecurity] = useState<AuthSecurityInfo>({
    signatureVerified: null,
    tokenAge: null,
    expiresIn: null,
    authMethod: 'unknown',
    rawDataHash: null,
    authDate: null
  });

  const [functionStatuses, setFunctionStatuses] = useState<FunctionStatus[]>([]);
  const [functionsLoading, setFunctionsLoading] = useState(false);
  const [testingFunction, setTestingFunction] = useState<string | null>(null);
  const [expandedFunction, setExpandedFunction] = useState<string | null>(null);
  const [functionLogs, setFunctionLogs] = useState<Record<string, FunctionLog[]>>({});

  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  const [profileChecks, setProfileChecks] = useState<ProfileCheck[]>([]);
  const [profileChecking, setProfileChecking] = useState(false);
  const [profileLastRun, setProfileLastRun] = useState<string | null>(null);

  const [energyData, setEnergyData] = useState<EnergyCheckData | null>(null);
  const [energyChecking, setEnergyChecking] = useState(false);
  const [energyLastRun, setEnergyLastRun] = useState<string | null>(null);

  const [streakData, setStreakData] = useState<any>(null);
  const [streakChecking, setStreakChecking] = useState(false);
  const [streakLastRun, setStreakLastRun] = useState<string | null>(null);
  const [streakActionLoading, setStreakActionLoading] = useState<string | null>(null);

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

  // 🆕 🔐 AUTH SECURITY CHECK
  useEffect(() => {
    if (!showDebug) return;
    
    const checkAuthSecurity = async () => {
      const securityInfo: AuthSecurityInfo = {
        signatureVerified: null,
        tokenAge: null,
        expiresIn: null,
        authMethod: 'unknown',
        rawDataHash: null,
        authDate: null
      };

      try {
        // 1. Check if session exists and get token info
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.access_token) {
            // Parse JWT to get timing info
            try {
              const tokenParts = session.access_token.split('.');
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                const now = Math.floor(Date.now() / 1000);
                securityInfo.tokenAge = now - (payload.iat || now);
                securityInfo.expiresIn = (payload.exp || now) - now;
                
                // Check custom claims if present
                if (payload.auth_method) {
                  securityInfo.authMethod = payload.auth_method;
                }
              }
            } catch (e) {
              console.warn('Failed to parse JWT:', e);
            }
            
            // Session exists = signature was verified (otherwise wouldn't be here)
            securityInfo.signatureVerified = true;
          } else {
            securityInfo.signatureVerified = false;
          }
        }

        // 2. Check initData hash from Telegram
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.initData) {
          const params = new URLSearchParams(tg.initData);
          const hash = params.get('hash');
          const authDate = params.get('auth_date');
          
          if (hash) {
            securityInfo.rawDataHash = hash.substring(0, 16) + '...';
          }
          if (authDate) {
            const age = Math.floor(Date.now() / 1000) - parseInt(authDate, 10);
            securityInfo.authDate = `${age}s ago`;
            
            // Check if initData is too old (24h)
            if (age > 86400) {
              securityInfo.signatureVerified = false; // Stale
            }
          }
        }

        // 3. Try to detect auth method from logs
        const authLogs = debugLogs.filter(l => 
          l.category === 'TELEGRAM_AUTH' || l.message?.includes('signed in') || l.message?.includes('User created')
        );
        if (authLogs.length > 0) {
          const lastAuthLog = authLogs[0];
          if (lastAuthLog.message?.includes('New user') || lastAuthLog.message?.includes('created')) {
            securityInfo.authMethod = 'createUser';
          } else if (lastAuthLog.message?.includes('signed in')) {
            securityInfo.authMethod = 'signIn';
          }
        }

        setAuthSecurity(securityInfo);
      } catch (err) {
        console.error('Auth security check failed:', err);
      }
    };

    checkAuthSecurity();
  }, [showDebug, debugLogs]);

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

  const getLevelFromTotalXP = (totalXP: number) => {
    let level = 1;
    let xpRequiredForNext = getXPToNextLevel(level);
    let currentLevelXP = totalXP;
    while (currentLevelXP >= xpRequiredForNext) {
      currentLevelXP -= xpRequiredForNext;
      level++;
      xpRequiredForNext = getXPToNextLevel(level);
    }
    return { level, currentLevelXP, xpToNext: xpRequiredForNext };
  };

  const runEnergyCheck = async () => {
    if (!user?.id || !supabase) return;
    setEnergyChecking(true);
    addDebugLog('info', 'ENERGY_CHECK', '⚡ Starting energy system check...');
    try {
      const { data: ecoData } = await supabase
        .from('user_economy')
        .select('cosmic_focus, max_focus, last_energy_update, energy_boost_multiplier')
        .eq('user_id', user.id)
        .single();

      const { data: txData } = await supabase
        .from('energy_transactions')
        .select('id, amount, transaction_type, reference_id, balance_after, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: costData } = await supabase
        .from('reading_costs')
        .select('reading_type, energy_cost, description')
        .order('energy_cost', { ascending: true });

      if (ecoData) {
        const boost = parseFloat(ecoData.energy_boost_multiplier) || 1.0;
        const now = new Date();
        const lastUpdate = new Date(ecoData.last_energy_update);
        const minutesPassed = (now.getTime() - lastUpdate.getTime()) / 1000 / 60;
        const regenRate = 30 / boost;
        const energyToRegen = Math.floor(minutesPassed / regenRate);
        const minutesUntilNext = Math.max(0, Math.ceil(regenRate - (minutesPassed % regenRate)));

        setEnergyData({
          uiEnergy: economy?.cosmic_focus ?? 0,
          uiMax: economy?.max_focus ?? 20,
          dbEnergy: ecoData.cosmic_focus,
          dbMax: ecoData.max_focus,
          lastUpdate: ecoData.last_energy_update,
          boostMultiplier: boost,
          minutesPassed: Math.floor(minutesPassed),
          energyToRegen,
          minutesUntilNext,
          transactions: txData || [],
          costs: costData || [],
          match: (economy?.cosmic_focus ?? 0) === ecoData.cosmic_focus && (economy?.max_focus ?? 20) === ecoData.max_focus
        });
        addDebugLog('success', 'ENERGY_CHECK', `✅ Check complete: UI ${economy?.cosmic_focus}/${economy?.max_focus} | DB ${ecoData.cosmic_focus}/${ecoData.max_focus}`);
      } else {
        addDebugLog('error', 'ENERGY_CHECK', '❌ No economy data found');
      }

      setEnergyLastRun(new Date().toLocaleTimeString('en-US', { hour12: false }));
    } catch (err: any) {
      addDebugLog('error', 'ENERGY_CHECK', `❌ ${err.message}`);
    }
    setEnergyChecking(false);
  };

  const runProfileBannerCheck = async () => {
    setProfileChecking(true);
    addDebugLog('info', 'PROFILE_BANNER', '🔍 Starting profile banner check...');
    const checks: ProfileCheck[] = [];

    let dbData: any = null;
    if (user?.id && supabase) {
      try {
        const { data, error } = await supabase
          .from('user_economy')
          .select('cosmic_coins, xp, level, current_streak, cosmic_focus, max_focus')
          .eq('user_id', user.id)
          .single();
        if (!error) dbData = data;
      } catch (err: any) {
        addDebugLog('error', 'PROFILE_BANNER', `DB query failed: ${err.message}`);
      }
    }

    const avatarLetter = user?.display_name?.charAt(0).toUpperCase() || 'U';
    checks.push({
      id: 'avatar',
      element: '🖼️ ავატარი + ასო',
      status: user ? (user.display_name ? 'pass' : 'warn') : 'fail',
      message: user 
        ? (user.display_name ? `ჩანს ასო: "${avatarLetter}"` : 'სახელი ცარიელია → fallback "U"')
        : 'user არ არის ჩატვირთული!',
      details: `display_name: ${user?.display_name || 'null'}`
    });

    const xp = economy?.xp ?? 0;
    const levelData = getLevelFromTotalXP(xp);
    const xpPercent = levelData.xpToNext > 0 ? Math.min((levelData.currentLevelXP / levelData.xpToNext) * 100, 100) : 0;
    const circumference = 2 * Math.PI * 22;
    const strokeDashoffset = circumference - (xpPercent / 100) * circumference;
    checks.push({
      id: 'xp-circle',
      element: '⭕ XP წრე (პროგრესი)',
      status: xp >= 0 && xpPercent >= 0 && xpPercent <= 100 ? 'pass' : 'fail',
      message: `XP: ${xp} → პროგრესი: ${xpPercent.toFixed(1)}%`,
      details: `currentLevelXP: ${levelData.currentLevelXP} / ${levelData.xpToNext} | dashoffset: ${strokeDashoffset.toFixed(1)}`
    });

    const computedLevel = levelData.level;
    const storedLevel = economy?.level ?? 1;
    checks.push({
      id: 'level-badge',
      element: '🏅 ლეველი badge',
      status: computedLevel === storedLevel ? 'pass' : 'warn',
      message: computedLevel === storedLevel 
        ? `ლეველი: ${storedLevel} ✅ (თანხვედრა)`
        : `განსხვავება! badge-ზე: ${computedLevel}, state-ში: ${storedLevel}`,
      details: `XP-დან გამოთვლილი: ${computedLevel} | economy.level: ${storedLevel}`
    });

    checks.push({
      id: 'username',
      element: '👤 მომხმარებლის სახელი',
      status: user?.display_name ? 'pass' : 'warn',
      message: user?.display_name ? `ჩანს: "${user.display_name}"` : 'ჩანს fallback: "LunaraSeeker"',
      details: `display_name: ${user?.display_name || 'null'}`
    });

    if (activeSubscription) {
      const expiresOk = new Date(activeSubscription.expires_at) > new Date();
      checks.push({
        id: 'premium-badge',
        element: '👑 Premium badge',
        status: expiresOk ? 'pass' : 'fail',
        message: expiresOk 
          ? `აქტიურია (${activeSubscription.plan_type}) → badge ჩანს`
          : 'ვადა გასულია! badge არ უნდა ჩანდეს',
        details: `expires_at: ${activeSubscription.expires_at}`
      });
    } else {
      checks.push({
        id: 'premium-badge',
        element: '👑 Premium badge',
        status: 'warn',
        message: 'subscription არ არის → badge არ ჩანს (ნორმალურია)',
        details: 'activeSubscription: null'
      });
    }

    const uiCoins = economy?.cosmic_coins ?? 0;
    const dbCoins = dbData?.cosmic_coins ?? null;
    checks.push({
      id: 'coins',
      element: '💎 Coins',
      status: dbCoins === null ? 'warn' : (uiCoins === dbCoins ? 'pass' : 'warn'),
      message: dbCoins === null 
        ? `UI: ${uiCoins} (DB ვერ წავიკითხე)`
        : (uiCoins === dbCoins ? `UI: ${uiCoins} = DB: ${dbCoins} ✅` : `განსხვავება! UI: ${uiCoins}, DB: ${dbCoins}`),
      details: `economy.cosmic_coins: ${uiCoins} | database: ${dbCoins}`
    });

    const uiEnergy = economy?.cosmic_focus ?? 0;
    const uiMax = economy?.max_focus ?? 20;
    const dbEnergy = dbData?.cosmic_focus ?? null;
    const dbMax = dbData?.max_focus ?? null;
    const energyValid = uiEnergy >= 0 && uiEnergy <= uiMax;
    checks.push({
      id: 'energy',
      element: '⚡ ენერგია',
      status: !energyValid ? 'fail' : (dbMax !== null && dbMax !== uiMax ? 'warn' : 'pass'),
      message: !energyValid 
        ? `არასწორია! ${uiEnergy}/${uiMax}`
        : `UI: ${uiEnergy}/${uiMax} | DB: ${dbEnergy}/${dbMax}`,
      details: `cosmic_focus: ${uiEnergy} | max_focus: ${uiMax} (უნდა იყოს 20)`
    });

    const dbStreak = dbData?.current_streak ?? null;
    checks.push({
      id: 'streak',
      element: '🔥 Streak',
      status: dbStreak === null ? 'warn' : (currentStreak === dbStreak ? 'pass' : 'warn'),
      message: dbStreak === null 
        ? `State: ${currentStreak} (DB ვერ წავიკითხე)`
        : (currentStreak === dbStreak ? `State: ${currentStreak} = DB: ${dbStreak} ✅` : `განსხვავება! State: ${currentStreak}, DB: ${dbStreak}`),
      details: `currentStreak state: ${currentStreak} | economy.current_streak: ${economy?.current_streak} | DB: ${dbStreak}`
    });

    setProfileChecks(checks);
    const passCount = checks.filter(c => c.status === 'pass').length;
    const warnCount = checks.filter(c => c.status === 'warn').length;
    const failCount = checks.filter(c => c.status === 'fail').length;
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    setProfileLastRun(ts);
    addDebugLog('success', 'PROFILE_BANNER', `✅ Check complete: ${passCount} pass, ${warnCount} warn, ${failCount} fail`);
    setProfileChecking(false);
  };

  const runStreakCheck = async () => {
    if (!user?.id) return;
    setStreakChecking(true);
    addDebugLog('info', 'STREAK_CHECK', '🔥 Starting streak system check...');
    
    try {
      const { getStreakDiagnostics } = await import('../lib/streakService');
      const data = await getStreakDiagnostics(user.id);
      
      if (data) {
        setStreakData(data);
        setStreakLastRun(new Date().toLocaleTimeString('en-US', { hour12: false }));
        addDebugLog('success', 'STREAK_CHECK', 
          `✅ Streak: ${data.streak_info?.current_streak || 0} | ` +
          `Milestones: ${data.stats.claimed_count}/${data.stats.total_milestones} claimed | ` +
          `Unclaimed: ${data.stats.unclaimed_count}`);
      } else {
        addDebugLog('error', 'STREAK_CHECK', '❌ Failed to get streak data');
      }
    } catch (err: any) {
      addDebugLog('error', 'STREAK_CHECK', `❌ ${err.message}`);
    }
    
    setStreakChecking(false);
  };

  const handleSetStreak = async (days: number) => {
    if (!user?.id) return;
    setStreakActionLoading('set');
    addDebugLog('info', 'STREAK_ACTION', `🔧 Setting streak to ${days} days...`);
    
    try {
      const { forceSetStreak } = await import('../lib/streakService');
      const result = await forceSetStreak(user.id, days);
      
      if (result.success) {
        addDebugLog('success', 'STREAK_ACTION', `✅ Streak set to ${result.new_streak}`);
        await runStreakCheck();
      } else {
        addDebugLog('error', 'STREAK_ACTION', `❌ Failed: ${result.error}`);
      }
    } catch (err: any) {
      addDebugLog('error', 'STREAK_ACTION', `❌ ${err.message}`);
    }
    
    setStreakActionLoading(null);
  };

  const handleResetMilestones = async () => {
    if (!user?.id) return;
    if (!confirm('⚠️ Delete ALL claimed milestones? This cannot be undone.')) return;
    
    setStreakActionLoading('reset');
    addDebugLog('info', 'STREAK_ACTION', '🗑️ Resetting all claimed milestones...');
    
    try {
      const { resetClaimedMilestones } = await import('../lib/streakService');
      const result = await resetClaimedMilestones(user.id);
      
      if (result.success) {
        addDebugLog('success', 'STREAK_ACTION', `✅ Deleted ${result.deleted_count} claimed milestones`);
        await runStreakCheck();
      } else {
        addDebugLog('error', 'STREAK_ACTION', `❌ Failed: ${result.error}`);
      }
    } catch (err: any) {
      addDebugLog('error', 'STREAK_ACTION', `❌ ${err.message}`);
    }
    
    setStreakActionLoading(null);
  };

  const handleForceClaim = async () => {
    if (!user?.id) return;
    setStreakActionLoading('claim');
    addDebugLog('info', 'STREAK_ACTION', '🎯 Force claiming milestones via Edge Function...');
    
    try {
      const { claimStreakMilestone } = await import('../lib/streakService');
      const result = await claimStreakMilestone();
      
      if (result.success && result.data) {
        const claimedCount = result.data.milestones_claimed.length;
        addDebugLog('success', 'STREAK_ACTION', 
          `✅ Claimed ${claimedCount} milestone(s)! ` +
          `+${result.data.total_coins} coins, +${result.data.total_xp} XP`);
        await runStreakCheck();
      } else {
        addDebugLog('warning', 'STREAK_ACTION', `⚠️ ${result.error || 'No milestones to claim'}`);
      }
    } catch (err: any) {
      addDebugLog('error', 'STREAK_ACTION', `❌ ${err.message}`);
    }
    
    setStreakActionLoading(null);
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

🔐 AUTH SECURITY
🔑 HMAC Signature: ${authSecurity.signatureVerified === true ? 'VERIFIED ✅' : authSecurity.signatureVerified === false ? 'FAILED ❌' : 'CHECKING...'}
⏱️ Token Age: ${authSecurity.tokenAge !== null ? `${authSecurity.tokenAge}s` : 'N/A'}
⏰ Expires In: ${authSecurity.expiresIn !== null ? `${authSecurity.expiresIn}s (~${Math.floor((authSecurity.expiresIn || 0) / 60)} min)` : 'N/A'}
📊 Auth Method: ${authSecurity.authMethod}
🔗 Raw Hash: ${authSecurity.rawDataHash || 'N/A'}
📅 initData Age: ${authSecurity.authDate || 'N/A'}

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
    } else if (tab === 'streak') {
      if (!streakData) {
        text = 'STREAK SYSTEM\n\nNo data yet - run check first';
      } else {
        text = `STREAK SYSTEM DIAGNOSTICS
Last Run: ${streakLastRun || 'Never'}

CURRENT STREAK:
Current: ${streakData.streak_info?.current_streak || 0}
Longest: ${streakData.streak_info?.longest_streak || 0}
Last Active: ${streakData.economy?.last_active_date || 'N/A'}
Last Claim: ${streakData.economy?.last_daily_claim || 'N/A'}
Next Milestone: ${streakData.streak_info?.next_milestone?.name || 'None'} (${streakData.streak_info?.days_to_next || 0} days)

STATS:
Achieved: ${streakData.stats.achieved_count}/${streakData.stats.total_milestones}
Claimed: ${streakData.stats.claimed_count}
Unclaimed: ${streakData.stats.unclaimed_count}
Active Days (30d): ${streakData.stats.active_days}
Missed Days: ${streakData.stats.missed_days}

MILESTONES:
${streakData.milestones.map((m: any) => 
  `${m.is_claimed ? '✅' : m.is_achieved ? '🎁' : '🔒'} ${m.name} (${m.days_required}d) - +${m.reward_coins}💎 +${m.reward_xp}XP${m.reward_premium_days > 0 ? ` +${m.reward_premium_days}d👑` : ''}`
).join('\n')}`;
      }
    } else if (tab === 'profile') {
      text = `PROFILE BANNER CHECK (${profileChecks.length} elements)
Last Run: ${profileLastRun || 'Never'}

${profileChecks.map(c => 
  `${c.status === 'pass' ? '✅' : c.status === 'warn' ? '⚠️' : '❌'} ${c.element}
   ${c.message}
   ${c.details || ''}`
).join('\n\n')}`;
    } else if (tab === 'energy') {
      text = `ENERGY SYSTEM CHECK
Last Run: ${energyLastRun || 'Never'}

UI: ${energyData?.uiEnergy}/${energyData?.uiMax} | DB: ${energyData?.dbEnergy}/${energyData?.dbMax} | Match: ${energyData?.match ? 'YES ✅' : 'NO ❌'}
Boost: ${energyData?.boostMultiplier}x | Minutes passed: ${energyData?.minutesPassed}
Pending regen: +${energyData?.energyToRegen} | Next +1 in: ${energyData?.minutesUntilNext} min

READING COSTS:
${energyData?.costs.map(c => `- ${c.reading_type}: ${c.energy_cost}⚡ (${c.description})`).join('\n') || 'None'}

LAST TRANSACTIONS:
${energyData?.transactions.map(t => `- [${t.created_at}] ${t.amount > 0 ? '+' : ''}${t.amount} (${t.transaction_type}) → balance: ${t.balance_after}`).join('\n') || 'None'}`;
    } else if (tab === 'diagnostics') {
      const diagResults = diagnostics?.results || [];
      text = `HOME DIAGNOSTICS (${diagResults.length} checks)
Last Run: ${diagnostics?.lastRun || 'Never'}
Passed: ${diagResults.filter(r => r.status === 'pass').length}/${diagResults.length}

${diagResults.map(r => 
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
    { id: 'streak' as TabType, label: 'Streak', icon: Flame },
    { id: 'profile' as TabType, label: 'Profile', icon: Crown },
    { id: 'energy' as TabType, label: 'Energy', icon: Zap },
    { id: 'diagnostics' as TabType, label: 'Diag', icon: Heart },
    { id: 'functions' as TabType, label: 'Funcs', icon: Server },
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

  const diagResults = diagnostics?.results || [];
  const diagIsRunning = diagnostics?.isRunning || false;
  const diagLastRun = diagnostics?.lastRun || null;

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
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: '1 1 22%', minWidth: '50px', padding: '6px 4px', background: activeTab === tab.id ? 'rgba(255, 229, 102, 0.2)' : 'transparent', border: activeTab === tab.id ? '1px solid rgba(255, 229, 102, 0.5)' : '1px solid transparent', borderRadius: '8px', color: activeTab === tab.id ? '#ffe566' : '#94a3b8', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '9px', fontWeight: 'bold', transition: 'all 0.2s' }}>
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

                {/* 🆕 🔐 AUTH SECURITY SECTION */}
                <div style={{ padding: '12px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.4)', fontSize: '11px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#a855f7', fontWeight: 'bold', fontSize: '12px' }}>
                    <Shield size={14} /> AUTH SECURITY
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      🔑 HMAC: <span style={{ 
                        color: authSecurity.signatureVerified === true ? '#10b981' : authSecurity.signatureVerified === false ? '#ef4444' : '#fbbf24', 
                        fontWeight: 'bold' 
                      }}>
                        {authSecurity.signatureVerified === true ? 'VERIFIED ✅' : authSecurity.signatureVerified === false ? 'FAILED ❌' : 'CHECKING...'}
                      </span>
                    </div>
                    <div>⏱️ Token Age: <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{authSecurity.tokenAge !== null ? `${authSecurity.tokenAge}s` : 'N/A'}</span></div>
                    <div>⏰ Expires: <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{authSecurity.expiresIn !== null ? `${authSecurity.expiresIn}s` : 'N/A'}</span></div>
                    <div>📊 Method: <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>{authSecurity.authMethod}</span></div>
                  </div>
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(168, 85, 247, 0.2)', fontSize: '10px' }}>
                    <div>🔗 Hash: <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '9px' }}>{authSecurity.rawDataHash || 'N/A'}</span></div>
                    <div>📅 initData Age: <span style={{ color: '#94a3b8' }}>{authSecurity.authDate || 'N/A'}</span></div>
                  </div>
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

            {activeTab === 'streak' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ color: '#fb923c', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Flame size={14} /> STREAK SYSTEM
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={runStreakCheck}
                      disabled={streakChecking}
                      style={{ 
                        padding: '6px 12px', 
                        background: streakChecking ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 146, 60, 0.2)', 
                        border: `1px solid #fb923c`, 
                        borderRadius: '6px', 
                        color: '#fb923c', 
                        cursor: streakChecking ? 'not-allowed' : 'pointer', 
                        fontSize: '10px', 
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <RefreshCw size={12} className={streakChecking ? 'animate-spin' : ''} /> 
                      {streakChecking ? 'Checking...' : 'Run Check'}
                    </button>
                    <CopyButton tab="streak" />
                  </div>
                </div>

                {streakLastRun && streakData && (
                  <div style={{ padding: '8px', background: 'rgba(251, 146, 60, 0.1)', borderRadius: '6px', border: '1px solid rgba(251, 146, 60, 0.3)', fontSize: '10px', textAlign: 'center' }}>
                    Last run: {streakLastRun} | 🔥 {streakData.streak_info?.current_streak || 0} days | 🎯 {streakData.stats.unclaimed_count} unclaimed
                  </div>
                )}

                {!streakData ? (
                  <div style={{ textAlign: 'center', padding: '24px 12px', color: '#94a3b8', fontSize: '11px' }}>
                    <Flame size={28} style={{ opacity: 0.4, marginBottom: '8px' }} />
                    <div>დააჭირე "Run Check"-ს რომ შეამოწმო<br/>streak system</div>
                  </div>
                ) : (
                  <>
                    <div style={{ padding: '12px', background: 'rgba(251, 146, 60, 0.1)', borderRadius: '8px', border: '1px solid rgba(251, 146, 60, 0.3)', fontSize: '11px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#fb923c' }}>🔥 მიმდინარე Streak</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>Current: <strong>{streakData.streak_info?.current_streak || 0}</strong></div>
                        <div>Longest: <strong>{streakData.streak_info?.longest_streak || 0}</strong></div>
                        <div>Last Active: <strong style={{ fontSize: '9px' }}>{streakData.economy?.last_active_date || 'N/A'}</strong></div>
                        <div>Last Claim: <strong style={{ fontSize: '9px' }}>{streakData.economy?.last_daily_claim || 'N/A'}</strong></div>
                      </div>
                      {streakData.streak_info?.next_milestone && (
                        <div style={{ marginTop: '8px', padding: '6px', background: 'rgba(251, 191, 36, 0.2)', borderRadius: '4px', fontSize: '10px' }}>
                          🎯 Next: <strong>{streakData.streak_info.next_milestone.icon_emoji} {streakData.streak_info.next_milestone.name}</strong>
                          <br/>
                          📅 {streakData.streak_info.days_to_next} days left ({streakData.streak_info.percent_to_next.toFixed(0)}%)
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '11px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#10b981' }}>📊 სტატისტიკა</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fb923c' }}>{streakData.stats.achieved_count}</div>
                          <div style={{ fontSize: '9px', color: '#94a3b8' }}>Achieved</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>{streakData.stats.claimed_count}</div>
                          <div style={{ fontSize: '9px', color: '#94a3b8' }}>Claimed</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: streakData.stats.unclaimed_count > 0 ? '#fbbf24' : '#94a3b8' }}>
                            {streakData.stats.unclaimed_count}
                          </div>
                          <div style={{ fontSize: '9px', color: '#94a3b8' }}>Unclaimed</div>
                        </div>
                      </div>
                      <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px' }}>
                        <div>📅 Active Days (30d): <strong>{streakData.stats.active_days}</strong></div>
                        <div>❌ Missed Days: <strong style={{ color: streakData.stats.missed_days > 0 ? '#ef4444' : '#10b981' }}>{streakData.stats.missed_days}</strong></div>
                      </div>
                    </div>

                    <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.3)', fontSize: '11px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#a78bfa' }}>🎯 Milestones ({streakData.milestones.length})</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                        {streakData.milestones.map((m: any) => {
                          const status = m.is_claimed ? 'claimed' : m.is_achieved ? 'ready' : 'locked';
                          const colors = {
                            claimed: { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.4)', text: '#10b981', label: '✅ Claimed' },
                            ready: { bg: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 0.4)', text: '#fbbf24', label: '🎁 Ready' },
                            locked: { bg: 'rgba(0,0,0,0.3)', border: 'rgba(255,255,255,0.1)', text: '#94a3b8', label: '🔒 Locked' }
                          };
                          const c = colors[status];
                          
                          return (
                            <div 
                              key={m.id} 
                              style={{ 
                                padding: '8px', 
                                background: c.bg, 
                                border: `1px solid ${c.border}`, 
                                borderRadius: '6px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#e2e8f0' }}>
                                  {m.icon_emoji} {m.name} <span style={{ color: c.text, fontSize: '9px' }}>({m.days_required}d)</span>
                                </div>
                                <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                                  +{m.reward_coins}💎 +{m.reward_xp}XP {m.reward_premium_days > 0 && `+${m.reward_premium_days}d👑`}
                                </div>
                              </div>
                              <div style={{ fontSize: '9px', color: c.text, fontWeight: 'bold', textAlign: 'right' }}>
                                {c.label}
                                {m.claim_record && (
                                  <div style={{ fontSize: '8px', color: '#64748b', marginTop: '2px' }}>
                                    @ {m.claim_record.streak_at_claim}d
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: '11px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#60a5fa' }}>📅 ბოლო 30 დღე</div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '3px'
                      }}>
                        {streakData.calendar.map((day: any, idx: number) => (
                          <div
                            key={idx}
                            title={`${day.date} ${day.has_reading ? '✓' : '✗'}`}
                            style={{
                              aspectRatio: '1',
                              borderRadius: '3px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '8px',
                              fontWeight: day.is_today ? 700 : 400,
                              background: day.is_today
                                ? 'linear-gradient(135deg, #fbbf24, #d97706)'
                                : day.has_reading
                                ? 'linear-gradient(135deg, #10b981, #059669)'
                                : day.is_future
                                ? 'rgba(255,255,255,0.02)'
                                : 'rgba(239, 68, 68, 0.3)',
                              color: day.is_future ? '#64748b' : '#fff',
                              border: day.is_today ? '1px solid #ffe566' : '1px solid transparent'
                            }}
                          >
                            {day.has_reading ? '✓' : day.is_today ? '★' : day.is_future ? '' : '✗'}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '11px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#ef4444' }}>🔧 TEST ACTIONS</div>
                      
                      <div style={{ marginBottom: '8px', fontSize: '10px', color: '#94a3b8' }}>Force Set Streak:</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px', marginBottom: '12px' }}>
                        <button 
                          onClick={() => handleSetStreak(0)} 
                          disabled={streakActionLoading === 'set'}
                          style={{ padding: '6px', background: '#64748b', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}
                        >
                          0d
                        </button>
                        <button 
                          onClick={() => handleSetStreak(3)} 
                          disabled={streakActionLoading === 'set'}
                          style={{ padding: '6px', background: '#10b981', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}
                        >
                          3d 🌱
                        </button>
                        <button 
                          onClick={() => handleSetStreak(7)} 
                          disabled={streakActionLoading === 'set'}
                          style={{ padding: '6px', background: '#fb923c', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}
                        >
                          7d 🔥
                        </button>
                        <button 
                          onClick={() => handleSetStreak(30)} 
                          disabled={streakActionLoading === 'set'}
                          style={{ padding: '6px', background: '#fbbf24', border: 'none', borderRadius: '4px', color: '#000', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}
                        >
                          30d 👑
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <button 
                          onClick={handleForceClaim}
                          disabled={streakActionLoading === 'claim'}
                          style={{ 
                            padding: '8px', 
                            background: streakActionLoading === 'claim' ? 'rgba(251, 191, 36, 0.3)' : '#fbbf24', 
                            border: 'none', 
                            borderRadius: '6px', 
                            color: '#000', 
                            cursor: streakActionLoading === 'claim' ? 'not-allowed' : 'pointer', 
                            fontWeight: 'bold', 
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          {streakActionLoading === 'claim' ? <RefreshCw size={10} className="animate-spin" /> : <Play size={10} />}
                          Force Claim
                        </button>
                        <button 
                          onClick={handleResetMilestones}
                          disabled={streakActionLoading === 'reset'}
                          style={{ 
                            padding: '8px', 
                            background: 'rgba(239, 68, 68, 0.3)', 
                            border: '1px solid #ef4444', 
                            borderRadius: '6px', 
                            color: '#ef4444', 
                            cursor: streakActionLoading === 'reset' ? 'not-allowed' : 'pointer', 
                            fontWeight: 'bold', 
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          {streakActionLoading === 'reset' ? <RefreshCw size={10} className="animate-spin" /> : <X size={10} />}
                          Reset All
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ color: '#C5A059', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Crown size={14} /> PROFILE BANNER
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={runProfileBannerCheck}
                      disabled={profileChecking}
                      style={{ 
                        padding: '6px 12px', 
                        background: profileChecking ? 'rgba(251, 191, 36, 0.3)' : 'rgba(197, 160, 89, 0.2)', 
                        border: `1px solid ${profileChecking ? '#fbbf24' : '#C5A059'}`, 
                        borderRadius: '6px', 
                        color: profileChecking ? '#fbbf24' : '#C5A059', 
                        cursor: profileChecking ? 'not-allowed' : 'pointer', 
                        fontSize: '10px', 
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <RefreshCw size={12} className={profileChecking ? 'animate-spin' : ''} /> 
                      {profileChecking ? 'Checking...' : 'Run Check'}
                    </button>
                    <CopyButton tab="profile" />
                  </div>
                </div>

                {profileLastRun && (
                  <div style={{ padding: '8px', background: 'rgba(197, 160, 89, 0.1)', borderRadius: '6px', border: '1px solid rgba(197, 160, 89, 0.3)', fontSize: '10px', textAlign: 'center' }}>
                    Last run: {profileLastRun} | ✅ {profileChecks.filter(c => c.status === 'pass').length} | ⚠️ {profileChecks.filter(c => c.status === 'warn').length} | ❌ {profileChecks.filter(c => c.status === 'fail').length}
                  </div>
                )}

                {profileChecks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 12px', color: '#94a3b8', fontSize: '11px' }}>
                    <Crown size={28} style={{ opacity: 0.4, marginBottom: '8px' }} />
                    <div>დააჭირე "Run Check"-ს რომ შეამოწმო<br/>პროფილის ბანერის ყველა ელემენტი</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {profileChecks.map((check) => (
                      <div 
                        key={check.id}
                        style={{ 
                          padding: '10px', 
                          background: 'rgba(0,0,0,0.3)', 
                          borderRadius: '8px', 
                          border: `1px solid ${
                            check.status === 'pass' ? 'rgba(16, 185, 129, 0.5)' :
                            check.status === 'warn' ? 'rgba(251, 191, 36, 0.5)' :
                            'rgba(239, 68, 68, 0.5)'
                          }`
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#e2e8f0' }}>
                            {check.status === 'pass' && '✅'}
                            {check.status === 'warn' && '⚠️'}
                            {check.status === 'fail' && '❌'}
                            {' '}{check.element}
                          </div>
                        </div>
                        <div style={{ fontSize: '10px', color: '#cbd5e1', marginBottom: check.details ? '4px' : '0' }}>{check.message}</div>
                        {check.details && (
                          <div style={{ fontSize: '9px', color: '#94a3b8', padding: '4px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', wordBreak: 'break-word' }}>
                            {check.details}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'energy' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={14} /> ENERGY SYSTEM
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={runEnergyCheck}
                      disabled={energyChecking}
                      style={{ 
                        padding: '6px 12px', 
                        background: energyChecking ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 191, 36, 0.2)', 
                        border: `1px solid #fbbf24`, 
                        borderRadius: '6px', 
                        color: '#fbbf24', 
                        cursor: energyChecking ? 'not-allowed' : 'pointer', 
                        fontSize: '10px', 
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <RefreshCw size={12} className={energyChecking ? 'animate-spin' : ''} /> 
                      {energyChecking ? 'Checking...' : 'Run Check'}
                    </button>
                    <CopyButton tab="energy" />
                  </div>
                </div>

                {energyLastRun && energyData && (
                  <div style={{ padding: '8px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '6px', border: '1px solid rgba(251, 191, 36, 0.3)', fontSize: '10px', textAlign: 'center' }}>
                    Last run: {energyLastRun} | {energyData.match ? '✅ UI = DB' : '❌ UI ≠ DB'}
                  </div>
                )}

                {!energyData ? (
                  <div style={{ textAlign: 'center', padding: '24px 12px', color: '#94a3b8', fontSize: '11px' }}>
                    <Zap size={28} style={{ opacity: 0.4, marginBottom: '8px' }} />
                    <div>დააჭირე "Run Check"-ს რომ შეამოწმო<br/>ენერგიის სისტემა</div>
                  </div>
                ) : (
                  <>
                    <div style={{ padding: '12px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px', border: `1px solid ${energyData.match ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`, fontSize: '11px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#fbbf24' }}>⚡ მიმდინარე ენერგია</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>UI: <strong>{energyData.uiEnergy}/{energyData.uiMax}</strong></div>
                        <div>DB: <strong>{energyData.dbEnergy}/{energyData.dbMax}</strong></div>
                      </div>
                      <div style={{ marginTop: '6px', padding: '4px', borderRadius: '4px', textAlign: 'center', background: energyData.match ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}>
                        {energyData.match ? '✅ UI და DB თანხვედრაშია' : '❌ განსხვავება! საჭიროა sync'}
                      </div>
                    </div>

                    <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: '11px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#60a5fa' }}>🔄 რეგენერაცია (30 წუთში +1)</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>გასული წუთები: <strong>{energyData.minutesPassed}</strong></div>
                        <div>Boost: <strong>{energyData.boostMultiplier}x</strong></div>
                        <div>დასამატებელი: <strong style={{ color: energyData.energyToRegen > 0 ? '#10b981' : '#94a3b8' }}>+{energyData.energyToRegen}</strong></div>
                        <div>შემდეგი +1: <strong>{energyData.minutesUntilNext} წუთში</strong></div>
                      </div>
                      {energyData.dbEnergy >= energyData.dbMax && (
                        <div style={{ marginTop: '6px', padding: '4px', borderRadius: '4px', textAlign: 'center', background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }}>
                          🔋 ენერგია სრულია - რეგენერაცია პაუზაზეა
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '12px', background: 'rgba(167, 139, 250, 0.1)', borderRadius: '8px', border: '1px solid rgba(167, 139, 250, 0.3)', fontSize: '11px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#a78bfa' }}>💰 ხარჯვის ღირებულებები (reading_costs)</div>
                      {energyData.costs.length === 0 ? (
                        <div style={{ color: '#94a3b8', textAlign: 'center' }}>ცხრილი ცარიელია</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {energyData.costs.map((cost) => (
                            <div key={cost.reading_type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>
                              <span style={{ color: '#e2e8f0' }}>{cost.reading_type}</span>
                              <span style={{ color: cost.energy_cost === 0 ? '#10b981' : '#fbbf24', fontWeight: 'bold' }}>
                                {cost.energy_cost === 0 ? 'FREE' : `${cost.energy_cost}⚡`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '11px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#10b981' }}>📜 ბოლო 10 ტრანზაქცია</div>
                      {energyData.transactions.length === 0 ? (
                        <div style={{ color: '#94a3b8', textAlign: 'center' }}>ტრანზაქციები არ არის</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '180px', overflowY: 'auto' }}>
                          {energyData.transactions.map((tx) => (
                            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>
                              <div>
                                <span style={{ color: tx.amount > 0 ? '#10b981' : tx.amount < 0 ? '#ef4444' : '#94a3b8', fontWeight: 'bold' }}>
                                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                                </span>
                                <span style={{ color: '#94a3b8', fontSize: '9px', marginLeft: '6px' }}>{tx.transaction_type}</span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ color: '#e2e8f0', fontSize: '9px' }}>→ {tx.balance_after}</div>
                                <div style={{ color: '#64748b', fontSize: '8px' }}>{new Date(tx.created_at).toLocaleTimeString('en-US', { hour12: false })}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <button onClick={() => { testAddEnergy(1); setTimeout(runEnergyCheck, 1000); }} style={{ padding: '8px', background: '#fbbf24', border: 'none', borderRadius: '6px', color: '#000', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}>+1 ⚡</button>
                      <button onClick={() => { testSpendEnergy(1); setTimeout(runEnergyCheck, 1000); }} style={{ padding: '8px', background: '#ef4444', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}>-1 ⚡</button>
                      <button onClick={() => { testAddEnergy(10); setTimeout(runEnergyCheck, 1000); }} style={{ padding: '8px', background: '#10b981', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}>+10 ⚡</button>
                      <button onClick={runEnergyCheck} style={{ padding: '8px', background: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}>🔄 Refresh</button>
                    </div>
                  </>
                )}
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
                      onClick={() => runHomeDiagnostics?.()} 
                      disabled={diagIsRunning}
                      style={{ 
                        padding: '6px 12px', 
                        background: diagIsRunning ? 'rgba(251, 191, 36, 0.3)' : 'rgba(236, 72, 153, 0.2)', 
                        border: `1px solid ${diagIsRunning ? '#fbbf24' : '#ec4899'}`, 
                        borderRadius: '6px', 
                        color: diagIsRunning ? '#fbbf24' : '#ec4899', 
                        cursor: diagIsRunning ? 'not-allowed' : 'pointer', 
                        fontSize: '10px', 
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <RefreshCw size={12} className={diagIsRunning ? 'animate-spin' : ''} /> 
                      {diagIsRunning ? 'Running...' : 'Run All'}
                    </button>
                    <CopyButton tab="diagnostics" />
                  </div>
                </div>

                {diagLastRun && (
                  <div style={{ padding: '8px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '6px', border: '1px solid rgba(236, 72, 153, 0.3)', fontSize: '10px', textAlign: 'center' }}>
                    Last run: {diagLastRun} | {diagResults.filter(r => r.status === 'pass').length}/{diagResults.length} passed
                  </div>
                )}

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

                {diagResults.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                    {diagResults.map((result, idx) => (
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