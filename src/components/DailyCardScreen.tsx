import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Briefcase, Star, Share2, Bookmark, BookOpen, ArrowLeft, Shield, Copy, CheckCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { tarotCards, TarotCard, SUITS, CARD_BACK_URL } from '../data/tarotCards';
import { logReading } from '../lib/adminService';
import { trackQuestProgress } from '../lib/questService';
import { useUser } from '../context/UserContext';
import { getActiveSubscription } from '../lib/subscriptionService';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import {
  getTodayReading,
  getDailyCard,
  updateDailyNotes,
  toggleBookmark,
  updateStreakOnReading,
  updateMood,
  MOODS,
  type DailyReading,
  type FocusArea,
  type Mood
} from '../lib/dailyCardService';
import { getStreakInfo, type StreakInfo } from '../lib/streakService';

interface Props {
  onNavigate?: (screen: string) => void;
}

type LogType = 'info' | 'success' | 'error' | 'warning' | 'api' | 'db' | 'ui';

interface DebugLog {
  id: number;
  timestamp: string;
  type: LogType;
  message: string;
  data?: any;
}

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

const logColors: Record<LogType, string> = {
  info: '#60a5fa', success: '#10b981', error: '#ef4444',
  warning: '#fbbf24', api: '#a78bfa', db: '#f472b6', ui: '#f59e0b'
};

const logIcons: Record<LogType, string> = {
  info: 'ℹ️', success: '✅', error: '❌',
  warning: '⚠️', api: '🌐', db: '🗄️', ui: ''
};

