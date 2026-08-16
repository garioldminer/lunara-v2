import { motion } from 'framer-motion';
import { ChevronRight, Zap, Heart, Briefcase as BriefcaseIcon, Sparkles, Activity, DollarSign } from 'lucide-react';
import { ZODIAC_SIGNS } from '../../data/zodiacData';
import { TabType, TAB_LABELS, safeString, getPredictionSubtitle } from './horoscopeData';

type Ref<T> = { current: T | null };

interface HeroBannerProps {
  activeTab: TabType;
  refreshing: boolean;
  userSign: string;
  heroTitle: string;
  onReadFull: () => void;
  heroLeftRef: Ref<HTMLDivElement>;
  subtitleRef: Ref<HTMLDivElement>;
  titleRef: Ref<HTMLHeadingElement>;
}

export function HeroBanner({ activeTab, refreshing, userSign, heroTitle, onReadFull, heroLeftRef, subtitleRef, titleRef }: HeroBannerProps) {
  const zodiacData = ZODIAC_SIGNS[userSign] || ZODIAC_SIGNS['leo'];
  return (
    <motion.div
      className="premium-hero-banner"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{ opacity: refreshing ? 0.7 : 1 }}
    >
      <div className="premium-hero-cosmic-bg">
        <div className="cosmic-nebula nebula-1" />
        <div className="cosmic-nebula nebula-2" />
      </div>

      <div className="premium-glowing-ring" />

      <div className="premium-hero-left" ref={heroLeftRef}>
        <div className="premium-hero-subtitle" ref={subtitleRef}>
          <span className="subtitle-star">✦</span>
          <span>{TAB_LABELS[activeTab]}</span>
          <span className="subtitle-star">✦</span>
        </div>

        <h2 className="premium-hero-title" ref={titleRef}>{heroTitle}</h2>

        <motion.button
          className="premium-read-full-btn"
          whileHover={{ scale: 1.02, x: 3 }}
          whileTap={{ scale: 0.98 }}
          onClick={onReadFull}
        >
          READ FULL <ChevronRight size={18} />
        </motion.button>
      </div>

      <div className="premium-hero-right">
        <motion.div
          className="premium-tarot-card"
          initial={{ opacity: 0, rotateY: -20, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, rotateY: 0, scale: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
        >
          <div className="premium-card-glow" />
          <div className="premium-card-frame">
            <div className="premium-card-inner">
              <div className="premium-card-numeral">VIII</div>
              <img src={zodiacData.imageUrl} alt={userSign} className="premium-card-image" />
              <div className="premium-card-symbol">{zodiacData.symbol}</div>
              <div className="premium-card-sign-name">{userSign.toUpperCase()}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function EnergyCard({ type, icon, level, subtitle, delay }: { type: string; icon: React.ReactNode; level: string; subtitle: string; delay: number }) {
  return (
    <motion.div className={`premium-energy-card ${type}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <div className="premium-energy-icon">{icon}</div>
      <p className="premium-energy-level">{safeString(level || 'MEDIUM').toUpperCase()}</p>
      <p className="premium-energy-subtitle">{subtitle}</p>
      <div className="premium-energy-dots">
        {[...Array(5)].map((_, i) => {
          const lvl = safeString(level).toLowerCase();
          const active = i < (lvl.includes('very') ? 5 : lvl.includes('high') ? 4 : lvl.includes('medium') ? 3 : 2);
          return <div key={i} className={`dot ${active ? 'active' : ''}`} />;
        })}
      </div>
    </motion.div>
  );
}

export function EnergyGrid({ horoscope }: { horoscope: any }) {
  return (
    <div className="premium-energy-grid">
      <EnergyCard type="energy" icon={<Zap size={32} />} level={horoscope?.cosmic_energy_level} subtitle="Energy" delay={0.1} />
      <EnergyCard type="love" icon={<Heart size={32} />} level={horoscope?.love_energy_level} subtitle="Emotions" delay={0.2} />
      <EnergyCard type="career" icon={<BriefcaseIcon size={32} />} level={horoscope?.career_energy_level} subtitle="Opportunities" delay={0.3} />
    </div>
  );
}

export function MoonCard({ horoscope, moonDescription }: { horoscope: any; moonDescription: string }) {
  return (
    <motion.div className="premium-moon-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
      <div className="premium-moon-image-container">
        <div className="premium-moon-image" />
      </div>
      <div className="premium-moon-content">
        <h4 className="premium-moon-label">MOON INFO</h4>
        <h3 className="premium-moon-phase">{safeString(horoscope?.moon_phase)}</h3>
        <p className="premium-moon-sign">IN {safeString(horoscope?.moon_sign).toUpperCase()}</p>
        <p className="premium-moon-desc">{moonDescription}</p>
      </div>
    </motion.div>
  );
}

function PredictionCard({ type, icon, label, subtitle, delay, onClick }: { type: string; icon: React.ReactNode; label: string; subtitle: string; delay: number; onClick: () => void }) {
  return (
    <motion.div className={`premium-prediction-card ${type}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} onClick={onClick} whileHover={{ y: -5, scale: 1.02 }}>
      <div className="premium-prediction-icon">{icon}</div>
      <h4>{label}</h4>
      <p>{subtitle}</p>
    </motion.div>
  );
}

export function PredictionsGrid({ safeDate, onSelect }: { safeDate: string; onSelect: (key: string) => void }) {
  return (
    <div className="premium-predictions-grid">
      <PredictionCard type="general" icon={<Sparkles size={28} />} label="GENERAL" subtitle={getPredictionSubtitle('general', safeDate)} delay={0.5} onClick={() => onSelect('general')} />
      <PredictionCard type="love" icon={<Heart size={28} />} label="LOVE" subtitle={getPredictionSubtitle('love', safeDate)} delay={0.6} onClick={() => onSelect('love')} />
      <PredictionCard type="career" icon={<BriefcaseIcon size={28} />} label="CAREER" subtitle={getPredictionSubtitle('career', safeDate)} delay={0.7} onClick={() => onSelect('career')} />
      <PredictionCard type="health" icon={<Activity size={28} />} label="HEALTH" subtitle={getPredictionSubtitle('health', safeDate)} delay={0.8} onClick={() => onSelect('health')} />
      <PredictionCard type="finance" icon={<DollarSign size={28} />} label="FINANCE" subtitle={getPredictionSubtitle('finance', safeDate)} delay={0.9} onClick={() => onSelect('finance')} />
    </div>
  );
}