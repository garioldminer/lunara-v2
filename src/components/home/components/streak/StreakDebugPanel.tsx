import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock, Database, TrendingUp, Trophy } from 'lucide-react';
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
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const runAllChecks = async () => {
    setLoading(true);
    setValidations([]);
    const checks: ValidationCheck[] = [];

    addLog('info', 'START', '🚀 Starting full streak system diagnostic...');

    // TEST 1: User Economy Data
    try {
      const startTime = performance.now();
      const info = await getStreakInfo(userId);
      const duration = Math.round(performance.now() - startTime);

      if (info) {
        setStreakInfo(info);
        addLog('success', 'STREAK_INFO', `✅ Loaded in ${duration}ms`, duration);
        
        checks.push({
          id: 'streak_value',
          label: 'Current Streak Value',
          status: info.current_streak >= 0 ? 'pass' : 'fail',
          details: `Value: ${info.current_streak} days`
        });

        checks.push({
          id: 'longest_value',
          label: 'Longest Streak',
          status: info.longest_streak >= info.current_streak ? 'pass' : 'warning',
          details: `Longest: ${info.longest_streak}, Current: ${info.current_streak}`
        });

        checks.push({
          id: 'last_active_date',
          label: 'Last Active Date',
          status: info.last_active_date ? 'pass' : 'warning',
          details: info.last_active_date || 'NULL - will show as safe'
        });

        if (info.last_active_date) {
          const warning = getStreakWarning(info.last_active_date);
          checks.push({
            id: 'warning_system',
            label: 'Warning System',
            status: warning.dangerLevel === 'safe' ? 'pass' : warning.dangerLevel === 'warning' ? 'warning' : 'fail',
            details: `${warning.icon} ${warning.message} (${warning.hoursRemaining}h left)`
          });
        }

        if (info.next_milestone) {
          checks.push({
            id: 'next_milestone',
            label: 'Next Milestone',
            status: info.days_to_next >= 0 ? 'pass' : 'fail',
            details: `${info.next_milestone.name} in ${info.days_to_next} days (${info.percent_to_next.toFixed(1)}%)`
          });
        }

        checks.push({
          id: 'unclaimed_rewards',
          label: 'Unclaimed Rewards',
          status: info.achieved_not_claimed.length > 0 ? 'warning' : 'pass',
          details: `${info.achieved_not_claimed.length} unclaimed milestone(s)`
        });

      } else {
        addLog('error', 'STREAK_INFO', '❌ Failed to load streak info');
        checks.push({
          id: 'streak_info',
          label: 'Streak Info Load',
          status: 'fail',
          details: 'Failed to load from database'
        });
      }
    } catch (error: any) {
      addLog('error', 'STREAK_INFO', `❌ Exception: ${error.message}`);
      checks.push({
        id: 'streak_info_error',
        label: 'Streak Info',
        status: 'fail',
        details: error.message
      });
    }

    // TEST 2: Milestones Config
    try {
      const startTime = performance.now();
      const msList = await getStreakMilestones();
      const duration = Math.round(performance.now() - startTime);
      setMilestones(msList);

      if (msList.length > 0) {
        addLog('success', 'MILESTONES', `✅ Loaded ${msList.length} milestones in ${duration}ms`, duration);
        
        checks.push({
          id: 'milestones_config',
          label: 'Milestones Configuration',
          status: msList.length >= 5 ? 'pass' : 'warning',
          details: `${msList.length} milestones defined`
        });

        const daysSet = new Set(msList.map(m => m.days_required));
        checks.push({
          id: 'milestone_duplicates',
          label: 'Milestone Duplicates',
          status: daysSet.size === msList.length ? 'pass' : 'fail',
          details: daysSet.size === msList.length ? 'No duplicates found' : 'Duplicate days detected!'
        });

        checks.push({
          id: 'milestone_sort',
          label: 'Milestone Sort Order',
          status: msList.every((m, i) => i === 0 || m.days_required > msList[i-1].days_required) ? 'pass' : 'fail',
          details: msList.map(m => m.days_required).join(' → ')
        });
      } else {
        addLog('warning', 'MILESTONES', '⚠️ No milestones found');
        checks.push({
          id: 'milestones_config',
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
      const startTime = performance.now();
      const claimedList = await getClaimedMilestones(userId);
      const duration = Math.round(performance.now() - startTime);
      setClaimed(claimedList);

      addLog('success', 'CLAIMED', `✅ Loaded ${claimedList.length} claimed milestones in ${duration}ms`, duration);
      
      checks.push({
        id: 'claimed_count',
        label: 'Claimed Milestones',
        status: 'pass',
        details: `${claimedList.length} milestones claimed`
      });

      const claimedIds = claimedList.map(c => c.milestone_id);
      const uniqueClaimedIds = new Set(claimedIds);
      checks.push({
        id: 'claimed_duplicates',
        label: 'Claimed Duplicates',
        status: uniqueClaimedIds.size === claimedIds.length ? 'pass' : 'fail',
        details: uniqueClaimedIds.size === claimedIds.length ? 'No duplicate claims' : 'DUPLICATE CLAIMS DETECTED!'
      });
    } catch (error: any) {
      addLog('error', 'CLAIMED', `❌ Exception: ${error.message}`);
    }

    // TEST 4: Calendar Data
    try {
      const startTime = performance.now();
      const calData = await getStreakCalendar(userId, 30);
      const duration = Math.round(performance.now() - startTime);
      setCalendar(calData);

      const activeDays = calData.filter(d => d.has_reading).length;
      const missedDays = calData.filter(d => !d.has_reading && !d.is_future && !d.is_today).length;

      addLog('success', 'CALENDAR', `✅ Loaded ${calData.length} days in ${duration}ms (${activeDays} active, ${missedDays} missed)`, duration);
      
      checks.push({
        id: 'calendar_data',
        label: 'Calendar Data',
        status: calData.length === 30 ? 'pass' : 'warning',
        details: `${calData.length} days loaded (${activeDays} active, ${missedDays} missed)`
      });

      const futureDates = calData.filter(d => d.is_future);
      checks.push({
        id: 'future_dates',
        label: 'Future Dates in Calendar',
        status: futureDates.length === 0 ? 'pass' : 'warning',
        details: futureDates.length === 0 ? 'No future dates' : `${futureDates.length} future dates found`
      });
    } catch (error: any) {
      addLog('error', 'CALENDAR', `❌ Exception: ${error.message}`);
    }

    // TEST 5: Full Diagnostics
    try {
      const startTime = performance.now();
      const diag = await getStreakDiagnostics(userId);
      const duration = Math.round(performance.now() - startTime);
      
      if (diag) {
        setDiagnostics(diag);
        addLog('success', 'DIAGNOSTICS', `✅ Full diagnostics loaded in ${duration}ms`, duration);
        
        checks.push({
          id: 'diagnostics',
          label: 'Full Diagnostics',
          status: 'pass',
          details: `Achieved: ${diag.stats.achieved_count}, Claimed: ${diag.stats.claimed_count}, Unclaimed: ${diag.stats.unclaimed_count}`
        });
      }
    } catch (error: any) {
      addLog('error', 'DIAGNOSTICS', `❌ Exception: ${error.message}`);
    }

    // TEST 6: Logic Consistency
    if (streakInfo && milestones.length > 0 && claimed.length > 0) {
      const claimedIds = new Set(claimed.map(c => c.milestone_id));
      const achievableMilestones = milestones.filter(m => m.days_required <= (streakInfo.current_streak || 0));
      const notClaimed = achievableMilestones.filter(m => !claimedIds.has(m.id));

      checks.push({
        id: 'consistency',
        label: 'Data Consistency',
        status: notClaimed.length === 0 ? 'pass' : 'warning',
        details: notClaimed.length === 0 
          ? 'All achievable milestones claimed' 
          : `${notClaimed.length} achievable milestone(s) not claimed yet`
      });
    }

    // TEST 7: Edge Cases
    checks.push({
      id: 'negative_streak',
      label: 'Negative Streak Handling',
      status: (streakInfo?.current_streak || 0) >= 0 ? 'pass' : 'fail',
      details: `Current streak: ${streakInfo?.current_streak || 0}`
    });

    const tier = getStreakTier(streakInfo?.current_streak || 0);
    checks.push({
      id: 'tier_function',
      label: 'Tier Function',
      status: tier && tier.icon ? 'pass' : 'fail',
      details: `Tier: ${tier.icon} ${tier.name} (${tier.color})`
    });

    setValidations(checks);
    
    const passCount = checks.filter(c => c.status === 'pass').length;
    const failCount = checks.filter(c => c.status === 'fail').length;
    const warnCount = checks.filter(c => c.status === 'warning').length;
    
    addLog('info', 'COMPLETE', `✅ Diagnostic complete: ${passCount} passed, ${warnCount} warnings, ${failCount} failed`);
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
              maxWidth: '500px',
              maxHeight: '90vh',
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
                    Streak Debug Panel
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>
                    Admin Only • Full System Diagnostic
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
              
              {/* Status Overview */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  marginBottom: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#3b82f6',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>
                  <TrendingUp size={12} />
                  <span>Status Overview</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div style={{
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '2px' }}>PASS</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>{passCount}</div>
                  </div>
                  <div style={{
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1px solid rgba(251, 191, 36, 0.2)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '2px' }}>WARN</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#fbbf24' }}>{warnCount}</div>
                  </div>
                  <div style={{
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '2px' }}>FAIL</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#ef4444' }}>{failCount}</div>
                  </div>
                </div>
              </div>

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
                        <span style={{ color: '#fff', fontWeight: 700 }}>{streakInfo.last_active_date || 'NULL'}</span>
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
                    <Database size={12} />
                    <span>Calendar Data</span>
                  </div>
                  
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '11px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: '#64748b' }}>Active</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>
                          {calendar.filter(d => d.has_reading).length}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: '#64748b' }}>Missed</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
                          {calendar.filter(d => !d.has_reading && !d.is_future && !d.is_today).length}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: '#64748b' }}>Future</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>
                          {calendar.filter(d => d.is_future).length}
                        </div>
                      </div>
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
                    <Database size={12} />
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

              {/* Validations */}
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
                  <CheckCircle size={12} />
                  <span>Validation Checks ({validations.length})</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {validations.map((check) => (
                    <div
                      key={check.id}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: `${getStatusColor(check.status)}10`,
                        border: `1px solid ${getStatusColor(check.status)}30`,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px'
                      }}
                    >
                      <div style={{ color: getStatusColor(check.status), flexShrink: 0, marginTop: '1px' }}>
                        {getStatusIcon(check.status)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>
                          {check.label}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                          {check.details}
                        </div>
                      </div>
                    </div>
                  ))}
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
                {loading ? 'Running...' : 'Re-run All Checks'}
              </button>
              <button
                onClick={() => {
                  setLogs([]);
                  setValidations([]);
                  setLogIdCounter(0);
                }}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🗑️ Clear
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}