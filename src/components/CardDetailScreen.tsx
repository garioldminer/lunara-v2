import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Sparkles, Moon, Tags, Info, Home, Layers, Star, Orbit, User } from 'lucide-react';
import { tarotCards, SUITS } from '../data/tarotCards';
import './CardDetailScreen.css';

interface Props {
  cardId: number;
  onNavigate?: (screen: string) => void;
}

export default function CardDetailScreen({ cardId, onNavigate }: Props) {
  const card = tarotCards.find(c => c.id === cardId);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showBottomNav, setShowBottomNav] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // ✅ სმარტ layout: nav inset
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

  // ✅ ქვედა nav ამოდის ბოლომდე სქროლვისას
  useEffect(() => {
    const area = scrollAreaRef.current;
    if (!area) return;
    const onScroll = () => {
      const nearBottom = area.scrollTop + area.clientHeight >= area.scrollHeight - 60;
      setShowBottomNav(nearBottom);
    };
    area.addEventListener('scroll', onScroll, { passive: true });
    return () => area.removeEventListener('scroll', onScroll);
  }, []);

  // ✅ paddingBottom დინამიურად — 5px დაშორება Card Details → nav
  useEffect(() => {
    const area = scrollAreaRef.current;
    const nav = document.querySelector('.detail-bottom-nav') as HTMLElement;
    if (!area || !nav) return;

    const timer = setTimeout(() => {
      if (showBottomNav) {
        const navHeight = nav.getBoundingClientRect().height;
        area.style.paddingBottom = `${Math.round(navHeight) + 5}px`;
      } else {
        area.style.paddingBottom = '40px';
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [showBottomNav]);

  if (!card) {
    return (
      <div className="card-detail-screen">
        <div className="error-message">
          <p>Card not found</p>
          <button onClick={() => onNavigate?.('cards')}>Back to Cards</button>
        </div>
      </div>
    );
  }

  const getCardMeta = () => {
    if (card.arcana === 'major') return 'Major Arcana';
    if (card.suit && SUITS[card.suit]) return `${SUITS[card.suit].name} · ${SUITS[card.suit].element}`;
    return 'Minor Arcana';
  };

  const getSuitColor = () => {
    if (card.arcana === 'major') return '#C5A059';
    if (!card.suit) return '#C5A059';
    const colors: Record<string, string> = { wands: '#fb923c', cups: '#60a5fa', swords: '#cbd5e1', pentacles: '#34d399' };
    return colors[card.suit] || '#C5A059';
  };
  const suitColor = getSuitColor();

  const handleBack = () => { if (onNavigate) onNavigate('cards'); };

  return (
    <div className={`card-detail-screen ${isLoaded ? 'loaded' : ''}`} style={{ '--suit-color': suitColor } as React.CSSProperties}>
      <div className="detail-topbar">
        <h1 className="detail-title-top">Card Details</h1>
      </div>

      <div className="detail-subbar">
        <button className="detail-back-btn" onClick={handleBack}>
          <ArrowLeft size={16} />
        </button>
        <span className="detail-subbar-name">{card.name}</span>
      </div>

      <div className="detail-scroll-area" ref={scrollAreaRef}>
        <div className="detail-content">
          <div className="detail-card-image-container">
            {card.image_url ? (
              <img src={card.image_url} alt={card.name} className="detail-card-image" />
            ) : (
              <div className="detail-card-placeholder">
                <span className="detail-placeholder-number">{card.number}</span>
                <span className="detail-placeholder-name">{card.name}</span>
              </div>
            )}
          </div>

          <div className="detail-card-info">
            <div className="detail-card-number">{card.number}</div>
            <h1 className="detail-card-title">{card.name}</h1>
            <p className="detail-card-meta">{getCardMeta()}</p>
            <div className="detail-ornament">✦ ─── ✦</div>

            <div className="detail-section">
              <h2 className="detail-section-title"><Sparkles size={14} /> Meaning</h2>
              <p className="detail-section-text">{card.meaning}</p>
            </div>

            <div className="detail-section reversed">
              <h2 className="detail-section-title"><Moon size={14} /> Reversed Meaning</h2>
              <p className="detail-section-text">{card.reversed_meaning}</p>
            </div>

            <div className="detail-section">
              <h2 className="detail-section-title"><Tags size={14} /> Keywords</h2>
              <div className="detail-keywords">
                {card.keywords.map((keyword: string, idx: number) => (
                  <span key={idx} className="detail-keyword-tag">{keyword}</span>
                ))}
              </div>
            </div>

            <div className="detail-section reversed">
              <h2 className="detail-section-title"><Tags size={14} /> Reversed Keywords</h2>
              <div className="detail-keywords">
                {card.reversed_keywords.map((keyword: string, idx: number) => (
                  <span key={idx} className="detail-keyword-tag reversed">{keyword}</span>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <h2 className="detail-section-title"><Info size={14} /> Card Details</h2>
              <div className="detail-info-grid">
                <div className="detail-info-item">
                  <span className="detail-info-label">Arcana</span>
                  <span className="detail-info-value">{card.arcana === 'major' ? 'Major' : 'Minor'}</span>
                </div>
                {card.suit && (
                  <div className="detail-info-item">
                    <span className="detail-info-label">Suit</span>
                    <span className="detail-info-value">{SUITS[card.suit]?.name || card.suit}</span>
                  </div>
                )}
                {card.suit && (
                  <div className="detail-info-item">
                    <span className="detail-info-label">Element</span>
                    <span className="detail-info-value">{SUITS[card.suit]?.element || '-'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ ქვედა nav — ამოდის ბოლომდე სქროლვისას */}
      <div className={`detail-bottom-nav ${showBottomNav ? 'visible' : ''}`}>
        <button onClick={() => onNavigate?.('home')}><Home size={18} /><span>Home</span></button>
        <button onClick={() => onNavigate?.('cards')} className="active"><Layers size={18} /><span>Cards</span></button>
        <button onClick={() => onNavigate?.('horoscope')}><Star size={18} /><span>Horoscope</span></button>
        <button onClick={() => onNavigate?.('astro')}><Orbit size={18} /><span>Astro</span></button>
        <button onClick={() => onNavigate?.('profile')}><User size={18} /><span>Profile</span></button>
      </div>
    </div>
  );
}