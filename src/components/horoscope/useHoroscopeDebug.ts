import { useState, useEffect, useRef } from 'react';
import { DebugLog, PerformanceMetrics, SignValidation, ALL_SIGNS } from './horoscopeData';

export function useHoroscopeDebug(
  isAdmin: boolean,
  user: any,
  horoscope: any,
  loading: boolean,
  error: any,
  activeTab: string
) {
  const [debugVisible, setDebugVisible] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({ startTime: Date.now(), phases: [] });
  const [diagnostics, setDiagnostics] = useState<{ type: 'success' | 'error' | 'warn'; message: string }[]>([]);
  const [signValidation, setSignValidation] = useState<SignValidation>({ userSign: '', foundWrongSigns: [], replacementsMade: 0, originalSigns: {} });
  const prevLoadingRef = useRef<boolean | null>(null);
  const prevHoroscopeRef = useRef<any>(null);

  const userSign = user?.sun_sign?.toLowerCase() || '';

  const addLog = (type: DebugLog['type'], category: string, message: string, data?: any) => {
    if (!isAdmin) return;
    const log: DebugLog = {
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type, category, message, data
    };
    setDebugLogs(prev => [log, ...prev].slice(0, 100));
  };

  const addDiagnostic = (type: 'success' | 'error' | 'warn', message: string) => {
    if (!isAdmin) return;
    setDiagnostics(prev => [{ type, message }, ...prev].slice(0, 10));
  };

  const startPhase = (name: string) => {
    if (!isAdmin) return;
    const startTime = Date.now();
    setPerformanceMetrics(prev => ({ ...prev, phases: [...prev.phases, { name, startTime }] }));
  };

  const endPhase = (name: string) => {
    if (!isAdmin) return;
    const endTime = Date.now();
    setPerformanceMetrics(prev => ({
      ...prev,
      phases: prev.phases.map(p => p.name === name && !p.endTime ? { ...p, endTime, duration: endTime - p.startTime } : p)
    }));
  };

  useEffect(() => {
    if (!isAdmin) return;
    addLog('info', 'MOUNT', '🚀 HoroscopeScreen mounted');
    addLog('info', 'USER', '👤 User:', user ? { id: user.id, name: user.display_name, sun_sign: user.sun_sign, moon_sign: user.moon_sign, rising_sign: user.rising_sign } : null);
    setPerformanceMetrics({ startTime: Date.now(), phases: [] });
    startPhase('component_init');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    if (prevLoadingRef.current !== loading) {
      addLog('info', 'STATE', `📊 Loading changed: ${prevLoadingRef.current} → ${loading}`);
      if (loading) startPhase('data_fetch');
      else {
        endPhase('data_fetch');
        const phase = performanceMetrics.phases.find(p => p.name === 'data_fetch');
        if (phase?.duration) addLog('perf', 'PERF', `⏱️ Total fetch time: ${phase.duration}ms`);
      }
      prevLoadingRef.current = loading;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (!isAdmin) return;
    if (horoscope !== prevHoroscopeRef.current) {
      addLog('info', 'DATA', '📦 Horoscope data updated', horoscope);
      if (horoscope && userSign) {
        const foundWrongSigns: string[] = [];
        const originalSigns: { [key: string]: number } = {};
        let replacementsMade = 0;
        const allTexts = [
          horoscope.general_prediction, horoscope.love_prediction, horoscope.career_prediction,
          horoscope.health_prediction, horoscope.finance_prediction, horoscope.affirmation, horoscope.hero_description
        ].filter(Boolean).join(' ');

        ALL_SIGNS.forEach(sign => {
          if (sign === userSign) return;
          const signCap = sign.charAt(0).toUpperCase() + sign.slice(1).toLowerCase();
          const matches = allTexts.match(new RegExp(`\\b${signCap}\\b`, 'gi'));
          if (matches && matches.length > 0) {
            foundWrongSigns.push(signCap);
            originalSigns[signCap] = matches.length;
            replacementsMade += matches.length;
          }
        });
        setSignValidation({ userSign, foundWrongSigns, replacementsMade, originalSigns });
        if (foundWrongSigns.length > 0) addDiagnostic('warn', `Wrong signs detected: ${foundWrongSigns.join(', ')}`);
        else addDiagnostic('success', 'Sign validation passed ✅');
      }
      prevHoroscopeRef.current = horoscope;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horoscope, userSign]);

  useEffect(() => {
    if (!isAdmin) return;
    if (error) {
      addLog('error', 'ERROR', '❌ Error occurred', error);
      addDiagnostic('error', `Error: ${String(error)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  useEffect(() => {
    if (!isAdmin) return;
    addLog('info', 'TAB', `📑 Active tab: ${activeTab}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (!isAdmin) return;
    if (!loading && horoscope && performanceMetrics.duration === undefined) {
      const endTime = Date.now();
      setPerformanceMetrics(prev => ({ ...prev, endTime, duration: endTime - prev.startTime }));
      endPhase('component_init');
      addLog('success', 'COMPLETE', `🎉 Component fully loaded in ${endTime - performanceMetrics.startTime}ms`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, horoscope]);

  const handleCopyDebug = () => {
    const debugData = {
      timestamp: new Date().toISOString(),
      app: 'Lunara v2',
      page: 'HoroscopeScreen',
      user: user ? { id: user.id, name: user.display_name, sun_sign: user.sun_sign, moon_sign: user.moon_sign, rising_sign: user.rising_sign } : null,
      performance: performanceMetrics,
      diagnostics, signValidation, logs: debugLogs, horoscope, activeTab,
      url: window.location.href
    };
    return debugData;
  };

  return {
    debugVisible, setDebugVisible, debugLogs, performanceMetrics,
    diagnostics, signValidation, addLog, handleCopyDebug
  };
}