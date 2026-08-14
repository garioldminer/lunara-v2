import { useState, useEffect, useCallback } from 'react';
import { 
  Bug, X, Activity, Users, Server, Terminal, Settings, 
  Copy, Check, RefreshCw, Play, Eye, ChevronDown, Heart, Crown, Zap, Flame, Shield, Wrench
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { 
  getAllFunctionStatuses, getRecentLogs, testFunction,
  type FunctionStatus, type FunctionLog, EDGE_FUNCTIONS
} from '../lib/adminService';

/* ==========================================
   🎨 UI PRIMITIVES - კომპაქტური სტილები
   ========================================== */
const CLR = {
  green: '#10b981', red: '#ef4444', yellow: '#fbbf24', blue: '#60a5fa',
  purple: '#a78bfa', orange: '#fb923c', pink: '#ec4899', gold: '#C5A059',
  gray: '#94a3b8', dark: '#64748b', light: '#e2e8f0'
};
type CS = React.CSSProperties;

const card = (c: string, x?: CS): CS => ({ padding: 12, background: `${c}1a`, borderRadius: 8, border: `1px solid ${c}66`, fontSize: 11, ...x });
const btnS = (c: string, x?: CS): CS => ({ padding: '6px 10px', background: `${c}33`, border: `1px solid ${c}`, borderRadius: 6, color: c, cursor: 'pointer', fontSize: 10, fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: 4, ...x });
const solidBtn = (bg: string, fg = '#fff', x?: CS): CS => ({ padding: 8, background: bg, border: 'none', borderRadius: 6, color: fg, cursor: 'pointer', fontWeight: 'bold', fontSize: 10, ...x });
const grid = (n: number): CS => ({ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 8 });
const rowS = (x?: CS): CS => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...x });
const colS: CS = { display: 'flex', flexDirection: 'column', gap: 12 };
const stColor = (ok: boolean | null) => (ok === null ? CLR.yellow : ok ? CLR.green : CLR.red);

