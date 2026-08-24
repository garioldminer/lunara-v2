import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useHoroscopeQuery } from '../hooks/useHoroscopeQuery';
import { useUser } from '../context/UserContext';
import { ZODIAC_SIGNS, BACKGROUND_IMAGE } from '../data/zodiacData';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Moon, RotateCcw } from 'lucide-react';
import SignSelectionScreen from './SignSelectionScreen';
import HoroscopeLayoutDebugger from './HoroscopeLayoutDebugger';
import { ScreenLoader } from './ScreenLoader';
import { logReading } from '../lib/adminService';
import { trackQuestProgress } from '../lib/questService';
import { supabase } from '../lib/supabase';
import {
  TabType, ADMIN_USER_ID, ERROR_MESSAGES, TAB_HERO_FALLBACK,
  safeString, safeExtractTransit, fixHoroscopeText, getMoonDescription
} from './horoscope/horoscopeData';
import { useHoroscopeDebug } from './horoscope/useHoroscopeDebug';
import { ToastNotification, DebugPanel } from './horoscope/DebugPanel';
import { HeroBanner, EnergyGrid, MoonCard, PredictionsGrid } from './horoscope/HoroscopeSections';
import { PredictionModal, ShareModal, ReadFullModal } from './horoscope/HoroscopeModals';
import './HoroscopeScreen.css';

const ZODIAC_SIGNS_LIST = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

interface Props { onNavigate?: (screen: string) => void; }

