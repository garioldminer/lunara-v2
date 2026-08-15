import { useState, useEffect, useRef } from 'react';
import { tarotCards, SUITS } from '../data/tarotCards';
import { ArrowLeft, TrendingUp, Heart, X, Ruler } from 'lucide-react';
import { trackQuestProgress } from '../lib/questService';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import CardsLayoutDebugger from './CardsLayoutDebugger';
import './CardsScreen.css';

type FilterType = 'all' | 'major' | 'minor';

interface Props { onNavigate?: (screen: string) => void; }
interface CardStat { card_id: string; times_drawn: number; }

export default function CardsScreen({ onNavigate }: Props) {
  const { user } = useUser();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedCard, setSelectedCard] = useState<typeof tarotCards[0] | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [cardStats, setCardStats] = useState<CardStat[]>([]);
  const [longPressCard, setLongPressCard] = useState<typeof tarotCards[0] | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showCardsDebug, setShowCardsDebug] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const longPressTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  const filteredCards = tarotCards.filter((card) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'major') return card.arcana === 'major';
    return card.arcana === 'minor';
  });

  const counts = {
    all: tarotCards.length,
    major: tarotCards.filter(c => c.arcana === 'major').length,
    minor: tarotCards.filter(c => c.arcana === 'minor').length,
  };

  useEffect(() => {
    if (!user || !supabase) return;
    const loadStats = async () => {
      try {
        const { data, error } = await supabase!.from('readings').select('cards').eq('user_id', user.id);
        if (error || !data) return;
        const cardCounts: Record<string, number> = {};
        data.forEach(reading => {
          (reading.cards as any[])?.forEach((card: any) => {
            const cid = String(card.id);
            cardCounts[cid] = (cardCounts[cid] || 0) + 1;
          });
        });
        setCardStats(Object.entries(cardCounts).map(([card_id, times_drawn]) => ({ card_id, times_drawn })));
      } catch (err) { console.error('Failed to load card stats:', err); }
    };
    loadStats();
  }, [user]);

  useEffect(() => {
    const stored = localStorage.getItem('favorite_cards');
    if (stored) { try { setFavorites(new Set(JSON.parse(stored) as string[])); } catch {} }
  }, []);

  // ✅ Auto-hide preview on INNER scroll (scroll area-ზე, არა window-ზე)
  useEffect(() => {
    const area = scrollAreaRef.current;
    if (!area) return;
    const handleScroll = () => {
      const cur = area.scrollTop;
      if (cur > lastScrollTop.current && showPreview) setShowPreview(false);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => { if (selectedCard) setShowPreview(true); }, 2000);
      lastScrollTop.current = cur;
    };
    area.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      area.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [showPreview, selectedCard]);

  // ✅ სმარტ Layout v3: flex + inner scroll. აყენებს მხოლოდ horizontal + bottom.
  useEffect(() => {
    const apply = () => {
      const scrollArea = document.querySelector('.cards-scroll-area') as HTMLElement;
      const grid = document.querySelector('.cards-grid-enhanced') as HTMLElement;
      const nav = document.querySelector('.bottom-nav-container') as HTMLElement;
      if (!scrollArea || !grid) return;

      if (nav) {
        const nb = nav.getBoundingClientRect();
        // ✅ HORIZONTAL: grid კიდეები = nav კიდეები
        grid.style.paddingLeft = `${Math.round(nb.left)}px`;
        grid.style.paddingRight = `${Math.round(window.innerWidth - nb.right)}px`;
        // ✅ BOTTOM: ბოლო კარტი დაჯდება nav-ის ზემოთ + 5px
        scrollArea.style.paddingBottom = `${Math.round(window.innerHeight - nb.top) + 5}px`;
      }
    };
    apply();
    const t1 = setTimeout(apply, 300);
    const t2 = setTimeout(apply, 800);
    const t3 = setTimeout(apply, 1500);
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      window.removeEventListener('resize', apply);
      window.removeEventListener('orientationchange', apply);
    };
  }, []);

  const handleCardSelect = (card: typeof tarotCards[0]) => {
    setSelectedCard(card);
    setShowPreview(true);
  };

  const handleClosePreview = () => { setSelectedCard(null); setShowPreview(false); };

  const handlePointerDown = (card: typeof tarotCards[0]) => {
    longPressTimer.current = setTimeout(() => {
      setLongPressCard(card);
      setTimeout(() => setLongPressCard(null), 3000);
    }, 500);
  };
  const handlePointerUp = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = undefined; }
  };

  const handleViewCard = async () => {
    if (onNavigate && selectedCard) {
      onNavigate(`card-detail-${selectedCard.id}`);
      if (user) { try { await trackQuestProgress(user.id, 'view_gallery', 1); } catch (e) {} }
    }
  };

  const handleBack = () => { if (onNavigate) onNavigate('home'); };

  const toggleFavorite = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nf = new Set(favorites);
    if (nf.has(cardId)) nf.delete(cardId); else nf.add(cardId);
    setFavorites(nf);
    localStorage.setItem('favorite_cards', JSON.stringify([...nf]));
  };

  const getCardMeta = (card: typeof tarotCards[0]) => {
    if (card.arcana === 'major') return 'Major Arcana';
    if (card.suit && SUITS[card.suit]) return `${SUITS[card.suit].name} · ${SUITS[card.suit].element}`;
    return 'Minor Arcana';
  };

  const getCardTimesDrawn = (cardId: number): number => cardStats.find(s => s.card_id === String(cardId))?.times_drawn || 0;

  const getSuitColor = (card: typeof tarotCards[0]): string => {
    if (card.arcana === 'major') return '#C5A059';
    if (!card.suit) return '#C5A059';
    const colors: Record<string, string> = { wands: '#fb923c', cups: '#60a5fa', swords: '#cbd5e1', pentacles: '#34d399' };
    return colors[card.suit] || '#C5A059';
  };

  return (
    <div className="cards-screen">
      {/* ✅ TOPBAR — Telegram header ზონაში, flex-shrink:0 */}
      <div className="cards-topbar">
        <h1 className="cards-title-top">Tarot Cards</h1>
      </div>

      {/* ✅ SUBBAR — flex-shrink:0, არასდროს დაიფარება */}
      <div className="cards-subbar">
        <button className="cards-back-btn" onClick={handleBack}>
          <ArrowLeft size={16} />
        </button>
        <button className={`filter-tab-compact ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>
          ALL <span className="count">({counts.all})</span>
        </button>
        <button className={`filter-tab-compact ${activeFilter === 'major' ? 'active' : ''}`} onClick={() => setActiveFilter('major')}>
          MAJOR <span className="count">({counts.major})</span>
        </button>
        <button className={`filter-tab-compact ${activeFilter === 'minor' ? 'active' : ''}`} onClick={() => setActiveFilter('minor')}>
          MINOR <span className="count">({counts.minor})</span>
        </button>
      </div>

      {/* ✅ SCROLL AREA — მხოლოდ ეს სქროლდება */}
      <div className="cards-scroll-area" ref={scrollAreaRef}>
        <div className="cards-grid-enhanced">
          {filteredCards.map((card) => {
            const timesDrawn = getCardTimesDrawn(card.id);
            const cardIdStr = String(card.id);
            const isFavorite = favorites.has(cardIdStr);
            const suitColor = getSuitColor(card);
            return (
              <motion.div
                key={card.id}
                className={`card-item-enhanced ${selectedCard?.id === card.id ? 'selected' : ''}`}
                onClick={() => handleCardSelect(card)}
                onPointerDown={() => handlePointerDown(card)}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                whileTap={{ scale: 0.95 }}
                style={{ '--suit-color': suitColor } as React.CSSProperties}
              >
                {card.image_url ? (
                  <img src={card.image_url} alt={card.name} className="card-image-enhanced" loading="lazy" />
                ) : (
                  <div className="card-image-placeholder-enhanced">
                    <span className="placeholder-number">{card.number}</span>
                    <span className="placeholder-text">{card.name}</span>
                  </div>
                )}
                {isFavorite && (
                  <div className="favorite-indicator"><Heart size={12} fill="#ef4444" color="#ef4444" /></div>
                )}
                {timesDrawn > 0 && (
                  <div className="times-drawn-badge"><TrendingUp size={10} /><span>{timesDrawn}</span></div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ✅ DEBUG BUTTON — მხოლოდ admin */}
      {user?.is_admin && (
        <button
          onClick={() => setShowCardsDebug(true)}
          style={{
            position: 'fixed', top: '50%', right: 8, transform: 'translateY(-50%)',
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))',
            border: '2px solid rgba(255,255,255,0.2)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 9990,
            boxShadow: '0 4px 16px rgba(16,185,129,0.5), 0 0 20px rgba(16,185,129,0.3)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          }}
          title="Cards Layout Debugger"
        >
          <Ruler size={18} />
        </button>
      )}

      <AnimatePresence>
        {longPressCard && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="quick-preview-popup">
            <div className="quick-preview-content">
              {longPressCard.image_url && <img src={longPressCard.image_url} alt={longPressCard.name} />}
              <div className="quick-preview-info">
                <h4>{longPressCard.name}</h4>
                <p>{getCardMeta(longPressCard)}</p>
                <p className="quick-meaning">{longPressCard.meaning}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCard && showPreview && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="floating-preview-enhanced"
          >
            <button className="preview-close-btn" onClick={handleClosePreview} aria-label="Close preview">
              <X size={14} />
            </button>
            <div className="preview-card-enhanced">
              <div className="preview-card-image-enhanced">
                {selectedCard.image_url ? (
                  <img src={selectedCard.image_url} alt={selectedCard.name} className="preview-image-enhanced" />
                ) : (
                  <div className="preview-placeholder"><span>{selectedCard.name}</span></div>
                )}
              </div>
              <div className="preview-info-enhanced">
                <h3>{selectedCard.name}</h3>
                <p className="preview-arcana-enhanced">{getCardMeta(selectedCard)}</p>
                <p className="preview-meaning-enhanced">{selectedCard.meaning}</p>
                {getCardTimesDrawn(selectedCard.id) > 0 && (
                  <div className="preview-stats"><TrendingUp size={12} /><span>Drawn {getCardTimesDrawn(selectedCard.id)} times</span></div>
                )}
              </div>
              <button className="favorite-btn" onClick={(e) => toggleFavorite(String(selectedCard.id), e)}>
                <Heart size={18} fill={favorites.has(String(selectedCard.id)) ? '#ef4444' : 'none'} color={favorites.has(String(selectedCard.id)) ? '#ef4444' : '#C5A059'} />
              </button>
            </div>
            <button className="view-card-btn-enhanced" onClick={handleViewCard}>VIEW CARD</button>
          </motion.div>
        )}
      </AnimatePresence>

      {user?.is_admin && (
        <CardsLayoutDebugger open={showCardsDebug} onClose={() => setShowCardsDebug(false)} />
      )}
    </div>
  );
}