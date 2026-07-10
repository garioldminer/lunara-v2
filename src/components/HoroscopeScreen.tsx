import { useState, useEffect, useRef } from 'react';
import { useHoroscope } from '../hooks/useHoroscope';
import { useUser } from '../context/UserContext';
import { ZODIAC_SIGNS, BACKGROUND_IMAGE } from '../data/zodiacData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Moon, Star, Activity,
  Sparkles, RotateCcw, Share2, Sun, ChevronRight,
  X, Download, Heart, Briefcase, Palette, Hash, DollarSign, Zap, Briefcase as BriefcaseIcon,
  ChevronDown, Bug, CheckCircle, AlertCircle, Clock, TrendingUp
} from 'lucide-react';
import ShareCardPreview from './ShareCardPreview';
import LoadingScreen from './LoadingScreen';
import SignSelectionScreen from './SignSelectionScreen';
import { logReading } from '../lib/adminService';
import './HoroscopeScreen.css';

type TabType = 'today' | 'tomorrow' | 'weekly' | 'monthly';

interface Props {
  onNavigate?: (screen: string) => void;
}

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

// 🆕 DEBUG TYPES
interface DebugLog {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warn' | 'perf';
  category: string;
  message: string;
  data?: any;
}

interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  phases: {
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
  }[];
}

const ERROR_MESSAGES = [
  "The stars are clouded today. Please try again.",
  "Cosmic connection interrupted. Mercury might be in retrograde.",
  "The universe needs a moment. Try again in a few minutes.",
  "The celestial wires are crossed. Please retry."
];

const TAB_LABELS: Record<TabType, string> = {
  today: "TODAY'S HOROSCOPE",
  tomorrow: "TOMORROW'S HOROSCOPE",
  weekly: "WEEKLY HOROSCOPE",
  monthly: "MONTHLY HOROSCOPE"
};

const TAB_PREDICTIONS_TITLE: Record<TabType, string> = {
  today: "TODAY'S PREDICTIONS",
  tomorrow: "TOMORROW'S PREDICTIONS",
  weekly: "THIS WEEK'S PREDICTIONS",
  monthly: "THIS MONTH'S PREDICTIONS"
};

const TAB_HERO_FALLBACK: Record<TabType, string> = {
  today: "Cosmic winds fuel your mind",
  tomorrow: "Tomorrow holds new possibilities",
  weekly: "A week of transformation awaits",
  monthly: "The month brings cosmic shifts"
};

const PREDICTION_SUBTITLES = {
  general: ["Insight", "Guidance", "Wisdom", "Vision", "Clarity"],
  love: ["Connections", "Romance", "Passion", "Harmony", "Devotion"],
  career: ["Path", "Growth", "Success", "Ambition", "Progress"],
  health: ["Wellness", "Vitality", "Balance", "Strength", "Healing"],
  finance: ["Prosperity", "Abundance", "Wealth", "Fortune", "Gains"]
};

const getEnergyEmojis = (level: string | undefined, emoji: string): string => {
  const normalized = level?.toLowerCase() || 'medium';
  if (normalized.includes('very')) return `${emoji}${emoji}${emoji}${emoji}`;
  if (normalized.includes('high')) return `${emoji}${emoji}${emoji}`;
  if (normalized.includes('medium')) return `${emoji}${emoji}`;
  if (normalized.includes('low')) return `${emoji}`;
  return `${emoji}${emoji}`;
};

const getPredictionSubtitle = (category: keyof typeof PREDICTION_SUBTITLES, date?: string): string => {
  const subtitles = PREDICTION_SUBTITLES[category];
  if (!date) return subtitles[0];
  const dayIndex = new Date(date).getDate() % subtitles.length;
  return subtitles[dayIndex];
};

const getMoonDescription = (moonPhase?: string): string => {
  if (!moonPhase) return "The moon guides your path through the cosmic landscape.";
  
  const phaseDescriptions: Record<string, string> = {
    'New Moon': "A time for new beginnings. Set your intentions and plant seeds for the future.",
    'Waxing Crescent': "Building momentum. Take action on your dreams and watch them grow.",
    'First Quarter': "Time for decisions. Push forward with determination and courage.",
    'Waxing Gibbous': "Refining your path. Make adjustments and stay focused on your goals.",
    'Full Moon': "Peak energy! Celebrate achievements and release what no longer serves you.",
    'Waning Gibbous': "Sharing wisdom. Express gratitude and share your light with others.",
    'Last Quarter': "Letting go. Release old patterns and make space for the new.",
    'Waning Crescent': "Rest and reflect. Prepare for the next cycle with inner peace."
  };
  
  return phaseDescriptions[moonPhase] || "The moon guides your path through the cosmic landscape.";
};

function ToastNotification({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div 
      className={`toast toast-${toast.type}`}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    >
      <div className="toast-content">
        <span className="toast-icon">
          {toast.type === 'success' && '✨'}
          {toast.type === 'error' && '⚠️'}
          {toast.type === 'info' && 'ℹ️'}
        </span>
        <span className="toast-message">{toast.message}</span>
      </div>
      <button className="toast-close" onClick={onClose}>
        <X size={14} />
      </button>
    </motion.div>
  );
}

