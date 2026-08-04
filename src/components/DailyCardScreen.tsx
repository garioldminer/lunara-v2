import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Briefcase, Star, Share2, Lock, Bookmark, BookOpen, ArrowLeft, Shield, RefreshCw, Copy, CheckCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { tarotCards, TarotCard, SUITS, CARD_BACK_URL } from '../data/tarotCards';
import { saveReading, getUserReadings } from '../lib/readingService';
import { logReading } from '../lib/adminService';
import { trackQuestProgress } from '../lib/questService';
import { useUser } from '../context/UserContext';
import { getActiveSubscription } from '../lib/subscriptionService';
import { supabase } from '../lib/supabase';

interface Props {
  onNavigate?: (screen: string) => void;
}

type FocusArea = 'general' | 'love' | 'career' | 'custom';
type LogType = 'info' | 'success' | 'error' | 'warning' | 'api' | 'db' | 'ui';

interface DailyReading {
  card: TarotCard;
  isReversed: boolean;
  date: string;
  focusArea: FocusArea;
  question?: string;
  isRevealed?: boolean;
}

interface DebugLog {
  id: number;
  timestamp: string;
  type: LogType;
  message: string;
  data?: any;
}

const logColors: Record<LogType, string> = {
  info: '#60a5fa',
  success: '#10b981',
  error: '#ef4444',
  warning: '#fbbf24',
  api: '#a78bfa',
  db: '#f472b6',
  ui: '#f59e0b'
};

const logIcons: Record<LogType, string> = {
  info: 'ℹ️',
  success: '✅',
  error: '❌',
  warning: '⚠️',
  api: '🌐',
  db: '🗄️',
  ui: ''
};

