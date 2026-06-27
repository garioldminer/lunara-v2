import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import './AstroScreen.css';

const BG_IMAGE = 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/backgrounds/space-bg.webp';
const ZODIAC_WHEEL = 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/test/lucid-origin_a_cinematic_photo_of_Ultra_ornate_golden_zodiac_wheel_12_astrological_symbols_ar-0%20(1)-Photoroom.png';
const MOON_IMAGE = 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/planets/moon.webp';

type ZodiacSign = {
  name: string;
  symbol: string;
  image?: string;
};

const ZODIAC_SIGNS: Record<string, ZodiacSign> = {
  aries: { 
    name: 'Aries', 
    symbol: '',
    image: 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/assets/test/Aries.png'
  },
  taurus: { name: 'Taurus', symbol: '♉' },
  gemini: { name: 'Gemini', symbol: '♊' },
  cancer: { name: 'Cancer', symbol: '♋' },
  leo: { name: 'Leo', symbol: '♌' },
  virgo: { name: 'Virgo', symbol: '♍' },
  libra: { name: 'Libra', symbol: '' },
  scorpio: { name: 'Scorpio', symbol: '♏' },
  sagittarius: { name: 'Sagittarius', symbol: '♐' },
  capricorn: { name: 'Capricorn', symbol: '♑' },
  aquarius: { name: 'Aquarius', symbol: '♒' },
  pisces: { name: 'Pisces', symbol: '♓' }
};

// Element position type
type ElementPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
  saved: boolean;
};

// Default positions
const DEFAULT_POSITIONS: Record<string, ElementPosition> = {
  zodiac: { x: 50, y: 50, width: 320, height: 320, saved: false },
  lunar: { x: 50, y: 400, width: 200, height: 300, saved: false }
};

export default function AstroScreen() {
  const [userSign] = useState<string>('aries');
  const [moonIllumination] = useState(78);
  const [editMode, setEditMode] = useState(false);
  const [positions, setPositions] = useState<Record<string, ElementPosition>>(() => {
    const saved = localStorage.getItem('astro-element-positions');
    return saved ? JSON.parse(saved) : DEFAULT_POSITIONS;
  });

  const currentSign = ZODIAC_SIGNS[userSign];

  // Save positions to localStorage
  const savePositions = () => {
    localStorage.setItem('astro-element-positions', JSON.stringify(positions));
    setPositions(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[key] = { ...updated[key], saved: true };
      });
      return updated;
    });
    alert('✅ პოზიციები შენახულია!');
  };

  // Reset positions
  const resetPositions = () => {
    localStorage.removeItem('astro-element-positions');
    setPositions(DEFAULT_POSITIONS);
  };

  return (
    <div className="astro-screen">
      {/* 🌌 Background */}
      <div 
        className="cosmic-background"
        style={{ backgroundImage: `url(${BG_IMAGE})` }}
      />

      {/* 🎛️ Edit Mode Controls */}
      {editMode && (
        <div className="edit-controls">
          <button onClick={savePositions} className="edit-btn save-btn">
            💾 შენახვა
          </button>
          <button onClick={resetPositions} className="edit-btn reset-btn">
            🔄 Reset
          </button>
          <button onClick={() => setEditMode(false)} className="edit-btn exit-btn">
            ✕ გასვლა
          </button>
        </div>
      )}

      {!editMode && (
        <button 
          className="edit-mode-toggle"
          onClick={() => setEditMode(true)}
        >
          ✏️ Edit Mode
        </button>
      )}

      {/*  Content */}
      <div className="astro-content">
        
        {/* 🎯 ZODIAC WHEEL - Draggable */}
        <DraggableElement
          id="zodiac"
          position={positions.zodiac}
          editMode={editMode}
          onPositionChange={(pos) => setPositions(prev => ({ ...prev, zodiac: pos }))}
        >
          <div className="zodiac-wrapper">
            {/* LAYER 1: ნიშანი (ქვედა ფენა) */}
            <div className="user-sign-layer">
              <div className="user-sign-circle">
                {currentSign?.image ? (
                  <img 
                    src={currentSign.image} 
                    alt={currentSign.name}
                    className="user-sign-image"
                  />
                ) : (
                  <span className="user-sign-symbol">{currentSign?.symbol}</span>
                )}
              </div>
            </div>

            {/* LAYER 2: ბორბალი (ზედა ფენა) */}
            <motion.div 
              className="zodiac-wheel-layer"
              animate={{ rotate: 360 }}
              transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            >
              <img src={ZODIAC_WHEEL} alt="Zodiac Wheel" className="zodiac-image" />
            </motion.div>

            <div className="zodiac-glow" />
          </div>
        </DraggableElement>

        {/* 🌙 LUNAR PHASE - Draggable */}
        <DraggableElement
          id="lunar"
          position={positions.lunar}
          editMode={editMode}
          onPositionChange={(pos) => setPositions(prev => ({ ...prev, lunar: pos }))}
        >
          <div className="lunar-section">
            <div className="lunar-header">
              <h2 className="lunar-title">LUNAR PHASE & WAXING GIBBOUS</h2>
            </div>

            <div className="lunar-content">
              <div className="lunar-moon-container">
                <div className="lunar-moon-circle">
                  <img src={MOON_IMAGE} alt="Moon" className="lunar-moon-image" />
                </div>
              </div>

              <div className="lunar-stats">
                <div className="lunar-stat-item">
                  <span className="stat-percentage">{moonIllumination}%</span>
                  <span className="stat-label">Illuminated</span>
                </div>
                <div className="lunar-divider" />
                <div className="lunar-stat-item">
                  <span className="stat-percentage">{moonIllumination}%</span>
                  <span className="stat-label">energy</span>
                </div>
              </div>

              <p className="lunar-description">
                High energy, take action towards your goals.
              </p>

              <div className="lunar-ritual">
                <span className="ritual-label">Best Ritual:</span>
                <span className="ritual-value">Release & Manifest</span>
              </div>
            </div>
          </div>
        </DraggableElement>

        <div className="empty-space" />
      </div>
    </div>
  );
}