// 🆕 DEBUG PANEL COMPONENT
function DebugPanel({ 
  logs, 
  metrics, 
  diagnostics, 
  isVisible, 
  onToggle 
}: { 
  logs: DebugLog[];
  metrics: PerformanceMetrics;
  diagnostics: { type: 'success' | 'error' | 'warn'; message: string }[];
  isVisible: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      {/* Debug Toggle Button */}
      <motion.button
        className="debug-toggle-btn"
        onClick={onToggle}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '16px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: isVisible ? '#10b981' : '#ef4444',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Bug size={24} />
      </motion.button>

      {/* Debug Panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="debug-panel"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            style={{
              position: 'fixed',
              top: '60px',
              right: '16px',
              bottom: '140px',
              width: '320px',
              maxWidth: 'calc(100vw - 32px)',
              background: 'rgba(10, 6, 0, 0.95)',
              border: '2px solid rgba(255, 229, 102, 0.4)',
              borderRadius: '12px',
              padding: '12px',
              zIndex: 9999,
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: '11px',
              color: '#ffe566',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
            }}
          >
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid rgba(255, 229, 102, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bug size={16} color="#ffe566" />
                <strong style={{ fontSize: '13px' }}>DEBUG PANEL</strong>
              </div>
              <span style={{ fontSize: '10px', color: '#c87800' }}>
                {logs.length} logs
              </span>
            </div>

            {/* Performance Metrics */}
            <div style={{ 
              background: 'rgba(96, 165, 250, 0.1)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              borderRadius: '8px',
              padding: '8px',
              marginBottom: '12px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                marginBottom: '6px',
                color: '#60a5fa',
                fontWeight: 'bold'
              }}>
                <Clock size={14} />
                PERFORMANCE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#c87800' }}>Duration:</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                    {metrics.duration ? `${metrics.duration}ms` : '...'}
                  </span>
                </div>
                {metrics.phases.map((phase, i) => (
                  <div key={i} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    paddingLeft: '12px',
                    fontSize: '10px'
                  }}>
                    <span style={{ color: '#94a3b8' }}>→ {phase.name}</span>
                    <span style={{ color: '#fbbf24' }}>
                      {phase.duration ? `${phase.duration}ms` : '...'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Diagnostics */}
            {diagnostics.length > 0 && (
              <div style={{ 
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: '8px',
                padding: '8px',
                marginBottom: '12px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  marginBottom: '6px',
                  color: '#fbbf24',
                  fontWeight: 'bold'
                }}>
                  <AlertCircle size={14} />
                  DIAGNOSTICS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {diagnostics.map((diag, i) => (
                    <div key={i} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      fontSize: '10px'
                    }}>
                      {diag.type === 'success' && <CheckCircle size={12} color="#10b981" />}
                      {diag.type === 'error' && <AlertCircle size={12} color="#ef4444" />}
                      {diag.type === 'warn' && <AlertCircle size={12} color="#fbbf24" />}
                      <span style={{ 
                        color: diag.type === 'success' ? '#10b981' : 
                               diag.type === 'error' ? '#ef4444' : '#fbbf24'
                      }}>
                        {diag.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Logs */}
            <div style={{ 
              background: 'rgba(20, 12, 5, 0.8)',
              border: '1px solid rgba(200, 120, 0, 0.3)',
              borderRadius: '8px',
              padding: '8px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                marginBottom: '8px',
                color: '#c87800',
                fontWeight: 'bold'
              }}>
                <TrendingUp size={14} />
                LOGS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {logs.slice(0, 30).map((log, i) => (
                  <div key={i} style={{ 
                    padding: '4px 6px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '4px',
                    borderLeft: `3px solid ${
                      log.type === 'success' ? '#10b981' :
                      log.type === 'error' ? '#ef4444' :
                      log.type === 'warn' ? '#fbbf24' :
                      log.type === 'perf' ? '#60a5fa' :
                      '#94a3b8'
                    }`
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginBottom: '2px'
                    }}>
                      <span style={{ 
                        color: '#c87800',
                        fontSize: '9px',
                        fontWeight: 'bold'
                      }}>
                        [{log.category}]
                      </span>
                      <span style={{ 
                        color: '#64748b',
                        fontSize: '9px'
                      }}>
                        {log.timestamp}
                      </span>
                    </div>
                    <div style={{ 
                      color: log.type === 'error' ? '#ef4444' : 
                             log.type === 'success' ? '#10b981' : '#ffe566',
                      fontSize: '10px',
                      wordBreak: 'break-word'
                    }}>
                      {log.message}
                    </div>
                    {log.data && (
                      <details style={{ marginTop: '2px' }}>
                        <summary style={{ 
                          color: '#64748b', 
                          fontSize: '9px', 
                          cursor: 'pointer' 
                        }}>
                          Data
                        </summary>
                        <pre style={{ 
                          color: '#94a3b8', 
                          fontSize: '9px',
                          marginTop: '2px',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all'
                        }}>
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function HoroscopeScreen({ onNavigate }: Props) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReadFullOpen, setIsReadFullOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  // 🆕 DEBUG STATES
  const [debugVisible, setDebugVisible] = useState(true); // default ON
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    startTime: Date.now(),
    phases: []
  });
  const [diagnostics, setDiagnostics] = useState<{ type: 'success' | 'error' | 'warn'; message: string }[]>([]);
  const prevLoadingRef = useRef<boolean | null>(null);
  const prevHoroscopeRef = useRef<any>(null);

  // 🆕 DEBUG HELPER FUNCTIONS
  const addLog = (
    type: DebugLog['type'],
    category: string,
    message: string,
    data?: any
  ) => {
    const log: DebugLog = {
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        fractionalSecondDigits: 3
      } as any),
      type,
      category,
      message,
      data
    };
    
    setDebugLogs(prev => [log, ...prev].slice(0, 100));
    
    // Console log with colors
    const colors = {
      info: '🔵',
      success: '✅',
      error: '❌',
      warn: '⚠️',
      perf: '⚡'
    };
    
    console.log(
      `%c${colors[type]} [${category}] ${message}`,
      `color: ${
        type === 'success' ? '#10b981' :
        type === 'error' ? '#ef4444' :
        type === 'warn' ? '#fbbf24' :
        type === 'perf' ? '#60a5fa' :
        '#ffe566'
      }; font-weight: bold;`,
      data || ''
    );
  };

  const addDiagnostic = (type: 'success' | 'error' | 'warn', message: string) => {
    setDiagnostics(prev => [{ type, message }, ...prev].slice(0, 10));
  };

  const startPhase = (name: string) => {
    const startTime = Date.now();
    setPerformanceMetrics(prev => ({
      ...prev,
      phases: [...prev.phases, { name, startTime }]
    }));
    addLog('perf', 'PERF', `▶️ Phase started: ${name}`);
  };

  const endPhase = (name: string) => {
    const endTime = Date.now();
    setPerformanceMetrics(prev => {
      const phases = prev.phases.map(p => 
        p.name === name && !p.endTime 
          ? { ...p, endTime, duration: endTime - p.startTime }
          : p
      );
      return { ...prev, phases };
    });
    
    const phase = performanceMetrics.phases.find(p => p.name === name);
    if (phase) {
      const duration = endTime - phase.startTime;
      addLog('perf', 'PERF', `⏹️ Phase ended: ${name} (${duration}ms)`);
    }
  };

  // 🆕 DEBUG: Component Mount
  useEffect(() => {
    addLog('info', 'MOUNT', '🚀 HoroscopeScreen mounted');
    addLog('info', 'USER', '👤 User:', user ? { 
      id: user.id, 
      name: user.display_name, 
      sun_sign: user.sun_sign 
    } : null);
    
    setPerformanceMetrics({
      startTime: Date.now(),
      phases: []
    });
    
    startPhase('component_init');
    
    return () => {
      addLog('info', 'UNMOUNT', '💀 HoroscopeScreen unmounted');
    };
  }, []);

  // ყველა hooks უნდა იყოს აქ (React-ის წესი)
  const { horoscope, loading, refreshing, error, refetch } = useHoroscope(user?.id || '', activeTab);

  const userSign = user?.sun_sign?.toLowerCase() || '';

  // 🆕 DEBUG: Track loading state changes
  useEffect(() => {
    if (prevLoadingRef.current !== loading) {
      addLog('info', 'STATE', `📊 Loading changed: ${prevLoadingRef.current} → ${loading}`);
      
      if (loading) {
        startPhase('data_fetch');
        addLog('info', 'FETCH', '📡 Starting data fetch', { tab: activeTab, userSign });
      } else {
        endPhase('data_fetch');
        const phase = performanceMetrics.phases.find(p => p.name === 'data_fetch');
        if (phase?.duration) {
          addLog('perf', 'PERF', `⏱️ Total fetch time: ${phase.duration}ms`);
          
          if (phase.duration < 500) {
            addDiagnostic('success', `Fast loading (${phase.duration}ms)`);
          } else if (phase.duration < 2000) {
            addDiagnostic('warn', `Slow loading (${phase.duration}ms)`);
          } else {
            addDiagnostic('error', `Very slow loading (${phase.duration}ms)`);
          }
        }
      }
      
      prevLoadingRef.current = loading;
    }
  }, [loading]);

  // 🆕 DEBUG: Track horoscope data changes
  useEffect(() => {
    if (horoscope !== prevHoroscopeRef.current) {
      addLog('info', 'DATA', '📦 Horoscope data updated', horoscope);
      
      if (horoscope) {
        // Data validation
        const requiredFields = [
          'date', 'general_prediction', 'love_prediction', 
          'career_prediction', 'health_prediction', 'finance_prediction'
        ];
        
        const missingFields = requiredFields.filter(f => !horoscope[f]);
        
        if (missingFields.length === 0) {
          addDiagnostic('success', 'All required fields present');
          addLog('success', 'VALIDATE', '✅ All required fields present');
        } else {
          addDiagnostic('warn', `Missing fields: ${missingFields.join(', ')}`);
          addLog('warn', 'VALIDATE', `⚠️ Missing fields: ${missingFields.join(', ')}`, missingFields);
        }
        
        // Check predictions length
        const predictions = [
          horoscope.general_prediction,
          horoscope.love_prediction,
          horoscope.career_prediction,
          horoscope.health_prediction,
          horoscope.finance_prediction
        ];
        
        const emptyPredictions = predictions.filter(p => !p || p.length < 10);
        if (emptyPredictions.length > 0) {
          addDiagnostic('warn', `${emptyPredictions.length} predictions too short`);
          addLog('warn', 'VALIDATE', `⚠️ ${emptyPredictions.length} predictions too short`);
        } else {
          addDiagnostic('success', 'All predictions have content');
        }
        
        // Energy levels check
        const energyLevels = [
          horoscope.cosmic_energy_level,
          horoscope.love_energy_level,
          horoscope.career_energy_level
        ];
        
        const validLevels = energyLevels.filter(l => 
          l && ['low', 'medium', 'high', 'very high', 'very low'].includes(l.toLowerCase())
        );
        
        if (validLevels.length === energyLevels.length) {
          addDiagnostic('success', 'All energy levels valid');
        } else {
          addDiagnostic('warn', 'Some energy levels invalid');
          addLog('warn', 'VALIDATE', '⚠️ Invalid energy levels', energyLevels);
        }
      }
      
      prevHoroscopeRef.current = horoscope;
    }
  }, [horoscope]);

  // 🆕 DEBUG: Track error state
  useEffect(() => {
    if (error) {
      addLog('error', 'ERROR', '❌ Error occurred', error);
      addDiagnostic('error', `Error: ${error.message || 'Unknown error'}`);
    }
  }, [error]);

  // 🆕 DEBUG: Track tab changes
  useEffect(() => {
    addLog('info', 'TAB', `📑 Active tab: ${activeTab}`);
  }, [activeTab]);

  // 🆕 DEBUG: Track refreshing state
  useEffect(() => {
    if (refreshing) {
      addLog('info', 'REFRESH', '🔄 Refreshing data...');
      startPhase('refresh');
    } else if (performanceMetrics.phases.some(p => p.name === 'refresh' && !p.endTime)) {
      endPhase('refresh');
      addLog('success', 'REFRESH', '✅ Refresh complete');
    }
  }, [refreshing]);

  // 🆕 DEBUG: Overall performance tracking
  useEffect(() => {
    if (!loading && horoscope && performanceMetrics.duration === undefined) {
      const endTime = Date.now();
      setPerformanceMetrics(prev => ({
        ...prev,
        endTime,
        duration: endTime - prev.startTime
      }));
      endPhase('component_init');
      addLog('success', 'COMPLETE', `🎉 Component fully loaded in ${endTime - performanceMetrics.startTime}ms`);
    }
  }, [loading, horoscope]);

  // ეტაპი 3: ჩაწერა reading_history ცხრილში
  useEffect(() => {
    if (!user || !horoscope || loading || !userSign) return;
    
    try {
      logReading(
        user.id,
        'horoscope',
        [],
        `${activeTab} - ${userSign} - ${horoscope.date}`
      ).then(() => {
        addLog('success', 'READING', '✅ Horoscope reading logged', { 
          tab: activeTab, 
          sign: userSign, 
          date: horoscope.date 
        });
      }).catch(err => {
        addLog('error', 'READING', '❌ Failed to log reading', err);
      });
    } catch (error) {
      addLog('error', 'READING', '❌ Error logging reading', error);
    }
  }, [horoscope, loading, user, activeTab, userSign]);

  // Check if user has sun_sign
  if (!user?.sun_sign) {
    addLog('warn', 'USER', '⚠️ No sun_sign found → redirecting to SignSelection');
    return <SignSelectionScreen onNavigate={onNavigate} />;
  }

  const zodiacData = ZODIAC_SIGNS[userSign] || ZODIAC_SIGNS['leo'];

  const randomErrorMessage = ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    addLog('info', 'TOAST', `🔔 Toast: ${message}`, { type });
  };

  const toggleAccordion = (section: string) => {
    setOpenAccordion(openAccordion === section ? null : section);
    addLog('info', 'UI', `📂 Accordion toggled: ${section}`);
  };

  const tabs = [
    { id: 'today' as TabType, label: 'TODAY' },
    { id: 'tomorrow' as TabType, label: 'TOMORROW' },
    { id: 'weekly' as TabType, label: 'WEEKLY' },
    { id: 'monthly' as TabType, label: 'MONTHLY' },
  ];

  const handleDownloadCard = async () => {
    addLog('info', 'ACTION', '📥 Download card requested');
    try {
      const html2canvas = (await import('html2canvas')).default;
      
      const element = document.getElementById('share-card');
      if (!element) {
        showToast('Card not found!', 'error');
        addLog('error', 'DOWNLOAD', '❌ Card element not found');
        return;
      }

      showToast('Generating image...', 'info');
      startPhase('download');

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          showToast('Failed to generate image!', 'error');
          addLog('error', 'DOWNLOAD', '❌ Blob creation failed');
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `lunara-${userSign}-${horoscope?.date}.png`;
        link.href = url;
        link.click();

        URL.revokeObjectURL(url);
        
        showToast('Horoscope card downloaded! 🌟', 'success');
        endPhase('download');
        addLog('success', 'DOWNLOAD', '✅ Card downloaded successfully');
      }, 'image/png', 1.0);

    } catch (error) {
      console.error('Download error:', error);
      showToast('Failed to download card', 'error');
      addLog('error', 'DOWNLOAD', '❌ Download failed', error);
      endPhase('download');
    }
  };

  const handleShareToTelegram = async () => {
    addLog('info', 'ACTION', '📤 Share to Telegram requested');
    const shareText = `Check out my ${userSign} horoscope on Lunara! 🔮✨`;
    const shareUrl = `https://lunara.app/horoscope?sign=${userSign}&date=${horoscope?.date}`;
    
    const telegram = (window as any).Telegram?.WebApp;
    
    if (telegram) {
      telegram.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
      );
      addLog('success', 'SHARE', '✅ Opened Telegram share');
    } else {
      window.open(
        `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
        '_blank'
      );
      addLog('info', 'SHARE', '🌐 Opened in new window');
    }
    showToast('Opening Telegram...', 'info');
  };

  // LoadingScreen ჩვენება loading-ის დროს
  if (loading && !horoscope) {
    return (
      <>
        <LoadingScreen message="Reading the stars" />
        <DebugPanel 
          logs={debugLogs}
          metrics={performanceMetrics}
          diagnostics={diagnostics}
          isVisible={debugVisible}
          onToggle={() => setDebugVisible(!debugVisible)}
        />
      </>
    );
  }

  if (error && !horoscope) {
    addLog('error', 'RENDER', '❌ Rendering error screen');
    return (
      <>
        <div className="horoscope-screen">
          <div className="cosmic-background" style={{ backgroundImage: `url(${BACKGROUND_IMAGE})` }} />
          <div className="aurora-layer" />
          <div className="horoscope-error">
            <motion.div className="error-icon" animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5 }}>
              <Moon size={48} className="error-moon" />
            </motion.div>
            <p className="error-message">{randomErrorMessage}</p>
            <motion.button className="retry-button" onClick={refetch} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <RotateCcw size={16} /><span>Try Again</span>
            </motion.button>
          </div>
        </div>
        <DebugPanel 
          logs={debugLogs}
          metrics={performanceMetrics}
          diagnostics={diagnostics}
          isVisible={debugVisible}
          onToggle={() => setDebugVisible(!debugVisible)}
        />
      </>
    );
  }

  if (!horoscope) {
    addLog('warn', 'RENDER', '⚠️ Rendering empty state');
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
        <DebugPanel 
          logs={debugLogs}
          metrics={performanceMetrics}
          diagnostics={diagnostics}
          isVisible={debugVisible}
          onToggle={() => setDebugVisible(!debugVisible)}
        />
      </>
    );
  }

  const formattedDate = new Date(horoscope.date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const heroTitle = horoscope.hero_description 
    ? horoscope.hero_description.split(' ').slice(0, 2).join(' ').toUpperCase()
    : TAB_HERO_FALLBACK[activeTab].split(' ').slice(0, 2).join(' ').toUpperCase();

  const heroDescription = horoscope.hero_description 
    ? horoscope.hero_description
    : TAB_HERO_FALLBACK[activeTab];

  const moonDescription = getMoonDescription(horoscope.moon_phase);

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

        {/* Toast Notifications */}
        <AnimatePresence>
          {toast && (
            <ToastNotification toast={toast} onClose={() => setToast(null)} />
          )}
        </AnimatePresence>

        {/* Refreshing Indicator */}
        <AnimatePresence>
          {refreshing && (
            <motion.div 
              className="refreshing-indicator"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
              <motion.div 
                className="refreshing-icon"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RotateCcw size={14} />
              </motion.div>
              <span>Updating cosmic energies...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Premium Header */}
        <div className="premium-header">
          <button className="premium-back-btn" onClick={() => onNavigate?.('home')}>
            <ArrowLeft size={24} />
          </button>
          <div className="premium-header-center">
            <h1 className="premium-sign-name">{userSign.toUpperCase()}</h1>
            <p className="premium-date">{formattedDate}</p>
          </div>
          <button className="premium-refresh-btn" onClick={refetch}>
            <RotateCcw size={24} />
          </button>
        </div>

        <div className="horoscope-content premium-content">
          {/* Premium Hero Banner */}
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

            <div className="premium-hero-left">
              <div className="premium-hero-subtitle">
                <span className="subtitle-star">✦</span>
                <span>{TAB_LABELS[activeTab]}</span>
                <span className="subtitle-star">✦</span>
              </div>
              
              <h2 className="premium-hero-title">{heroTitle}</h2>
              
              <p className="premium-hero-description">{heroDescription}</p>
              
              <motion.button 
                className="premium-read-full-btn"
                whileHover={{ scale: 1.02, x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsReadFullOpen(true)}
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
                    
                    <div className="card-corner card-corner-tl" />
                    <div className="card-corner card-corner-tr" />
                    <div className="card-corner card-corner-bl" />
                    <div className="card-corner card-corner-br" />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Premium Tab Navigation */}
          <div className="premium-tab-nav">
            {tabs.map((tab) => (
              <button 
                key={tab.id} 
                className={`premium-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div 
                    className="premium-tab-underline"
                    layoutId="premium-tab-underline"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Cosmic Energy Levels */}
          <div className="premium-section">
            <h3 className="premium-section-title">
              <Sparkles size={12} />
              COSMIC ENERGY LEVELS
              <Sparkles size={12} />
            </h3>
            
            <div className="premium-energy-grid">
              <motion.div 
                className="premium-energy-card energy"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="premium-energy-icon">
                  <Zap size={32} />
                </div>
                <p className="premium-energy-level">{horoscope.cosmic_energy_level?.toUpperCase() || 'MEDIUM'}</p>
                <p className="premium-energy-subtitle">Energy</p>
                <div className="premium-energy-dots">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`dot ${i < (horoscope.cosmic_energy_level?.includes('very') ? 5 : horoscope.cosmic_energy_level?.includes('high') ? 4 : horoscope.cosmic_energy_level?.includes('medium') ? 3 : 2) ? 'active' : ''}`} />
                  ))}
                </div>
              </motion.div>

              <motion.div 
                className="premium-energy-card love"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="premium-energy-icon">
                  <Heart size={32} />
                </div>
                <p className="premium-energy-level">{horoscope.love_energy_level?.toUpperCase() || 'MEDIUM'}</p>
                <p className="premium-energy-subtitle">Emotions</p>
                <div className="premium-energy-dots">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`dot ${i < (horoscope.love_energy_level?.includes('very') ? 5 : horoscope.love_energy_level?.includes('high') ? 4 : horoscope.love_energy_level?.includes('medium') ? 3 : 2) ? 'active' : ''}`} />
                  ))}
                </div>
              </motion.div>

              <motion.div 
                className="premium-energy-card career"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="premium-energy-icon">
                  <BriefcaseIcon size={32} />
                </div>
                <p className="premium-energy-level">{horoscope.career_energy_level?.toUpperCase() || 'MEDIUM'}</p>
                <p className="premium-energy-subtitle">Opportunities</p>
                <div className="premium-energy-dots">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`dot ${i < (horoscope.career_energy_level?.includes('very') ? 5 : horoscope.career_energy_level?.includes('high') ? 4 : horoscope.career_energy_level?.includes('medium') ? 3 : 2) ? 'active' : ''}`} />
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Premium Moon Info */}
          <motion.div 
            className="premium-moon-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="premium-moon-image-container">
              <div className="premium-moon-image" />
            </div>
            
            <div className="premium-moon-content">
              <h4 className="premium-moon-label">MOON INFO</h4>
              <h3 className="premium-moon-phase">{horoscope.moon_phase}</h3>
              <p className="premium-moon-sign">IN {horoscope.moon_sign?.toUpperCase()}</p>
              <p className="premium-moon-desc">{moonDescription}</p>
            </div>

            <div className="premium-moon-symbol">
              <div className="premium-symbol-circle">
                <span className="premium-zodiac-symbol">{zodiacData.symbol}</span>
              </div>
            </div>
          </motion.div>

          {/* Premium Predictions Grid */}
          <div className="premium-section">
            <h3 className="premium-section-title">
              <Sparkles size={12} />
              {TAB_PREDICTIONS_TITLE[activeTab]}
              <Sparkles size={12} />
            </h3>
            
            <div className="premium-predictions-grid">
              <motion.div 
                className="premium-prediction-card general"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => setOpenModal('general')}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="premium-prediction-icon">
                  <div className="premium-icon-glow general" />
                  <Sparkles size={28} />
                </div>
                <h4>GENERAL</h4>
                <p>{getPredictionSubtitle('general', horoscope.date)}</p>
              </motion.div>

              <motion.div 
                className="premium-prediction-card love"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={() => setOpenModal('love')}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="premium-prediction-icon">
                  <div className="premium-icon-glow love" />
                  <Heart size={28} />
                </div>
                <h4>LOVE</h4>
                <p>{getPredictionSubtitle('love', horoscope.date)}</p>
              </motion.div>

              <motion.div 
                className="premium-prediction-card career"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={() => setOpenModal('career')}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="premium-prediction-icon">
                  <div className="premium-icon-glow career" />
                  <BriefcaseIcon size={28} />
                </div>
                <h4>CAREER</h4>
                <p>{getPredictionSubtitle('career', horoscope.date)}</p>
              </motion.div>

              <motion.div 
                className="premium-prediction-card health"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                onClick={() => setOpenModal('health')}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="premium-prediction-icon">
                  <div className="premium-icon-glow health" />
                  <Activity size={28} />
                </div>
                <h4>HEALTH</h4>
                <p>{getPredictionSubtitle('health', horoscope.date)}</p>
              </motion.div>

              <motion.div 
                className="premium-prediction-card finance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                onClick={() => setOpenModal('finance')}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="premium-prediction-icon">
                  <div className="premium-icon-glow finance" />
                  <DollarSign size={28} />
                </div>
                <h4>FINANCE</h4>
                <p>{getPredictionSubtitle('finance', horoscope.date)}</p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* MODAL - Predictions */}
        <AnimatePresence>
          {openModal && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpenModal(null)}>
              <motion.div className="modal-content" initial={{ scale: 0.9, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 15 }} onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setOpenModal(null)}><X size={20} /></button>
                {openModal === 'general' && (
                  <>
                    <div className="modal-icon"><Sparkles size={28} /></div>
                    <h2 className="modal-title">General Energy</h2>
                    <p className="modal-text">{horoscope.general_prediction}</p>
                  </>
                )}
                {openModal === 'love' && (
                  <>
                    <div className="modal-icon" style={{ color: '#E8738A' }}><Heart size={28} /></div>
                    <h2 className="modal-title">Love & Relationships</h2>
                    <p className="modal-text">{horoscope.love_prediction}</p>
                  </>
                )}
                {openModal === 'career' && (
                  <>
                    <div className="modal-icon" style={{ color: '#7CB3E8' }}><Briefcase size={28} /></div>
                    <h2 className="modal-title">Career & Work</h2>
                    <p className="modal-text">{horoscope.career_prediction}</p>
                  </>
                )}
                {openModal === 'health' && (
                  <>
                    <div className="modal-icon"><Activity size={28} /></div>
                    <h2 className="modal-title">Health & Wellness</h2>
                    <p className="modal-text">{horoscope.health_prediction}</p>
                  </>
                )}
                {openModal === 'finance' && (
                  <>
                    <div className="modal-icon" style={{ color: '#7CE8A6' }}><DollarSign size={28} /></div>
                    <h2 className="modal-title">Finance & Money</h2>
                    <p className="modal-text">{horoscope.finance_prediction}</p>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SHARE MODAL */}
        <AnimatePresence>
          {isShareModalOpen && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsShareModalOpen(false)}>
              <motion.div className="modal-content share-modal" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setIsShareModalOpen(false)}><X size={20} /></button>
                <h2 className="modal-title">Share Your Horoscope</h2>
                <div className="share-preview-container">
                  <ShareCardPreview 
                    userSign={userSign} 
                    date={horoscope.date} 
                    affirmation={horoscope.affirmation} 
                    moonPhase={horoscope.moon_phase} 
                    luckyNumber={horoscope.lucky_number} 
                    luckyColor={horoscope.lucky_color}
                    luckyCrystal={horoscope.lucky_crystal}
                    luckyPlanet={horoscope.lucky_planet || zodiacData.planet}
                    keyTransits={horoscope.key_transits?.slice(0, 2) || []}
                  />
                </div>
                <div className="share-actions">
                  <button className="share-action-btn" onClick={handleDownloadCard}><Download size={16} /><span>Download</span></button>
                  <button className="share-action-btn primary" onClick={handleShareToTelegram}><Share2 size={16} /><span>Share</span></button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* READ FULL MODAL */}
        <AnimatePresence>
          {isReadFullOpen && (
            <motion.div 
              className="read-full-overlay" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsReadFullOpen(false)}
            >
              <motion.div 
                className="read-full-modal"
                initial={{ scale: 0.85, y: 40, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.85, y: 40, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="rf-glow" />
                <button className="rf-close" onClick={() => setIsReadFullOpen(false)}>
                  <X size={22} />
                </button>

                <div className="rf-scroll">
                  {/* HEADER */}
                  <div className="rf-header">
                    <div className="rf-sign-icon">{zodiacData.symbol}</div>
                    <h1 className="rf-sign-name">{userSign.toUpperCase()}</h1>
                    <div className="rf-date-row">
                      <span className="rf-divider-line" />
                      <span className="rf-date">{horoscope.date}</span>
                      <span className="rf-divider-line" />
                    </div>
                  </div>

                  {/* ENERGY OVERVIEW */}
                  <div className="rf-energy-overview">
                    <div className="rf-energy-item">
                      <span className="rf-energy-emoji">{getEnergyEmojis(horoscope.cosmic_energy_level, '⚡')}</span>
                      <span className="rf-energy-level">{horoscope.cosmic_energy_level?.toUpperCase() || 'MEDIUM'}</span>
                      <span className="rf-energy-cat">Energy</span>
                    </div>
                    <div className="rf-energy-divider" />
                    <div className="rf-energy-item">
                      <span className="rf-energy-emoji">{getEnergyEmojis(horoscope.love_energy_level, '💕')}</span>
                      <span className="rf-energy-level">{horoscope.love_energy_level?.toUpperCase() || 'MEDIUM'}</span>
                      <span className="rf-energy-cat">Love</span>
                    </div>
                    <div className="rf-energy-divider" />
                    <div className="rf-energy-item">
                      <span className="rf-energy-emoji">{getEnergyEmojis(horoscope.career_energy_level, '💼')}</span>
                      <span className="rf-energy-level">{horoscope.career_energy_level?.toUpperCase() || 'MEDIUM'}</span>
                      <span className="rf-energy-cat">Career</span>
                    </div>
                  </div>

                  {/* PREDICTIONS */}
                  <div className="rf-sections">
                    {horoscope.general_prediction && (
                      <div className="rf-section">
                        <div className="rf-section-header">
                          <Sparkles size={18} className="rf-section-icon" />
                          <h3>General Energy</h3>
                        </div>
                        <p className="rf-section-text">{horoscope.general_prediction}</p>
                      </div>
                    )}

                    {horoscope.love_prediction && (
                      <div className="rf-section">
                        <div className="rf-section-header love">
                          <Heart size={18} className="rf-section-icon" />
                          <h3>Love & Relationships</h3>
                        </div>
                        <p className="rf-section-text">{horoscope.love_prediction}</p>
                      </div>
                    )}

                    {horoscope.career_prediction && (
                      <div className="rf-section">
                        <div className="rf-section-header career">
                          <Briefcase size={18} className="rf-section-icon" />
                          <h3>Career & Work</h3>
                        </div>
                        <p className="rf-section-text">{horoscope.career_prediction}</p>
                      </div>
                    )}

                    {horoscope.health_prediction && (
                      <div className="rf-section">
                        <div className="rf-section-header health">
                          <Activity size={18} className="rf-section-icon" />
                          <h3>Health & Wellness</h3>
                        </div>
                        <p className="rf-section-text">{horoscope.health_prediction}</p>
                      </div>
                    )}

                    {horoscope.finance_prediction && (
                      <div className="rf-section">
                        <div className="rf-section-header finance">
                          <DollarSign size={18} className="rf-section-icon" />
                          <h3>Finance & Money</h3>
                        </div>
                        <p className="rf-section-text">{horoscope.finance_prediction}</p>
                      </div>
                    )}
                  </div>

                  {/* AFFIRMATION */}
                  {horoscope.affirmation && (
                    <div className="rf-affirmation">
                      <div className="rf-aff-glow" />
                      <div className="rf-aff-icon">✨</div>
                      <h3 className="rf-aff-title">{activeTab === 'weekly' ? 'Weekly' : activeTab === 'monthly' ? 'Monthly' : 'Daily'} Affirmation</h3>
                      <p className="rf-aff-text">"{horoscope.affirmation}"</p>
                    </div>
                  )}

                  {/* ACCORDION SECTIONS */}
                  <div className="rf-accordion-container">
                    {/* KEY TRANSITS */}
                    {horoscope.key_transits && horoscope.key_transits.length > 0 && (
                      <div className="rf-accordion">
                        <button 
                          className="rf-accordion-header"
                          onClick={() => toggleAccordion('transits')}
                        >
                          <div className="rf-accordion-title">
                            <Star size={16} />
                            <span>Key Transits</span>
                          </div>
                          <motion.div
                            className="rf-accordion-arrow"
                            animate={{ rotate: openAccordion === 'transits' ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <ChevronDown size={18} />
                          </motion.div>
                        </button>
                        
                        <AnimatePresence>
                          {openAccordion === 'transits' && (
                            <motion.div
                              className="rf-accordion-content"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="rf-transits-list">
                                {horoscope.key_transits.slice(0, 5).map((transit, index) => (
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

                    {/* LUCKY ELEMENTS */}
                    <div className="rf-accordion">
                      <button 
                        className="rf-accordion-header"
                        onClick={() => toggleAccordion('lucky')}
                      >
                        <div className="rf-accordion-title">
                          <Sparkles size={16} />
                          <span>Lucky Elements</span>
                        </div>
                        <motion.div
                          className="rf-accordion-arrow"
                          animate={{ rotate: openAccordion === 'lucky' ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown size={18} />
                        </motion.div>
                      </button>
                      
                      <AnimatePresence>
                        {openAccordion === 'lucky' && (
                          <motion.div
                            className="rf-accordion-content"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="rf-lucky-grid">
                              <div className="rf-lucky-item">
                                <Palette size={20} className="rf-lucky-icon" />
                                <span className="rf-lucky-label">Color</span>
                                <span className="rf-lucky-value">{horoscope.lucky_color || 'Gold'}</span>
                              </div>
                              <div className="rf-lucky-item">
                                <Hash size={20} className="rf-lucky-icon" />
                                <span className="rf-lucky-label">Number</span>
                                <span className="rf-lucky-value">{horoscope.lucky_number || 7}</span>
                              </div>
                              <div className="rf-lucky-item">
                                <Sun size={20} className="rf-lucky-icon" />
                                <span className="rf-lucky-label">Planet</span>
                                <span className="rf-lucky-value">{horoscope.lucky_planet || zodiacData.planet}</span>
                              </div>
                              {horoscope.lucky_crystal && (
                                <div className="rf-lucky-item">
                                  <Star size={20} className="rf-lucky-icon" />
                                  <span className="rf-lucky-label">Crystal</span>
                                  <span className="rf-lucky-value">{horoscope.lucky_crystal}</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* MOON INFO */}
                    <div className="rf-accordion">
                      <button 
                        className="rf-accordion-header"
                        onClick={() => toggleAccordion('moon')}
                      >
                        <div className="rf-accordion-title">
                          <Moon size={16} />
                          <span>Moon Info</span>
                        </div>
                        <motion.div
                          className="rf-accordion-arrow"
                          animate={{ rotate: openAccordion === 'moon' ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown size={18} />
                        </motion.div>
                      </button>
                      
                      <AnimatePresence>
                        {openAccordion === 'moon' && (
                          <motion.div
                            className="rf-accordion-content"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="rf-moon-info-expanded">
                              <Moon size={24} className="rf-moon-icon-large" />
                              <div className="rf-moon-details-expanded">
                                <span className="rf-moon-phase-large">{horoscope.moon_phase}</span>
                                <span className="rf-moon-sign-large">Moon in {horoscope.moon_sign}</span>
                                <p className="rf-moon-desc-expanded">{moonDescription}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* SHARE ღილაკი ბოლოში */}
                  {horoscope.affirmation && (
                    <div className="rf-share-bottom">
                      <button 
                        className="share-affirmation-btn" 
                        onClick={() => {
                          setIsReadFullOpen(false);
                          setIsShareModalOpen(true);
                        }}
                      >
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
                    <p className="rf-footer-text">The stars have spoken.<br />Trust your intuition.</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🆕 DEBUG PANEL */}
      <DebugPanel 
        logs={debugLogs}
        metrics={performanceMetrics}
        diagnostics={diagnostics}
        isVisible={debugVisible}
        onToggle={() => setDebugVisible(!debugVisible)}
      />
    </>
  );
}