// ============================================
//  PROCEDURAL STAR FIELD
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
      
      const brightness = Math.log(1 - Math.random()) * -0.5;
      sizes[i] = brightness * 2;
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
//  NEBULA WITH PERLIN NOISE
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
// ✨ BRIGHT STARS WITH GLOW
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
//  REALISTIC COSMIC SCENE
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
// MAIN COMPONENT
// ============================================
export default function DailyCardScreen({ onNavigate }: Props) {
  const [dailyReading, setDailyReading] = useState<DailyReading | null>(null);
  const [stage, setStage] = useState<'selecting' | 'revealing' | 'revealed'>('selecting');
  const [selectedFocus, setSelectedFocus] = useState<FocusArea>('general');
  const [customQuestion, setCustomQuestion] = useState('');
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const { user } = useUser();
  const [hasPremium, setHasPremium] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  
  const [isReadingSaved, setIsReadingSaved] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);
  
  // Debug Panel States
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [logFilter, setLogFilter] = useState<LogType | 'all'>('all');
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  
  // 🆕 Auth Status
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'checking' | 'active' | 'inactive'>('checking');

  // 🆕 Admin Telegram ID
  const ADMIN_TELEGRAM_ID = 1436756556;

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  // Helper: Add Debug Log
  const addLog = (type: LogType, message: string, data?: any) => {
    const log: DebugLog = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      message,
      data
    };
    setDebugLogs(prev => [log, ...prev].slice(0, 100));
    console.log(`[${type.toUpperCase()}] ${message}`, data || '');
  };

  //  Check Supabase Auth Status
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
      
      // Admin check by Telegram ID
      const tg = (window as any).Telegram?.WebApp;
      const tgUserId = tg?.initDataUnsafe?.user?.id;
      const isAdminByTgId = tgUserId === ADMIN_TELEGRAM_ID;
      setIsUserAdmin(isAdminByTgId);
      addLog('info', 'Admin check completed', { 
        isAdmin: isAdminByTgId, 
        tgUserId, 
        authUid: user.id 
      });
      
      getActiveSubscription(user.id).then(sub => {
        setHasPremium(!!sub);
        addLog('info', 'Subscription check', { hasPremium: !!sub });
      });
    } else {
      addLog('error', 'No user in context');
    }
  }, [user]);

  useEffect(() => {
    const today = getTodayDate();
    addLog('info', 'Checking localStorage for daily card', { today });
    
    const stored = localStorage.getItem('dailyCard');
    if (stored) {
      const parsed: DailyReading = JSON.parse(stored);
      addLog('db', 'Found stored daily card', { date: parsed.date, isRevealed: parsed.isRevealed });
      
      if (parsed.date === today) {
        setDailyReading(parsed);
        setSelectedFocus(parsed.focusArea || 'general');
        if (parsed.focusArea === 'custom' && parsed.question) setCustomQuestion(parsed.question);
        
        if (parsed.isRevealed) {
          addLog('success', 'Card already revealed, going to revealed stage');
          setStage('revealed');
          checkAndSaveReading(parsed);
        } else {
          addLog('info', 'Card not yet revealed, going to selecting stage');
          setStage('selecting');
        }
        return;
      } else {
        addLog('warning', 'Stored card is from different date, generating new');
      }
    } else {
      addLog('info', 'No stored card found');
    }
    generateDailyCard();
  }, []);

  const checkAndSaveReading = async (reading: DailyReading) => {
    if (!user || saveAttempted) {
      addLog('info', 'Skipping save check', { hasUser: !!user, alreadyAttempted: saveAttempted });
      return;
    }
    
    setSaveAttempted(true);
    addLog('api', 'Checking if reading already saved in Supabase');
    
    try {
      const existingReadings = await getUserReadings(user.id, 100);
      const todayReadings = existingReadings.filter(r => {
        const readingDate = new Date(r.created_at).toISOString().split('T')[0];
        return readingDate === reading.date && r.reading_type === 'daily';
      });
      
      addLog('db', 'Today readings found', { count: todayReadings.length });
      
      if (todayReadings.length > 0) {
        addLog('success', 'Reading already saved, skipping');
        setIsReadingSaved(true);
        return;
      }
      
      addLog('api', 'Saving reading to Supabase', { card: reading.card.name });
      const saveResult = await saveReading({ 
        user_id: user.id, 
        reading_type: 'daily', 
        question: reading.question, 
        cards: [{ 
          id: reading.card.id, 
          name: reading.card.name, 
          is_reversed: reading.isReversed 
        }] 
      });
      
      if (saveResult && saveResult.success) {
        addLog('success', 'Reading saved successfully', saveResult.data);
        setIsReadingSaved(true);
      } else {
        addLog('error', 'Failed to save reading', saveResult?.error);
      }
    } catch (error: any) {
      addLog('error', 'Error in checkAndSaveReading', { error: error.message });
    }
  };

  const generateDailyCard = () => {
    const today = getTodayDate();
    const dayOfYear = getDayOfYear(new Date());
    const card = tarotCards[dayOfYear % tarotCards.length];
    const newReading: DailyReading = { 
      card, 
      isReversed: Math.random() < 0.5, 
      date: today, 
      focusArea: 'general',
      isRevealed: false 
    };
    addLog('db', 'Generated new daily card', { cardName: card.name, date: today });
    localStorage.setItem('dailyCard', JSON.stringify(newReading));
    setDailyReading(newReading);
    setStage('selecting');
  };

  const getDayOfYear = (date: Date): number => {
    const start = new Date(date.getFullYear(), 0, 0);
    return Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleFocusSelect = (focus: FocusArea) => {
    setSelectedFocus(focus);
    setShowQuestionInput(focus === 'custom');
    if (focus !== 'custom') setCustomQuestion('');
    addLog('ui', 'Focus area selected', { focus });
  };

  const handleReveal = async () => {
    if (!dailyReading) return;
    addLog('ui', 'Reveal button clicked');
    
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
    setStage('revealing');
    
    const updatedReading = { 
      ...dailyReading, 
      focusArea: selectedFocus, 
      question: selectedFocus === 'custom' ? customQuestion : undefined,
      isRevealed: true 
    };
    
    setDailyReading(updatedReading);
    localStorage.setItem('dailyCard', JSON.stringify(updatedReading));
    addLog('db', 'Updated localStorage with revealed card');

    setTimeout(async () => {
      setStage('revealed');
      if (user) {
        try {
          addLog('api', 'Saving reading after reveal');
          const saveResult = await saveReading({ 
            user_id: user.id, 
            reading_type: 'daily', 
            question: updatedReading.question, 
            cards: [{ 
              id: updatedReading.card.id, 
              name: updatedReading.card.name, 
              is_reversed: updatedReading.isReversed 
            }] 
          });
          
          if (!saveResult || !saveResult.success) {
            addLog('error', 'Failed to save reading', saveResult?.error);
            alert(`Failed to save reading: ${saveResult?.error || 'Unknown error'}`);
            return;
          }
          
          addLog('success', 'Reading saved successfully after reveal');
          setIsReadingSaved(true);
          
          await logReading(user.id, 'daily_card', [updatedReading.card.id], `${updatedReading.card.name}${updatedReading.isReversed ? ' (Reversed)' : ''}`);
          await trackQuestProgress(user.id, 'draw_daily_card', 1);
        } catch (error: any) { 
          addLog('error', 'Error in handleReveal', { error: error.message });
          alert(`Error: ${error.message}`);
        }
      }
    }, 1200);
  };

  const handleShare = () => {
    if (!dailyReading) return;
    addLog('ui', 'Share button clicked');
    const { card, isReversed } = dailyReading;
    const shareText = ` My Daily Card: ${card.name}${isReversed ? ' (Reversed)' : ''}\n\n"${isReversed ? card.reversed_meaning : card.meaning}"\n\nDraw your own card on Lunara App! ✨`;
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(window.location.href || '')}&text=${encodeURIComponent(shareText)}`);
      addLog('success', 'Share dialog opened');
    } else {
      navigator.clipboard.writeText(shareText);
      addLog('success', 'Copied to clipboard');
      alert('Copied to clipboard!');
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

  const testSaveReading = async () => {
    if (!dailyReading || !user) {
      addLog('error', 'Cannot test save: no reading or user');
      return;
    }
    addLog('api', 'Manual test save triggered');
    const saveResult = await saveReading({ 
      user_id: user.id, 
      reading_type: 'daily', 
      question: dailyReading.question, 
      cards: [{ 
        id: dailyReading.card.id, 
        name: dailyReading.card.name, 
        is_reversed: dailyReading.isReversed 
      }] 
    });
    if (saveResult?.success) {
      addLog('success', 'Test save successful', saveResult.data);
      setIsReadingSaved(true);
    } else {
      addLog('error', 'Test save failed', saveResult?.error);
    }
  };

  const filteredLogs = logFilter === 'all' ? debugLogs : debugLogs.filter(l => l.type === logFilter);

  if (!dailyReading) {
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

  const { card, isReversed } = dailyReading;
  const meaning = isReversed ? card.reversed_meaning : card.meaning;
  const keywords = isReversed ? card.reversed_keywords : card.keywords;

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    position: 'relative',
    color: '#fff',
    paddingTop: 'calc(70px + env(safe-area-inset-top, 0px))',
    paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
    paddingLeft: '5px',
    paddingRight: '5px',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    background: '#000002'
  };

  const actionBtnStyle: React.CSSProperties = {
    width: '48px', height: '48px', borderRadius: '50%',
    background: 'rgba(10, 8, 20, 0.5)',
    border: '1px solid rgba(197, 160, 89, 0.4)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#C5A059', cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
  };

  return (
    <div style={containerStyle}>
      <Canvas 
        dpr={[1, 1.5]} 
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none' }}
        camera={{ position: [0, 0, 35], fov: 60 }}
      >
        <CosmicScene />
      </Canvas>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingLeft: '5px', paddingRight: '5px', position: 'relative', zIndex: 1 }}>
        <button 
          onClick={() => onNavigate?.('home')}
          style={{ background: 'rgba(10, 8, 20, 0.5)', border: '1px solid rgba(197, 160, 89, 0.4)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C5A059', cursor: 'pointer', backdropFilter: 'blur(12px)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', background: 'rgba(10, 8, 20, 0.4)', padding: '6px 12px', borderRadius: '20px', backdropFilter: 'blur(8px)' }}>
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
        </div>
        <div style={{ width: '40px' }} />
      </div>

      <AnimatePresence mode="wait">
        {stage === 'selecting' && (
          <motion.div key="selecting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ padding: '0 10px', position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: '20px', background: 'rgba(10, 8, 20, 0.6)', padding: '20px', borderRadius: '16px', backdropFilter: 'blur(12px)', border: '1px solid rgba(197, 160, 89, 0.15)' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}></div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#C5A059' }}>Set Your Intention</h2>
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
            <motion.button whileTap={{ scale: 0.98 }} onClick={handleReveal} style={{ width: '100%', marginTop: '16px', padding: '14px', background: 'linear-gradient(135deg, #C5A059 0%, #8B6914 100%)', border: 'none', borderRadius: '10px', color: '#0f0c08', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 20px rgba(197, 160, 89, 0.4)' }}>
              Reveal My Card
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

        {stage === 'revealed' && (
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
                <img src={card.image_url} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {isReversed && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', color: '#fff', border: '2px solid #fff', boxShadow: '0 0 10px rgba(167,139,250,0.8)', transform: isReversed ? 'rotate(-180deg)' : 'rotate(0deg)' }}>
                    R
                  </div>
                )}
              </motion.div>

              <div style={{ width: '48px', display: 'flex', flexDirection: 'column', gap: '14px', marginLeft: '12px' }}>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => !hasPremium && onNavigate?.('pricing')} style={{ ...actionBtnStyle, background: hasPremium ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 215, 0, 0.15)', borderColor: hasPremium ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 215, 0, 0.5)', color: hasPremium ? '#10b981' : '#FFD700' }}>
                  {hasPremium ? <Sparkles size={20} /> : <Lock size={18} />}
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsBookmarked(!isBookmarked)} style={{ ...actionBtnStyle, color: isBookmarked ? '#C5A059' : '#94a3b8' }}>
                  <Bookmark size={20} fill={isBookmarked ? '#C5A059' : 'none'} />
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
                <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>{getCardMeta(card)}</div>
                <h2 style={{ margin: '4px 0', fontSize: '22px', color: '#C5A059', fontWeight: '700' }}>{card.name}</h2>
                {isReversed && <span style={{ fontSize: '10px', color: '#a78bfa', fontWeight: '700', letterSpacing: '0.5px' }}>REVERSED POSITION</span>}
              </div>
              <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(197, 160, 89, 0.3), transparent)', margin: '12px 0' }} />
              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: 'rgba(255, 255, 255, 0.9)', fontStyle: 'italic', textAlign: 'center' }}>"{meaning}"</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                {keywords.map((keyword: string, idx: number) => (
                  <span key={idx} style={{ background: 'rgba(197, 160, 89, 0.15)', color: '#e2e8f0', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', border: '1px solid rgba(197, 160, 89, 0.25)' }}>
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🐛 FLOATING DEBUG PANEL (მხოლოდ ადმინისთვის) */}
      {isUserAdmin && (
        <div style={{ position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 9999, fontFamily: 'monospace' }}>
          <button 
            onClick={() => setShowDebug(!showDebug)}
            style={{
              width: '50px',
              height: '50px',
              background: showDebug ? '#ef4444' : 'rgba(197, 160, 89, 0.9)',
              border: 'none',
              borderRadius: '8px 0 0 8px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              fontSize: '20px'
            }}
          >
            {showDebug ? '✕' : '🐛'}
          </button>

          {showDebug && (
            <div style={{
              position: 'absolute',
              right: '50px',
              top: '0',
              width: '350px',
              maxHeight: '80vh',
              background: 'rgba(10, 6, 0, 0.98)',
              backdropFilter: 'blur(10px)',
              border: '2px solid #C5A059',
              borderRadius: '8px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ padding: '12px', borderBottom: '1px solid rgba(197, 160, 89, 0.3)', background: 'rgba(197, 160, 89, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C5A059', fontWeight: 'bold', fontSize: '13px' }}>
                    <Shield size={16} />
                    ADMIN DEBUG CONSOLE
                  </div>
                </div>

                {/* 🆕 Auth Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px', marginBottom: '8px' }}>
                  <div>🔑 Auth: <span style={{ color: authStatus === 'active' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{authStatus === 'active' ? 'ACTIVE ✅' : 'INACTIVE ❌'}</span></div>
                  <div>👤 UID: <span style={{ color: authUid ? '#10b981' : '#ef4444', fontSize: '9px' }}>{authUid ? `${authUid.substring(0, 8)}...` : 'NULL'}</span></div>
                  <div>📊 Stage: <span style={{ color: '#fbbf24' }}>{stage}</span></div>
                  <div>💾 Saved: <span style={{ color: isReadingSaved ? '#10b981' : '#ef4444' }}>{isReadingSaved ? 'YES ✅' : 'NO ❌'}</span></div>
                  <div>🃏 Card: <span style={{ color: '#60a5fa' }}>{card.name}</span></div>
                  <div>🔄 Reversed: <span style={{ color: '#a78bfa' }}>{isReversed ? 'YES' : 'NO'}</span></div>
                </div>

                <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '8px' }}>
                  {(['all', 'info', 'success', 'error', 'warning', 'api', 'db', 'ui'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setLogFilter(type)}
                      style={{
                        padding: '4px 8px',
                        background: logFilter === type ? (type === 'all' ? '#C5A059' : logColors[type]) : 'rgba(255,255,255,0.1)',
                        color: logFilter === type ? '#000' : '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        textTransform: 'uppercase'
                      }}
                    >
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
                  <button onClick={testSaveReading} style={{ flex: 1, padding: '6px', background: '#C5A059', color: '#0a0600', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <RefreshCw size={10} /> Test Save
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {filteredLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '11px' }}>No logs yet...</div>
                ) : (
                  filteredLogs.map(log => (
                    <div 
                      key={log.id}
                      style={{ 
                        padding: '8px', 
                        marginBottom: '4px', 
                        background: 'rgba(255,255,255,0.03)', 
                        borderLeft: `3px solid ${logColors[log.type]}`,
                        borderRadius: '4px',
                        cursor: log.data ? 'pointer' : 'default'
                      }}
                      onClick={() => log.data && setExpandedLog(expandedLog === log.id ? null : log.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '10px' }}>
                        <span style={{ flexShrink: 0 }}>{logIcons[log.type]}</span>
                        <span style={{ color: '#666', flexShrink: 0, fontSize: '9px' }}>{log.timestamp}</span>
                        <span style={{ color: logColors[log.type], fontWeight: 'bold', flexShrink: 0, fontSize: '9px', textTransform: 'uppercase' }}>
                          [{log.type}]
                        </span>
                        <span style={{ color: '#e2e8f0', flex: 1, lineHeight: 1.4 }}>{log.message}</span>
                        {log.data && (
                          <span style={{ flexShrink: 0, color: '#666' }}>
                            {expandedLog === log.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </span>
                        )}
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