export default function HoroscopeScreen({ onNavigate }: Props) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReadFullOpen, setIsReadFullOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showHoroDebug, setShowHoroDebug] = useState(false);

  const [showUnifiedDebug, setShowUnifiedDebug] = useState(false);
  const [unifiedTab, setUnifiedTab] = useState<'status' | 'summaries' | 'layout' | 'logs' | 'raw'>('status');
  const [statusData, setStatusData] = useState<any>({});
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusGenerating, setStatusGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [expandedSign, setExpandedSign] = useState<string | null>(null);

  const [summariesTab, setSummariesTab] = useState<'weekly' | 'monthly'>('weekly');
  const [summariesData, setSummariesData] = useState<{ weekly: any; monthly: any }>({ weekly: {}, monthly: {} });
  const [summariesLoading, setSummariesLoading] = useState(false);
  const [summariesGenerating, setSummariesGenerating] = useState(false);
  const [summariesMessage, setSummariesMessage] = useState<string>('');

  const ADMIN_IDS = [
    ADMIN_USER_ID,
    'c9dbe3be-5c02-4034-8bfd-1d693eb02754',
    '1436756556',
  ];
  const isAdmin = 
    (user as any)?.is_admin === true || 
    ADMIN_IDS.includes(user?.id || '') ||
    ADMIN_IDS.includes(String((user as any)?.telegram_id || ''));
  
  const userSign = user?.sun_sign?.toLowerCase() || '';

  const heroLeftRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const loggedReadingsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  const { horoscope, loading, refreshing, error, refetch } = useHoroscopeQuery(
    user?.id || '',
    user?.sun_sign || '',
    activeTab
  );

  const debug = useHoroscopeDebug(isAdmin, user, horoscope, loading, error, activeTab);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => setToast({ message, type });

  const fetchStatus = async () => {
    if (!supabase) return;
    setStatusLoading(true);
    const today = new Date();
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    try {
      const { data, error } = await supabase
        .from('daily_horoscopes')
        .select('zodiac_sign, date, created_at, ai_model_used, tokens_used, generation_time_ms, general_prediction, love_prediction, career_prediction, lucky_color, lucky_number, affirmation')
        .in('date', dates)
        .order('date', { ascending: false });

      if (error) throw error;

      const grouped: any = {};
      ZODIAC_SIGNS_LIST.forEach(s => { grouped[s] = []; });
      (data || []).forEach((r: any) => {
        const age = Math.floor((today.getTime() - new Date(r.date + 'T00:00:00').getTime()) / (1000*60*60*24));
        grouped[r.zodiac_sign]?.push({
          date: r.date,
          age,
          createdAt: r.created_at,
          model: r.ai_model_used,
          tokens: r.tokens_used,
          genMs: r.generation_time_ms,
          preview: (r.general_prediction || '').substring(0, 80),
          love: (r.love_prediction || '').substring(0, 60),
          career: (r.career_prediction || '').substring(0, 60),
          luckyColor: r.lucky_color,
          luckyNumber: r.lucky_number,
          affirmation: (r.affirmation || '').substring(0, 60)
        });
      });
      Object.keys(grouped).forEach(s => grouped[s].sort((a: any, b: any) => b.date.localeCompare(a.date)));
      setStatusData(grouped);
    } catch (e: any) { setStatusMessage(`❌ ${e.message}`); }
    setStatusLoading(false);
  };

  const fetchSummaries = async () => {
    if (!supabase) return;
    setSummariesLoading(true);
    try {
      const weekStart = (() => {
        const d = new Date();
        const day = d.getDay();
        const diff = day === 0 ? 6 : day - 1;
        d.setDate(d.getDate() - diff);
        return d.toISOString().split('T')[0];
      })();
      const monthStart = (() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
      })();

      const [weeklyRes, monthlyRes] = await Promise.all([
        supabase.from('weekly_summaries').select('*').eq('week_start', weekStart).order('zodiac_sign'),
        supabase.from('monthly_summaries').select('*').eq('month_start', monthStart).order('zodiac_sign')
      ]);

      const weeklyGrouped: any = {};
      const monthlyGrouped: any = {};
      ZODIAC_SIGNS_LIST.forEach(s => { weeklyGrouped[s] = null; monthlyGrouped[s] = null; });
      
      (weeklyRes.data || []).forEach((r: any) => { weeklyGrouped[r.zodiac_sign] = r; });
      (monthlyRes.data || []).forEach((r: any) => { monthlyGrouped[r.zodiac_sign] = r; });

      setSummariesData({ weekly: weeklyGrouped, monthly: monthlyGrouped });
      setSummariesMessage(`✅ Loaded ${Object.values(weeklyGrouped).filter(Boolean).length}/12 weekly, ${Object.values(monthlyGrouped).filter(Boolean).length}/12 monthly`);
    } catch (e: any) {
      setSummariesMessage(`❌ ${e.message}`);
    }
    setSummariesLoading(false);
  };

  const triggerSummaryGeneration = async (type: 'weekly' | 'monthly') => {
    setSummariesGenerating(true);
    setSummariesMessage(`⚡ Triggering ${type}...`);
    try {
      const url = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://eutavdhcxpfhpfsyaskb.supabase.co';
      const res = await fetch(`${url}/functions/v1/generate-summaries?type=${type}`, { method: 'POST' });
      const r = await res.json();
      setSummariesMessage(r.success ? `✅ ${r.sign} (${r.progress})` : `❌ ${r.error || r.reason || 'Unknown'}`);
      setTimeout(fetchSummaries, 2000);
    } catch (e: any) {
      setSummariesMessage(`❌ ${e.message}`);
    }
    setSummariesGenerating(false);
  };

  const copySummaries = () => {
    const data = {
      timestamp: new Date().toISOString(),
      weekly: summariesData.weekly,
      monthly: summariesData.monthly
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    showToast('Summaries data copied! 📋', 'success');
  };

  const triggerGeneration = async () => {
    setStatusGenerating(true);
    setStatusMessage('⚡ Triggering...');
    try {
      const url = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://eutavdhcxpfhpfsyaskb.supabase.co';
      const key = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${url}/functions/v1/generate-all-horoscopes`, {
        method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
      });
      const r = await res.json();
      setStatusMessage(r.success ? `✅ ${r.sign} (${r.progress})` : `❌ ${r.error || 'Unknown error'}`);
      setTimeout(fetchStatus, 1500);
    } catch (e: any) { setStatusMessage(`❌ ${e.message}`); }
    setStatusGenerating(false);
  };

  const copyStatus = () => {
    const data = {
      timestamp: new Date().toISOString(),
      today: new Date().toISOString().split('T')[0],
      summary: {
        fresh: ZODIAC_SIGNS_LIST.filter(s => (statusData[s] || [])[0]?.age === 0).length,
        old: ZODIAC_SIGNS_LIST.filter(s => { const l = (statusData[s] || [])[0]; return !!l && l.age > 0; }).length,
        missing: ZODIAC_SIGNS_LIST.filter(s => (statusData[s] || []).length === 0).length
      },
      signs: statusData
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    showToast('Status data copied! 📋', 'success');
  };

  const copyLayout = () => {
    const data = {
      timestamp: new Date().toISOString(),
      message: 'Layout debugger - use 📐 button to open full layout inspector'
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    showToast('Layout info copied! 📋', 'success');
  };

  const copyLogs = () => {
    const data = {
      timestamp: new Date().toISOString(),
      logs: debug.debugLogs,
      metrics: debug.performanceMetrics,
      diagnostics: debug.diagnostics
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    showToast('Debug logs copied! 📋', 'success');
  };

  const copyRaw = () => {
    const data = {
      timestamp: new Date().toISOString(),
      userSign,
      activeTab,
      horoscope
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    showToast('Raw data copied! 📋', 'success');
  };

  useEffect(() => {
    if (showUnifiedDebug && unifiedTab === 'status') fetchStatus();
  }, [showUnifiedDebug, unifiedTab]);

  useEffect(() => {
    if (showUnifiedDebug && unifiedTab === 'summaries') fetchSummaries();
  }, [showUnifiedDebug, unifiedTab]);

  useEffect(() => {
    const fit = () => {
      const left = heroLeftRef.current;
      const subtitle = subtitleRef.current;
      const title = titleRef.current;
      if (!left) return;
      const avail = left.clientWidth;
      if (subtitle) {
        subtitle.style.fontSize = '';
        subtitle.style.whiteSpace = 'nowrap';
        let size = parseFloat(getComputedStyle(subtitle).fontSize);
        while (subtitle.scrollWidth > avail && size > 5) { size -= 0.5; subtitle.style.fontSize = `${size}px`; }
      }
      if (title) {
        title.style.fontSize = '';
        title.style.whiteSpace = 'nowrap';
        const titleSpan = title.querySelector('span') as HTMLElement;
        let size = parseFloat(getComputedStyle(title).fontSize);
        const checkEl = titleSpan || title;
        while (checkEl.scrollWidth > avail && size > 8) {
          size -= 0.5;
          title.style.fontSize = `${size}px`;
          if (titleSpan) titleSpan.style.fontSize = `${size}px`;
        }
      }
    };
    fit();
    const t1 = setTimeout(fit, 300);
    const t2 = setTimeout(fit, 800);
    const t3 = setTimeout(fit, 1500);
    window.addEventListener('resize', fit);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); window.removeEventListener('resize', fit); };
  }, [activeTab, horoscope]);

  useEffect(() => {
    const apply = () => {
      const nav = document.querySelector('.bottom-nav-container') as HTMLElement;
      if (nav) {
        const inner = (nav.querySelector('.bottom-nav') || nav.firstElementChild || nav) as HTMLElement;
        document.documentElement.style.setProperty('--nav-inset', `${Math.round(inner.getBoundingClientRect().left)}px`);
      }
    };
    apply();
    const t1 = setTimeout(apply, 300);
    const t2 = setTimeout(apply, 800);
    window.addEventListener('resize', apply);
    return () => { clearTimeout(t1); clearTimeout(t2); window.removeEventListener('resize', apply); };
  }, []);

  useEffect(() => {
    if (!user || !horoscope || loading || !userSign) return;
    if (!isInitialLoadRef.current) return;
    const readingKey = `${user.id}-${activeTab}-${horoscope.date || horoscope.week_start || horoscope.month_start}`;
    if (loggedReadingsRef.current.has(readingKey)) return;

    logReading(user.id, 'horoscope', [], `${activeTab} - ${userSign} - ${horoscope.date || horoscope.week_start || horoscope.month_start}`)
      .then(() => {
        loggedReadingsRef.current.add(readingKey);
        isInitialLoadRef.current = false;
        if (isAdmin) debug.addLog('success', 'READING', '✅ Horoscope reading logged');
        trackQuestProgress(user.id, 'check_horoscope', 1)
          .then(reward => { if (reward) console.log(`🎉 Quest Completed! Reward: ${reward.coins} coins, ${reward.xp} XP`); })
          .catch(err => console.error('❌ [Quest] Error updating horoscope quest:', err));
      })
      .catch((readingError: any) => { if (isAdmin) debug.addLog('error', 'READING', '❌ Failed to log reading', readingError); });
  }, [horoscope, loading, user, activeTab, userSign]);

  if (!user?.sun_sign) return <SignSelectionScreen onNavigate={onNavigate} />;

  const todayStr = new Date().toISOString().split('T')[0];
  const freshCount = ZODIAC_SIGNS_LIST.filter(s => (statusData[s] || [])[0]?.age === 0).length;
  const oldCount = ZODIAC_SIGNS_LIST.filter(s => { const l = (statusData[s] || [])[0]; return !!l && l.age > 0; }).length;
  const missingCount = ZODIAC_SIGNS_LIST.filter(s => (statusData[s] || []).length === 0).length;
  const missingSigns = ZODIAC_SIGNS_LIST.filter(s => (statusData[s] || []).length === 0);

  return (
    <ScreenLoader isLoading={loading && !horoscope} context="horoscope">
      {error && !horoscope ? (
        <div className="horoscope-screen">
          <div className="cosmic-background" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }} />
          <div className="aurora-layer" />
          <div className="horoscope-error">
            <motion.div className="error-icon" animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5 }}>
              <Moon size={48} className="error-moon" />
            </motion.div>
            <p className="error-message">{ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)]}</p>
            <motion.button className="retry-button" onClick={refetch} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <RotateCcw size={16} /><span>Try Again</span>
            </motion.button>
          </div>
        </div>
      ) : !horoscope ? (
        <div className="horoscope-screen">
          <div className="cosmic-background" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }} />
          <div className="aurora-layer" />
          <div className="horoscope-empty">
            <Moon size={48} className="empty-moon" />
            <p>The cosmos has no message for you today.</p>
          </div>
        </div>
      ) : (
        <HoroscopeContent
          userSign={userSign}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          horoscope={horoscope}
          refreshing={refreshing}
          onNavigate={onNavigate}
          heroLeftRef={heroLeftRef}
          subtitleRef={subtitleRef}
          titleRef={titleRef}
          openModal={openModal}
          setOpenModal={setOpenModal}
          isShareModalOpen={isShareModalOpen}
          setIsShareModalOpen={setIsShareModalOpen}
          isReadFullOpen={isReadFullOpen}
          setIsReadFullOpen={setIsReadFullOpen}
          toast={toast}
          setToast={setToast}
          showToast={showToast}
        />
      )}

      {isAdmin && createPortal(
        <button
          onClick={() => { setShowUnifiedDebug(true); fetchStatus(); }}
          style={{
            position: 'fixed',
            top: '50%',
            right: '10px',
            transform: 'translateY(-50%)',
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #60a5fa 0%, #D9B66F 50%, #60a5fa 100%)',
            border: '3px solid #fff',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 2147483647,
            boxShadow: '0 6px 24px rgba(96,165,250,0.7), 0 6px 24px rgba(217,182,111,0.5)',
          }}
          title="Unified Horoscope Debugger"
        >
          <Moon size={24} strokeWidth={2.5} />
        </button>,
        document.body
      )}

      {isAdmin && showUnifiedDebug && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowUnifiedDebug(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 99998,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #1a1410, #0f0a06)',
              border: '2px solid #D9B66F',
              borderRadius: '16px',
              width: '100%', maxWidth: '900px', maxHeight: '90vh',
              display: 'flex', flexDirection: 'column',
              color: '#fff',
              fontFamily: 'system-ui, sans-serif',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(217,182,111,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#D9B66F', fontWeight: 'bold' }}>🌙 Horoscope Debugger</h2>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#888' }}>Today: {todayStr}</p>
              </div>
              <button onClick={() => setShowUnifiedDebug(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid rgba(217,182,111,0.2)' }}>
              {([
                { id: 'status', label: '📊 Status' },
                { id: 'summaries', label: '📅 Summaries' },
                { id: 'layout', label: '📐 Layout' },
                { id: 'logs', label: '📝 Logs' },
                { id: 'raw', label: '🔍 Raw' }
              ] as const).map(t => (
                <button key={t.id} onClick={() => setUnifiedTab(t.id)} style={{
                  flex: 1, padding: '12px', border: 'none', cursor: 'pointer',
                  background: unifiedTab === t.id ? 'rgba(217,182,111,0.15)' : 'transparent',
                  color: unifiedTab === t.id ? '#D9B66F' : '#888',
                  fontSize: '11px', fontWeight: unifiedTab === t.id ? 'bold' : 'normal',
                  borderBottom: unifiedTab === t.id ? '2px solid #D9B66F' : '2px solid transparent'
                }}>{t.label}</button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {unifiedTab === 'status' && (
                <div>
                  <div style={{ padding: '10px 20px', display: 'flex', gap: '14px', fontSize: '12px', borderBottom: '1px solid rgba(217,182,111,0.15)', flexWrap: 'wrap', background: 'rgba(0,0,0,0.3)' }}>
                    <span><span style={{ color: '#10b981' }}>●</span> Fresh today: <b style={{ color: '#10b981' }}>{freshCount}/12</b></span>
                    <span><span style={{ color: '#f59e0b' }}>●</span> Old (fallback): <b style={{ color: '#f59e0b' }}>{oldCount}</b></span>
                    <span><span style={{ color: '#ef4444' }}>●</span> Missing: <b style={{ color: '#ef4444' }}>{missingCount}</b></span>
                    {missingSigns.length > 0 && missingSigns.length < 12 && (
                      <span style={{ color: '#888', fontSize: '10px' }}>
                        Next: <b style={{ color: '#60a5fa' }}>{missingSigns[0]}</b>
                      </span>
                    )}
                  </div>

                  <div style={{ padding: '12px 20px', display: 'flex', gap: '8px' }}>
                    <button onClick={fetchStatus} disabled={statusLoading} style={{
                      flex: 1, padding: '10px', background: 'rgba(217,182,111,0.15)',
                      border: '1px solid #D9B66F', color: '#D9B66F', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
                    }}>{statusLoading ? 'Loading...' : '🔄 Refresh'}</button>
                    <button onClick={triggerGeneration} disabled={statusGenerating} style={{
                      flex: 1, padding: '10px',
                      background: 'linear-gradient(135deg, #D9B66F, #F4D47C)',
                      border: 'none', color: '#0a0600', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
                    }}>{statusGenerating ? 'Generating...' : '⚡ Generate Next'}</button>
                    <button onClick={copyStatus} style={{
                      padding: '10px 16px',
                      background: 'rgba(96,165,250,0.15)',
                      border: '1px solid #60a5fa', color: '#60a5fa', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
                    }}>📋 Copy</button>
                  </div>

                  {statusMessage && (
                    <div style={{
                      padding: '8px 20px', fontSize: '12px',
                      background: statusMessage.startsWith('✅') ? 'rgba(16,185,129,0.15)' : 'rgba(251,191,36,0.15)',
                      color: statusMessage.startsWith('✅') ? '#10b981' : '#fbbf24'
                    }}>{statusMessage}</div>
                  )}

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(217,182,111,0.3)', background: 'rgba(0,0,0,0.2)' }}>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#D9B66F' }}>Sign</th>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#D9B66F' }}>Latest</th>
                        <th style={{ padding: '8px', textAlign: 'center', color: '#D9B66F' }}>Age</th>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#D9B66F' }}>Created At</th>
                        <th style={{ padding: '8px', textAlign: 'center', color: '#D9B66F' }}>Model</th>
                        <th style={{ padding: '8px', textAlign: 'right', color: '#D9B66F' }}>Tokens</th>
                        <th style={{ padding: '8px', textAlign: 'right', color: '#D9B66F' }}>Gen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ZODIAC_SIGNS_LIST.map(sign => {
                        const entries = statusData[sign] || [];
                        const latest = entries[0];
                        const ageColor = !latest ? '#ef4444' : latest.age === 0 ? '#10b981' : latest.age <= 2 ? '#f59e0b' : '#ef4444';
                        const isExpanded = expandedSign === sign;
                        return (
                          <>
                            <tr
                              key={sign + '-row'}
                              onClick={() => setExpandedSign(isExpanded ? null : sign)}
                              style={{
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                cursor: 'pointer',
                                background: isExpanded ? 'rgba(217,182,111,0.08)' : 'transparent',
                                transition: 'background 0.15s'
                              }}
                            >
                              <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>
                                {sign}
                                {entries.length > 1 && (
                                  <span style={{ color: '#888', fontSize: '9px', marginLeft: '4px' }}>
                                    ({entries.length})
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '10px 8px', color: latest ? '#ddd' : '#666', fontSize: '10px' }}>
                                {latest ? latest.date : <em>missing</em>}
                              </td>
                              <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                                <span style={{ color: ageColor, fontWeight: 'bold' }}>
                                  {latest ? `${latest.age}d` : '—'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 8px', color: '#aaa', fontSize: '10px' }}>
                                {latest?.createdAt ? (
                                  <span title={latest.createdAt}>
                                    {new Date(latest.createdAt).toLocaleString('en-US', {
                                      month: 'short', day: 'numeric',
                                      hour: '2-digit', minute: '2-digit',
                                      hour12: false
                                    })}
                                  </span>
                                ) : '—'}
                              </td>
                              <td style={{ padding: '10px 8px', textAlign: 'center', color: '#aaa', fontSize: '10px' }}>
                                {latest?.model || '—'}
                              </td>
                              <td style={{ padding: '10px 8px', textAlign: 'right', color: '#aaa' }}>
                                {latest?.tokens || '—'}
                              </td>
                              <td style={{ padding: '10px 8px', textAlign: 'right', color: '#aaa', fontSize: '10px' }}>
                                {latest?.genMs ? `${(latest.genMs / 1000).toFixed(1)}s` : '—'}
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr key={sign + '-expand'}>
                                <td colSpan={7} style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.5)', fontSize: '10px' }}>
                                  {entries.length === 0 ? (
                                    <div style={{ color: '#666', padding: '8px 0' }}>No data in last 7 days</div>
                                  ) : (
                                    <div>
                                      <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
                                        <div style={{ color: '#D9B66F', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>
                                          📋 Current Content ({latest.date})
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px 10px' }}>
                                          <span style={{ color: '#888' }}>Color:</span>
                                          <span style={{ color: '#ddd' }}>{latest.luckyColor || <em style={{ color: '#666' }}>missing</em>}</span>
                                          <span style={{ color: '#888' }}>Number:</span>
                                          <span style={{ color: '#ddd' }}>{latest.luckyNumber || <em style={{ color: '#666' }}>missing</em>}</span>
                                          <span style={{ color: '#888' }}>General:</span>
                                          <span style={{ color: '#bbb', fontStyle: 'italic' }}>"{latest.preview}..."</span>
                                          <span style={{ color: '#888' }}>Love:</span>
                                          <span style={{ color: '#bbb', fontStyle: 'italic' }}>"{latest.love || '—'}..."</span>
                                          <span style={{ color: '#888' }}>Career:</span>
                                          <span style={{ color: '#bbb', fontStyle: 'italic' }}>"{latest.career || '—'}..."</span>
                                          <span style={{ color: '#888' }}>Affirmation:</span>
                                          <span style={{ color: '#bbb', fontStyle: 'italic' }}>"{latest.affirmation || '—'}..."</span>
                                        </div>
                                      </div>
                                      <div style={{ color: '#888', fontSize: '10px', marginBottom: '6px' }}>
                                        📜 All versions in last 7 days ({entries.length}):
                                      </div>
                                      {entries.map((e: any, i: number) => (
                                        <div key={i} style={{ padding: '6px 0', borderBottom: i < entries.length - 1 ? '1px dashed rgba(255,255,255,0.08)' : 'none' }}>
                                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '10px' }}>
                                            <span style={{ color: '#D9B66F', fontWeight: 'bold' }}>{e.date}</span>
                                            <span style={{ color: e.age === 0 ? '#10b981' : e.age <= 2 ? '#f59e0b' : '#ef4444' }}>
                                              age {e.age}d
                                            </span>
                                            <span style={{ color: '#aaa' }}>{e.model}</span>
                                            <span style={{ color: '#aaa' }}>{e.tokens} tok</span>
                                            <span style={{ color: '#888' }}>gen: {e.genMs ? `${(e.genMs / 1000).toFixed(1)}s` : '—'}</span>
                                          </div>
                                          <div style={{ color: '#777', marginTop: '2px', fontSize: '9px' }}>
                                            created: {e.createdAt ? new Date(e.createdAt).toLocaleString() : '—'}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {unifiedTab === 'summaries' && (
                <div>
                  <div style={{ display: 'flex', borderBottom: '1px solid rgba(217,182,111,0.2)', background: 'rgba(0,0,0,0.3)' }}>
                    <button onClick={() => setSummariesTab('weekly')} style={{
                      flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
                      background: summariesTab === 'weekly' ? 'rgba(217,182,111,0.15)' : 'transparent',
                      color: summariesTab === 'weekly' ? '#D9B66F' : '#888',
                      fontSize: '12px', fontWeight: summariesTab === 'weekly' ? 'bold' : 'normal'
                    }}>📅 WEEKLY</button>
                    <button onClick={() => setSummariesTab('monthly')} style={{
                      flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
                      background: summariesTab === 'monthly' ? 'rgba(217,182,111,0.15)' : 'transparent',
                      color: summariesTab === 'monthly' ? '#D9B66F' : '#888',
                      fontSize: '12px', fontWeight: summariesTab === 'monthly' ? 'bold' : 'normal'
                    }}>🗓️ MONTHLY</button>
                  </div>

                  {(() => {
                    const current = summariesData[summariesTab];
                    const count = Object.values(current).filter(Boolean).length;
                    const missing = 12 - count;
                    return (
                      <div style={{ padding: '10px 20px', display: 'flex', gap: '14px', fontSize: '12px', borderBottom: '1px solid rgba(217,182,111,0.15)', flexWrap: 'wrap', background: 'rgba(0,0,0,0.3)' }}>
                        <span><span style={{ color: '#10b981' }}>●</span> Generated: <b style={{ color: '#10b981' }}>{count}/12</b></span>
                        <span><span style={{ color: '#ef4444' }}>●</span> Missing: <b style={{ color: '#ef4444' }}>{missing}</b></span>
                      </div>
                    );
                  })()}

                  <div style={{ padding: '12px 20px', display: 'flex', gap: '8px' }}>
                    <button onClick={fetchSummaries} disabled={summariesLoading} style={{
                      flex: 1, padding: '10px', background: 'rgba(217,182,111,0.15)',
                      border: '1px solid #D9B66F', color: '#D9B66F', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
                    }}>{summariesLoading ? 'Loading...' : '🔄 Refresh'}</button>
                    <button onClick={() => triggerSummaryGeneration(summariesTab)} disabled={summariesGenerating} style={{
                      flex: 1, padding: '10px',
                      background: 'linear-gradient(135deg, #D9B66F, #F4D47C)',
                      border: 'none', color: '#0a0600', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
                    }}>{summariesGenerating ? 'Generating...' : `⚡ Next ${summariesTab === 'weekly' ? 'Weekly' : 'Monthly'}`}</button>
                    <button onClick={copySummaries} style={{
                      padding: '10px 16px',
                      background: 'rgba(96,165,250,0.15)',
                      border: '1px solid #60a5fa', color: '#60a5fa', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
                    }}>📋 Copy</button>
                  </div>

                  {summariesMessage && (
                    <div style={{
                      padding: '8px 20px', fontSize: '12px',
                      background: summariesMessage.startsWith('✅') ? 'rgba(16,185,129,0.15)' : summariesMessage.startsWith('⚡') ? 'rgba(96,165,250,0.15)' : 'rgba(251,191,36,0.15)',
                      color: summariesMessage.startsWith('✅') ? '#10b981' : summariesMessage.startsWith('⚡') ? '#60a5fa' : '#fbbf24'
                    }}>{summariesMessage}</div>
                  )}

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(217,182,111,0.3)', background: 'rgba(0,0,0,0.2)' }}>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#D9B66F' }}>Sign</th>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#D9B66F' }}>Hero</th>
                        <th style={{ padding: '8px', textAlign: 'center', color: '#D9B66F' }}>Energy</th>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#D9B66F' }}>Sources</th>
                        <th style={{ padding: '8px', textAlign: 'right', color: '#D9B66F' }}>Tok</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ZODIAC_SIGNS_LIST.map(sign => {
                        const entry = summariesData[summariesTab][sign];
                        const isExpanded = expandedSign === sign + '-' + summariesTab;
                        return (
                          <>
                            <tr
                              key={sign + '-' + summariesTab + '-row'}
                              onClick={() => setExpandedSign(isExpanded ? null : sign + '-' + summariesTab)}
                              style={{
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                cursor: entry ? 'pointer' : 'default',
                                background: isExpanded ? 'rgba(217,182,111,0.08)' : 'transparent',
                                transition: 'background 0.15s'
                              }}
                            >
                              <td style={{ padding: '10px 8px', fontWeight: 'bold', color: entry ? '#fff' : '#666' }}>
                                {sign}
                              </td>
                              <td style={{ padding: '10px 8px', color: entry ? '#D9B66F' : '#444', fontSize: '10px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {entry ? (entry.hero_description || '—') : <em>missing</em>}
                              </td>
                              <td style={{ padding: '10px 8px', textAlign: 'center', color: '#aaa', fontSize: '10px' }}>
                                {entry ? entry.overall_energy : '—'}
                              </td>
                              <td style={{ padding: '10px 8px', color: '#aaa', fontSize: '10px' }}>
                                {entry && entry.source_dates ? `${entry.source_dates.length}d` : '—'}
                              </td>
                              <td style={{ padding: '10px 8px', textAlign: 'right', color: '#aaa' }}>
                                {entry ? entry.tokens_used : '—'}
                              </td>
                            </tr>
                            {isExpanded && entry && (
                              <tr key={sign + '-' + summariesTab + '-expand'}>
                                <td colSpan={5} style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.5)', fontSize: '11px' }}>
                                  <div style={{ marginBottom: '10px' }}>
                                    <div style={{ color: '#D9B66F', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                                      ✨ Hero: <span style={{ fontWeight: 'normal', color: '#ddd' }}>{entry.hero_description}</span>
                                    </div>
                                    <div style={{ color: '#888', fontSize: '10px', marginBottom: '8px' }}>
                                      📚 Sources: {entry.source_dates?.join(', ')}
                                    </div>
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '4px 10px' }}>
                                    <span style={{ color: '#D9B66F', fontWeight: 'bold' }}>General:</span>
                                    <span style={{ color: '#bbb', fontStyle: 'italic' }}>"{entry.general_summary?.substring(0, 150)}..."</span>
                                    <span style={{ color: '#D9B66F', fontWeight: 'bold' }}>Key Factors:</span>
                                    <span style={{ color: '#bbb', fontStyle: 'italic' }}>"{entry.key_factors?.substring(0, 120)}..."</span>
                                    <span style={{ color: '#E8738A', fontWeight: 'bold' }}>Love:</span>
                                    <span style={{ color: '#bbb', fontStyle: 'italic' }}>"{entry.love_summary?.substring(0, 120)}..."</span>
                                    <span style={{ color: '#7CB3E8', fontWeight: 'bold' }}>Career:</span>
                                    <span style={{ color: '#bbb', fontStyle: 'italic' }}>"{entry.career_summary?.substring(0, 120)}..."</span>
                                    <span style={{ color: '#888' }}>Lucky Color:</span>
                                    <span style={{ color: '#ddd' }}>{entry.lucky_color || '—'}</span>
                                    <span style={{ color: '#888' }}>Lucky Number:</span>
                                    <span style={{ color: '#ddd' }}>{entry.lucky_number || '—'}</span>
                                    <span style={{ color: '#888' }}>Model:</span>
                                    <span style={{ color: '#aaa' }}>{entry.ai_model_used} • {entry.tokens_used} tok • {(entry.generation_time_ms / 1000).toFixed(1)}s</span>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {unifiedTab === 'layout' && (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <p style={{ color: '#aaa', marginBottom: '20px' }}>Inspect hero, sections, and responsive behavior.</p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button onClick={() => { setShowUnifiedDebug(false); setShowHoroDebug(true); }} style={{
                      padding: '14px 32px',
                      background: 'linear-gradient(135deg, #D9B66F, #F4D47C)',
                      border: 'none', color: '#0a0600', borderRadius: '10px',
                      cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
                    }}>📐 Open Layout Debugger</button>
                    <button onClick={copyLayout} style={{
                      padding: '14px 24px',
                      background: 'rgba(96,165,250,0.15)',
                      border: '1px solid #60a5fa', color: '#60a5fa', borderRadius: '10px',
                      cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
                    }}>📋 Copy Info</button>
                  </div>
                </div>
              )}

              {unifiedTab === 'logs' && (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <p style={{ color: '#aaa', marginBottom: '20px' }}>See reading, quest, and performance diagnostics.</p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button onClick={() => { setShowUnifiedDebug(false); debug.setDebugVisible(true); }} style={{
                      padding: '14px 32px',
                      background: 'linear-gradient(135deg, #60a5fa, #93c5fd)',
                      border: 'none', color: '#fff', borderRadius: '10px',
                      cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
                    }}>📝 Open Debug Logs</button>
                    <button onClick={copyLogs} style={{
                      padding: '14px 24px',
                      background: 'rgba(96,165,250,0.15)',
                      border: '1px solid #60a5fa', color: '#60a5fa', borderRadius: '10px',
                      cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
                    }}>📋 Copy Logs</button>
                  </div>
                </div>
              )}

              {unifiedTab === 'raw' && (
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', color: '#D9B66F' }}>
                      Current: {userSign?.toUpperCase() || '—'} • Tab: {activeTab}
                    </h3>
                    <button onClick={copyRaw} style={{
                      padding: '8px 16px',
                      background: 'rgba(96,165,250,0.15)',
                      border: '1px solid #60a5fa', color: '#60a5fa', borderRadius: '6px',
                      cursor: 'pointer', fontSize: '11px', fontWeight: 'bold'
                    }}>📋 Copy JSON</button>
                  </div>
                  <pre style={{
                    background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '8px',
                    fontSize: '10px', color: '#10b981', overflowX: 'auto',
                    maxHeight: '500px', whiteSpace: 'pre-wrap', wordBreak: 'break-all'
                  }}>
                    {horoscope ? JSON.stringify(horoscope, null, 2) : 'No horoscope loaded'}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {isAdmin && (
        <HoroscopeLayoutDebugger open={showHoroDebug} onClose={() => setShowHoroDebug(false)} />
      )}

      {isAdmin && (
        <DebugPanel logs={debug.debugLogs} metrics={debug.performanceMetrics} diagnostics={debug.diagnostics}
          isVisible={debug.debugVisible} onToggle={() => debug.setDebugVisible(!debug.debugVisible)}
          onCopy={() => navigator.clipboard.writeText(JSON.stringify(debug.handleCopyDebug(), null, 2))}
          signValidation={debug.signValidation} horoscopeData={horoscope} />
      )}
    </ScreenLoader>
  );
}

interface HoroscopeContentProps {
  userSign: string;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  horoscope: any;
  refreshing: boolean;
  onNavigate?: (screen: string) => void;
  heroLeftRef: React.RefObject<HTMLDivElement>;
  subtitleRef: React.RefObject<HTMLDivElement>;
  titleRef: React.RefObject<HTMLHeadingElement>;
  openModal: string | null;
  setOpenModal: (m: string | null) => void;
  isShareModalOpen: boolean;
  setIsShareModalOpen: (v: boolean) => void;
  isReadFullOpen: boolean;
  setIsReadFullOpen: (v: boolean) => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  setToast: (t: any) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

function HoroscopeContent(props: HoroscopeContentProps) {
  const {
    userSign, activeTab, setActiveTab, horoscope, refreshing, onNavigate,
    heroLeftRef, subtitleRef, titleRef,
    openModal, setOpenModal, isShareModalOpen, setIsShareModalOpen,
    isReadFullOpen, setIsReadFullOpen, toast, setToast, showToast,
  } = props;

  const zodiacData = ZODIAC_SIGNS[userSign] || ZODIAC_SIGNS['leo'];

  const wrongSignsDetected: string[] = [];
  const detectWrongSign = (sign: string) => { if (!wrongSignsDetected.includes(sign)) wrongSignsDetected.push(sign); };

  const fixedHoroscope = {
    ...horoscope,
    general_prediction: fixHoroscopeText(horoscope.general_prediction, userSign, detectWrongSign),
    love_prediction: fixHoroscopeText(horoscope.love_prediction, userSign, detectWrongSign),
    career_prediction: fixHoroscopeText(horoscope.career_prediction, userSign, detectWrongSign),
    health_prediction: fixHoroscopeText(horoscope.health_prediction, userSign, detectWrongSign),
    finance_prediction: fixHoroscopeText(horoscope.finance_prediction, userSign, detectWrongSign),
    affirmation: fixHoroscopeText(horoscope.affirmation, userSign, detectWrongSign),
    hero_description: fixHoroscopeText(horoscope.hero_description, userSign, detectWrongSign),
    general_summary: fixHoroscopeText(horoscope.general_summary, userSign, detectWrongSign),
    love_summary: fixHoroscopeText(horoscope.love_summary, userSign, detectWrongSign),
    career_summary: fixHoroscopeText(horoscope.career_summary, userSign, detectWrongSign),
    key_factors: fixHoroscopeText(horoscope.key_factors, userSign, detectWrongSign)
  };

  const safeTransits = Array.isArray(fixedHoroscope.key_transits) ? fixedHoroscope.key_transits.map(safeExtractTransit) : [];
  const safeDate = safeString(fixedHoroscope.date || fixedHoroscope.week_start || fixedHoroscope.month_start);
  const formattedDate = new Date(safeDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const heroTitle = fixedHoroscope.hero_description
    ? safeString(fixedHoroscope.hero_description).split(' ').slice(0, 2).join(' ').toUpperCase()
    : TAB_HERO_FALLBACK[activeTab].split(' ').slice(0, 2).join(' ').toUpperCase();
  const moonDescription = getMoonDescription(safeString(fixedHoroscope.moon_phase));

  const handleCopyAffirmation = () => {
    if (fixedHoroscope.affirmation) {
      navigator.clipboard.writeText(fixedHoroscope.affirmation);
      showToast('Affirmation copied! ✨', 'success');
    }
  };

  const handleDownloadCard = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = document.getElementById('share-card');
      if (!element) { showToast('Card not found!', 'error'); return; }
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: null, logging: false, useCORS: true, allowTaint: true });
      canvas.toBlob((blob) => {
        if (!blob) { showToast('Failed to generate image!', 'error'); return; }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `lunara-${userSign}-${fixedHoroscope.date || fixedHoroscope.week_start || fixedHoroscope.month_start}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        showToast('Horoscope card downloaded! 🌟', 'success');
      }, 'image/png', 1.0);
    } catch {
      showToast('Failed to download card', 'error');
    }
  };

  const handleShareToTelegram = () => {
    const shareText = `Check out my ${userSign} horoscope on Lunara! 🔮✨`;
    const shareUrl = `https://lunara.app/horoscope?sign=${userSign}&date=${fixedHoroscope.date || fixedHoroscope.week_start || fixedHoroscope.month_start}`;
    const telegram = (window as any).Telegram?.WebApp;
    if (telegram) telegram.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`);
    else window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
    showToast('Opening Telegram...', 'info');
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'today', label: 'TODAY' },
    { id: 'tomorrow', label: 'TOMORROW' },
    { id: 'weekly', label: 'WEEKLY' },
    { id: 'monthly', label: 'MONTHLY' },
  ];

  return (
    <>
      <div className="horoscope-screen premium-design">
        <div className="cosmic-background" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }} />
        <div className="aurora-layer" />
        <div className="floating-particles">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="particle" style={{
              left: `${(i * 37) % 100}%`,
              animationDelay: `${i * 1.4}s`,
              animationDuration: `${10 + (i % 5) * 2}s`
            }} />
          ))}
        </div>

        <div className="horoscope-topbar">
          <div className="horoscope-topbar-text">
            <h1 className="horoscope-sign-name">{userSign.toUpperCase()}</h1>
            <p className="horoscope-date-small">{formattedDate}</p>
          </div>
        </div>

        <div className="horoscope-subbar">
          <button className="horoscope-back-btn" onClick={() => onNavigate?.('home')}>
            <ArrowLeft size={16} />
          </button>
          <div className="horoscope-tabs">
            {tabs.map((tab) => (
              <button key={tab.id} className={`horoscope-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="horoscope-scroll-area">
          <AnimatePresence>
            {toast && <ToastNotification toast={toast} onClose={() => setToast(null)} />}
          </AnimatePresence>

          <div className="horoscope-content premium-content">
            <HeroBanner
              activeTab={activeTab} refreshing={refreshing} userSign={userSign}
              heroTitle={heroTitle}
              onReadFull={() => setIsReadFullOpen(true)}
              heroLeftRef={heroLeftRef} subtitleRef={subtitleRef} titleRef={titleRef}
            />

            {(activeTab === 'today' || activeTab === 'tomorrow') ? (
              <>
                <div className="premium-section energy-section">
                  <EnergyGrid horoscope={fixedHoroscope} isSummary={false} />
                </div>
                <MoonCard horoscope={fixedHoroscope} moonDescription={moonDescription} />
                <div className="premium-section predictions-section">
                  <PredictionsGrid safeDate={safeDate} onSelect={setOpenModal} isSummary={false} />
                </div>
              </>
            ) : (
              <>
                <div className="premium-section energy-section">
                  <EnergyGrid horoscope={fixedHoroscope} isSummary={true} />
                </div>

                {!fixedHoroscope?.general_summary ? (
                  <div className="summary-empty-state">
                    <div className="summary-empty-icon">
                      {activeTab === 'monthly' ? '🗓️' : '📅'}
                    </div>
                    <h3 className="summary-empty-title">
                      {activeTab === 'monthly' ? 'Monthly Narrative' : 'Weekly Narrative'}
                    </h3>
                    <p className="summary-empty-text">
                      {activeTab === 'monthly' 
                        ? 'The cosmic narrative for this month will be generated on the last day.'
                        : 'No weekly narrative available for this period.'}
                    </p>
                  </div>
                ) : (
                  <div className="premium-section predictions-section">
                    <PredictionsGrid safeDate={safeDate} onSelect={setOpenModal} isSummary={true} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <PredictionModal 
        openModal={openModal} 
        horoscope={fixedHoroscope} 
        onClose={() => setOpenModal(null)}
        activeTab={activeTab}
      />

      <ShareModal
        isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)}
        userSign={userSign} safeDate={safeDate} horoscope={fixedHoroscope}
        safeTransits={safeTransits} zodiacPlanet={zodiacData.planet}
        onDownload={handleDownloadCard} onShare={handleShareToTelegram}
      />

      <ReadFullModal
        isOpen={isReadFullOpen} onClose={() => setIsReadFullOpen(false)}
        userSign={userSign} zodiacSymbol={zodiacData.symbol} safeDate={safeDate}
        horoscope={fixedHoroscope} safeTransits={safeTransits} moonDescription={moonDescription}
        activeTab={activeTab} onCopyAffirmation={handleCopyAffirmation}
        onShareAffirmation={() => { setIsReadFullOpen(false); setIsShareModalOpen(true); }}
      />
    </>
  );
}