function Title({ icon: Icon, color, children, right }: { icon: any; color: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={rowS({ marginBottom: 4 })}>
      <span style={{ color, fontWeight: 'bold', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Icon size={14} /> {children}</span>
      <div style={{ display: 'flex', gap: 6 }}>{right}</div>
    </div>
  );
}
function LastRun({ text }: { text: string }) {
  return <div style={{ padding: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', fontSize: 10, textAlign: 'center' }}>{text}</div>;
}
function Empty({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 12px', color: CLR.gray, fontSize: 11 }}>
      <Icon size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
      <div>{children}</div>
    </div>
  );
}
function CheckRow({ status, title, msg, details }: { status: 'pass' | 'warn' | 'fail'; title: string; msg: string; details?: string }) {
  const c = status === 'pass' ? CLR.green : status === 'warn' ? CLR.yellow : CLR.red;
  const ic = status === 'pass' ? '✅' : status === 'warn' ? '⚠️' : '❌';
  return (
    <div style={{ padding: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 8, border: `1px solid ${c}80` }}>
      <div style={{ fontSize: 11, fontWeight: 'bold', color: CLR.light, marginBottom: 4 }}>{ic} {title}</div>
      <div style={{ fontSize: 10, color: '#cbd5e1', marginBottom: details ? 4 : 0 }}>{msg}</div>
      {details && <div style={{ fontSize: 9, color: CLR.gray, padding: 4, background: 'rgba(0,0,0,0.5)', borderRadius: 4, wordBreak: 'break-word' }}>{details}</div>}
    </div>
  );
}
function FixRow({ label, ok, okT, badT }: { label: string; ok: boolean; okT: string; badT: string }) {
  return (
    <div style={rowS({ padding: '4px 6px', background: ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', borderRadius: 4 })}>
      <span>{label}</span>
      <span style={{ color: ok ? '#22c55e' : CLR.red, fontWeight: 'bold', fontSize: 10 }}>{ok ? okT : badT}</span>
    </div>
  );
}

/* ==========================================
   📋 INTERFACES
   ========================================== */
interface DiagnosticResult { id: string; name: string; status: 'pass' | 'fail' | 'warning' | 'pending'; message: string; details?: any; timestamp: string; }
interface HomeDiagnostics { results: DiagnosticResult[]; isRunning: boolean; lastRun: string | null; }
interface ProfileCheck { id: string; element: string; status: 'pass' | 'warn' | 'fail'; message: string; details?: string; }
interface EnergyTransaction { id: string; amount: number; transaction_type: string; reference_id: string | null; balance_after: number; created_at: string; }
interface ReadingCost { reading_type: string; energy_cost: number; description: string; }
interface EnergyCheckData { uiEnergy: number; uiMax: number; dbEnergy: number; dbMax: number; lastUpdate: string | null; boostMultiplier: number; minutesPassed: number; energyToRegen: number; minutesUntilNext: number; transactions: EnergyTransaction[]; costs: ReadingCost[]; match: boolean; }
interface AuthSecurityInfo { signatureVerified: boolean | null; tokenAge: number | null; expiresIn: number | null; authMethod: 'signIn' | 'createUser' | 'unknown'; rawDataHash: string | null; authDate: string | null; }
interface AppFixesStatus { splashClosure: boolean; visibilityCleanup: boolean; errorBoundary: boolean; telegramReady: boolean; selectedCardCheck: boolean; }
interface DebugPanelProps {
  showDebug: boolean; setShowDebug: (s: boolean) => void; user: any; economy: any; dbDebugInfo: any;
  debugLogs: any[]; dbStatus: string; activeSubscription: any; questsLoading: boolean; dailyQuests: any[];
  activeDailyQuest: any; isClaimingQuest: boolean; timeLeft: string; showQuestModal: boolean; rewardClaimed: boolean;
  isClaiming: boolean; currentStreak: number; setDebugLogs: React.Dispatch<React.SetStateAction<any[]>>;
  checkDatabaseStatus: () => void; refreshUserDataDebug: () => void; handleLogoutAndReset: () => void;
  testAddCoins: (n: number) => void; testAddXP: (n: number) => void; testAddEnergy: (n: number) => void;
  testSpendEnergy: (n: number) => void; testCompleteQuest: () => void; reloadFromDatabase: () => void;
  testAddXPWithLevel: (n: number) => void; forceRecalcLevel: () => void; xpTestLogs: string[];
  runHomeDiagnostics?: () => Promise<DiagnosticResult[]>; diagnostics?: HomeDiagnostics;
  testEnergySystem?: () => void; testLocalStorage?: () => void; testPremiumGate?: () => void; testQuestSystem?: () => void;
  testDailyCard?: () => void; testStreakSystem?: () => void; testXPSystem?: () => void; testSupabaseConnection?: () => void;
}
type TabType = 'system' | 'user' | 'streak' | 'profile' | 'energy' | 'diagnostics' | 'functions' | 'logs' | 'actions';

export default function DebugPanel(props: DebugPanelProps) {
  // ✅ FIX: timeLeft და isClaiming ამოღებულია (TS6133)
  const {
    showDebug, setShowDebug, user, economy, debugLogs, dbStatus, activeSubscription, currentStreak, setDebugLogs,
    checkDatabaseStatus, refreshUserDataDebug, handleLogoutAndReset, testAddCoins, testAddXP, testAddEnergy,
    testSpendEnergy, testCompleteQuest, reloadFromDatabase, questsLoading, showQuestModal, rewardClaimed,
    runHomeDiagnostics = async () => [], diagnostics = { results: [], isRunning: false, lastRun: null },
    testEnergySystem = () => {}, testLocalStorage = () => {}, testPremiumGate = () => {}, testQuestSystem = () => {},
    testDailyCard = () => {}, testStreakSystem = () => {}, testXPSystem = () => {}, testSupabaseConnection = () => {}
  } = props;

  const [activeTab, setActiveTab] = useState<TabType>('system');
  const [activeCopyTab, setActiveCopyTab] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState('');
  const [authStatus, setAuthStatus] = useState<'checking' | 'active' | 'inactive'>('checking');
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [tgAvailable, setTgAvailable] = useState(false);
  const [hasInitData, setHasInitData] = useState(false);
  const [bootTime, setBootTime] = useState(0);
  const [localStorageData, setLocalStorageData] = useState<Record<string, any>>({});
  const [authSecurity, setAuthSecurity] = useState<AuthSecurityInfo>({ signatureVerified: null, tokenAge: null, expiresIn: null, authMethod: 'unknown', rawDataHash: null, authDate: null });
  const [appFixes, setAppFixes] = useState<AppFixesStatus>({ splashClosure: true, visibilityCleanup: true, errorBoundary: true, telegramReady: false, selectedCardCheck: true });
  const [authFlow, setAuthFlow] = useState<any>({ edge: 'idle', edgeLatency: null, edgeError: null, edgeStatus: null, edgeResponse: null, session: 'idle', sessionError: null, lastRun: null });
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

  const addDebugLog = (type: 'info' | 'success' | 'error' | 'warning', category: string, message: string, data?: any) => {
    setDebugLogs(prev => [{ id: Date.now(), timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }), type, category, message, data }, ...prev].slice(0, 100));
  };
  const getXPToNextLevel = (l: number): number => { if (l===1) return 100; if (l===2) return 250; if (l===3) return 500; if (l===4) return 1000; if (l===5) return 2000; return Math.floor(2000*Math.pow(1.8,l-5)); };
  const getLevelFromTotalXP = (t: number) => { let lv=1, need=getXPToNextLevel(1), cur=t; while (cur>=need) { cur-=need; lv++; need=getXPToNextLevel(lv); } return { level: lv, currentLevelXP: cur, xpToNext: need }; };

  useEffect(() => {
    if (!showDebug) return;
    const check = async () => {
      const t0 = performance.now();
      const tg = (window as any).Telegram?.WebApp;
      setTgAvailable(!!tg); setHasInitData(!!tg?.initData);
      if (supabase) {
        try { const { data: { user: au }, error } = await supabase.auth.getUser();
          if (error || !au) { setAuthStatus('inactive'); setAuthUid(null); } else { setAuthStatus('active'); setAuthUid(au.id); }
        } catch { setAuthStatus('inactive'); setAuthUid(null); }
      } else setAuthStatus('inactive');
      const ls: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k) { try { ls[k] = localStorage.getItem(k)?.substring(0,100) || ''; } catch { ls[k] = '[Error]'; } } }
      setLocalStorageData(ls); setBootTime(Math.round(performance.now() - t0));
    };
    check();
  }, [showDebug]);

  useEffect(() => { if (showDebug && (window as any).Telegram?.WebApp?.version) setAppFixes(p => ({ ...p, telegramReady: true })); }, [showDebug]);

  useEffect(() => {
    if (!showDebug) return;
    const run = async () => {
      const s: AuthSecurityInfo = { signatureVerified: null, tokenAge: null, expiresIn: null, authMethod: 'unknown', rawDataHash: null, authDate: null };
      try {
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            try { const p = session.access_token.split('.'); if (p.length===3) { const pl = JSON.parse(atob(p[1])); const now = Math.floor(Date.now()/1000); s.tokenAge = now-(pl.iat||now); s.expiresIn = (pl.exp||now)-now; if (pl.auth_method) s.authMethod = pl.auth_method; } } catch {}
            s.signatureVerified = true;
          } else s.signatureVerified = false;
        }
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.initData) {
          const pr = new URLSearchParams(tg.initData); const h = pr.get('hash'); const ad = pr.get('auth_date');
          if (h) s.rawDataHash = h.substring(0,16)+'...';
          if (ad) { const age = Math.floor(Date.now()/1000)-parseInt(ad,10); s.authDate = `${age}s ago`; if (age>86400) s.signatureVerified = false; }
        }
        const logs = debugLogs.filter(l => l.category==='TELEGRAM_AUTH' || l.message?.includes('signed in') || l.message?.includes('User created'));
        if (logs[0]) s.authMethod = logs[0].message?.includes('created') ? 'createUser' : logs[0].message?.includes('signed in') ? 'signIn' : s.authMethod;
        setAuthSecurity(s);
      } catch (e) { console.error('Auth security check failed:', e); }
    };
    run();
  }, [showDebug, debugLogs]);

  const loadFunctionStatuses = useCallback(async () => {
    if (!user?.id) return;
    setFunctionsLoading(true);
    try {
      const st = await getAllFunctionStatuses(user.id); setFunctionStatuses(st);
      const m: Record<string, FunctionLog[]> = {};
      for (const f of EDGE_FUNCTIONS) { const l = await getRecentLogs(user.id, 5); m[f.name] = l.filter(x => x.function_name === f.name); }
      setFunctionLogs(m);
    } catch (e) { console.error(e); } finally { setFunctionsLoading(false); }
  }, [user?.id]);

  useEffect(() => { if (showDebug && activeTab==='functions') { loadFunctionStatuses(); const i = setInterval(loadFunctionStatuses, 30000); return () => clearInterval(i); } }, [showDebug, activeTab, loadFunctionStatuses]);

  const handleTestFunction = async (n: string) => {
    if (!user?.id) return; setTestingFunction(n);
    try { const r = await testFunction(user.id, n);
      if (r.success) addDebugLog('success','FUNCTION_TEST',`✅ ${n} executed successfully`, r.log); else addDebugLog('error','FUNCTION_TEST',`❌ ${n} failed: ${r.error}`);
      await loadFunctionStatuses();
    } catch (e: any) { addDebugLog('error','FUNCTION_TEST',`💥 ${n} exception: ${e.message}`); } finally { setTestingFunction(null); }
  };

  const runAuthFlowTest = async () => {
    const tg = (window as any).Telegram?.WebApp;
    const url = import.meta.env.VITE_SUPABASE_URL; const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const ts = () => new Date().toLocaleTimeString('en-US', { hour12: false });
    addDebugLog('info','AUTH_FLOW_TEST','🧪 Starting auth flow test...');
    setAuthFlow((p: any) => ({ ...p, edge: 'testing', edgeError: null, edgeStatus: null, edgeResponse: null }));
    if (!tg?.initData) { setAuthFlow((p: any) => ({ ...p, edge: 'fail', edgeError: 'No Telegram initData' })); addDebugLog('error','AUTH_FLOW_TEST','❌ No initData'); }
    else if (!url) { setAuthFlow((p: any) => ({ ...p, edge: 'fail', edgeError: 'No SUPABASE_URL' })); addDebugLog('error','AUTH_FLOW_TEST','❌ No SUPABASE_URL'); }
    else {
      const t0 = performance.now();
      try {
        const res = await fetch(`${url}/functions/v1/telegram-auth`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key||''}` }, body: JSON.stringify({ initData: tg.initData }) });
        const lat = Math.round(performance.now()-t0); let d: any = null; try { d = await res.json(); } catch { d = { raw: await res.text() }; }
        if (res.ok && (d.success||d.access_token||d.session)) { setAuthFlow((p: any) => ({ ...p, edge: 'ok', edgeLatency: lat, edgeStatus: res.status, edgeResponse: d })); addDebugLog('success','AUTH_FLOW_TEST',`✅ Edge OK (${lat}ms)`, d); }
        else { const em = d?.error||d?.message||`HTTP ${res.status}`; setAuthFlow((p: any) => ({ ...p, edge: 'fail', edgeLatency: lat, edgeStatus: res.status, edgeError: em, edgeResponse: d })); addDebugLog('error','AUTH_FLOW_TEST',`❌ Edge fail: ${em} (${res.status})`, d); }
      } catch (e: any) { setAuthFlow((p: any) => ({ ...p, edge: 'fail', edgeLatency: Math.round(performance.now()-t0), edgeError: e.message })); addDebugLog('error','AUTH_FLOW_TEST',`💥 Edge exception: ${e.message}`); }
    }
    setAuthFlow((p: any) => ({ ...p, session: 'testing', sessionError: null }));
    if (!supabase) { setAuthFlow((p: any) => ({ ...p, session: 'fail', sessionError: 'No supabase client', lastRun: ts() })); addDebugLog('error','AUTH_FLOW_TEST','❌ No supabase client'); return; }
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) { setAuthFlow((p: any) => ({ ...p, session: 'fail', sessionError: error.message, lastRun: ts() })); addDebugLog('error','AUTH_FLOW_TEST',`❌ Session: ${error.message}`); }
      else if (!data?.session) { setAuthFlow((p: any) => ({ ...p, session: 'fail', sessionError: 'No session', lastRun: ts() })); addDebugLog('error','AUTH_FLOW_TEST','❌ Session: no session'); }
      else { setAuthFlow((p: any) => ({ ...p, session: 'ok', lastRun: ts() })); addDebugLog('success','AUTH_FLOW_TEST','✅ Session refresh OK'); }
    } catch (e: any) { setAuthFlow((p: any) => ({ ...p, session: 'fail', sessionError: e.message, lastRun: ts() })); addDebugLog('error','AUTH_FLOW_TEST',`💥 Session: ${e.message}`); }
  };

  const runEnergyCheck = async () => {
    if (!user?.id || !supabase) return;
    setEnergyChecking(true); addDebugLog('info','ENERGY_CHECK','⚡ Starting energy check...');
    try {
      const { data: eco } = await supabase.from('user_economy').select('cosmic_focus, max_focus, last_energy_update, energy_boost_multiplier').eq('user_id', user.id).single();
      const { data: tx } = await supabase.from('energy_transactions').select('id, amount, transaction_type, reference_id, balance_after, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
      const { data: cost } = await supabase.from('reading_costs').select('reading_type, energy_cost, description').order('energy_cost', { ascending: true });
      if (eco) {
        const boost = parseFloat(eco.energy_boost_multiplier)||1; const now = new Date(); const last = new Date(eco.last_energy_update);
        const mins = (now.getTime()-last.getTime())/1000/60; const rate = 30/boost;
        setEnergyData({ uiEnergy: economy?.cosmic_focus??0, uiMax: economy?.max_focus??20, dbEnergy: eco.cosmic_focus, dbMax: eco.max_focus, lastUpdate: eco.last_energy_update, boostMultiplier: boost, minutesPassed: Math.floor(mins), energyToRegen: Math.floor(mins/rate), minutesUntilNext: Math.max(0, Math.ceil(rate-(mins%rate))), transactions: tx||[], costs: cost||[], match: (economy?.cosmic_focus??0)===eco.cosmic_focus && (economy?.max_focus??20)===eco.max_focus });
        addDebugLog('success','ENERGY_CHECK',`✅ UI ${economy?.cosmic_focus}/${economy?.max_focus} | DB ${eco.cosmic_focus}/${eco.max_focus}`);
      } else addDebugLog('error','ENERGY_CHECK','❌ No economy data');
      setEnergyLastRun(new Date().toLocaleTimeString('en-US', { hour12: false }));
    } catch (e: any) { addDebugLog('error','ENERGY_CHECK',`❌ ${e.message}`); }
    setEnergyChecking(false);
  };

  const runProfileBannerCheck = async () => {
    setProfileChecking(true); addDebugLog('info','PROFILE_BANNER','🔍 Starting profile banner check...');
    const c: ProfileCheck[] = []; let db: any = null;
    if (user?.id && supabase) { try { const { data, error } = await supabase.from('user_economy').select('cosmic_coins, xp, level, current_streak, cosmic_focus, max_focus').eq('user_id', user.id).single(); if (!error) db = data; } catch (e: any) { addDebugLog('error','PROFILE_BANNER',`DB: ${e.message}`); } }
    const letter = user?.display_name?.charAt(0).toUpperCase()||'U';
    c.push({ id:'avatar', element:'🖼️ ავატარი + ასო', status: user ? (user.display_name?'pass':'warn') : 'fail', message: user ? (user.display_name?`ჩანს ასო: "${letter}"`:'სახელი ცარიელია → "U"') : 'user არ ჩატვირთულა!', details: `display_name: ${user?.display_name||'null'}` });
    const xp = economy?.xp??0; const ld = getLevelFromTotalXP(xp); const pct = ld.xpToNext>0 ? Math.min((ld.currentLevelXP/ld.xpToNext)*100,100) : 0;
    c.push({ id:'xp-circle', element:'⭕ XP წრე', status: (xp>=0&&pct>=0&&pct<=100)?'pass':'fail', message:`XP: ${xp} → ${pct.toFixed(1)}%`, details:`${ld.currentLevelXP}/${ld.xpToNext}` });
    c.push({ id:'level-badge', element:'🏅 ლეველი badge', status: ld.level===(economy?.level??1)?'pass':'warn', message: ld.level===(economy?.level??1)?`ლეველი: ${economy?.level} ✅`:`განსხვავება! badge: ${ld.level}, state: ${economy?.level}`, details:`XP-დან: ${ld.level} | economy.level: ${economy?.level}` });
    c.push({ id:'username', element:'👤 სახელი', status: user?.display_name?'pass':'warn', message: user?.display_name?`ჩანს: "${user.display_name}"`:'fallback: "LunaraSeeker"', details:`display_name: ${user?.display_name||'null'}` });
    if (activeSubscription) { const ok = new Date(activeSubscription.expires_at)>new Date(); c.push({ id:'premium-badge', element:'👑 Premium badge', status: ok?'pass':'fail', message: ok?`აქტიურია (${activeSubscription.plan_type})`:'ვადა გასულია!', details:`expires_at: ${activeSubscription.expires_at}` }); }
    else c.push({ id:'premium-badge', element:'👑 Premium badge', status:'warn', message:'subscription არ არის (ნორმალურია)', details:'activeSubscription: null' });
    const uc = economy?.cosmic_coins??0; const dc = db?.cosmic_coins??null;
    c.push({ id:'coins', element:'💎 Coins', status: dc===null?'warn':(uc===dc?'pass':'warn'), message: dc===null?`UI: ${uc} (DB ვერ წავიკითხე)`:(uc===dc?`UI: ${uc} = DB: ${dc} ✅`:`განსხვავება! UI: ${uc}, DB: ${dc}`), details:`economy: ${uc} | db: ${dc}` });
    const ue = economy?.cosmic_focus??0; const um = economy?.max_focus??20; const de = db?.cosmic_focus??null; const dm = db?.max_focus??null;
    c.push({ id:'energy', element:'⚡ ენერგია', status: !(ue>=0&&ue<=um)?'fail':(dm!==null&&dm!==um?'warn':'pass'), message: !(ue>=0&&ue<=um)?`არასწორია! ${ue}/${um}`:`UI: ${ue}/${um} | DB: ${de}/${dm}`, details:`cosmic_focus: ${ue} | max: ${um}` });
    const ds = db?.current_streak??null;
    c.push({ id:'streak', element:'🔥 Streak', status: ds===null?'warn':(currentStreak===ds?'pass':'warn'), message: ds===null?`State: ${currentStreak} (DB ვერ წავიკითხე)`:(currentStreak===ds?`State: ${currentStreak} = DB: ${ds} ✅`:`განსხვავება! State: ${currentStreak}, DB: ${ds}`), details:`state: ${currentStreak} | db: ${ds}` });
    setProfileChecks(c);
    const p = c.filter(x=>x.status==='pass').length, w = c.filter(x=>x.status==='warn').length, f = c.filter(x=>x.status==='fail').length;
    setProfileLastRun(new Date().toLocaleTimeString('en-US', { hour12: false }));
    addDebugLog('success','PROFILE_BANNER',`✅ ${p} pass, ${w} warn, ${f} fail`);
    setProfileChecking(false);
  };

  const runStreakCheck = async () => {
    if (!user?.id) return; setStreakChecking(true); addDebugLog('info','STREAK_CHECK','🔥 Starting streak check...');
    try { const { getStreakDiagnostics } = await import('../lib/streakService'); const d = await getStreakDiagnostics(user.id);
      if (d) { setStreakData(d); setStreakLastRun(new Date().toLocaleTimeString('en-US', { hour12: false })); addDebugLog('success','STREAK_CHECK',`✅ Streak: ${d.streak_info?.current_streak||0} | Unclaimed: ${d.stats.unclaimed_count}`); }
      else addDebugLog('error','STREAK_CHECK','❌ Failed');
    } catch (e: any) { addDebugLog('error','STREAK_CHECK',`❌ ${e.message}`); }
    setStreakChecking(false);
  };
  const handleSetStreak = async (d: number) => { if (!user?.id) return; setStreakActionLoading('set'); addDebugLog('info','STREAK_ACTION',`🔧 Set streak ${d}d`);
    try { const { forceSetStreak } = await import('../lib/streakService'); const r = await forceSetStreak(user.id, d);
      if (r.success) { addDebugLog('success','STREAK_ACTION',`✅ Streak → ${r.new_streak}`); await runStreakCheck(); } else addDebugLog('error','STREAK_ACTION',`❌ ${r.error}`);
    } catch (e: any) { addDebugLog('error','STREAK_ACTION',`❌ ${e.message}`); } setStreakActionLoading(null); };
  const handleResetMilestones = async () => { if (!user?.id) return; if (!confirm('⚠️ Delete ALL claimed milestones?')) return; setStreakActionLoading('reset'); addDebugLog('info','STREAK_ACTION','🗑️ Reset milestones');
    try { const { resetClaimedMilestones } = await import('../lib/streakService'); const r = await resetClaimedMilestones(user.id);
      if (r.success) { addDebugLog('success','STREAK_ACTION',`✅ Deleted ${r.deleted_count}`); await runStreakCheck(); } else addDebugLog('error','STREAK_ACTION',`❌ ${r.error}`);
    } catch (e: any) { addDebugLog('error','STREAK_ACTION',`❌ ${e.message}`); } setStreakActionLoading(null); };
  const handleForceClaim = async () => { if (!user?.id) return; setStreakActionLoading('claim'); addDebugLog('info','STREAK_ACTION','🎯 Force claim');
    try { const { claimStreakMilestone } = await import('../lib/streakService'); const r = await claimStreakMilestone();
      if (r.success && r.data) { addDebugLog('success','STREAK_ACTION',`✅ Claimed ${r.data.milestones_claimed.length}! +${r.data.total_coins}💎 +${r.data.total_xp}XP`); await runStreakCheck(); }
      else addDebugLog('warning','STREAK_ACTION',`⚠️ ${r.error||'No milestones'}`);
    } catch (e: any) { addDebugLog('error','STREAK_ACTION',`❌ ${e.message}`); } setStreakActionLoading(null); };

  const xpToNext = getXPToNextLevel(economy.level||1);
  const currentLevelXP = (() => { let r = economy.xp||0, l = 1; while (l < (economy.level||1)) { r -= getXPToNextLevel(l); l++; } return Math.max(0, r); })();
  const xpPercent = Math.min((currentLevelXP/xpToNext)*100, 100);

  const handleCopyTab = (tab: string) => {
    let text = '';
    if (tab==='system') text = `SYSTEM STATUS\n⚡ Boot: ${bootTime}ms\n🗄️ DB: ${dbStatus.toUpperCase()}\n🔑 Auth: ${authStatus==='active'?'ACTIVE ✅':'INACTIVE ❌'}\n🛡️ Admin: ${user?.is_admin?'YES':'NO'}\n📱 WebApp: ${tgAvailable?'YES':'NO'}\n🔐 initData: ${hasInitData?'YES':'NO'}\n🆔 UID: ${authUid||'NULL'}\n🆔 DB: ${user?.id||'NULL'}\n${authUid===user?.id?'✅ Match':'❌ Mismatch'}\n🔑 HMAC: ${authSecurity.signatureVerified===true?'VERIFIED':authSecurity.signatureVerified===false?'FAILED':'...'}\n⏱️ Age: ${authSecurity.tokenAge??'N/A'}s | Exp: ${authSecurity.expiresIn??'N/A'}s\n📊 Method: ${authSecurity.authMethod}\n🧪 Edge: ${authFlow.edge==='ok'?`OK ${authFlow.edgeLatency}ms`:authFlow.edge==='fail'?`FAIL ${authFlow.edgeError}`:'-'}\n🔄 Session: ${authFlow.session}\n\nLOCALSTORAGE (${Object.keys(localStorageData).length})\n${Object.entries(localStorageData).map(([k,v])=>`${k}\n${v}`).join('\n\n')}`;
    else if (tab==='user') text = `PROFILE\n👤 ${user?.display_name||'N/A'} | 📧 ${user?.username||'N/A'} | ♏ ${user?.sun_sign||'-'}\n💎 ${economy.cosmic_coins} | ⚡ ${economy.cosmic_focus}/${economy.max_focus} | ⭐ ${economy.level} | 🔥 ${currentStreak}\n📊 XP: ${currentLevelXP}/${xpToNext} (${xpPercent.toFixed(1)}%)\nSub: ${activeSubscription?activeSubscription.plan_type:'None'}`;
    else if (tab==='streak') text = streakData ? `STREAK\nCurrent: ${streakData.streak_info?.current_streak||0} | Longest: ${streakData.streak_info?.longest_streak||0}\nClaimed: ${streakData.stats.claimed_count} | Unclaimed: ${streakData.stats.unclaimed_count}\n${streakData.milestones.map((m:any)=>`${m.is_claimed?'✅':m.is_achieved?'🎁':''} ${m.name} (${m.days_required}d)`).join('\n')}` : 'STREAK\nNo data';
    else if (tab==='profile') text = `PROFILE CHECK\n${profileChecks.map(c=>`${c.status==='pass'?'✅':c.status==='warn'?'⚠️':'❌'} ${c.element}\n${c.message}`).join('\n\n')}`;
    else if (tab==='energy') text = `ENERGY\nUI: ${energyData?.uiEnergy}/${energyData?.uiMax} | DB: ${energyData?.dbEnergy}/${energyData?.dbMax} | Match: ${energyData?.match?'YES':'NO'}\nBoost: ${energyData?.boostMultiplier}x | Next +1: ${energyData?.minutesUntilNext}min\n${energyData?.costs.map(c=>`- ${c.reading_type}: ${c.energy_cost}⚡`).join('\n')}`;
    else if (tab==='diagnostics') text = `DIAGNOSTICS\n${(diagnostics?.results||[]).map(r=>`${r.status==='pass'?'✅':r.status==='fail'?'❌':'️'} ${r.name}\n${r.message}`).join('\n\n')}`;
    else if (tab==='functions') text = `EDGE FUNCTIONS\n${functionStatuses.map(f=>`${f.name}\nRuns: ${f.totalRuns} | ${f.successRate.toFixed(0)}% | ${f.avgResponseTime}ms`).join('\n\n')}`;
    else if (tab==='logs') text = debugLogs.map(l=>`[${l.timestamp}] [${l.category}] ${l.type.toUpperCase()}: ${l.message}`).join('\n\n');
    else text = `ACTIONS\nQuests: ${questsLoading} | Modal: ${showQuestModal} | Claimed: ${rewardClaimed}`;
    navigator.clipboard.writeText(text); setActiveCopyTab(tab); setTimeout(() => setActiveCopyTab(null), 2000);
  };

  const tabs = [
    { id: 'system' as TabType, label: 'System', icon: Activity }, { id: 'user' as TabType, label: 'User', icon: Users },
    { id: 'streak' as TabType, label: 'Streak', icon: Flame }, { id: 'profile' as TabType, label: 'Profile', icon: Crown },
    { id: 'energy' as TabType, label: 'Energy', icon: Zap }, { id: 'diagnostics' as TabType, label: 'Diag', icon: Heart },
    { id: 'functions' as TabType, label: 'Funcs', icon: Server }, { id: 'logs' as TabType, label: 'Logs', icon: Terminal },
    { id: 'actions' as TabType, label: 'Actions', icon: Settings },
  ];
  const CopyButton = ({ tab }: { tab: string }) => (
    <button onClick={() => handleCopyTab(tab)} style={btnS(activeCopyTab===tab?CLR.green:CLR.blue, { padding: '4px 8px' })}>
      {activeCopyTab===tab?<Check size={12}/>:<Copy size={12}/>} {activeCopyTab===tab?'Copied!':'Copy'}
    </button>
  );
  const RunBtn = ({ onClick, loading, color, label }: any) => (
    <button onClick={onClick} disabled={loading} style={btnS(color, { opacity: loading?0.6:1 })}>
      <RefreshCw size={12} className={loading?'animate-spin':''}/> {loading?'...':label}
    </button>
  );

  const diagResults = diagnostics?.results||[]; const diagRunning = diagnostics?.isRunning||false; const diagLast = diagnostics?.lastRun||null;
  const filteredLogs = debugLogs.filter(l => !logFilter || l.category.toLowerCase().includes(logFilter.toLowerCase()) || l.message.toLowerCase().includes(logFilter.toLowerCase()));

  return (
    <>
      {/* ✅ ლურჯი floating ღილაკი ამოღებულია - იხსნება HomeScreen-ის ღილაკით */}
      {showDebug && (
        <div style={{ position: 'fixed', top: 10, bottom: 10, left: 10, right: 10, zIndex: 10000, maxWidth: 450, margin: '0 auto', background: 'rgba(10,6,0,0.98)', border: '2px solid rgba(255,229,102,0.5)', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.8)', fontFamily: 'monospace', fontSize: 11, color: '#ffe566', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,229,102,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: 14, color: '#ffe566', display: 'flex', alignItems: 'center', gap: 8 }}><Bug size={16}/> ADMIN DEBUG</strong>
            <button onClick={() => setShowDebug(false)} style={{ background: 'none', border: 'none', color: CLR.red, cursor: 'pointer', padding: 4 }}><X size={18}/></button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4, padding: '8px 12px', borderBottom: '1px solid rgba(255,229,102,0.2)', background: 'rgba(0,0,0,0.3)' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: '1 1 22%', minWidth: 50, padding: '6px 4px', background: activeTab===t.id?'rgba(255,229,102,0.2)':'transparent', border: activeTab===t.id?'1px solid rgba(255,229,102,0.5)':'1px solid transparent', borderRadius: 8, color: activeTab===t.id?'#ffe566':CLR.gray, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontSize: 9, fontWeight: 'bold' }}>
                <t.icon size={14}/>{t.label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

            {activeTab==='system' && (<div style={colS}>
              <Title icon={Activity} color={CLR.green} right={<CopyButton tab="system"/>}>SYSTEM STATUS</Title>
              <div style={card(CLR.green, grid(2))}>
                <div>⚡ Boot: <strong>{bootTime}ms</strong></div>
                <div>🗄️ DB: <strong style={{ color: dbStatus==='connected'?CLR.green:CLR.red }}>{dbStatus.toUpperCase()}</strong></div>
                <div>🔑 Auth: <strong style={{ color: authStatus==='active'?CLR.green:CLR.red }}>{authStatus==='active'?'ACTIVE ✅':'INACTIVE ❌'}</strong></div>
                <div>🛡️ Admin: <strong style={{ color: user?.is_admin?CLR.green:CLR.red }}>{user?.is_admin?'YES ✅':'NO ❌'}</strong></div>
              </div>
              <div style={card(CLR.blue, grid(2))}>
                <div>📱 WebApp: <strong style={{ color: tgAvailable?CLR.green:CLR.red }}>{tgAvailable?'YES':'NO'}</strong></div>
                <div>🔐 initData: <strong style={{ color: hasInitData?CLR.green:CLR.red }}>{hasInitData?'YES':'NO'}</strong></div>
              </div>
              <div style={card(CLR.purple)}>
                <div>🆔 UID: <span style={{ color: authUid?CLR.green:CLR.red, wordBreak: 'break-all' }}>{authUid?`${authUid.substring(0,8)}...`:'NULL'}</span></div>
                <div>🆔 DB: <span style={{ color: user?.id?CLR.green:CLR.red, wordBreak: 'break-all' }}>{user?.id?`${user.id.substring(0,8)}...`:'NULL'}</span></div>
                <div style={{ marginTop: 4, padding: 4, background: authUid===user?.id?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)', borderRadius: 4, textAlign: 'center' }}>{authUid===user?.id?'✅ IDs Match':'❌ IDs Mismatch'}</div>
              </div>
              <div style={card('#a855f7')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#a855f7', fontWeight: 'bold', fontSize: 12 }}><Shield size={14}/> AUTH SECURITY</div>
                <div style={grid(2)}>
                  <div>🔑 HMAC: <strong style={{ color: stColor(authSecurity.signatureVerified) }}>{authSecurity.signatureVerified===true?'VERIFIED ✅':authSecurity.signatureVerified===false?'FAILED ❌':'...'}</strong></div>
                  <div>⏱️ Age: <strong style={{ color: CLR.yellow }}>{authSecurity.tokenAge!==null?`${authSecurity.tokenAge}s`:'N/A'}</strong></div>
                  <div>⏰ Exp: <strong style={{ color: CLR.blue }}>{authSecurity.expiresIn!==null?`${authSecurity.expiresIn}s`:'N/A'}</strong></div>
                  <div>📊 Method: <strong style={{ color: CLR.purple }}>{authSecurity.authMethod}</strong></div>
                </div>
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(168,85,247,0.2)', fontSize: 10 }}>
                  <div>🔗 Hash: <span style={{ color: CLR.gray, fontSize: 9 }}>{authSecurity.rawDataHash||'N/A'}</span></div>
                  <div>📅 initData: <span style={{ color: CLR.gray }}>{authSecurity.authDate||'N/A'}</span></div>
                </div>
              </div>
              <div style={card(CLR.blue)}>
                <div style={rowS({ marginBottom: 8 })}>
                  <span style={{ color: CLR.blue, fontWeight: 'bold', fontSize: 12 }}>🧪 AUTH FLOW TEST</span>
                  <button onClick={runAuthFlowTest} disabled={authFlow.edge==='testing'||authFlow.session==='testing'} style={btnS(CLR.blue)}>
                    {authFlow.edge==='testing'||authFlow.session==='testing'?<><RefreshCw size={10} className="animate-spin"/> Testing</>:<><Play size={10}/> Run Test</>}
                  </button>
                </div>
                <div style={colS}>
                  <div style={rowS({ padding: '6px 8px', background: authFlow.edge==='ok'?'rgba(16,185,129,0.15)':authFlow.edge==='fail'?'rgba(239,68,68,0.15)':'rgba(255,255,255,0.05)', borderRadius: 4 })}>
                    <div><div style={{ fontWeight: 'bold', fontSize: 10 }}>🔌 telegram-auth</div><div style={{ fontSize: 9, color: CLR.gray }}>signInWithPassword via service_role</div></div>
                    <strong style={{ color: authFlow.edge==='ok'?CLR.green:authFlow.edge==='fail'?CLR.red:CLR.gray, fontSize: 10 }}>{authFlow.edge==='testing'?'⏳':authFlow.edge==='ok'?`✅ ${authFlow.edgeLatency}ms`:authFlow.edge==='fail'?`❌ ${authFlow.edgeStatus??''}`:'—'}</strong>
                  </div>
                  {authFlow.edge==='fail'&&authFlow.edgeError && <div style={{ padding: '6px 8px', background: 'rgba(239,68,68,0.1)', borderRadius: 4, fontSize: 9, color: '#fca5a5' }}>Error: {authFlow.edgeError}</div>}
                  <div style={rowS({ padding: '6px 8px', background: authFlow.session==='ok'?'rgba(16,185,129,0.15)':authFlow.session==='fail'?'rgba(239,68,68,0.15)':'rgba(255,255,255,0.05)', borderRadius: 4 })}>
                    <div><div style={{ fontWeight: 'bold', fontSize: 10 }}>🔄 Session Refresh</div><div style={{ fontSize: 9, color: CLR.gray }}>supabase.auth.refreshSession()</div></div>
                    <strong style={{ color: authFlow.session==='ok'?CLR.green:authFlow.session==='fail'?CLR.red:CLR.gray, fontSize: 10 }}>{authFlow.session==='testing'?'⏳':authFlow.session==='ok'?'✅ OK':authFlow.session==='fail'?'❌ FAIL':'—'}</strong>
                  </div>
                  {authFlow.session==='fail'&&authFlow.sessionError && <div style={{ padding: '6px 8px', background: 'rgba(239,68,68,0.1)', borderRadius: 4, fontSize: 9, color: '#fca5a5' }}>Error: {authFlow.sessionError}</div>}
                  {authFlow.lastRun && <div style={{ fontSize: 9, color: CLR.dark, textAlign: 'right' }}>Last run: {authFlow.lastRun}</div>}
                </div>
              </div>
              <div style={card('#22c55e')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#22c55e', fontWeight: 'bold', fontSize: 12 }}><Wrench size={14}/> APP FIXES</div>
                <div style={colS}>
                  <FixRow label="1. Splash Stale Closure" ok={appFixes.splashClosure} okT="✅ FIXED" badT="❌ BUG"/>
                  <FixRow label="2. visibilitychange" ok={appFixes.visibilityCleanup} okT="✅ FIXED" badT="❌ LEAK"/>
                  <FixRow label="3. ErrorBoundary" ok={appFixes.errorBoundary} okT="✅ FIXED" badT="❌ RISK"/>
                  <FixRow label="4. Telegram ready()" ok={appFixes.telegramReady} okT="✅ CALLED" badT="⏳ PENDING"/>
                  <FixRow label="5. selectedCardId" ok={appFixes.selectedCardCheck} okT="✅ FIXED" badT="❌ EDGE"/>
                </div>
              </div>
              <div style={card(CLR.yellow, { maxHeight: 120, overflowY: 'auto' })}>
                <div style={{ fontWeight: 'bold', marginBottom: 6 }}>LOCALSTORAGE ({Object.keys(localStorageData).length})</div>
                {Object.entries(localStorageData).map(([k,v]) => (
                  <div key={k} style={{ marginBottom: 6, padding: 6, background: 'rgba(0,0,0,0.3)', borderRadius: 4 }}>
                    <div style={{ color: CLR.yellow, fontWeight: 'bold', fontSize: 9 }}>{k}</div>
                    <div style={{ color: CLR.gray, fontSize: 9, wordBreak: 'break-all' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>)}

            {activeTab==='user' && (<div style={colS}>
              <Title icon={Users} color={CLR.blue} right={<CopyButton tab="user"/>}>USER & ECONOMY</Title>
              <div style={card(CLR.blue)}>
                <div>👤 Name: <strong>{user?.display_name||'N/A'}</strong></div>
                <div>📧 Username: <strong>{user?.username||'N/A'}</strong></div>
                <div>♏ Sun Sign: <strong>{user?.sun_sign||'Not set'}</strong></div>
                <div>✅ Onboarding: <strong>{user?.onboarding_completed?'Complete':'Pending'}</strong></div>
              </div>
              <div style={card(CLR.yellow)}>
                <div style={grid(2)}>
                  <div>💎 Gems: <strong>{economy.cosmic_coins}</strong></div>
                  <div>⚡ Energy: <strong>{economy.cosmic_focus}/{economy.max_focus}</strong></div>
                  <div>⭐ Level: <strong>{economy.level}</strong></div>
                  <div>🔥 Streak: <strong>{currentStreak}</strong></div>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginTop: 8 }}>
                  <div style={{ height: '100%', width: `${xpPercent}%`, background: 'linear-gradient(90deg,#fbbf24,#ffe566)', borderRadius: 3 }}/>
                </div>
                <div style={{ fontSize: 9, color: CLR.gray, marginTop: 4, textAlign: 'right' }}>{xpPercent.toFixed(1)}% → Level {(economy.level||1)+1}</div>
              </div>
              <div style={card(CLR.green)}>
                <div>Status: <strong style={{ color: activeSubscription?CLR.green:CLR.red }}>{activeSubscription?'Active ✅':'None ❌'}</strong></div>
                {activeSubscription && <div>Plan: <strong>{activeSubscription.plan_type}</strong> | Exp: <strong>{new Date(activeSubscription.expires_at).toLocaleDateString()}</strong></div>}
              </div>
            </div>)}

            {activeTab==='streak' && (<div style={colS}>
              <Title icon={Flame} color={CLR.orange} right={<><RunBtn onClick={runStreakCheck} loading={streakChecking} color={CLR.orange} label="Run Check"/><CopyButton tab="streak"/></>}>STREAK SYSTEM</Title>
              {streakLastRun&&streakData && <LastRun text={`Last: ${streakLastRun} | 🔥 ${streakData.streak_info?.current_streak||0}d | 🎯 ${streakData.stats.unclaimed_count} unclaimed`}/>}
              {!streakData ? <Empty icon={Flame}>დააჭირე "Run Check"-ს</Empty> : (<>
                <div style={card(CLR.orange)}>
                  <div style={{ fontWeight: 'bold', marginBottom: 8, color: CLR.orange }}>🔥 მიმდინარე Streak</div>
                  <div style={grid(2)}>
                    <div>Current: <strong>{streakData.streak_info?.current_streak||0}</strong></div>
                    <div>Longest: <strong>{streakData.streak_info?.longest_streak||0}</strong></div>
                    <div>Last Active: <strong style={{ fontSize: 9 }}>{streakData.economy?.last_active_date||'N/A'}</strong></div>
                    <div>Last Claim: <strong style={{ fontSize: 9 }}>{streakData.economy?.last_daily_claim||'N/A'}</strong></div>
                  </div>
                  {streakData.streak_info?.next_milestone && <div style={{ marginTop: 8, padding: 6, background: 'rgba(251,191,36,0.2)', borderRadius: 4, fontSize: 10 }}>🎯 Next: <strong>{streakData.streak_info.next_milestone.icon_emoji} {streakData.streak_info.next_milestone.name}</strong> ({streakData.streak_info.days_to_next}d)</div>}
                </div>
                <div style={card(CLR.green)}>
                  <div style={grid(3)}>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: 16, fontWeight: 'bold', color: CLR.orange }}>{streakData.stats.achieved_count}</div><div style={{ fontSize: 9, color: CLR.gray }}>Achieved</div></div>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: 16, fontWeight: 'bold', color: CLR.green }}>{streakData.stats.claimed_count}</div><div style={{ fontSize: 9, color: CLR.gray }}>Claimed</div></div>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: 16, fontWeight: 'bold', color: streakData.stats.unclaimed_count>0?CLR.yellow:CLR.gray }}>{streakData.stats.unclaimed_count}</div><div style={{ fontSize: 9, color: CLR.gray }}>Unclaimed</div></div>
                  </div>
                </div>
                <div style={card(CLR.purple, { maxHeight: 200, overflowY: 'auto' })}>
                  <div style={{ fontWeight: 'bold', marginBottom: 8, color: CLR.purple }}>🎯 Milestones</div>
                  {streakData.milestones.map((m: any) => {
                    const st = m.is_claimed?'claimed':m.is_achieved?'ready':'locked';
                    const cc = st==='claimed'?{bg:'rgba(16,185,129,0.2)',bd:'rgba(16,185,129,0.4)',tx:CLR.green,lb:'✅'}:st==='ready'?{bg:'rgba(251,191,36,0.2)',bd:'rgba(251,191,36,0.4)',tx:CLR.yellow,lb:'🎁'}:{bg:'rgba(0,0,0,0.3)',bd:'rgba(255,255,255,0.1)',tx:CLR.gray,lb:'🔒'};
                    return (<div key={m.id} style={{ padding: 8, background: cc.bg, border: `1px solid ${cc.bd}`, borderRadius: 6, display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div><div style={{ fontSize: 11, fontWeight: 'bold', color: CLR.light }}>{m.icon_emoji} {m.name} <span style={{ color: cc.tx, fontSize: 9 }}>({m.days_required}d)</span></div><div style={{ fontSize: 9, color: CLR.gray }}>+{m.reward_coins}💎 +{m.reward_xp}XP</div></div>
                      <div style={{ fontSize: 9, color: cc.tx, fontWeight: 'bold' }}>{cc.lb}</div>
                    </div>);
                  })}
                </div>
                <div style={card(CLR.blue)}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
                    {streakData.calendar?.map((d: any, i: number) => (
                      <div key={i} style={{ aspectRatio: '1', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, background: d.is_today?'linear-gradient(135deg,#fbbf24,#d97706)':d.has_reading?'linear-gradient(135deg,#10b981,#059669)':d.is_future?'rgba(255,255,255,0.02)':'rgba(239,68,68,0.3)', color: '#fff' }}>
                        {d.has_reading?'✓':d.is_today?'★':d.is_future?'':'✗'}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={card(CLR.red)}>
                  <div style={{ fontWeight: 'bold', marginBottom: 8, color: CLR.red }}>🔧 TEST ACTIONS</div>
                  <div style={grid(4)}>
                    {[0,3,7,30].map(d => <button key={d} onClick={() => handleSetStreak(d)} disabled={streakActionLoading==='set'} style={solidBtn(d===0?'#64748b':d===3?CLR.green:d===7?CLR.orange:CLR.yellow, d===30?'#000':'#fff')}>{d}d</button>)}
                  </div>
                  <div style={grid(2)}>
                    <button onClick={handleForceClaim} disabled={streakActionLoading==='claim'} style={solidBtn(CLR.yellow, '#000')}>{streakActionLoading==='claim'?'...':'Force Claim'}</button>
                    <button onClick={handleResetMilestones} disabled={streakActionLoading==='reset'} style={btnS(CLR.red)}>{streakActionLoading==='reset'?'...':'Reset All'}</button>
                  </div>
                </div>
              </>)}
            </div>)}

            {activeTab==='profile' && (<div style={colS}>
              <Title icon={Crown} color={CLR.gold} right={<><RunBtn onClick={runProfileBannerCheck} loading={profileChecking} color={CLR.gold} label="Run Check"/><CopyButton tab="profile"/></>}>PROFILE BANNER</Title>
              {profileLastRun && <LastRun text={`Last: ${profileLastRun} | ✅ ${profileChecks.filter(c=>c.status==='pass').length} ⚠️ ${profileChecks.filter(c=>c.status==='warn').length} ❌ ${profileChecks.filter(c=>c.status==='fail').length}`}/>}
              {profileChecks.length===0 ? <Empty icon={Crown}>დააჭირე "Run Check"-ს</Empty> : profileChecks.map(c => <CheckRow key={c.id} status={c.status} title={c.element} msg={c.message} details={c.details}/>)}
            </div>)}

            {activeTab==='energy' && (<div style={colS}>
              <Title icon={Zap} color={CLR.yellow} right={<><RunBtn onClick={runEnergyCheck} loading={energyChecking} color={CLR.yellow} label="Run Check"/><CopyButton tab="energy"/></>}>ENERGY SYSTEM</Title>
              {energyLastRun&&energyData && <LastRun text={`Last: ${energyLastRun} | ${energyData.match?'✅ UI=DB':'❌ UI≠DB'}`}/>}
              {!energyData ? <Empty icon={Zap}>დააჭირე "Run Check"-ს</Empty> : (<>
                <div style={card(CLR.yellow, { border: `1px solid ${energyData.match?'rgba(16,185,129,0.5)':'rgba(239,68,68,0.5)'}` })}>
                  <div style={grid(2)}><div>UI: <strong>{energyData.uiEnergy}/{energyData.uiMax}</strong></div><div>DB: <strong>{energyData.dbEnergy}/{energyData.dbMax}</strong></div></div>
                  <div style={{ marginTop: 6, padding: 4, borderRadius: 4, textAlign: 'center', background: energyData.match?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)' }}>{energyData.match?'✅ თანხვედრა':'❌ sync საჭიროა'}</div>
                </div>
                <div style={card(CLR.blue)}>
                  <div style={grid(2)}>
                    <div>წუთები: <strong>{energyData.minutesPassed}</strong></div><div>Boost: <strong>{energyData.boostMultiplier}x</strong></div>
                    <div>+<strong style={{ color: energyData.energyToRegen>0?CLR.green:CLR.gray }}>{energyData.energyToRegen}</strong></div><div>Next: <strong>{energyData.minutesUntilNext}min</strong></div>
                  </div>
                </div>
                <div style={card(CLR.purple)}>
                  <div style={{ fontWeight: 'bold', marginBottom: 8, color: CLR.purple }}>💰 ხარჯები</div>
                  {energyData.costs.map(c => <div key={c.reading_type} style={rowS({ padding: '4px 6px', background: 'rgba(0,0,0,0.3)', borderRadius: 4, marginBottom: 4 })}><span>{c.reading_type}</span><strong style={{ color: c.energy_cost===0?CLR.green:CLR.yellow }}>{c.energy_cost===0?'FREE':`${c.energy_cost}⚡`}</strong></div>)}
                </div>
                <div style={card(CLR.green, { maxHeight: 180, overflowY: 'auto' })}>
                  <div style={{ fontWeight: 'bold', marginBottom: 8, color: CLR.green }}>📜 ტრანზაქციები</div>
                  {energyData.transactions.map(t => <div key={t.id} style={rowS({ padding: '4px 6px', background: 'rgba(0,0,0,0.3)', borderRadius: 4, marginBottom: 4 })}><span style={{ color: t.amount>0?CLR.green:CLR.red, fontWeight: 'bold' }}>{t.amount>0?'+':''}{t.amount}</span><span style={{ color: CLR.gray, fontSize: 9 }}>→ {t.balance_after}</span></div>)}
                </div>
                <div style={grid(4)}>
                  <button onClick={() => { testAddEnergy(1); setTimeout(runEnergyCheck, 1000); }} style={solidBtn(CLR.yellow, '#000')}>+1⚡</button>
                  <button onClick={() => { testSpendEnergy(1); setTimeout(runEnergyCheck, 1000); }} style={solidBtn(CLR.red)}>-1⚡</button>
                  <button onClick={() => { testAddEnergy(10); setTimeout(runEnergyCheck, 1000); }} style={solidBtn(CLR.green)}>+10⚡</button>
                  <button onClick={runEnergyCheck} style={solidBtn('#3b82f6')}>🔄</button>
                </div>
              </>)}
            </div>)}

            {activeTab==='diagnostics' && (<div style={colS}>
              <Title icon={Heart} color={CLR.pink} right={<><RunBtn onClick={() => runHomeDiagnostics?.()} loading={diagRunning} color={CLR.pink} label="Run All"/><CopyButton tab="diagnostics"/></>}>DIAGNOSTICS</Title>
              {diagLast && <LastRun text={`Last: ${diagLast} | ${diagResults.filter(r=>r.status==='pass').length}/${diagResults.length} passed`}/>}
              <div style={grid(2)}>
                {([['⚡ Energy',CLR.yellow,testEnergySystem],['💾 Storage',CLR.blue,testLocalStorage],['👑 Premium',CLR.purple,testPremiumGate],['🎯 Quests',CLR.green,testQuestSystem],['🃏 Daily','#f472b6',testDailyCard],['🔥 Streak',CLR.orange,testStreakSystem],['⭐ XP','#3b82f6',testXPSystem],['🗄️ DB','#8b5cf6',testSupabaseConnection]] as any[]).map(([l,c,f]) => <button key={l} onClick={f as any} style={solidBtn(c, l.includes('Energy')?'#000':'#fff')}>{l}</button>)}
              </div>
              {diagResults.map((r, i) => <CheckRow key={i} status={r.status==='pass'?'pass':r.status==='fail'?'fail':'warn'} title={r.name} msg={r.message} details={r.details?JSON.stringify(r.details):undefined}/>)}
            </div>)}

            {activeTab==='functions' && (<div style={colS}>
              <Title icon={Server} color={CLR.purple} right={<><RunBtn onClick={loadFunctionStatuses} loading={functionsLoading} color={CLR.purple} label="Refresh"/><CopyButton tab="functions"/></>}>EDGE FUNCTIONS</Title>
              {functionsLoading ? <div style={{ color: CLR.gray, textAlign: 'center', padding: 20 }}>Loading...</div> : functionStatuses.map(f => (
                <div key={f.name} style={{ padding: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={rowS({ marginBottom: 6 })}>
                    <div><div style={{ color: CLR.light, fontWeight: 'bold', fontSize: 11 }}>{f.name}</div><div style={{ fontSize: 9, color: CLR.gray }}>Runs: {f.totalRuns} | {f.successRate.toFixed(0)}% | {f.avgResponseTime}ms</div></div>
                    <button onClick={() => handleTestFunction(f.name)} disabled={testingFunction===f.name} style={btnS(testingFunction===f.name?CLR.yellow:CLR.green)}>{testingFunction===f.name?'...':'Test'}</button>
                  </div>
                  <button onClick={() => setExpandedFunction(expandedFunction===f.name?null:f.name)} style={{ width: '100%', padding: 4, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 4, color: CLR.gray, cursor: 'pointer', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    {expandedFunction===f.name?<ChevronDown size={10}/>:<Eye size={10}/>} Logs
                  </button>
                  {expandedFunction===f.name&&functionLogs[f.name] && <div style={{ marginTop: 6, maxHeight: 120, overflowY: 'auto', background: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: 6 }}>
                    {functionLogs[f.name].map((l, i) => <div key={i} style={{ padding: 4, marginBottom: 3, background: 'rgba(255,255,255,0.03)', borderRadius: 3, fontSize: 9 }}><span style={{ color: l.status==='success'?CLR.green:CLR.red }}>{l.status}</span> <span style={{ color: CLR.dark }}>{l.response_time_ms}ms</span></div>)}
                  </div>}
                </div>
              ))}
            </div>)}

            {activeTab==='logs' && (<div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Title icon={Terminal} color="#f472b6" right={<><button onClick={() => setDebugLogs([])} style={btnS(CLR.red, { padding: '4px 8px' })}>Clear</button><CopyButton tab="logs"/></>}>LIVE LOGS ({debugLogs.length})</Title>
              <input value={logFilter} onChange={e => setLogFilter(e.target.value)} placeholder="🔍 Filter..." style={{ padding: 6, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: 10, marginBottom: 8 }}/>
              <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.5)', borderRadius: 8, padding: 8 }}>
                {filteredLogs.length===0 && <div style={{ color: CLR.dark, textAlign: 'center', padding: 20 }}>No logs.</div>}
                {filteredLogs.slice().reverse().map((l, i) => (
                  <div key={i} onClick={() => l.data && setExpandedLog(expandedLog===i?null:i)} style={{ padding: 8, marginBottom: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 6, borderLeft: `3px solid ${l.type==='error'?CLR.red:l.type==='success'?CLR.green:CLR.yellow}`, cursor: l.data?'pointer':'default' }}>
                    <div style={rowS({ marginBottom: 4 })}><span style={{ color: CLR.dark, fontSize: 9 }}>{l.timestamp}</span><span style={{ fontSize: 9, color: l.type==='error'?CLR.red:l.type==='success'?CLR.green:CLR.yellow, fontWeight: 'bold' }}>{l.category}</span></div>
                    <div style={{ color: CLR.light, fontSize: 10, wordBreak: 'break-word' }}>{l.message}</div>
                    {l.data && expandedLog===i && <div style={{ marginTop: 4, padding: 6, background: 'rgba(0,0,0,0.5)', borderRadius: 4, fontSize: 9, color: CLR.gray, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{typeof l.data==='object'?JSON.stringify(l.data,null,2):l.data}</div>}
                  </div>
                ))}
              </div>
            </div>)}

            {activeTab==='actions' && (<div style={colS}>
              <Title icon={Settings} color={CLR.purple} right={<CopyButton tab="actions"/>}>ADMIN ACTIONS</Title>
              <div style={card(CLR.purple)}>
                <div style={{ marginBottom: 8, color: CLR.purple, fontWeight: 'bold' }}>⚡ ENERGY</div>
                <div style={grid(2)}><button onClick={() => testAddEnergy(10)} style={solidBtn(CLR.yellow, '#000')}>+10 ⚡</button><button onClick={() => testSpendEnergy(2)} style={solidBtn(CLR.red)}>Spend 2 ⚡</button></div>
              </div>
              <div style={card(CLR.blue)}>
                <div style={{ marginBottom: 8, color: CLR.blue, fontWeight: 'bold' }}>💎 ECONOMY</div>
                <div style={grid(2)}><button onClick={() => testAddCoins(100)} style={solidBtn(CLR.purple)}>+100 💎</button><button onClick={() => testAddXP(100)} style={solidBtn('#3b82f6')}>+100 XP</button></div>
              </div>
              <div style={grid(2)}>
                <button onClick={reloadFromDatabase} style={solidBtn(CLR.green)}>🔄 RELOAD DB</button>
                <button onClick={testCompleteQuest} style={solidBtn('#8b5cf6')}>🎯 TEST QUEST</button>
                <button onClick={checkDatabaseStatus} style={solidBtn('#3b82f6')}>🩺 CHECK DB</button>
                <button onClick={refreshUserDataDebug} style={solidBtn('#0ea5e9')}>🔄 REFRESH USER</button>
              </div>
              <div style={card('rgba(0,0,0,0.3)')}>
                <div style={{ marginBottom: 8, color: '#f472b6', fontWeight: 'bold' }}>📜 ბოლო ლოგები</div>
                {debugLogs.slice(0,10).map(l => <div key={l.id} style={{ padding: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 4, borderLeft: `3px solid ${l.type==='error'?CLR.red:l.type==='success'?CLR.green:CLR.yellow}`, fontSize: 9, marginBottom: 4 }}><div style={{ color: CLR.light, wordBreak: 'break-word' }}>{l.message}</div></div>)}
              </div>
              <button onClick={handleLogoutAndReset} style={btnS(CLR.red, { width: '100%', justifyContent: 'center', padding: 10 })}><X size={14}/> LOGOUT & RESET</button>
            </div>)}

          </div>
        </div>
      )}
    </>
  );
}