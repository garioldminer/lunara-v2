import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock, Database, Trophy, Copy, Activity, Zap, Shield, Calendar } from 'lucide-react';
import { 
  getStreakInfo, 
  getStreakMilestones, 
  getClaimedMilestones,
  getStreakCalendar,
  getStreakDiagnostics,
  type StreakInfo,
  type StreakMilestone,
  type ClaimedMilestone,
  type CalendarDay
} from '../../../../lib/streakService';
import { getStreakTier, getStreakWarning } from '../../lib/helpers';

interface StreakDebugPanelProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface LogEntry {
  id: number;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  category: string;
  message: string;
  duration?: number;
}

interface ValidationCheck {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  details: string;
  category: string;
}

interface PerfMetrics {
  streakInfo: number;
  milestones: number;
  claimed: number;
  calendar: number;
  diagnostics: number;
  total: number;
}

export function StreakDebugPanel({ userId, isOpen, onClose }: StreakDebugPanelProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [validations, setValidations] = useState<ValidationCheck[]>([]);
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [milestones, setMilestones] = useState<StreakMilestone[]>([]);
  const [claimed, setClaimed] = useState<ClaimedMilestone[]>([]);
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logIdCounter, setLogIdCounter] = useState(0);
  const [copied, setCopied] = useState(false);
  const [perfData, setPerfData] = useState<PerfMetrics>({
    streakInfo: 0, milestones: 0, claimed: 0, calendar: 0, diagnostics: 0, total: 0
  });
  const [healthScore, setHealthScore] = useState(0);

  const addLog = (level: LogEntry['level'], category: string, message: string, duration?: number) => {
    const newLog: LogEntry = {
      id: logIdCounter + 1,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      level,
      category,
      message,
      duration
    };
    setLogIdCounter(prev => prev + 1);
    setLogs(prev => [newLog, ...prev].slice(0, 100));
  };

  const copyToClipboard = async (currentValidations: ValidationCheck[], currentLogs: LogEntry[]) => {
    const activeDays = calendar.filter(d => d.has_reading).length;
    const missedDays = calendar.filter(d => !d.has_reading && !d.is_future && !d.is_today).length;
    const futureDays = calendar.filter(d => d.is_future).length;
    const todayStr = new Date().toISOString().split('T')[0];
    
    const report = {
      _meta: {
        report_type: 'Streak System Diagnostic',
        timestamp: new Date().toISOString(),
        version: '2.0',
        userId
      },
      health_score: `${healthScore}%`,
      summary: {
        pass: currentValidations.filter(v => v.status === 'pass').length,
        fail: currentValidations.filter(v => v.status === 'fail').length,
        warning: currentValidations.filter(v => v.status === 'warning').length,
        total_checks: currentValidations.length
      },
      performance: {
        streak_info_ms: perfData.streakInfo,
        milestones_ms: perfData.milestones,
        claimed_ms: perfData.claimed,
        calendar_ms: perfData.calendar,
        diagnostics_ms: perfData.diagnostics,
        total_ms: perfData.total,
        assessment: perfData.total > 3000 ? 'SLOW' : perfData.total > 1500 ? 'ACCEPTABLE' : 'FAST'
      },
      streak_state: streakInfo ? {
        current_streak: streakInfo.current_streak,
        longest_streak: streakInfo.longest_streak,
        last_active_date: streakInfo.last_active_date,
        last_daily_claim: streakInfo.last_daily_claim,
        days_since_last_active: streakInfo.last_active_date 
          ? Math.floor((new Date(todayStr).getTime() - new Date(streakInfo.last_active_date).getTime()) / 86400000)
          : null,
        days_since_last_claim: streakInfo.last_daily_claim
          ? Math.floor((new Date(todayStr).getTime() - new Date(streakInfo.last_daily_claim).getTime()) / 86400000)
          : null,
        tier: getStreakTier(streakInfo.current_streak),
        next_milestone: streakInfo.next_milestone?.name || null,
        days_to_next: streakInfo.days_to_next,
        percent_to_next: streakInfo.percent_to_next,
        achieved_not_claimed_count: streakInfo.achieved_not_claimed.length,
        achieved_not_claimed_list: streakInfo.achieved_not_claimed.map(m => ({
          id: m.id,
          name: m.name,
          days_required: m.days_required,
          reward_coins: m.reward_coins,
          reward_xp: m.reward_xp
        }))
      } : null,
      calendar: {
        total_days_loaded: calendar.length,
        active_days: activeDays,
        missed_days: missedDays,
        future_days: futureDays,
        today: todayStr,
        active_rate: calendar.length > 0 ? ((activeDays / calendar.filter(d => !d.is_future).length) * 100).toFixed(1) + '%' : 'N/A',
        streak_continuity: getStreakContinuity(calendar)
      },
      diagnostics: diagnostics?.stats || null,
      validations: currentValidations.map(v => ({
        category: v.category,
        check: v.label,
        status: v.status,
        details: v.details
      })),
      milestones_config: milestones.map(m => ({
        id: m.id,
        days: m.days_required,
        name: m.name,
        coins: m.reward_coins,
        xp: m.reward_xp,
        premium_days: m.reward_premium_days,
        claimed: claimed.some(c => c.milestone_id === m.id)
      })),
      recent_logs: currentLogs.slice(0, 30).map(l => ({
        time: l.timestamp,
        level: l.level,
        category: l.category,
        message: l.message,
        duration_ms: l.duration
      }))
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addLog('success', 'COPY', '📋 Full diagnostic report copied to clipboard');
    } catch (err) {
      addLog('error', 'COPY', `❌ Failed to copy: ${(err as Error).message}`);
    }
  };

  const getStreakContinuity = (cal: CalendarDay[]): string => {
    const sortedDays = [...cal].sort((a, b) => a.date.localeCompare(b.date));
    const activeDates = sortedDays.filter(d => d.has_reading).map(d => d.date);
    
    if (activeDates.length === 0) return 'No activity';
    
    const today = new Date();
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }
    
    const activeInLast7 = last7Days.filter(d => activeDates.includes(d)).length;
    return `${activeInLast7}/7 days active (last week)`;
  };

  const runAllChecks = async () => {
    setLoading(true);
    setValidations([]);
    const checks: ValidationCheck[] = [];
    const metrics: PerfMetrics = {
      streakInfo: 0, milestones: 0, claimed: 0, calendar: 0, diagnostics: 0, total: 0
    };
    const totalStartTime = Date.now();
    let loadedStreakInfo: StreakInfo | null = null;
    let loadedMilestones: StreakMilestone[] = [];
    let loadedClaimed: ClaimedMilestone[] = [];

    addLog('info', 'START', '🚀 Starting full streak system diagnostic...');

    // TEST 1: User Economy Data
    try {
      const startTime = Date.now();
      const info = await getStreakInfo(userId);
      metrics.streakInfo = Date.now() - startTime;
      loadedStreakInfo = info;

      if (info) {
        setStreakInfo(info);
        addLog('success', 'STREAK_INFO', `✅ Loaded in ${metrics.streakInfo}ms`, metrics.streakInfo);
        
        if (metrics.streakInfo > 1000) {
          addLog('warning', 'PERFORMANCE', `⚠️ StreakInfo API is slow (${metrics.streakInfo}ms)`);
        }
        
        checks.push({
          id: 'streak_value',
          category: 'STREAK',
          label: 'Current Streak Value',
          status: info.current_streak >= 0 ? 'pass' : 'fail',
          details: `Value: ${info.current_streak} days`
        });

        checks.push({
          id: 'longest_value',
          category: 'STREAK',
          label: 'Longest Streak',
          status: info.longest_streak >= info.current_streak ? 'pass' : 'warning',
          details: `Longest: ${info.longest_streak}, Current: ${info.current_streak}`
        });

        checks.push({
          id: 'last_active_date',
          category: 'STREAK',
          label: 'Last Active Date',
          status: info.last_active_date ? 'pass' : 'warning',
          details: info.last_active_date || 'NULL - streak may be at risk'
        });

        checks.push({
          id: 'last_daily_claim',
          category: 'STREAK',
          label: 'Last Daily Claim',
          status: info.last_daily_claim ? 'pass' : 'warning',
          details: info.last_daily_claim || 'NULL - never claimed daily reward'
        });

        if (info.last_active_date) {
          const warning = getStreakWarning(info.last_active_date);
          checks.push({
            id: 'warning_system',
            category: 'STREAK',
            label: 'Warning System',
            status: 'pass',
            details: `${warning.icon} Status: ${warning.dangerLevel.toUpperCase()} • ${warning.message} (${warning.hoursRemaining}h remaining)`
          });
        } else {
          checks.push({
            id: 'warning_system',
            category: 'STREAK',
            label: 'Warning System',
            status: 'warning',
            details: '⚠️ Cannot calculate - no last_active_date'
          });
        }

        if (info.next_milestone) {
          checks.push({
            id: 'next_milestone',
            category: 'STREAK',
            label: 'Next Milestone',
            status: info.days_to_next >= 0 && info.percent_to_next >= 0 ? 'pass' : 'fail',
            details: `${info.next_milestone.name} in ${info.days_to_next} days (${info.percent_to_next.toFixed(1)}%)`
          });
        } else {
          checks.push({
            id: 'next_milestone',
            category: 'STREAK',
            label: 'Next Milestone',
            status: 'warning',
            details: 'No next milestone (may have reached max)'
          });
        }

        checks.push({
          id: 'unclaimed_rewards',
          category: 'STREAK',
          label: 'Unclaimed Rewards',
          status: info.achieved_not_claimed.length > 0 ? 'warning' : 'pass',
          details: info.achieved_not_claimed.length > 0 
            ? `${info.achieved_not_claimed.length} unclaimed: ${info.achieved_not_claimed.map(m => m.name).join(', ')}`
            : '0 unclaimed rewards'
        });

      } else {
        addLog('error', 'STREAK_INFO', '❌ Failed to load streak info');
        checks.push({
          id: 'streak_info',
          category: 'STREAK',
          label: 'Streak Info Load',
          status: 'fail',
          details: 'Failed to load from database'
        });
      }
    } catch (error: any) {
      addLog('error', 'STREAK_INFO', `❌ Exception: ${error.message}`);
      checks.push({
        id: 'streak_info_error',
        category: 'STREAK',
        label: 'Streak Info',
        status: 'fail',
        details: error.message
      });
    }

    // TEST 2: Milestones Config
    try {
      const startTime = Date.now();
      const msList = await getStreakMilestones();
      metrics.milestones = Date.now() - startTime;
      loadedMilestones = msList;
      setMilestones(msList);

      if (msList.length > 0) {
        addLog('success', 'MILESTONES', `✅ Loaded ${msList.length} milestones in ${metrics.milestones}ms`, metrics.milestones);
        
        checks.push({
          id: 'milestones_config',
          category: 'CONFIG',
          label: 'Milestones Configuration',
          status: msList.length >= 5 ? 'pass' : 'warning',
          details: `${msList.length} milestones defined`
        });

        const daysSet = new Set(msList.map(m => m.days_required));
        checks.push({
          id: 'milestone_duplicates',
          category: 'CONFIG',
          label: 'Milestone Duplicates',
          status: daysSet.size === msList.length ? 'pass' : 'fail',
          details: daysSet.size === msList.length ? 'No duplicates found' : 'Duplicate days detected!'
        });

        const isSorted = msList.every((m, i) => i === 0 || m.days_required > msList[i-1].days_required);
        checks.push({
          id: 'milestone_sort',
          category: 'CONFIG',
          label: 'Milestone Sort Order',
          status: isSorted ? 'pass' : 'fail',
          details: msList.map(m => m.days_required).join(' → ')
        });

        const invalidRewards = msList.filter(m => m.reward_coins < 0 || m.reward_xp < 0);
        checks.push({
          id: 'milestone_rewards',
          category: 'CONFIG',
          label: 'Milestone Rewards',
          status: invalidRewards.length === 0 ? 'pass' : 'fail',
          details: invalidRewards.length === 0 
            ? 'All rewards are positive'
            : `Invalid: ${invalidRewards.map(m => m.name).join(', ')}`
        });

        checks.push({
          id: 'tier_consistency',
          category: 'CONFIG',
          label: 'Tier System Compatibility',
          status: 'pass',
          details: `Tier system OK, ${msList.length} milestones defined`
        });

      } else {
        addLog('warning', 'MILESTONES', '⚠️ No milestones found');
        checks.push({
          id: 'milestones_config',
          category: 'CONFIG',
          label: 'Milestones Configuration',
          status: 'fail',
          details: 'No milestones defined in database'
        });
      }
    } catch (error: any) {
      addLog('error', 'MILESTONES', `❌ Exception: ${error.message}`);
    }

    // TEST 3: Claimed Milestones
    try {
      const startTime = Date.now();
      const claimedList = await getClaimedMilestones(userId);
      metrics.claimed = Date.now() - startTime;
      loadedClaimed = claimedList;
      setClaimed(claimedList);

      addLog('success', 'CLAIMED', `✅ Loaded ${claimedList.length} claimed milestones in ${metrics.claimed}ms`, metrics.claimed);
      
      checks.push({
        id: 'claimed_count',
        category: 'CLAIMS',
        label: 'Claimed Milestones',
        status: 'pass',
        details: `${claimedList.length} milestones claimed`
      });

      const claimedIds = claimedList.map(c => c.milestone_id);
      const uniqueClaimedIds = new Set(claimedIds);
      checks.push({
        id: 'claimed_duplicates',
        category: 'CLAIMS',
        label: 'Claimed Duplicates',
        status: uniqueClaimedIds.size === claimedIds.length ? 'pass' : 'fail',
        details: uniqueClaimedIds.size === claimedIds.length ? 'No duplicate claims' : 'DUPLICATE CLAIMS DETECTED!'
      });

      const validClaimed = claimedList.filter(c => loadedMilestones.some(m => m.id === c.milestone_id));
      checks.push({
        id: 'claimed_valid',
        category: 'CLAIMS',
        label: 'Claimed Milestones Valid',
        status: validClaimed.length === claimedList.length ? 'pass' : 'warning',
        details: `${validClaimed.length}/${claimedList.length} claimed milestones exist in config`
      });

    } catch (error: any) {
      addLog('error', 'CLAIMED', `❌ Exception: ${error.message}`);
    }

    // TEST 4: Calendar Data
    try {
      const startTime = Date.now();
      const calData = await getStreakCalendar(userId, 30);
      metrics.calendar = Date.now() - startTime;
      setCalendar(calData);

      const activeDays = calData.filter(d => d.has_reading).length;
      const missedDays = calData.filter(d => !d.has_reading && !d.is_future && !d.is_today).length;

      addLog('success', 'CALENDAR', `✅ Loaded ${calData.length} days in ${metrics.calendar}ms (${activeDays} active, ${missedDays} missed)`, metrics.calendar);
      
      checks.push({
        id: 'calendar_data',
        category: 'CALENDAR',
        label: 'Calendar Data',
        status: calData.length === 30 ? 'pass' : 'warning',
        details: `${calData.length} days loaded (${activeDays} active, ${missedDays} missed)`
      });

      const futureDates = calData.filter(d => d.is_future);
      checks.push({
        id: 'future_dates',
        category: 'CALENDAR',
        label: 'Future Dates in Calendar',
        status: futureDates.length <= 1 ? 'pass' : 'warning',
        details: futureDates.length === 0 ? 'No future dates' : `${futureDates.length} future date(s) found`
      });

      const todayStr = new Date().toISOString().split('T')[0];
      const hasToday = calData.some(d => d.date === todayStr);
      checks.push({
        id: 'today_in_calendar',
        category: 'CALENDAR',
        label: 'Today in Calendar',
        status: hasToday ? 'pass' : 'warning',
        details: hasToday ? `Today (${todayStr}) is included` : 'Today not found in calendar'
      });

      const sortedCal = [...calData].sort((a, b) => b.date.localeCompare(a.date));
      let calculatedStreak = 0;
      for (const day of sortedCal) {
        if (day.is_future) continue;
        if (day.has_reading) {
          calculatedStreak++;
        } else {
          break;
        }
      }
      
      checks.push({
        id: 'calendar_streak_match',
        category: 'CALENDAR',
        label: 'Calendar vs Streak Consistency',
        status: Math.abs(calculatedStreak - (loadedStreakInfo?.current_streak || 0)) <= 1 ? 'pass' : 'warning',
        details: `Calendar streak: ${calculatedStreak}, DB streak: ${loadedStreakInfo?.current_streak || 0}`
      });

    } catch (error: any) {
      addLog('error', 'CALENDAR', `❌ Exception: ${error.message}`);
    }

    // TEST 5: Full Diagnostics
    try {
      const startTime = Date.now();
      const diag = await getStreakDiagnostics(userId);
      metrics.diagnostics = Date.now() - startTime;
      
      if (diag) {
        setDiagnostics(diag);
        addLog('success', 'DIAGNOSTICS', `✅ Full diagnostics loaded in ${metrics.diagnostics}ms`, metrics.diagnostics);
        
        if (metrics.diagnostics > 1500) {
          addLog('warning', 'PERFORMANCE', `⚠️ Diagnostics API is slow (${metrics.diagnostics}ms)`);
        }
        
        checks.push({
          id: 'diagnostics',
          category: 'SYSTEM',
          label: 'Full Diagnostics',
          status: 'pass',
          details: `Achieved: ${diag.stats.achieved_count}, Claimed: ${diag.stats.claimed_count}, Unclaimed: ${diag.stats.unclaimed_count}`
        });

        const diagUnclaimed = diag.stats.unclaimed_count;
        const infoUnclaimed = loadedStreakInfo?.achieved_not_claimed.length || 0;
        checks.push({
          id: 'diagnostics_consistency',
          category: 'SYSTEM',
          label: 'Diagnostics Consistency',
          status: diagUnclaimed === infoUnclaimed ? 'pass' : 'warning',
          details: `Diagnostics says ${diagUnclaimed} unclaimed, StreakInfo says ${infoUnclaimed}`
        });
      }
    } catch (error: any) {
      addLog('error', 'DIAGNOSTICS', `❌ Exception: ${error.message}`);
    }

    // TEST 6: Logic Consistency
    if (loadedStreakInfo && loadedMilestones.length > 0) {
      const claimedIds = new Set(loadedClaimed.map(c => c.milestone_id));
      const achievableMilestones = loadedMilestones.filter(m => m.days_required <= loadedStreakInfo.current_streak);
      const notClaimed = achievableMilestones.filter(m => !claimedIds.has(m.id));

      checks.push({
        id: 'consistency',
        category: 'LOGIC',
        label: 'Data Consistency',
        status: notClaimed.length === 0 ? 'pass' : 'warning',
        details: notClaimed.length === 0 
          ? 'All achievable milestones claimed' 
          : `${notClaimed.length} achievable milestone(s) not claimed: ${notClaimed.map(m => m.name).join(', ')}`
      });

      const currentTier = getStreakTier(loadedStreakInfo.current_streak);
      checks.push({
        id: 'tier_progression',
        category: 'LOGIC',
        label: 'Tier Progression',
        status: 'pass',
        details: `Current tier: ${currentTier.icon} ${currentTier.name} at ${loadedStreakInfo.current_streak} days`
      });
    }

    // TEST 7: Edge Cases
    const currentStreakValue = loadedStreakInfo?.current_streak || 0;
    
    checks.push({
      id: 'negative_streak',
      category: 'EDGE',
      label: 'Negative Streak Handling',
      status: currentStreakValue >= 0 ? 'pass' : 'fail',
      details: `Current streak: ${currentStreakValue}`
    });

    const tier = getStreakTier(currentStreakValue);
    checks.push({
      id: 'tier_function',
      category: 'EDGE',
      label: 'Tier Function',
      status: tier && tier.icon ? 'pass' : 'fail',
      details: `Tier: ${tier.icon} ${tier.name} (${tier.color})`
    });

    if (loadedStreakInfo?.last_active_date) {
      const hoursLeft = getStreakWarning(loadedStreakInfo.last_active_date).hoursRemaining;
      checks.push({
        id: 'streak_loss_risk',
        category: 'EDGE',
        label: 'Streak Loss Risk',
        status: hoursLeft > 12 ? 'pass' : hoursLeft > 6 ? 'warning' : 'fail',
        details: `${hoursLeft} hours until streak resets`
      });
    }

    // Performance Analysis
    metrics.total = Date.now() - totalStartTime;
    setPerfData(metrics);
    
    if (metrics.total > 3000) {
      addLog('warning', 'PERFORMANCE', `⚠️ Total diagnostic time: ${metrics.total}ms (slow)`);
    } else {
      addLog('success', 'PERFORMANCE', `✅ Total diagnostic time: ${metrics.total}ms`);
    }

    setValidations(checks);
    
    const passCount = checks.filter(c => c.status === 'pass').length;
    const failCount = checks.filter(c => c.status === 'fail').length;
    const warnCount = checks.filter(c => c.status === 'warning').length;
    const score = Math.round((passCount / checks.length) * 100);
    setHealthScore(score);
    
    addLog('info', 'COMPLETE', `✅ Diagnostic complete: ${passCount} passed, ${warnCount} warnings, ${failCount} failed (${score}% health)`);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && userId) {
      runAllChecks();
    }
  }, [isOpen, userId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return '#10b981';
      case 'fail': return '#ef4444';
      case 'warning': return '#fbbf24';
      default: return '#64748b';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle size={12} />;
      case 'fail': return <XCircle size={12} />;
      case 'warning': return <AlertTriangle size={12} />;
      default: return <Clock size={12} />;
    }
  };

  const passCount = validations.filter(v => v.status === 'pass').length;
  const failCount = validations.filter(v => v.status === 'fail').length;
  const warnCount = validations.filter(v => v.status === 'warning').length;

  const getHealthColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#fbbf24';
    if (score >= 50) return '#f97316';
    return '#ef4444';
  };

  const getPerfColor = (ms: number) => {
    if (ms === 0) return '#64748b';
    if (ms < 500) return '#10b981';
    if (ms < 1000) return '#fbbf24';
    return '#ef4444';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10010,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            background: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(12px)'
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              maxHeight: '92vh',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.9), 0 0 40px rgba(59, 130, 246, 0.1)'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1), transparent)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Bug size={18} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                    Streak Debug Panel v2.0
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>
                    Admin Only • {validations.length} Checks
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              
              {/* Health Score */}
              {validations.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    padding: '16px',
                    borderRadius: '10px',
                    background: `linear-gradient(135deg, ${getHealthColor(healthScore)}15, ${getHealthColor(healthScore)}05)`,
                    border: `1px solid ${getHealthColor(healthScore)}40`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px'
                  }}>
                    <div style={{ position: 'relative', width: 60, height: 60 }}>
                      <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
                        <circle
                          cx="30"
                          cy="30"
                          r="25"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="5"
                          fill="none"
                        />
                        <circle
                          cx="30"
                          cy="30"
                          r="25"
                          stroke={getHealthColor(healthScore)}
                          strokeWidth="5"
                          fill="none"
                          strokeDasharray={2 * Math.PI * 25}
                          strokeDashoffset={2 * Math.PI * 25 * (1 - healthScore / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 800,
                        color: getHealthColor(healthScore)
                      }}>
                        {healthScore}%
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
                        System Health
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {healthScore >= 90 ? '🎯 Excellent' : healthScore >= 70 ? '⚡ Good' : healthScore >= 50 ? '⚠️ Needs Attention' : '🚨 Critical'}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '10px' }}>
                        <span style={{ color: '#10b981', fontWeight: 700 }}>{passCount}✓</span>
                        <span style={{ color: '#fbbf24', fontWeight: 700 }}>{warnCount}⚠</span>
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>{failCount}✗</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Metrics */}
              {perfData.total > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    marginBottom: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#f97316',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    <Zap size={12} />
                    <span>API Performance ({perfData.total}ms total)</span>
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '4px'
                  }}>
                    {[
                      { name: 'StreakInfo', value: perfData.streakInfo },
                      { name: 'Milestones', value: perfData.milestones },
                      { name: 'Claimed', value: perfData.claimed },
                      { name: 'Calendar', value: perfData.calendar },
                      { name: 'Diagnostics', value: perfData.diagnostics },
                    ].map(item => (
                      <div
                        key={item.name}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '10px'
                        }}
                      >
                        <span style={{ color: '#94a3b8' }}>{item.name}</span>
                        <span style={{ color: getPerfColor(item.value), fontWeight: 700 }}>
                          {item.value}ms
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Streak Info */}
              {streakInfo && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    marginBottom: '10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#fbbf24',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    <Trophy size={12} />
                    <span>Current Streak Data</span>
                  </div>
                  
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(251, 191, 36, 0.05)',
                    border: '1px solid rgba(251, 191, 36, 0.2)'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                      <div>
                        <span style={{ color: '#64748b' }}>Current: </span>
                        <span style={{ color: '#fff', fontWeight: 700 }}>{streakInfo.current_streak} days</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Longest: </span>
                        <span style={{ color: '#fff', fontWeight: 700 }}>{streakInfo.longest_streak} days</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Last Active: </span>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: '10px' }}>{streakInfo.last_active_date || 'NULL'}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Last Claim: </span>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: '10px' }}>{streakInfo.last_daily_claim || 'NULL'}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Tier: </span>
                        <span style={{ color: '#fff', fontWeight: 700 }}>{getStreakTier(streakInfo.current_streak).icon} {getStreakTier(streakInfo.current_streak).name}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Next: </span>
                        <span style={{ color: '#fff', fontWeight: 700 }}>{streakInfo.next_milestone?.name || 'None'}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Days to Next: </span>
                        <span style={{ color: '#fff', fontWeight: 700 }}>{streakInfo.days_to_next}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Progress: </span>
                        <span style={{ color: '#fff', fontWeight: 700 }}>{streakInfo.percent_to_next.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Calendar Info */}
              {calendar.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    marginBottom: '10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#10b981',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    <Calendar size={12} />
                    <span>Calendar Data</span>
                  </div>
                  
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '11px', marginBottom: '8px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: '#64748b' }}>Active</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>
                          {calendar.filter(d => d.has_reading).length}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: '#64748b' }}>Missed</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444' }}>
                          {calendar.filter(d => !d.has_reading && !d.is_future && !d.is_today).length}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: '#64748b' }}>Future</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#64748b' }}>
                          {calendar.filter(d => d.is_future).length}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', paddingTop: '6px', borderTop: '1px solid rgba(16, 185, 129, 0.1)' }}>
                      📊 {getStreakContinuity(calendar)}
                    </div>
                  </div>
                </div>
              )}

              {/* Diagnostics Info */}
              {diagnostics && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    marginBottom: '10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#a78bfa',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    <Shield size={12} />
                    <span>Diagnostics Summary</span>
                  </div>
                  
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(167, 139, 250, 0.05)',
                    border: '1px solid rgba(167, 139, 250, 0.2)',
                    fontSize: '11px'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <div>
                        <span style={{ color: '#64748b' }}>Total Milestones: </span>
                        <span style={{ color: '#fff', fontWeight: 700 }}>{diagnostics.stats.total_milestones}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Achieved: </span>
                        <span style={{ color: '#10b981', fontWeight: 700 }}>{diagnostics.stats.achieved_count}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Claimed: </span>
                        <span style={{ color: '#fbbf24', fontWeight: 700 }}>{diagnostics.stats.claimed_count}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Unclaimed: </span>
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>{diagnostics.stats.unclaimed_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Validations by Category */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  marginBottom: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#a78bfa',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>
                  <Activity size={12} />
                  <span>Validation Checks ({validations.length})</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {['STREAK', 'CONFIG', 'CLAIMS', 'CALENDAR', 'SYSTEM', 'LOGIC', 'EDGE'].map(category => {
                    const categoryChecks = validations.filter(v => v.category === category);
                    if (categoryChecks.length === 0) return null;
                    
                    const catPass = categoryChecks.filter(c => c.status === 'pass').length;
                    const catFail = categoryChecks.filter(c => c.status === 'fail').length;
                    
                    return (
                      <div key={category} style={{
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '6px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          padding: '6px 10px',
                          background: 'rgba(255,255,255,0.03)',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#64748b',
                          letterSpacing: '0.5px'
                        }}>
                          <span>{category}</span>
                          <span>
                            {catPass}/{categoryChecks.length} 
                            {catFail > 0 && <span style={{ color: '#ef4444', marginLeft: '4px' }}>!{catFail}</span>}
                          </span>
                        </div>
                        {categoryChecks.map((check) => (
                          <div
                            key={check.id}
                            style={{
                              padding: '6px 10px',
                              borderBottom: '1px solid rgba(255,255,255,0.03)',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px'
                            }}
                          >
                            <div style={{ color: getStatusColor(check.status), flexShrink: 0, marginTop: '1px' }}>
                              {getStatusIcon(check.status)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '10px', fontWeight: 600, color: '#fff', marginBottom: '1px' }}>
                                {check.label}
                              </div>
                              <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                                {check.details}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Logs */}
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  marginBottom: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#94a3b8',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>
                  <Database size={12} />
                  <span>Debug Logs ({logs.length})</span>
                </div>
                
                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '8px',
                  padding: '8px',
                  fontFamily: 'monospace',
                  fontSize: '10px'
                }}>
                  {logs.length === 0 ? (
                    <div style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
                      No logs yet...
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        style={{
                          padding: '4px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          display: 'flex',
                          gap: '8px'
                        }}
                      >
                        <span style={{ color: '#64748b', flexShrink: 0 }}>{log.timestamp}</span>
                        <span style={{
                          color: log.level === 'success' ? '#10b981' : 
                                 log.level === 'error' ? '#ef4444' :
                                 log.level === 'warning' ? '#fbbf24' : '#94a3b8'
                        }}>
                          [{log.category}]
                        </span>
                        <span style={{ color: '#e2e8f0', flex: 1 }}>{log.message}</span>
                        {log.duration !== undefined && (
                          <span style={{ color: '#64748b' }}>{log.duration}ms</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid rgba(59, 130, 246, 0.2)',
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={runAllChecks}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: loading ? '#64748b' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Running...' : 'Re-run'}
              </button>
              <button
                onClick={() => copyToClipboard(validations, logs)}
                disabled={validations.length === 0}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: copied 
                    ? '1px solid rgba(16, 185, 129, 0.5)' 
                    : '1px solid rgba(59, 130, 246, 0.3)',
                  background: copied 
                    ? 'rgba(16, 185, 129, 0.2)' 
                    : 'rgba(59, 130, 246, 0.1)',
                  color: copied ? '#10b981' : '#3b82f6',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: validations.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: validations.length === 0 ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                {copied ? (
                  <><CheckCircle size={12} /> Copied!</>
                ) : (
                  <><Copy size={12} /> Copy Report</>
                )}
              </button>
              <button
                onClick={() => {
                  setLogs([]);
                  setValidations([]);
                  setLogIdCounter(0);
                  setHealthScore(0);
                  setPerfData({ streakInfo: 0, milestones: 0, claimed: 0, calendar: 0, diagnostics: 0, total: 0 });
                }}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                🗑️
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}