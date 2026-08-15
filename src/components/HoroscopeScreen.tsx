import { useState, useEffect, useRef } from 'react';
import { useHoroscope } from '../hooks/useHoroscope';
import { useUser } from '../context/UserContext';
import { ZODIAC_SIGNS, BACKGROUND_IMAGE } from '../data/zodiacData';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Moon, RotateCcw, Ruler } from 'lucide-react';
import LoadingScreen from './LoadingScreen';
import SignSelectionScreen from './SignSelectionScreen';
import HoroscopeLayoutDebugger from './HoroscopeLayoutDebugger';
import { logReading } from '../lib/adminService';
import { trackQuestProgress } from '../lib/questService';
import {
  TabType, ADMIN_USER_ID, ERROR_MESSAGES, TAB_HERO_FALLBACK,
  safeString, safeExtractTransit, fixHoroscopeText, getMoonDescription
} from './horoscope/horoscopeData';
import { useHoroscopeDebug } from './horoscope/useHoroscopeDebug';
import { ToastNotification, DebugPanel } from './horoscope/DebugPanel';
import { HeroBanner, EnergyGrid, MoonCard, PredictionsGrid } from './horoscope/HoroscopeSections';
import { PredictionModal, ShareModal, ReadFullModal } from './horoscope/HoroscopeModals';
import './HoroscopeScreen.css';

interface Props { onNavigate?: (screen: string) => void; }

export default function HoroscopeScreen({ onNavigate }: Props) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReadFullOpen, setIsReadFullOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showHoroDebug, setShowHoroDebug] = useState(false);

  const isAdmin = user?.id === ADMIN_USER_ID;
  const userSign = user?.sun_sign?.toLowerCase() || '';

  const heroLeftRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const loggedReadingsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  const { horoscope, loading, refreshing, error, refetch } = useHoroscope(user?.id || '', user?.sun_sign || '', activeTab);

  const debug = useHoroscopeDebug(isAdmin, user, horoscope, loading, error, activeTab);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => setToast({ message, type });

  /* ✅ ჭკვიანი ტექსტი — subtitle/title ერთ ხაზზე */
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
        let size = parseFloat(getComputedStyle(title).fontSize);
        while (title.scrollWidth > avail && size > 10) { size -= 0.5; title.style.fontSize = `${size}px`; }
      }
    };
    fit();
    const t1 = setTimeout(fit, 300);
    const t2 = setTimeout(fit, 800);
    const t3 = setTimeout(fit, 1500);
    window.addEventListener('resize', fit);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); window.removeEventListener('resize', fit); };
  }, [activeTab, horoscope]);

  /* ✅ Reading log + quest */
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

  if (loading && !horoscope) {
    return (
      <>
        <LoadingScreen message="Reading the stars" />
        {isAdmin && (
          <DebugPanel logs={debug.debugLogs} metrics={debug.performanceMetrics} diagnostics={debug.diagnostics}
            isVisible={debug.debugVisible} onToggle={() => debug.setDebugVisible(!debug.debugVisible)}
            onCopy={() => navigator.clipboard.writeText(JSON.stringify(debug.handleCopyDebug(), null, 2))}
            signValidation={debug.signValidation} horoscopeData={null} />
        )}
      </>
    );
  }

  if (error && !horoscope) {
    return (
      <>
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
        {isAdmin && (
          <DebugPanel logs={debug.debugLogs} metrics={debug.performanceMetrics} diagnostics={debug.diagnostics}
            isVisible={debug.debugVisible} onToggle={() => debug.setDebugVisible(!debug.debugVisible)}
            onCopy={() => navigator.clipboard.writeText(JSON.stringify(debug.handleCopyDebug(), null, 2))}
            signValidation={debug.signValidation} horoscopeData={null} />
        )}
      </>
    );
  }

  if (!horoscope) {
    return (
      <>
        <div className="horoscope-screen">
          <div className="cosmic-background" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }} />
          <div className="aurora-layer" />
          <div className="horoscope-empty">
            <Moon size={48} className="empty-moon" />
            <p>The cosmos has no message for you today.</p>
          </div>
        </div>
        {isAdmin && (
          <DebugPanel logs={debug.debugLogs} metrics={debug.performanceMetrics} diagnostics={debug.diagnostics}
            isVisible={debug.debugVisible} onToggle={() => debug.setDebugVisible(!debug.debugVisible)}
            onCopy={() => navigator.clipboard.writeText(JSON.stringify(debug.handleCopyDebug(), null, 2))}
            signValidation={debug.signValidation} horoscopeData={null} />
        )}
      </>
    );
  }

  // ✅ აქ horoscope definitely not null
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
  const heroDescription = safeString(fixedHoroscope.hero_description || TAB_HERO_FALLBACK[activeTab]);
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

  const handleCopyDebugPanel = () => {
    navigator.clipboard.writeText(JSON.stringify(debug.handleCopyDebug(), null, 2))
      .then(() => showToast('Debug data copied! 📋', 'success'))
      .catch(() => showToast('Copy failed', 'error'));
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

          <AnimatePresence>
            {refreshing && (
              <motion.div className="refreshing-indicator" initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }}>
                <motion.div className="refreshing-icon" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <RotateCcw size={14} />
                </motion.div>
                <span>Updating cosmic energies...</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="horoscope-content premium-content">
            <HeroBanner
              activeTab={activeTab} refreshing={refreshing} userSign={userSign}
              heroTitle={heroTitle} heroDescription={heroDescription}
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

      {/* ✅ DEBUG ღილაკი — ეკრანის შუაში, მარჯვნივ, z-index 999999 */}
      {isAdmin && (
        <button
          onClick={() => setShowHoroDebug(true)}
          style={{
            position: 'fixed',
            top: '50%',
            right: '10px',
            transform: 'translateY(-50%)',
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #D9B66F 0%, #F4D47C 50%, #D9B66F 100%)',
            border: '3px solid #fff',
            color: '#0a0600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 999999,
            boxShadow: '0 6px 24px rgba(217,182,111,0.9), 0 0 40px rgba(217,182,111,0.5)',
            animation: 'horoDebugPulse 2s ease-in-out infinite',
          }}
          title="Horoscope Layout Debugger"
        >
          <Ruler size={24} strokeWidth={2.5} />
        </button>
      )}

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

      {isAdmin && (
        <HoroscopeLayoutDebugger open={showHoroDebug} onClose={() => setShowHoroDebug(false)} />
      )}

      {isAdmin && (
        <DebugPanel logs={debug.debugLogs} metrics={debug.performanceMetrics} diagnostics={debug.diagnostics}
          isVisible={debug.debugVisible} onToggle={() => debug.setDebugVisible(!debug.debugVisible)}
          onCopy={handleCopyDebugPanel} signValidation={debug.signValidation} horoscopeData={horoscope} />
      )}
    </>
  );
}