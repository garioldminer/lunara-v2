import { useState, useEffect, useRef } from 'react';
import { tarotCards, SUITS } from '../data/tarotCards';
import { ArrowLeft, Search, Clock, TrendingUp, Heart } from 'lucide-react';
import { trackQuestProgress } from '../lib/questService';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import './CardsScreen.css';

type FilterType = 'all' | 'major' | 'minor';

interface Props {
  onNavigate?: (screen: string) => void;
}

interface CardStat {
  card_id: string;
  times_drawn: number;
}

export default function CardsScreen({ onNavigate }: Props) {
  const { user } = useUser();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedCard, setSelectedCard] = useState(tarotCards[0]);
  const [showPreview, setShowPreview] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState<typeof tarotCards[0][]>([]);
  const [cardStats, setCardStats] = useState<CardStat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [longPressCard, setLongPressCard] = useState<typeof tarotCards[0] | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout>();

  // Filter cards
  const filteredCards = tarotCards.filter((card) => {
    if (searchQuery) {
      return card.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    if (activeFilter === 'all') return true;
    if (activeFilter === 'major') return card.arcana === 'major';
    return card.arcana === 'minor';
  });

  // Count cards
  const counts = {
    all: tarotCards.length,
    major: tarotCards.filter(c => c.arcana === 'major').length,
    minor: tarotCards.filter(c => c.arcana === 'minor').length,
  };

  // Load card statistics
  useEffect(() => {
    if (!user || !supabase) return;
    
    const loadStats = async () => {
      try {
        const { data, error } = await supabase
          .from('readings')
          .select('cards')
          .eq('user_id', user.id);
        
        if (error) return;
        
        const cardCounts: Record<string, number> = {};
        data?.forEach(reading => {
          reading.cards?.forEach((card: any) => {
            cardCounts[card.id] = (cardCounts[card.id] || 0) + 1;
          });
        });
        
        const stats: CardStat[] = Object.entries(cardCounts).map(([card_id, times_drawn]) => ({
          card_id,
          times_drawn,
        }));
        
        setCardStats(stats);
      } catch (err) {
        console.error('Failed to load card stats:', err);
      }
    };
    
    loadStats();
  }, [user]);

  // Load recently viewed from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recently_viewed_cards');
    if (stored) {
      const ids = JSON.parse(stored) as string[];
      const cards = ids.map(id => tarotCards.find(c => c.id === id)).filter(Boolean) as typeof tarotCards[];
      setRecentlyViewed(cards);
    }
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('favorite_cards');
    if (stored) {
      setFavorites(new Set(JSON.parse(stored)));
    }
  }, []);

  // Telegram BackButton integration
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => {
        if (onNavigate) onNavigate('home');
      });
    }
    return () => {
      if (tg) tg.BackButton.hide();
    };
  }, [onNavigate]);

  // Auto-hide preview on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const scrollingDown = currentY > lastScrollY.current;
      
      if (scrollingDown && showPreview) {
        setShowPreview(false);
      }
      
      // Show preview after 2 seconds of no scroll
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      scrollTimeout.current = setTimeout(() => {
        setShowPreview(true);
      }, 2000);
      
      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [showPreview]);

  const handleCardSelect = (card: typeof tarotCards[0]) => {
    setSelectedCard(card);
    setShowPreview(true);
  };

  const handleLongPress = (card: typeof tarotCards[0]) => {
    setLongPressCard(card);
    setTimeout(() => setLongPressCard(null), 3000);
  };

  const handleViewCard = async () => {
    if (onNavigate && selectedCard) {
      // Add to recently viewed
      const updated = [selectedCard, ...recentlyViewed.filter(c => c.id !== selectedCard.id)].slice(0, 5);
      setRecentlyViewed(updated);
      localStorage.setItem('recently_viewed_cards', JSON.stringify(updated.map(c => c.id)));
      
      onNavigate(`card-detail-${selectedCard.id}`);
      
      if (user) {
        try {
          await trackQuestProgress(user.id, 'view_gallery', 1);
          console.log('✅ [Quest] view_gallery progress updated');
        } catch (error) {
          console.error('❌ [Quest] Error updating view gallery quest:', error);
        }
      }
    }
  };

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('home');
    }
  };

  const toggleFavorite = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavorites = new Set(favorites);
    if (newFavorites.has(cardId)) {
      newFavorites.delete(cardId);
    } else {
      newFavorites.add(cardId);
    }
    setFavorites(newFavorites);
    localStorage.setItem('favorite_cards', JSON.stringify([...newFavorites]));
  };

  const getCardMeta = (card: typeof tarotCards[0]) => {
    if (card.arcana === 'major') return 'Major Arcana';
    if (card.suit && SUITS[card.suit]) {
      return `${SUITS[card.suit].name} · ${SUITS[card.suit].element}`;
    }
    return 'Minor Arcana';
  };

  const getCardTimesDrawn = (cardId: string): number => {
    const stat = cardStats.find(s => s.card_id === cardId);
    return stat?.times_drawn || 0;
  };

  const getSuitColor = (card: typeof tarotCards[0]): string => {
    if (card.arcana === 'major') return '#C5A059';
    if (!card.suit) return '#C5A059';
    
    const colors: Record<string, string> = {
      wands: '#fb923c',    // orange
      cups: '#60a5fa',     // blue
      swords: '#cbd5e1',   // silver
      pentacles: '#34d399' // green
    };
    
    return colors[card.suit] || '#C5A059';
  };

  return (
    <div className="cards-screen">
      {/* Compact Header with Back + Filters + Title */}
      <div className="cards-header-compact">
        <div className="header-left">
          <button className="cards-back-btn" onClick={handleBack}>
            <ArrowLeft size={16} />
          </button>
          <div className="filter-tabs-inline">
            <button
              className={`filter-tab-compact ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              ALL <span className="count">({counts.all})</span>
            </button>
            <button
              className={`filter-tab-compact ${activeFilter === 'major' ? 'active' : ''}`}
              onClick={() => setActiveFilter('major')}
            >
              MAJOR <span className="count">({counts.major})</span>
            </button>
            <button
              className={`filter-tab-compact ${activeFilter === 'minor' ? 'active' : ''}`}
              onClick={() => setActiveFilter('minor')}
            >
              MINOR <span className="count">({counts.minor})</span>
            </button>
          </div>
        </div>
        <h1 className="cards-title-compact">Tarot Cards</h1>
      </div>

      {/* Recently Viewed Section */}
      {recentlyViewed.length > 0 && (
        <div className="recently-viewed-section">
          <div className="section-header">
            <Clock size={14} />
            <span>Recently Viewed</span>
          </div>
          <div className="recently-viewed-carousel">
            {recentlyViewed.map((card) => (
              <div
                key={card.id}
                className="recent-card-item"
                onClick={() => handleCardSelect(card)}
              >
                <img src={card.image_url} alt={card.name} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Toggle */}
      <div className="search-toggle">
        <button
          className={`search-btn ${showSearch ? 'active' : ''}`}
          onClick={() => setShowSearch(!showSearch)}
        >
          <Search size={16} />
          {showSearch ? 'Hide' : 'Search'}
        </button>
      </div>

      {/* Search Bar (collapsible) */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="search-bar-container"
          >
            <input
              type="text"
              className="search-input"
              placeholder="Search cards by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards Grid - 5 Columns */}
      <div className="cards-grid-enhanced">
        {filteredCards.map((card) => {
          const timesDrawn = getCardTimesDrawn(card.id);
          const isFavorite = favorites.has(card.id);
          const suitColor = getSuitColor(card);
          
          return (
            <motion.div
              key={card.id}
              className={`card-item-enhanced ${selectedCard?.id === card.id ? 'selected' : ''}`}
              onClick={() => handleCardSelect(card)}
              onLongPress={() => handleLongPress(card)}
              whileTap={{ scale: 0.95 }}
              style={{
                '--suit-color': suitColor,
              } as React.CSSProperties}
            >
              {card.image_url ? (
                <img 
                  src={card.image_url} 
                  alt={card.name}
                  className="card-image-enhanced"
                  loading="lazy"
                />
              ) : (
                <div className="card-image-placeholder-enhanced">
                  <span className="placeholder-number">{card.number}</span>
                  <span className="placeholder-text">{card.name}</span>
                </div>
              )}
              
              {/* Favorite Heart */}
              {isFavorite && (
                <div className="favorite-indicator">
                  <Heart size={12} fill="#ef4444" color="#ef4444" />
                </div>
              )}
              
              {/* Times Drawn Badge */}
              {timesDrawn > 0 && (
                <div className="times-drawn-badge">
                  <TrendingUp size={10} />
                  <span>{timesDrawn}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Long Press Quick Preview */}
      <AnimatePresence>
        {longPressCard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="quick-preview-popup"
          >
            <div className="quick-preview-content">
              <img src={longPressCard.image_url} alt={longPressCard.name} />
              <div className="quick-preview-info">
                <h4>{longPressCard.name}</h4>
                <p>{getCardMeta(longPressCard)}</p>
                <p className="quick-meaning">{longPressCard.meaning}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Preview (auto-hide on scroll) */}
      <AnimatePresence>
        {selectedCard && showPreview && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="floating-preview-enhanced"
          >
            <div className="preview-card-enhanced">
              <div className="preview-card-image-enhanced">
                {selectedCard.image_url ? (
                  <img 
                    src={selectedCard.image_url} 
                    alt={selectedCard.name}
                    className="preview-image-enhanced"
                  />
                ) : (
                  <div className="preview-placeholder">
                    <span>{selectedCard.name}</span>
                  </div>
                )}
              </div>
              <div className="preview-info-enhanced">
                <h3>{selectedCard.name}</h3>
                <p className="preview-arcana-enhanced">
                  {getCardMeta(selectedCard)}
                </p>
                <p className="preview-meaning-enhanced">{selectedCard.meaning}</p>
                {getCardTimesDrawn(selectedCard.id) > 0 && (
                  <div className="preview-stats">
                    <TrendingUp size={12} />
                    <span>Drawn {getCardTimesDrawn(selectedCard.id)} times</span>
                  </div>
                )}
              </div>
              <button
                className="favorite-btn"
                onClick={(e) => toggleFavorite(selectedCard.id, e)}
              >
                <Heart
                  size={18}
                  fill={favorites.has(selectedCard.id) ? '#ef4444' : 'none'}
                  color={favorites.has(selectedCard.id) ? '#ef4444' : '#C5A059'}
                />
              </button>
            </div>
            <button className="view-card-btn-enhanced" onClick={handleViewCard}>
              VIEW CARD
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}