// ============================================
// DRAGGABLE ELEMENT COMPONENT
// ============================================
interface DraggableElementProps {
  id: string;
  position: ElementPosition;
  editMode: boolean;
  onPositionChange: (pos: ElementPosition) => void;
  children: React.ReactNode;
}

function DraggableElement({ id, position, editMode, onPositionChange, children }: DraggableElementProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Mouse down - start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editMode) return;
    if ((e.target as HTMLElement).classList.contains('resize-handle')) return;
    
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  // Mouse move - dragging or resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onPositionChange({
          ...position,
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
          saved: false
        });
      } else if (isResizing) {
        const newWidth = Math.max(100, e.clientX - position.x);
        const newHeight = Math.max(100, e.clientY - position.y);
        onPositionChange({
          ...position,
          width: newWidth,
          height: newHeight,
          saved: false
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, position, dragOffset, onPositionChange]);

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!editMode) return;
    if ((e.target as HTMLElement).classList.contains('resize-handle')) return;
    
    const touch = e.touches[0];
    setIsDragging(true);
    setDragOffset({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      onPositionChange({
        ...position,
        x: touch.clientX - dragOffset.x,
        y: touch.clientY - dragOffset.y,
        saved: false
      });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, position, dragOffset, onPositionChange]);

  return (
    <div
      ref={elementRef}
      className={`draggable-element ${editMode ? 'edit-mode' : ''} ${isDragging ? 'dragging' : ''} ${position.saved ? 'saved' : ''}`}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${position.width}px`,
        height: 'auto',
        zIndex: position.saved ? 5 : 10
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {children}
      
      {/* Resize handle - only in edit mode */}
      {editMode && (
        <div
          className="resize-handle"
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsResizing(true);
          }}
        >
          <div className="resize-icon">⤡</div>
        </div>
      )}

      {/* Saved indicator */}
      {position.saved && (
        <div className="saved-indicator">✓</div>
      )}
    </div>
  );
}