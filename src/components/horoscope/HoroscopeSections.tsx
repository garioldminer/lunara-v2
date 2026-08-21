import { motion } from 'framer-motion';
import { ChevronRight, Zap, Heart, Briefcase as BriefcaseIcon, Sparkles, Activity, DollarSign, Star } from 'lucide-react';
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
    <div
      className="premium-hero-banner"
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

        <h2 className="premium-hero-title" ref={titleRef}>
          <span>{heroTitle}</span>
        </h2>

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
        <div className="premium-tarot-card">
          <div className="premium-card-glow" />
          <div className="premium-card-frame">
            <div className="premium-card-inner">
              <div className="premium-card-numeral">VIII</div>
              <img src={zodiacData.imageUrl} alt={userSign} className="premium-card-image" />
              <div className="premium-card-symbol">{zodiacData.symbol}</div>
              <div className="premium-card-sign-name">{userSign.toUpperCase()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EnergyCard({ type, icon, level, subtitle }: { type: string; icon: React.ReactNode; level: string; subtitle: string }) {
  return (
    <div className={`premium-energy-card ${type}`}>
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
    </div>
  );
}

// ✅ ახალი: isSummary prop — summary-სთვის overall_energy-ს ვიყენებთ სამივე card-ზე
interface EnergyGridProps {
  horoscope: any;
  isSummary?: boolean;
}

export function EnergyGrid({ horoscope, isSummary = false }: EnergyGridProps) {
  if (isSummary) {
    const overallEnergy = safeString(horoscope?.overall_energy || 'MEDIUM');
    return (
      <div className="premium-energy-grid">
        <EnergyCard type="energy" icon={<Zap size={32} />} level={overallEnergy} subtitle="Overall" />
        <EnergyCard type="love" icon={<Heart size={32} />} level={overallEnergy} subtitle="Love" />
        <EnergyCard type="career" icon={<BriefcaseIcon size={32} />} level={overallEnergy} subtitle="Career" />
      </div>
    );
  }

  return (
    <div className="premium-energy-grid">
      <EnergyCard type="energy" icon={<Zap size={32} />} level={horoscope?.cosmic_energy_level} subtitle="Energy" />
      <EnergyCard type="love" icon={<Heart size={32} />} level={horoscope?.love_energy_level} subtitle="Emotions" />
      <EnergyCard type="career" icon={<BriefcaseIcon size={32} />} level={horoscope?.career_energy_level} subtitle="Opportunities" />
    </div>
  );
}

export function MoonCard({ horoscope, moonDescription }: { horoscope: any; moonDescription: string }) {
  // ✅ თუ moon data არ არის (summary) — არ ვაჩვენოთ
  if (!horoscope?.moon_phase && !horoscope?.moon_sign) {
    return null;
  }

  return (
    <div className="premium-moon-card">
      <div className="premium-moon-image-container">
        <div className="premium-moon-image" />
      </div>
      <div className="premium-moon-content">
        <h4 className="premium-moon-label">MOON INFO</h4>
        <h3 className="premium-moon-phase">{safeString(horoscope?.moon_phase)}</h3>
        <p className="premium-moon-sign">IN {safeString(horoscope?.moon_sign).toUpperCase()}</p>
        <p className="premium-moon-desc">{moonDescription}</p>
      </div>
    </div>
  );
}

function PredictionCard({ type, icon, label, subtitle, onClick }: { type: string; icon: React.ReactNode; label: string; subtitle: string; onClick: () => void }) {
  return (
    <div className={`premium-prediction-card ${type}`} onClick={onClick}>
      <div className="premium-prediction-icon">{icon}</div>
      <h4>{label}</h4>
      <p>{subtitle}</p>
    </div>
  );
}

// ✅ ახალი: isSummary prop — summary-სთვის 4 cards (general, key_factors, love, career)
interface PredictionsGridProps {
  safeDate: string;
  onSelect: (key: string) => void;
  isSummary?: boolean;
}

export function PredictionsGrid({ safeDate, onSelect, isSummary = false }: PredictionsGridProps) {
  if (isSummary) {
    return (
      <div className="premium-predictions-grid">
        <PredictionCard 
          type="general" 
          icon={<Sparkles size={28} />} 
          label="NARRATIVE" 
          subtitle="Overall cosmic story for this period" 
          onClick={() => onSelect('general')} 
        />
        <PredictionCard 
          type="career" 
          icon={<Activity size={28} />} 
          label="KEY FACTORS" 
          subtitle="Major planetary influences at play" 
          onClick={() => onSelect('key_factors')} 
        />
        <PredictionCard 
          type="love" 
          icon={<Heart size={28} />} 
          label="LOVE" 
          subtitle="Relationships & emotional currents" 
          onClick={() => onSelect('love')} 
        />
        <PredictionCard 
          type="career" 
          icon={<BriefcaseIcon size={28} />} 
          label="CAREER" 
          subtitle="Work, focus & opportunities" 
          onClick={() => onSelect('career')} 
        />
      </div>
    );
  }

  return (
    <div className="premium-predictions-grid">
      <PredictionCard type="general" icon={<Sparkles size={28} />} label="GENERAL" subtitle={getPredictionSubtitle('general', safeDate)} onClick={() => onSelect('general')} />
      <PredictionCard type="love" icon={<Heart size={28} />} label="LOVE" subtitle={getPredictionSubtitle('love', safeDate)} onClick={() => onSelect('love')} />
      <PredictionCard type="career" icon={<BriefcaseIcon size={28} />} label="CAREER" subtitle={getPredictionSubtitle('career', safeDate)} onClick={() => onSelect('career')} />
      <PredictionCard type="health" icon={<Activity size={28} />} label="HEALTH" subtitle={getPredictionSubtitle('health', safeDate)} onClick={() => onSelect('health')} />
      <PredictionCard type="finance" icon={<DollarSign size={28} />} label="FINANCE" subtitle={getPredictionSubtitle('finance', safeDate)} onClick={() => onSelect('finance')} />
    </div>
  );
}

// ═══════════════════════════════════════════
// 📅 SUMMARY VIEW (legacy — ახლა აღარ გამოიყენება main flow-ში)
// დარჩენილია compatibility-სთვის
// ═══════════════════════════════════════════

export function SummaryView({ 
  summary 
}: { 
  summary: any;
}) {
  const energyLevel = safeString(summary?.overall_energy || 'Medium');

  return (
    <div className="summary-view">
      <div className="summary-section summary-general">
        <div className="summary-section-header">
          <div className="summary-section-icon">
            <Sparkles size={20} />
          </div>
          <h3>OVERALL NARRATIVE</h3>
        </div>
        <p className="summary-text">
          {safeString(summary?.general_summary || 'The cosmic narrative is unfolding...')}
        </p>
      </div>

      {summary?.key_factors && (
        <div className="summary-section summary-factors">
          <div className="summary-section-header">
            <div className="summary-section-icon">
              <Activity size={20} />
            </div>
            <h3>KEY INFLUENCES</h3>
          </div>
          <p className="summary-text">
            {safeString(summary.key_factors)}
          </p>
        </div>
      )}

      {summary?.love_summary && (
        <div className="summary-section summary-love">
          <div className="summary-section-header">
            <div className="summary-section-icon summary-love-icon">
              <Heart size={20} />
            </div>
            <h3>LOVE & RELATIONSHIPS</h3>
          </div>
          <p className="summary-text">
            {safeString(summary.love_summary)}
          </p>
        </div>
      )}

      {summary?.career_summary && (
        <div className="summary-section summary-career">
          <div className="summary-section-header">
            <div className="summary-section-icon summary-career-icon">
              <BriefcaseIcon size={20} />
            </div>
            <h3>CAREER & FOCUS</h3>
          </div>
          <p className="summary-text">
            {safeString(summary.career_summary)}
          </p>
        </div>
      )}

      <div className="summary-footer">
        <div className="summary-lucky-grid">
          {summary?.lucky_color && (
            <div className="summary-lucky-item">
              <span className="summary-lucky-label">LUCKY COLOR</span>
              <span className="summary-lucky-value">{summary.lucky_color}</span>
            </div>
          )}
          {summary?.lucky_number && (
            <div className="summary-lucky-item">
              <span className="summary-lucky-label">LUCKY NUMBER</span>
              <span className="summary-lucky-value">{summary.lucky_number}</span>
            </div>
          )}
          <div className="summary-lucky-item">
            <span className="summary-lucky-label">ENERGY</span>
            <span className="summary-lucky-value summary-energy">{energyLevel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}