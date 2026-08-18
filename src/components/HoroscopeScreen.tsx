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

  // 🆕 Unified Debugger states
  const [showUnifiedDebug, setShowUnifiedDebug] = useState(false);
  const [unifiedTab, setUnifiedTab] = useState<'status' | 'layout' | 'logs' | 'raw'>('status');
  const [statusData, setStatusData] = useState<any>({});
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusGenerating, setStatusGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

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

  // 🆕 Status fetch + generation
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
      const { data } = await supabase
        .from('daily_horoscopes')
        .select('zodiac_sign,date,ai_model_used,tokens_used,general_prediction')
        .in('date', dates);
      const grouped: any = {};
      ZODIAC_SIGNS_LIST.forEach(s => { grouped[s] = []; });
      (data || []).forEach((r: any) => {
        const age = Math.floor((today.getTime() - new Date(r.date).getTime()) / (1000*60*60*24));
        grouped[r.zodiac_sign]?.push({
          date: r.date, age, model: r.ai_model_used, tokens: r.tokens_used,
          preview: (r.general_prediction || '').substring(0, 60)
        });
      });
      Object.keys(grouped).forEach(s => grouped[s].sort((a: any, b: any) => b.date.localeCompare(a.date)));
      setStatusData(grouped);
    } catch (e: any) { setStatusMessage(`❌ ${e.message}`); }
    setStatusLoading(false);
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

  // 🆕 Copy functions for all tabs
  const copyStatus = () => {
    const data = {
      timestamp: new Date().toISOString(),
      status: statusData
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
    const readingKey = `${user.id}-${activeTab}-${horoscope.date}`;
    if (loggedReadingsRef.current.has(readingKey)) return;

    logReading(user.id, 'horoscope', [], `${activeTab} - ${userSign} - ${horoscope.date}`)
      .then(() => {
        loggedReadingsRef.current.add(readingKey);
        isInitialLoadRef.current = false;
        if (isAdmin) debug.addLog('success', 'READING', '✅ Horoscope reading logged');
        trackQuestProgress(user.id, 'check_horoscope', 1)
          .then(reward => { if (reward) console.log(`🎉 Quest Completed! Reward: ${reward.coins} coins, ${reward.xp} XP`); })
          .catch(err => console.error('❌ [Quest] Error updating horoscope quest:', err));
      })
      .catch((readingError: any) => { if (isAdmin) debug.addLog('error', 'READING', '❌ Failed to log reading', readingError); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horoscope, loading, user, activeTab, userSign]);

  if (!user?.sun_sign) return <SignSelectionScreen onNavigate={onNavigate} />;

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

      {/* 🆕 UNIFIED DEBUGGER — ერთი 🌙 ღილაკი 4 ტაბით */}
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

      {/* 🆕 UNIFIED DEBUGGER MODAL */}
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
              width: '100%', maxWidth: '800px', maxHeight: '85vh',
              display: 'flex', flexDirection: 'column',
              color: '#fff',
              fontFamily: 'system-ui, sans-serif',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(217,182,111,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#D9B66F', fontWeight: 'bold' }}>🌙 Horoscope Debugger</h2>
              <button onClick={() => setShowUnifiedDebug(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid rgba(217,182,111,0.2)' }}>
              {([
                { id: 'status', label: '📊 Status' },
                { id: 'layout', label: '📐 Layout' },
                { id: 'logs', label: '📝 Logs' },
                { id: 'raw', label: '🔍 Raw' }
              ] as const).map(t => (
                <button key={t.id} onClick={() => setUnifiedTab(t.id)} style={{
                  flex: 1, padding: '12px', border: 'none', cursor: 'pointer',
                  background: unifiedTab === t.id ? 'rgba(217,182,111,0.15)' : 'transparent',
                  color: unifiedTab === t.id ? '#D9B66F' : '#888',
                  fontSize: '12px', fontWeight: unifiedTab === t.id ? 'bold' : 'normal',
                  borderBottom: unifiedTab === t.id ? '2px solid #D9B66F' : '2px solid transparent'
                }}>{t.label}</button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {unifiedTab === 'status' && (
                <div>
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
                      <tr style={{ borderBottom: '2px solid rgba(217,182,111,0.3)' }}>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#D9B66F' }}>Sign</th>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#D9B66F' }}>Latest</th>
                        <th style={{ padding: '8px', textAlign: 'center', color: '#D9B66F' }}>Age</th>
                        <th style={{ padding: '8px', textAlign: 'center', color: '#D9B66F' }}>Model</th>
                        <th style={{ padding: '8px', textAlign: 'right', color: '#D9B66F' }}>Tokens</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ZODIAC_SIGNS_LIST.map(sign => {
                        const entries = statusData[sign] || [];
                        const latest = entries[0];
                        const ageColor = !latest ? '#ef4444' : latest.age === 0 ? '#10b981' : latest.age <= 2 ? '#f59e0b' : '#ef4444';
                        return (
                          <tr key={sign} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>{sign}</td>
                            <td style={{ padding: '10px 8px', color: latest ? '#ddd' : '#666', fontSize: '10px' }}>
                              {latest ? latest.date : <em>missing</em>}
                            </td>
                            <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                              <span style={{ color: ageColor, fontWeight: 'bold' }}>
                                {latest ? `${latest.age}d` : '—'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 8px', textAlign: 'center', color: '#aaa', fontSize: '10px' }}>
                              {latest?.model || '—'}
                            </td>
                            <td style={{ padding: '10px 8px', textAlign: 'right', color: '#aaa' }}>
                              {latest?.tokens || '—'}
                            </td>
                          </tr>
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
    hero_description: fixHoroscopeText(horoscope.hero_description, userSign, detectWrongSign)
  };

  const safeTransits = Array.isArray(fixedHoroscope.key_transits) ? fixedHoroscope.key_transits.map(safeExtractTransit) : [];
  const safeDate = safeString(fixedHoroscope.date);
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
        link.download = `lunara-${userSign}-${fixedHoroscope.date}.png`;
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
    const shareUrl = `https://lunara.app/horoscope?sign=${userSign}&date=${fixedHoroscope.date}`;
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
            <div className="premium-section energy-section">
              <EnergyGrid horoscope={fixedHoroscope} />
            </div>
            <MoonCard horoscope={fixedHoroscope} moonDescription={moonDescription} />
            <div className="premium-section predictions-section">
              <PredictionsGrid safeDate={safeDate} onSelect={setOpenModal} />
            </div>
          </div>
        </div>
      </div>

      <PredictionModal openModal={openModal} horoscope={fixedHoroscope} onClose={() => setOpenModal(null)} />

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