// ============================================
// PROCEDURAL STAR FIELD
// ============================================
function StarField() {
  const starsRef = useRef<THREE.Points>(null);
  const { positions, colors, sizes } = useMemo(() => {
    const count = 8000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = 50 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      const starType = Math.random();
      if (starType < 0.6) {
        colors[i3] = 1.0; colors[i3 + 1] = 0.95 + Math.random() * 0.05; colors[i3 + 2] = 0.8 + Math.random() * 0.2;
      } else if (starType < 0.85) {
        colors[i3] = 0.7 + Math.random() * 0.3; colors[i3 + 1] = 0.8 + Math.random() * 0.2; colors[i3 + 2] = 1.0;
      } else {
        colors[i3] = 1.0; colors[i3 + 1] = 0.6 + Math.random() * 0.2; colors[i3 + 2] = 0.4 + Math.random() * 0.2;
      }
      sizes[i] = Math.log(1 - Math.random()) * -1;
    }
    return { positions, colors, sizes };
  }, []);

  useFrame((_state, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.015;
      starsRef.current.rotation.x += delta * 0.005;
    }
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={sizes.length} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial size={0.5} vertexColors={true} transparent={true} opacity={0.8} sizeAttenuation={true} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

// ============================================
// NEBULA WITH PERLIN NOISE
// ============================================
function Nebula({ position, color, scale = 30, opacity = 0.3 }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
    uScale: { value: scale },
    uOpacity: { value: opacity }
  }), [color, scale, opacity]);

  useFrame((_state, delta) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value += delta * 0.1;
      meshRef.current.rotation.z += delta * 0.02;
      meshRef.current.rotation.y += delta * 0.01;
    }
  });

  const vertexShader = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
  const fragmentShader = `
    uniform float uTime; uniform vec3 uColor; uniform float uScale; uniform float uOpacity; varying vec2 vUv;
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + C.yyy; vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857; vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ *ns.x + ns.yyyy; vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x); vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z); vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
    float fbm(vec3 p) {
      float value = 0.0; float amplitude = 0.5; float frequency = 1.0;
      for (int i = 0; i < 5; i++) { value += amplitude * snoise(p * frequency); amplitude *= 0.5; frequency *= 2.0; }
      return value;
    }
    void main() {
      vec3 p = vec3(vUv * uScale, uTime);
      float n1 = fbm(p); float n2 = fbm(p * 1.5 + 100.0); float n3 = fbm(p * 2.0 + 200.0);
      float noise = (n1 + n2 * 0.5 + n3 * 0.25) / 1.75;
      noise = noise * 0.5 + 0.5;
      float density = pow(noise, 2.0);
      float edgeFade = 1.0 - smoothstep(0.3, 0.7, length(vUv - 0.5));
      vec3 finalColor = uColor * density * edgeFade;
      float alpha = density * edgeFade * uOpacity;
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[40, 40]} />
      <shaderMaterial transparent={true} depthWrite={false} blending={THREE.AdditiveBlending} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ============================================
// BRIGHT STARS WITH GLOW
// ============================================
function BrightStars() {
  const groupRef = useRef<THREE.Group>(null);
  const stars = useMemo(() => {
    const data: Array<{ position: [number, number, number]; coreColor: [number, number, number]; haloColor: [number, number, number]; size: number }> = [];
    for (let i = 0; i < 200; i++) {
      const x = (Math.random() - 0.5) * 80;
      const y = (Math.random() - 0.5) * 80;
      const z = (Math.random() - 0.5) * 80 - 30;
      const colorType = Math.random();
      let coreColor: [number, number, number], haloColor: [number, number, number];
      if (colorType < 0.4) { coreColor = [1.0, 0.95, 0.8]; haloColor = [1.0, 0.9, 0.7]; }
      else if (colorType < 0.7) { coreColor = [0.8, 0.9, 1.0]; haloColor = [0.6, 0.8, 1.0]; }
      else { coreColor = [1.0, 0.7, 0.5]; haloColor = [1.0, 0.5, 0.3]; }
      data.push({ position: [x, y, z], coreColor, haloColor, size: Math.random() * 0.5 + 0.3 });
    }
    return data;
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.01;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 1.5;
    }
  });

  return (
    <group ref={groupRef}>
      {stars.map((star, i) => (
        <group key={i} position={star.position}>
          <mesh><sphereGeometry args={[star.size * 0.3, 16, 16]} /><meshBasicMaterial color={star.coreColor} /></mesh>
          <mesh><sphereGeometry args={[star.size, 16, 16]} /><meshBasicMaterial color={star.haloColor} transparent={true} opacity={0.3} /></mesh>
        </group>
      ))}
    </group>
  );
}

// ============================================
// REALISTIC COSMIC SCENE
// ============================================
function CosmicScene() {
  return (
    <>
      <color attach="background" args={['#000002']} />
      <StarField />
      <BrightStars />
      <Nebula position={[-30, 15, -50]} color="#3b82f6" scale={25} opacity={0.25} />
      <Nebula position={[35, -10, -45]} color="#ec4899" scale={30} opacity={0.2} />
      <Nebula position={[0, 25, -55]} color="#8b5cf6" scale={28} opacity={0.2} />
      <Nebula position={[-25, -20, -40]} color="#10b981" scale={22} opacity={0.15} />
      <Nebula position={[40, 20, -60]} color="#f59e0b" scale={20} opacity={0.18} />
    </>
  );
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function ToastNotification({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 10000, pointerEvents: 'none'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        style={{
          background: toast.type === 'success'
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.98), rgba(5, 150, 105, 0.98))'
            : toast.type === 'error'
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.98), rgba(220, 38, 38, 0.98))'
            : 'linear-gradient(135deg, rgba(251, 191, 36, 0.98), rgba(245, 158, 11, 0.98))',
          color: '#fff', padding: '12px 20px', borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600',
          maxWidth: '320px', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <span style={{ fontSize: '18px' }}>
          {toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
        </span>
        <span>{toast.message}</span>
      </motion.div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function DailyCardScreen({ onNavigate }: Props) {
  const { user } = useUser();

  const [dailyReading, setDailyReading] = useState<DailyReading | null>(null);
  const [stage, setStage] = useState<'loading' | 'selecting' | 'revealing' | 'revealed'>('loading');
  const [selectedFocus, setSelectedFocus] = useState<FocusArea>('general');
  const [customQuestion, setCustomQuestion] = useState('');
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [hasPremium, setHasPremium] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [moodSaving, setMoodSaving] = useState(false);

  const [toast, setToast] = useState<Toast | null>(null);

  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [logFilter, setLogFilter] = useState<LogType | 'all'>('all');
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const [authUid, setAuthUid] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'checking' | 'active' | 'inactive'>('checking');

  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);

  const addLog = (type: LogType, message: string, data?: any) => {
    const log: DebugLog = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type, message, data
    };
    setDebugLogs(prev => [log, ...prev].slice(0, 100));
    logger.log(`[${type.toUpperCase()}] ${message}`, data || '');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    const loadStreak = async () => {
      if (!user) return;
      try {
        const info = await getStreakInfo(user.id);
        if (info) {
          setStreakInfo(info);
          addLog('info', 'Streak loaded', { 
            current: info.current_streak, 
            next: info.next_milestone?.name || 'None' 
          });
        }
      } catch (err: any) {
        addLog('error', 'Streak load failed', { error: err.message });
      }
    };
    loadStreak();
  }, [user]);

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setAuthStatus('inactive');
        addLog('error', 'Supabase not initialized');
        return;
      }
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        if (error) {
          setAuthStatus('inactive');
          addLog('error', 'Auth error', { message: error.message });
        } else if (authUser) {
          setAuthStatus('active');
          setAuthUid(authUser.id);
          addLog('success', 'Supabase Auth active', { uid: authUser.id });
        } else {
          setAuthStatus('inactive');
          addLog('error', 'No active session');
        }
      } catch (err: any) {
        setAuthStatus('inactive');
        addLog('error', 'Auth check failed', { message: err.message });
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    addLog('info', 'DailyCardScreen mounted');

    if (user) {
      addLog('success', 'User found in context', { userId: user.id, name: user.display_name });

      const isAdmin = user.is_admin === true;
      setIsUserAdmin(isAdmin);
      addLog('info', 'Admin check completed', { isAdmin, authUid: user.id });

      getActiveSubscription(user.id).then(sub => {
        setHasPremium(!!sub);
        addLog('info', 'Subscription check', { hasPremium: !!sub });
      });
    } else {
      addLog('error', 'No user in context');
    }
  }, [user]);

  useEffect(() => {
    const loadTodayReading = async () => {
      if (!user) return;

      addLog('api', 'Loading today reading from DB');
      const existing = await getTodayReading(user.id);

      if (existing) {
        addLog('success', 'Today reading found in DB', existing);
        setDailyReading(existing);
        setSelectedFocus(existing.focus_area || 'general');
        setCustomQuestion(existing.question || '');
        setNotes(existing.notes || '');
        setSelectedMood(existing.mood || null);
        if (existing.reflection_prompt) {
          addLog('info', 'Reflection prompt loaded', { prompt: existing.reflection_prompt });
        }
        setStage('revealed');
      } else {
        addLog('info', 'No reading for today - showing focus selection');
        setDailyReading(null);
        setStage('selecting');
      }
    };

    loadTodayReading();
  }, [user]);

  useEffect(() => {
    if (!dailyReading || !notes) return;
    if (notes === dailyReading.notes) return;

    const timer = setTimeout(async () => {
      setNotesSaving(true);
      const success = await updateDailyNotes(dailyReading.id, notes);
      if (success) {
        addLog('success', 'Notes auto-saved');
        setDailyReading(prev => prev ? { ...prev, notes } : null);
      }
      setNotesSaving(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [notes, dailyReading?.id]);

  const handleFocusSelect = (focus: FocusArea) => {
    setSelectedFocus(focus);
    setShowQuestionInput(focus === 'custom');
    if (focus !== 'custom') setCustomQuestion('');
    addLog('ui', 'Focus area selected', { focus });
  };

  const handleReveal = async () => {
    if (!user || isCreating) return;

    setIsCreating(true);
    addLog('ui', 'Reveal button clicked');

    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    setStage('revealing');

    const question = selectedFocus === 'custom' ? customQuestion : undefined;
    const reading = await getDailyCard(user.id, selectedFocus, question);

    if (!reading) {
      addLog('error', 'Failed to create reading');
      showToast('Failed to draw your card. Please try again.', 'error');
      setIsCreating(false);
      setStage('selecting');
      return;
    }

    addLog('success', 'Reading created in DB', reading);
    setDailyReading(reading);
    setNotes(reading.notes || '');
    setSelectedMood(null);

    try {
      await logReading(user.id, 'daily_card', [reading.cards[0].id], `${reading.cards[0].name}${reading.cards[0].is_reversed ? ' (Reversed)' : ''}`);
      await trackQuestProgress(user.id, 'draw_daily_card', 1);
      addLog('success', 'Quest progress tracked');
      
      const streakResult = await updateStreakOnReading();
      if (streakResult.success) {
        addLog('success', 'Streak updated via Edge Function', { 
          current_streak: streakResult.current_streak,
          longest_streak: streakResult.longest_streak,
          streak_incremented: streakResult.streak_incremented
        });
        if (streakResult.streak_incremented) {
          showToast(`🔥 Streak: ${streakResult.current_streak} days!`, 'success');
          
          const newInfo = await getStreakInfo(user.id);
          if (newInfo) setStreakInfo(newInfo);
        } else {
          addLog('info', 'Streak already updated today');
        }
      } else {
        addLog('warning', 'Streak update failed', { error: streakResult.error });
      }
    } catch (err: any) {
      addLog('error', 'Quest/Streak tracking failed', { error: err.message });
    }

    setTimeout(() => {
      setStage('revealed');
      setIsCreating(false);
      showToast(`Your card: ${reading.cards[0].name} ✨`, 'success');
    }, 1200);
  };

  const handleShare = () => {
    if (!dailyReading) return;
    addLog('ui', 'Share button clicked');

    const cardData = dailyReading.cards[0];
    const tarotCard = tarotCards.find(c => c.id === cardData.id);
    if (!tarotCard) return;

    const shareText = `✨ My Daily Card: ${cardData.name}${cardData.is_reversed ? ' (Reversed)' : ''}\n\n"${cardData.is_reversed ? tarotCard.reversed_meaning : tarotCard.meaning}"\n\nDraw your own card on Lunara App! 🌙`;

    const tg = (window as any).Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(window.location.href || '')}&text=${encodeURIComponent(shareText)}`);
      showToast('Share dialog opened', 'info');
    } else {
      navigator.clipboard.writeText(shareText);
      showToast('Copied to clipboard!', 'success');
    }
  };

  const handleToggleBookmark = async () => {
    if (!dailyReading) return;

    const newStatus = await toggleBookmark(dailyReading.id);
    if (newStatus !== null) {
      setDailyReading(prev => prev ? { ...prev, is_bookmarked: newStatus } : null);
      showToast(newStatus ? 'Added to favorites ⭐' : 'Removed from favorites', 'success');
      addLog('success', `Bookmark ${newStatus ? 'added' : 'removed'}`);
    }
  };

  const handleAIInsight = () => {
    if (!hasPremium) {
      showToast('AI Insight is a Premium feature ✨', 'info');
      onNavigate?.('pricing');
    } else {
      showToast('AI Insight coming soon! 🤖', 'info');
    }
  };

  const getCardMeta = (card: TarotCard) => {
    if (card.arcana === 'major') return 'Major Arcana';
    if (card.suit && SUITS[card.suit]) return `${SUITS[card.suit].name} · ${SUITS[card.suit].element}`;
    return 'Minor Arcana';
  };

  const getFocusIcon = (focus: FocusArea) => {
    switch (focus) {
      case 'love': return <Heart size={18} />;
      case 'career': return <Briefcase size={18} />;
      case 'custom': return <Sparkles size={18} />;
      default: return <Star size={18} />;
    }
  };

  const copyAllLogs = () => {
    const authInfo = `Auth Status: ${authStatus}\nAuth UID: ${authUid || 'NULL'}\nUser ID: ${user?.id || 'NULL'}\n\n`;
    const text = authInfo + debugLogs.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}${l.data ? '\n' + JSON.stringify(l.data, null, 2) : ''}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addLog('info', 'All logs copied to clipboard');
  };

  const clearLogs = () => {
    setDebugLogs([]);
    addLog('info', 'Debug logs cleared');
  };

  const filteredLogs = logFilter === 'all' ? debugLogs : debugLogs.filter(l => l.type === logFilter);

  if (!user || stage === 'loading') {
    return (
      <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: '#000002' }}>
        <Canvas dpr={[1, 1.5]} style={{ position: 'absolute', inset: 0 }}>
          <CosmicScene />
        </Canvas>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#C5A059' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <Sparkles size={32} />
          </motion.div>
        </div>
      </div>
    );
  }

  const currentCard = dailyReading ? tarotCards.find(c => c.id === dailyReading.cards[0].id) : null;
  const isReversed = dailyReading?.cards[0].is_reversed || false;
  const meaning = currentCard ? (isReversed ? currentCard.reversed_meaning : currentCard.meaning) : '';
  const keywords = currentCard ? (isReversed ? currentCard.reversed_keywords : currentCard.keywords) : [];

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh', position: 'relative', color: '#fff',
    paddingLeft: '5px', paddingRight: '5px',
    display: 'flex', flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: '#000002'
  };

  const actionBtnStyle: React.CSSProperties = {
    width: '48px', height: '48px', borderRadius: '50%',
    background: 'rgba(10, 8, 20, 0.5)',
    border: '1px solid rgba(197, 160, 89, 0.4)',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#C5A059', cursor: 'pointer',
    transition: 'all 0.2s ease', boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
  };

  return (
    <div style={containerStyle}>
      <Canvas dpr={[1, 1.5]} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none' }} camera={{ position: [0, 0, 35], fov: 60 }}>
        <CosmicScene />
      </Canvas>

      <AnimatePresence>
        {toast && <ToastNotification toast={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* 🎯 DATE - Fixed between Telegram Close & Menu buttons */}
      <div style={{ 
        position: 'fixed', 
        top: 'calc(env(safe-area-inset-top, 0px) + 22px)', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        zIndex: 100, 
        fontSize: '11px', 
        color: '#94a3b8', 
        letterSpacing: '1px', 
        textTransform: 'uppercase', 
        background: 'rgba(10, 8, 20, 0.6)', 
        padding: '6px 12px', 
        borderRadius: '20px', 
        backdropFilter: 'blur(8px)', 
        WebkitBackdropFilter: 'blur(8px)',
        pointerEvents: 'none',
        border: '1px solid rgba(197, 160, 89, 0.15)'
      }}>
        {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
      </div>

      {/* 🎯 HEADER ROW - Back button + compact streak banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', paddingLeft: '5px', paddingRight: '10px', position: 'relative', zIndex: 1, marginTop: 'calc(env(safe-area-inset-top, 0px) + 50px)' }}>
        <button onClick={() => onNavigate?.('home')} style={{ background: 'rgba(10, 8, 20, 0.5)', border: '1px solid rgba(197, 160, 89, 0.4)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C5A059', cursor: 'pointer', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', flexShrink: 0 }}>
          <ArrowLeft size={20} />
        </button>

        {streakInfo && streakInfo.current_streak > 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(10, 8, 20, 0.6)', border: '1px solid rgba(251, 146, 60, 0.3)', borderRadius: '12px', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <span style={{ fontSize: '14px', flexShrink: 0 }}>🔥</span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#fb923c', flexShrink: 0 }}>
              {streakInfo.current_streak} day{streakInfo.current_streak !== 1 ? 's' : ''}
            </span>
            <div style={{ flex: 1, height: '4px', borderRadius: '999px', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', minWidth: '40px' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${streakInfo.percent_to_next}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #fb923c, #fbbf24)', boxShadow: '0 0 8px rgba(251, 146, 60, 0.5)' }}
              />
            </div>
            {streakInfo.next_milestone && (
              <span style={{ fontSize: '9px', color: '#94a3b8', flexShrink: 0, whiteSpace: 'nowrap' }}>
                {streakInfo.days_to_next}d → {streakInfo.next_milestone.icon_emoji}
              </span>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, fontSize: '15px', color: '#C5A059', fontWeight: 700, letterSpacing: '0.5px' }}>
            Daily Card
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {stage === 'selecting' && (
          <motion.div key="selecting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ padding: '0 10px', position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: '20px', background: 'rgba(10, 8, 20, 0.6)', padding: '20px', borderRadius: '16px', backdropFilter: 'blur(12px)', border: '1px solid rgba(197, 160, 89, 0.15)' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>🌙</div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#C5A059' }}>Set Your Intention</h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Choose a focus for today's reading</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {(['general', 'love', 'career', 'custom'] as FocusArea[]).map((focus) => (
                <motion.button key={focus} whileTap={{ scale: 0.96 }} onClick={() => handleFocusSelect(focus)} style={{ padding: '14px', background: selectedFocus === focus ? 'rgba(197, 160, 89, 0.2)' : 'rgba(10, 8, 20, 0.6)', border: selectedFocus === focus ? '1.5px solid #C5A059' : '1px solid rgba(197, 160, 89, 0.2)', borderRadius: '10px', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                  <div style={{ color: selectedFocus === focus ? '#C5A059' : '#94a3b8' }}>{getFocusIcon(focus)}</div>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>{focus.charAt(0).toUpperCase() + focus.slice(1)}</span>
                </motion.button>
              ))}
            </div>
            {showQuestionInput && (
              <textarea value={customQuestion} onChange={(e) => setCustomQuestion(e.target.value)} placeholder="Your question..." style={{ width: '100%', marginTop: '12px', padding: '12px', background: 'rgba(10, 8, 20, 0.6)', border: '1px solid rgba(197, 160, 89, 0.3)', borderRadius: '10px', color: '#fff', fontSize: '13px', minHeight: '60px', boxSizing: 'border-box', backdropFilter: 'blur(8px)' }} />
            )}
            <motion.button whileTap={{ scale: 0.98 }} onClick={handleReveal} disabled={isCreating} style={{ width: '100%', marginTop: '16px', padding: '14px', background: isCreating ? 'rgba(197, 160, 89, 0.5)' : 'linear-gradient(135deg, #C5A059 0%, #8B6914 100%)', border: 'none', borderRadius: '10px', color: '#0f0c08', fontSize: '15px', fontWeight: '700', cursor: isCreating ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px rgba(197, 160, 89, 0.4)' }}>
              {isCreating ? 'Drawing your card...' : 'Reveal My Card'}
            </motion.button>
          </motion.div>
        )}

        {stage === 'revealing' && (
          <motion.div key="revealing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, position: 'relative', zIndex: 1 }}>
            <motion.div initial={{ rotateY: 0 }} animate={{ rotateY: 180 }} transition={{ duration: 1.2 }} style={{ width: '220px', height: '330px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 0 50px rgba(197, 160, 89, 0.4)', border: '2px solid #C5A059' }}>
              <img src={CARD_BACK_URL} alt="Card Back" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </motion.div>
          </motion.div>
        )}

        {stage === 'revealed' && currentCard && (
          <motion.div key="revealed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: '220px', height: '330px', borderRadius: '12px', overflow: 'hidden', position: 'relative',
                  border: '2px solid rgba(197, 160, 89, 0.9)',
                  boxShadow: isReversed ? '0 0 40px rgba(167, 139, 250, 0.6), 0 0 80px rgba(167, 139, 250, 0.3), 0 10px 30px rgba(0,0,0,0.8)' : '0 0 40px rgba(197, 160, 89, 0.6), 0 0 80px rgba(197, 160, 89, 0.3), 0 10px 30px rgba(0,0,0,0.8)',
                  transform: isReversed ? 'rotate(180deg)' : 'rotate(0deg)',
                  background: '#0a0600'
                }}
              >
                <img src={currentCard.image_url} alt={currentCard.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {isReversed && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', color: '#fff', border: '2px solid #fff', boxShadow: '0 0 10px rgba(167,139,250,0.8)', transform: 'rotate(-180deg)' }}>
                    R
                  </div>
                )}
              </motion.div>

              <div style={{ width: '48px', display: 'flex', flexDirection: 'column', gap: '14px', marginLeft: '12px' }}>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAIInsight}
                  style={{ ...actionBtnStyle, background: hasPremium ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 215, 0, 0.15)', borderColor: hasPremium ? 'rgba(167, 139, 250, 0.5)' : 'rgba(255, 215, 0, 0.5)', color: hasPremium ? '#a78bfa' : '#FFD700' }}
                  title="AI Insight"
                >
                  <Sparkles size={20} />
                </motion.button>

                <motion.button whileTap={{ scale: 0.9 }} onClick={handleToggleBookmark} style={{ ...actionBtnStyle, color: dailyReading?.is_bookmarked ? '#C5A059' : '#94a3b8' }}>
                  <Bookmark size={20} fill={dailyReading?.is_bookmarked ? '#C5A059' : 'none'} />
                </motion.button>

                <motion.button whileTap={{ scale: 0.9 }} onClick={handleShare} style={actionBtnStyle}>
                  <Share2 size={20} />
                </motion.button>

                <motion.button whileTap={{ scale: 0.9 }} onClick={() => onNavigate?.('reading-history')} style={actionBtnStyle} title="Reading History">
                  <BookOpen size={20} />
                </motion.button>
              </div>
            </div>

            <div style={{ background: 'rgba(10, 8, 20, 0.6)', border: '1px solid rgba(197, 160, 89, 0.2)', borderRadius: '16px', padding: '16px', backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)', marginLeft: '5px', marginRight: '5px', marginBottom: '5px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>{getCardMeta(currentCard)}</div>
                <h2 style={{ margin: '4px 0', fontSize: '22px', color: '#C5A059', fontWeight: '700' }}>{currentCard.name}</h2>
                {isReversed && <span style={{ fontSize: '10px', color: '#a78bfa', fontWeight: '700', letterSpacing: '0.5px' }}>REVERSED POSITION</span>}
              </div>
              <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(197, 160, 89, 0.3), transparent)', margin: '12px 0' }} />
              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: 'rgba(255, 255, 255, 0.9)', fontStyle: 'italic', textAlign: 'center' }}>"{meaning}"</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '12px' }}>
                {keywords.map((keyword: string, idx: number) => (
                  <span key={idx} style={{ background: 'rgba(197, 160, 89, 0.15)', color: '#e2e8f0', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', border: '1px solid rgba(197, 160, 89, 0.25)' }}>
                    {keyword}
                  </span>
                ))}
              </div>

              {dailyReading?.reflection_prompt && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => {
                    if (notes.trim()) return;
                    setNotes(dailyReading.reflection_prompt || '');
                    showToast('💭 Prompt added to your notes! Edit as you wish.', 'info');
                    addLog('ui', 'Prompt filled into notes', { prompt: dailyReading.reflection_prompt });
                  }}
                  style={{
                    marginTop: '8px',
                    marginBottom: '16px',
                    padding: '14px',
                    background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.08) 0%, rgba(124, 58, 237, 0.05) 100%)',
                    border: '1px solid rgba(167, 139, 250, 0.25)',
                    borderRadius: '12px',
                    cursor: notes.trim() ? 'default' : 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    opacity: notes.trim() ? 0.6 : 1
                  }}
                  whileHover={notes.trim() ? {} : { scale: 1.02, borderColor: 'rgba(167, 139, 250, 0.5)' }}
                  whileTap={notes.trim() ? {} : { scale: 0.98 }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '2px' }}>💭</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '9px', color: '#a78bfa', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 700 }}>
                        Reflection Prompt
                      </div>
                      <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: 1.5, fontStyle: 'italic', fontWeight: 400 }}>
                        "{dailyReading.reflection_prompt}"
                      </div>
                      {!notes.trim() && (
                        <div style={{ fontSize: '9px', color: '#a78bfa', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', letterSpacing: '0.5px' }}>
                          <span>✨</span> Tap to start your reflection with this prompt
                        </div>
                      )}
                      {notes.trim() && (
                        <div style={{ fontSize: '9px', color: '#10b981', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>✓</span> Prompt used in your notes
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                  How are you feeling?
                  {moodSaving && <span style={{ fontSize: '9px', color: '#fbbf24' }}>Saving...</span>}
                </label>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {MOODS.map((mood) => (
                    <motion.button
                      key={mood.value}
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.1 }}
                      onClick={async () => {
                        if (!dailyReading) return;
                        setSelectedMood(mood.value);
                        setMoodSaving(true);
                        const success = await updateMood(dailyReading.id, mood.value);
                        if (success) {
                          addLog('success', `Mood saved: ${mood.label}`);
                          showToast(`${mood.emoji} Mood recorded!`, 'success');
                        } else {
                          addLog('error', 'Mood save failed');
                          showToast('Failed to save mood', 'error');
                        }
                        setMoodSaving(false);
                      }}
                      style={{
                        width: '48px',
                        height: '56px',
                        borderRadius: '12px',
                        background: selectedMood === mood.value 
                          ? `linear-gradient(135deg, ${mood.color}30, ${mood.color}15)` 
                          : 'rgba(255,255,255,0.05)',
                        border: selectedMood === mood.value 
                          ? `2px solid ${mood.color}` 
                          : '2px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{mood.emoji}</span>
                      <span style={{ fontSize: '8px', color: selectedMood === mood.value ? mood.color : '#94a3b8', fontWeight: selectedMood === mood.value ? 700 : 500 }}>
                        {mood.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  📝 Your Notes
                  {notesSaving && <span style={{ fontSize: '9px', color: '#fbbf24' }}>Saving...</span>}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write your thoughts about this card..."
                  style={{
                    width: '100%', minHeight: '80px', padding: '10px',
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(197, 160, 89, 0.2)',
                    borderRadius: '8px', color: '#fff', fontSize: '13px',
                    fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isUserAdmin && (
        <div style={{ position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 9999, fontFamily: 'monospace' }}>
          <button onClick={() => setShowDebug(!showDebug)} style={{ width: '50px', height: '50px', background: showDebug ? '#ef4444' : 'rgba(197, 160, 89, 0.9)', border: 'none', borderRadius: '8px 0 0 8px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', fontSize: '20px' }}>
            {showDebug ? '✕' : '🐛'}
          </button>

          {showDebug && (
            <div style={{ position: 'absolute', right: '50px', top: '0', width: '350px', maxHeight: '80vh', background: 'rgba(10, 6, 0, 0.98)', backdropFilter: 'blur(10px)', border: '2px solid #C5A059', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '12px', borderBottom: '1px solid rgba(197, 160, 89, 0.3)', background: 'rgba(197, 160, 89, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C5A059', fontWeight: 'bold', fontSize: '13px' }}>
                    <Shield size={16} /> ADMIN DEBUG
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px', marginBottom: '8px' }}>
                  <div>🔑 Auth: <span style={{ color: authStatus === 'active' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{authStatus === 'active' ? 'ACTIVE ✅' : 'INACTIVE ❌'}</span></div>
                  <div>👤 UID: <span style={{ color: authUid ? '#10b981' : '#ef4444', fontSize: '9px' }}>{authUid ? `${authUid.substring(0, 8)}...` : 'NULL'}</span></div>
                  <div>📊 Stage: <span style={{ color: '#fbbf24' }}>{stage}</span></div>
                  <div>💾 Reading ID: <span style={{ color: dailyReading ? '#10b981' : '#ef4444', fontSize: '9px' }}>{dailyReading?.id?.substring(0, 8) || 'None'}</span></div>
                  <div>🃏 Card: <span style={{ color: '#60a5fa' }}>{currentCard?.name || 'None'}</span></div>
                  <div>🎭 Mood: <span style={{ color: '#a78bfa' }}>{selectedMood || 'None'}</span></div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    📝 Prompt: <span style={{ color: '#f472b6', fontSize: '9px' }}>
                      {dailyReading?.reflection_prompt ? `"${dailyReading.reflection_prompt.substring(0, 40)}..."` : 'None'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '8px' }}>
                  {(['all', 'info', 'success', 'error', 'warning', 'api', 'db', 'ui'] as const).map(type => (
                    <button key={type} onClick={() => setLogFilter(type)} style={{ padding: '4px 8px', background: logFilter === type ? (type === 'all' ? '#C5A059' : logColors[type]) : 'rgba(255,255,255,0.1)', color: logFilter === type ? '#000' : '#fff', border: 'none', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                      {type} ({type === 'all' ? debugLogs.length : debugLogs.filter(l => l.type === type).length})
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={copyAllLogs} style={{ flex: 1, padding: '6px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    {copied ? <><CheckCircle size={10} /> Copied!</> : <><Copy size={10} /> Copy All</>}
                  </button>
                  <button onClick={clearLogs} style={{ flex: 1, padding: '6px', background: 'rgba(239, 68, 68, 0.3)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <Trash2 size={10} /> Clear
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {filteredLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '11px' }}>No logs yet...</div>
                ) : (
                  filteredLogs.map(log => (
                    <div key={log.id} style={{ padding: '8px', marginBottom: '4px', background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${logColors[log.type]}`, borderRadius: '4px', cursor: log.data ? 'pointer' : 'default' }} onClick={() => log.data && setExpandedLog(expandedLog === log.id ? null : log.id)}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '10px' }}>
                        <span style={{ flexShrink: 0 }}>{logIcons[log.type]}</span>
                        <span style={{ color: '#666', flexShrink: 0, fontSize: '9px' }}>{log.timestamp}</span>
                        <span style={{ color: logColors[log.type], fontWeight: 'bold', flexShrink: 0, fontSize: '9px', textTransform: 'uppercase' }}>[{log.type}]</span>
                        <span style={{ color: '#e2e8f0', flex: 1, lineHeight: 1.4 }}>{log.message}</span>
                        {log.data && <span style={{ flexShrink: 0, color: '#666' }}>{expandedLog === log.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</span>}
                      </div>
                      {log.data && expandedLog === log.id && (
                        <div style={{ marginTop: '6px', padding: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', fontSize: '9px', color: '#a78bfa', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}