import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Download, Share2, Sparkles, Heart, Briefcase, Activity, DollarSign,
  Star, Moon, Palette, Hash, Sun, ChevronDown, Copy
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

export function ReadFullModal({ isOpen, onClose, userSign, zodiacSymbol, safeDate, horoscope, safeTransits, moonDescription, activeTab, onCopyAffirmation, onShareAffirmation }: ReadFullModalProps) {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const toggleAccordion = (s: string) => setOpenAccordion(openAccordion === s ? null : s);

  const sections = [
    { key: 'general', icon: <Sparkles size={18} className="rf-section-icon" />, cls: '', title: 'General Energy', text: horoscope?.general_prediction },
    { key: 'love', icon: <Heart size={18} className="rf-section-icon" />, cls: 'love', title: 'Love & Relationships', text: horoscope?.love_prediction },
    { key: 'career', icon: <Briefcase size={18} className="rf-section-icon" />, cls: 'career', title: 'Career & Work', text: horoscope?.career_prediction },
    { key: 'health', icon: <Activity size={18} className="rf-section-icon" />, cls: 'health', title: 'Health & Wellness', text: horoscope?.health_prediction },
    { key: 'finance', icon: <DollarSign size={18} className="rf-section-icon" />, cls: 'finance', title: 'Finance & Money', text: horoscope?.finance_prediction },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="read-full-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="read-full-modal" initial={{ scale: 0.85, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.85, y: 40, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 250 }} onClick={(e) => e.stopPropagation()}>
            <div className="rf-glow" />
            <button className="rf-close" onClick={onClose}><X size={22} /></button>

            <div className="rf-scroll">
              <div className="rf-header">
                <div className="rf-sign-icon">{zodiacSymbol}</div>
                <h1 className="rf-sign-name">{userSign.toUpperCase()}</h1>
                <div className="rf-date-row">
                  <span className="rf-divider-line" />
                  <span className="rf-date">{safeDate}</span>
                  <span className="rf-divider-line" />
                </div>
              </div>

              <div className="rf-energy-overview">
                <div className="rf-energy-item">
                  <span className="rf-energy-emoji">{getEnergyEmojis(safeString(horoscope?.cosmic_energy_level), '⚡')}</span>
                  <span className="rf-energy-level">{safeString(horoscope?.cosmic_energy_level || 'MEDIUM').toUpperCase()}</span>
                  <span className="rf-energy-cat">Energy</span>
                </div>
                <div className="rf-energy-divider" />
                <div className="rf-energy-item">
                  <span className="rf-energy-emoji">{getEnergyEmojis(safeString(horoscope?.love_energy_level), '💕')}</span>
                  <span className="rf-energy-level">{safeString(horoscope?.love_energy_level || 'MEDIUM').toUpperCase()}</span>
                  <span className="rf-energy-cat">Love</span>
                </div>
                <div className="rf-energy-divider" />
                <div className="rf-energy-item">
                  <span className="rf-energy-emoji">{getEnergyEmojis(safeString(horoscope?.career_energy_level), '💼')}</span>
                  <span className="rf-energy-level">{safeString(horoscope?.career_energy_level || 'MEDIUM').toUpperCase()}</span>
                  <span className="rf-energy-cat">Career</span>
                </div>
              </div>

              <div className="rf-sections">
                {sections.filter(s => s.text).map(s => (
                  <div className="rf-section" key={s.key}>
                    <div className={`rf-section-header ${s.cls}`}>
                      {s.icon}
                      <h3>{s.title}</h3>
                    </div>
                    <p className="rf-section-text">{safeString(s.text)}</p>
                  </div>
                ))}
              </div>

              {horoscope?.affirmation && (
                <div className="rf-affirmation">
                  <div className="rf-aff-glow" />
                  <div className="rf-aff-icon">✨</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <h3 className="rf-aff-title" style={{ margin: 0 }}>
                      {activeTab === 'weekly' ? 'Weekly' : activeTab === 'monthly' ? 'Monthly' : 'Daily'} Affirmation
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={onCopyAffirmation}
                      style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ffe566' }}
                    >
                      <Copy size={16} />
                    </motion.button>
                  </div>
                  <p className="rf-aff-text">"{safeString(horoscope.affirmation)}"</p>
                </div>
              )}

              <div className="rf-accordion-container">
                {safeTransits.length > 0 && (
                  <div className="rf-accordion">
                    <button className="rf-accordion-header" onClick={() => toggleAccordion('transits')}>
                      <div className="rf-accordion-title"><Star size={16} /><span>Key Transits</span></div>
                      <motion.div className="rf-accordion-arrow" animate={{ rotate: openAccordion === 'transits' ? 180 : 0 }} transition={{ duration: 0.3 }}>
                        <ChevronDown size={18} />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {openAccordion === 'transits' && (
                        <motion.div className="rf-accordion-content" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                          <div className="rf-transits-list">
                            {safeTransits.slice(0, 5).map((transit, index) => (
                              <div key={index} className={`rf-transit-item ${transit.influence}`}>
                                <div className="rf-transit-main">
                                  <span className="rf-transit-planets">
                                    {transit.planet1} <span className="rf-transit-aspect">{transit.aspect_type}</span> {transit.planet2}
                                  </span>
                                </div>
                                <div className={`rf-transit-badge ${transit.influence}`}>
                                  {transit.influence === 'harmonious' && '🟢'}
                                  {transit.influence === 'challenging' && '🔴'}
                                  {transit.influence === 'neutral' && '⚪'}
                                  {transit.influence}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <div className="rf-accordion">
                  <button className="rf-accordion-header" onClick={() => toggleAccordion('lucky')}>
                    <div className="rf-accordion-title"><Sparkles size={16} /><span>Lucky Elements</span></div>
                    <motion.div className="rf-accordion-arrow" animate={{ rotate: openAccordion === 'lucky' ? 180 : 0 }} transition={{ duration: 0.3 }}>
                      <ChevronDown size={18} />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openAccordion === 'lucky' && (
                      <motion.div className="rf-accordion-content" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                        <div className="rf-lucky-grid">
                          <div className="rf-lucky-item">
                            <div className="rf-lucky-icon-wrapper" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}><Palette size={20} /></div>
                            <span className="rf-lucky-label">Color</span>
                            <span className="rf-lucky-value">{safeString(horoscope?.lucky_color || 'Gold')}</span>
                          </div>
                          <div className="rf-lucky-item">
                            <div className="rf-lucky-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}><Hash size={20} /></div>
                            <span className="rf-lucky-label">Number</span>
                            <span className="rf-lucky-value">{Number(horoscope?.lucky_number) || 7}</span>
                          </div>
                          <div className="rf-lucky-item">
                            <div className="rf-lucky-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><Sun size={20} /></div>
                            <span className="rf-lucky-label">Planet</span>
                            <span className="rf-lucky-value">{safeString(horoscope?.lucky_planet)}</span>
                          </div>
                          {horoscope?.lucky_crystal && (
                            <div className="rf-lucky-item">
                              <div className="rf-lucky-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><Star size={20} /></div>
                              <span className="rf-lucky-label">Crystal</span>
                              <span className="rf-lucky-value">{safeString(horoscope.lucky_crystal)}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="rf-accordion">
                  <button className="rf-accordion-header" onClick={() => toggleAccordion('moon')}>
                    <div className="rf-accordion-title"><Moon size={16} /><span>Moon Info</span></div>
                    <motion.div className="rf-accordion-arrow" animate={{ rotate: openAccordion === 'moon' ? 180 : 0 }} transition={{ duration: 0.3 }}>
                      <ChevronDown size={18} />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openAccordion === 'moon' && (
                      <motion.div className="rf-accordion-content" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
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
              </div>

              {horoscope?.affirmation && (
                <div className="rf-share-bottom">
                  <button className="share-affirmation-btn" onClick={onShareAffirmation}>
                    <Share2 size={12} /><span>Share Affirmation</span>
                  </button>
                </div>
              )}

              <div className="rf-footer">
                <div className="rf-footer-divider"><span className="rf-fd-star">✦</span></div>
                <p className="rf-footer-text">The stars have spoken.<br />Trust your intuition.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}