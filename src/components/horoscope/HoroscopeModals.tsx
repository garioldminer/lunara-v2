import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Download, Share2, Sparkles, Heart, Briefcase, Activity, DollarSign,
  Star, Moon, Palette, Hash, Sun, ChevronDown, Copy, ArrowLeft
} from 'lucide-react';
import ShareCardPreview from '../ShareCardPreview';
import { TabType, safeString, getEnergyEmojis } from './horoscopeData';

/* ---------- Prediction Modal ---------- */
export function PredictionModal({ openModal, horoscope, onClose }: { openModal: string | null; horoscope: any; onClose: () => void }) {
  const content: Record<string, { icon: React.ReactNode; title: string; text: string; color?: string }> = {
    general: { icon: <Sparkles size={28} />, title: 'General Energy', text: safeString(horoscope?.general_prediction) },
    love: { icon: <Heart size={28} />, title: 'Love & Relationships', text: safeString(horoscope?.love_prediction), color: '#E8738A' },
    career: { icon: <Briefcase size={28} />, title: 'Career & Work', text: safeString(horoscope?.career_prediction), color: '#7CB3E8' },
    health: { icon: <Activity size={28} />, title: 'Health & Wellness', text: safeString(horoscope?.health_prediction) },
    finance: { icon: <DollarSign size={28} />, title: 'Finance & Money', text: safeString(horoscope?.finance_prediction), color: '#7CE8A6' },
  };
  const item = openModal ? content[openModal] : null;

  return (
    <AnimatePresence>
      {openModal && item && (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="modal-content" initial={{ scale: 0.9, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 15 }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={onClose}><X size={20} /></button>
            <div className="modal-icon" style={item.color ? { color: item.color } : undefined}>{item.icon}</div>
            <h2 className="modal-title">{item.title}</h2>
            <p className="modal-text">{item.text}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Share Modal ---------- */
interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSign: string;
  safeDate: string;
  horoscope: any;
  safeTransits: any[];
  zodiacPlanet: string;
  onDownload: () => void;
  onShare: () => void;
}

export function ShareModal({ isOpen, onClose, userSign, safeDate, horoscope, safeTransits, zodiacPlanet, onDownload, onShare }: ShareModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="modal-content share-modal" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={onClose}><X size={20} /></button>
            <h2 className="modal-title">Share Your Horoscope</h2>
            <div className="share-preview-container">
              <ShareCardPreview
                userSign={String(userSign)}
                date={safeDate}
                affirmation={safeString(horoscope?.affirmation)}
                moonPhase={safeString(horoscope?.moon_phase)}
                luckyNumber={Number(horoscope?.lucky_number) || 7}
                luckyColor={safeString(horoscope?.lucky_color)}
                luckyCrystal={safeString(horoscope?.lucky_crystal)}
                luckyPlanet={safeString(horoscope?.lucky_planet || zodiacPlanet)}
                keyTransits={safeTransits.slice(0, 2)}
              />
            </div>
            <div className="share-actions">
              <button className="share-action-btn" onClick={onDownload}><Download size={16} /><span>Download</span></button>
              <button className="share-action-btn primary" onClick={onShare}><Share2 size={16} /><span>Share</span></button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Read Full Modal ---------- */
interface ReadFullModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSign: string;
  zodiacSymbol: string;
  safeDate: string;
  horoscope: any;
  safeTransits: any[];
  moonDescription: string;
  activeTab: TabType;
  onCopyAffirmation: () => void;
  onShareAffirmation: () => void;
}

export function ReadFullModal({ isOpen, onClose, userSign, safeDate, horoscope, safeTransits, moonDescription, activeTab, onCopyAffirmation, onShareAffirmation }: ReadFullModalProps) {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const toggleAccordion = (s: string) => setOpenAccordion(openAccordion === s ? null : s);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ✅ Summary ტაბების დეტექცია
  const isSummary = activeTab === 'weekly' || activeTab === 'monthly';

  const formattedDate = (() => {
    try {
      return new Date(safeDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return safeDate;
    }
  })();

  const findNav = (): HTMLElement | null => {
    const selectors = [
      '.bottom-nav-container',
      '.bottom-nav',
      '.nav-bar',
      '.main-nav',
      '.bottom-navbar',
      '[class*="bottom-nav"]',
      '[class*="BottomNav"]',
      'nav[class*="nav"]',
      'nav'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (el) return el;
    }
    return null;
  };

  useEffect(() => {
    if (!isOpen) return;
    const nav = findNav();
    if (nav) {
      nav.classList.add('rf-hidden');
    }
    return () => {
      if (nav) {
        nav.classList.remove('rf-hidden');
        nav.classList.remove('rf-revealed');
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const el = scrollRef.current;
    if (!el) return;
    const nav = findNav();

    const onScroll = () => {
      if (!nav) return;
      const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 15;
      if (atEnd) {
        nav.classList.remove('rf-hidden');
        nav.classList.add('rf-revealed');
      } else {
        nav.classList.remove('rf-revealed');
        nav.classList.add('rf-hidden');
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [isOpen]);

  // ✅ CONDITIONAL SECTIONS — daily vs summary
  const sections = isSummary ? [
    { key: 'general', icon: <Sparkles size={18} className="rf-section-icon" />, cls: '', title: 'Overall Narrative', text: horoscope?.general_summary },
    { key: 'factors', icon: <Activity size={18} className="rf-section-icon" />, cls: 'health', title: 'Key Influences', text: horoscope?.key_factors },
    { key: 'love', icon: <Heart size={18} className="rf-section-icon" />, cls: 'love', title: 'Love & Relationships', text: horoscope?.love_summary },
    { key: 'career', icon: <Briefcase size={18} className="rf-section-icon" />, cls: 'career', title: 'Career & Focus', text: horoscope?.career_summary },
  ] : [
    { key: 'general', icon: <Sparkles size={18} className="rf-section-icon" />, cls: '', title: 'General Energy', text: horoscope?.general_prediction },
    { key: 'love', icon: <Heart size={18} className="rf-section-icon" />, cls: 'love', title: 'Love & Relationships', text: horoscope?.love_prediction },
    { key: 'career', icon: <Briefcase size={18} className="rf-section-icon" />, cls: 'career', title: 'Career & Work', text: horoscope?.career_prediction },
    { key: 'health', icon: <Activity size={18} className="rf-section-icon" />, cls: 'health', title: 'Health & Wellness', text: horoscope?.health_prediction },
    { key: 'finance', icon: <DollarSign size={18} className="rf-section-icon" />, cls: 'finance', title: 'Finance & Money', text: horoscope?.finance_prediction },
  ];

  const tabLabel = activeTab === 'weekly' ? 'Weekly' : activeTab === 'monthly' ? 'Monthly' : 'Daily';

  const getInfluenceIcon = (influence: string) => {
    if (influence === 'harmonious') return '🟢';
    if (influence === 'challenging') return '🔴';
    return '⚪';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="read-full-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="read-full-modal"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rf-glow" />

            <div className="rf-topbar">
              <div className="rf-topbar-text">
                <span className="rf-topbar-sign">{userSign.toUpperCase()}</span>
                <span className="rf-topbar-date">{formattedDate}</span>
              </div>
            </div>

            <button className="rf-back" onClick={onClose} aria-label="Back">
              <ArrowLeft size={20} />
            </button>

            {/* ✅ CONDITIONAL ENERGY OVERVIEW */}
            <div className="rf-energy-overview">
              {isSummary ? (
                <div className="rf-energy-item">
                  <span className="rf-energy-emoji">{getEnergyEmojis(safeString(horoscope?.overall_energy), '⚡')}</span>
                  <span className="rf-energy-level">OVERALL: {safeString(horoscope?.overall_energy || 'MEDIUM').toUpperCase()}</span>
                </div>
              ) : (
                <>
                  <div className="rf-energy-item">
                    <span className="rf-energy-emoji">{getEnergyEmojis(safeString(horoscope?.cosmic_energy_level), '⚡')}</span>
                    <span className="rf-energy-level">{safeString(horoscope?.cosmic_energy_level || 'MEDIUM').toUpperCase()}</span>
                  </div>
                  <div className="rf-energy-divider" />
                  <div className="rf-energy-item">
                    <span className="rf-energy-emoji">{getEnergyEmojis(safeString(horoscope?.love_energy_level), '💕')}</span>
                    <span className="rf-energy-level">{safeString(horoscope?.love_energy_level || 'MEDIUM').toUpperCase()}</span>
                  </div>
                  <div className="rf-energy-divider" />
                  <div className="rf-energy-item">
                    <span className="rf-energy-emoji">{getEnergyEmojis(safeString(horoscope?.career_energy_level), '💼')}</span>
                    <span className="rf-energy-level">{safeString(horoscope?.career_energy_level || 'MEDIUM').toUpperCase()}</span>
                  </div>
                </>
              )}
            </div>

            <div className="rf-scroll" ref={scrollRef}>
              {/* SECTIONS */}
              <div className="rf-sections">
                {sections.filter(s => s.text).map(s => (
                  <motion.div
                    className="rf-section"
                    key={s.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className={`rf-section-header ${s.cls}`}>
                      {s.icon}
                      <h3>{s.title}</h3>
                    </div>
                    <p className="rf-section-text">{safeString(s.text)}</p>
                  </motion.div>
                ))}
              </div>

              {/* AFFIRMATION — მხოლოდ daily */}
              {!isSummary && horoscope?.affirmation && (
                <motion.div
                  className="rf-affirmation"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="rf-aff-glow" />
                  <div className="rf-aff-icon">✨</div>
                  <div className="rf-aff-header">
                    <h3 className="rf-aff-title">{tabLabel} Affirmation</h3>
                    <button className="rf-aff-copy-btn" onClick={onCopyAffirmation} aria-label="Copy affirmation">
                      <Copy size={14} />
                    </button>
                  </div>
                  <p className="rf-aff-text">"{safeString(horoscope.affirmation)}"</p>
                </motion.div>
              )}

              {/* ACCORDIONS */}
              <div className="rf-accordion-container">
                {/* TRANSITS — მხოლოდ daily */}
                {!isSummary && safeTransits.length > 0 && (
                  <div className="rf-accordion">
                    <button className="rf-accordion-header" onClick={() => toggleAccordion('transits')}>
                      <div className="rf-accordion-title">
                        <Star size={16} />
                        <span>Key Transits</span>
                      </div>
                      <div className={`rf-accordion-arrow ${openAccordion === 'transits' ? 'open' : ''}`}>
                        <ChevronDown size={18} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {openAccordion === 'transits' && (
                        <motion.div
                          className="rf-accordion-content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          <div className="rf-transits-list">
                            {safeTransits.slice(0, 5).map((transit, index) => (
                              <div key={index} className={`rf-transit-item ${transit.influence || 'neutral'}`}>
                                <div className="rf-transit-main">
                                  <span className="rf-transit-planet">{transit.planet1}</span>
                                  <span className="rf-transit-aspect">{transit.aspect_type}</span>
                                  <span className="rf-transit-planet">{transit.planet2}</span>
                                </div>
                                <div className={`rf-transit-badge ${transit.influence || 'neutral'}`}>
                                  <span className="rf-badge-icon">{getInfluenceIcon(transit.influence)}</span>
                                  <span className="rf-badge-text">{transit.influence}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* LUCKY ELEMENTS */}
                <div className="rf-accordion">
                  <button className="rf-accordion-header" onClick={() => toggleAccordion('lucky')}>
                    <div className="rf-accordion-title">
                      <Sparkles size={16} />
                      <span>Lucky Elements</span>
                    </div>
                    <div className={`rf-accordion-arrow ${openAccordion === 'lucky' ? 'open' : ''}`}>
                      <ChevronDown size={18} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {openAccordion === 'lucky' && (
                      <motion.div
                        className="rf-accordion-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <div className="rf-lucky-grid">
                          <div className="rf-lucky-item">
                            <div className="rf-lucky-icon-wrapper color-pink"><Palette size={20} /></div>
                            <span className="rf-lucky-label">Color</span>
                            <span className="rf-lucky-value">{safeString(horoscope?.lucky_color || 'Gold')}</span>
                          </div>
                          <div className="rf-lucky-item">
                            <div className="rf-lucky-icon-wrapper color-indigo"><Hash size={20} /></div>
                            <span className="rf-lucky-label">Number</span>
                            <span className="rf-lucky-value">{Number(horoscope?.lucky_number) || 7}</span>
                          </div>
                          {horoscope?.lucky_planet && (
                            <div className="rf-lucky-item">
                              <div className="rf-lucky-icon-wrapper color-amber"><Sun size={20} /></div>
                              <span className="rf-lucky-label">Planet</span>
                              <span className="rf-lucky-value">{safeString(horoscope.lucky_planet)}</span>
                            </div>
                          )}
                          {horoscope?.lucky_crystal && (
                            <div className="rf-lucky-item">
                              <div className="rf-lucky-icon-wrapper color-emerald"><Star size={20} /></div>
                              <span className="rf-lucky-label">Crystal</span>
                              <span className="rf-lucky-value">{safeString(horoscope.lucky_crystal)}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* MOON INFO — მხოლოდ daily */}
                {!isSummary && (
                  <div className="rf-accordion">
                    <button className="rf-accordion-header" onClick={() => toggleAccordion('moon')}>
                      <div className="rf-accordion-title">
                        <Moon size={16} />
                        <span>Moon Info</span>
                      </div>
                      <div className={`rf-accordion-arrow ${openAccordion === 'moon' ? 'open' : ''}`}>
                        <ChevronDown size={18} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {openAccordion === 'moon' && (
                        <motion.div
                          className="rf-accordion-content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          <div className="rf-moon-info-expanded">
                            <Moon size={24} className="rf-moon-icon-large" />
                            <div className="rf-moon-details-expanded">
                              <span className="rf-moon-phase-large">{safeString(horoscope?.moon_phase)}</span>
                              <span className="rf-moon-sign-large">Moon in {safeString(horoscope?.moon_sign)}</span>
                              <p className="rf-moon-desc-expanded">{moonDescription}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* SHARE BOTTOM — მხოლოდ daily */}
              {!isSummary && horoscope?.affirmation && (
                <div className="rf-share-bottom">
                  <button className="share-affirmation-btn" onClick={onShareAffirmation}>
                    <Share2 size={12} />
                    <span>Share Affirmation</span>
                  </button>
                </div>
              )}

              {/* FOOTER */}
              <div className="rf-footer">
                <div className="rf-footer-divider">
                  <span className="rf-fd-star">✦</span>
                </div>
                <p className="rf-footer-text">
                  The stars have spoken.<br />
                  Trust your intuition.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}