import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw, Send, Trash2, Download, CheckCircle, XCircle,
  Clock, Zap, Users, AlertCircle, TrendingUp, Database
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';

interface HoroscopeLog {
  id: string;
  user_id: string;
  sun_sign: string;
  status: 'sent' | 'failed';
  error_message: string | null;
  ai_model: string;
  tokens_used: number;
  created_at: string;
  user?: {
    display_name: string;
    username: string;
  };
}

interface EligibilityStats {
  total_users: number;
  with_sun_sign: number;
  with_push_notifications: number;
  with_telegram_chat_id: number;
  eligible: number;
}

interface AIStats {
  gemini_count: number;
  groq_count: number;
  total_tokens: number;
  avg_tokens: number;
  estimated_cost: number;
}

export default function HoroscopeMonitor() {
  const { user } = useUser();
  const [logs, setLogs] = useState<HoroscopeLog[]>([]);
  const [eligibilityStats, setEligibilityStats] = useState<EligibilityStats | null>(null);
  const [aiStats, setAiStats] = useState<AIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<'all' | 'sent' | 'failed'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      // 1. ბოლო 50 ლოგი
      const { data: logsData } = await supabase
        .from('horoscope_logs')
        .select(`
          *,
          user:users(display_name, username)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      setLogs(logsData || []);

      // 2. Eligibility stats
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: withSunSign } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .not('sun_sign', 'is', null);

      const { count: withPush } = await supabase
        .from('user_preferences')
        .select('*', { count: 'exact', head: true })
        .eq('push_notifications', true);

      const { count: withTelegram } = await supabase
        .from('user_preferences')
        .select('*', { count: 'exact', head: true })
        .not('telegram_chat_id', 'is', null);

      // Eligible = ყველა პირობა სრულდება
      const { count: eligible } = await supabase
        .from('users')
        .select(`
          id,
          sun_sign,
          user_preferences(telegram_chat_id, push_notifications)
        `)
        .not('sun_sign', 'is', null)
        .eq('user_preferences.push_notifications', true)
        .not('user_preferences.telegram_chat_id', 'is', null);

      setEligibilityStats({
        total_users: totalUsers || 0,
        with_sun_sign: withSunSign || 0,
        with_push_notifications: withPush || 0,
        with_telegram_chat_id: withTelegram || 0,
        eligible: eligible || 0
      });

      // 3. AI stats (დღევანდელი)
      const today = new Date().toISOString().split('T')[0];
      const { data: todayLogs } = await supabase
        .from('horoscope_logs')
        .select('ai_model, tokens_used')
        .gte('created_at', `${today}T00:00:00`);

      if (todayLogs && todayLogs.length > 0) {
        const geminiCount = todayLogs.filter(l => l.ai_model === 'gemini').length;
        const groqCount = todayLogs.filter(l => l.ai_model === 'groq').length;
        const totalTokens = todayLogs.reduce((sum, l) => sum + (l.tokens_used || 0), 0);
        const avgTokens = totalTokens / todayLogs.length;
        const estimatedCost = (totalTokens / 1000000) * 0.5; // მიახლოებითი ფასი

        setAiStats({
          gemini_count: geminiCount,
          groq_count: groqCount,
          total_tokens: totalTokens,
          avg_tokens: Math.round(avgTokens),
          estimated_cost: estimatedCost
        });
      }

    } catch (error) {
      console.error('Error loading monitor data:', error);
    }

    setLoading(false);
  };

  const handleManualTrigger = async () => {
    if (!confirm('Are you sure you want to manually trigger daily horoscope dispatch?')) return;
    
    setSending(true);
    try {
      const response = await fetch(
        'https://eutavdhcxpfhpfsyaskb.supabase.co/functions/v1/send-daily-horoscope',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer my-super-secret-horoscope-token-2024'
          },
          body: JSON.stringify({})
        }
      );
      const data = await response.json();
      alert(`Dispatch complete!\nSuccess: ${data.details?.successCount || 0}\nFailed: ${data.details?.failCount || 0}`);
      await loadData();
    } catch (error) {
      alert('Failed to trigger dispatch: ' + (error as Error).message);
    }
    setSending(false);
  };

  const handleClearOldLogs = async () => {
    if (!confirm('Delete logs older than 30 days?')) return;
    
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await supabase
        .from('horoscope_logs')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;
      alert('Old logs cleared successfully!');
      await loadData();
    } catch (error) {
      alert('Failed to clear logs: ' + (error as Error).message);
    }
  };

  const handleExportLogs = () => {
    const csvContent = [
      ['User', 'Sun Sign', 'Status', 'AI Model', 'Tokens', 'Timestamp', 'Error'].join(','),
      ...logs.map(log => [
        log.user?.display_name || log.user?.username || 'Unknown',
        log.sun_sign,
        log.status,
        log.ai_model,
        log.tokens_used,
        log.created_at,
        log.error_message || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horoscope_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.status === filter;
  });

  const todaySent = logs.filter(l => {
    const logDate = new Date(l.created_at).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return logDate === today && l.status === 'sent';
  }).length;

  const todayFailed = logs.filter(l => {
    const logDate = new Date(l.created_at).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return logDate === today && l.status === 'failed';
  }).length;

  const successRate = todaySent + todayFailed > 0 
    ? Math.round((todaySent / (todaySent + todayFailed)) * 100) 
    : 0;

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        <RefreshCw size={32} className="animate-spin" />
        <p>Loading monitor data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#C5A059', marginBottom: '8px' }}>
           Horoscope Monitor
        </h2>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>
          Track daily horoscope deliveries and AI performance
        </p>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={handleManualTrigger}
          disabled={sending}
          style={{
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #C5A059, #8B6914)',
            color: '#0a0600',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px'
          }}
        >
          <Send size={16} />
          {sending ? 'Sending...' : 'Manual Trigger'}
        </button>
        <button
          onClick={handleClearOldLogs}
          style={{
            padding: '12px 20px',
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px'
          }}
        >
          <Trash2 size={16} />
          Clear Old Logs
        </button>
        <button
          onClick={handleExportLogs}
          style={{
            padding: '12px 20px',
            background: 'rgba(59, 130, 246, 0.2)',
            color: '#3b82f6',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px'
          }}
        >
          <Download size={16} />
          Export CSV
        </button>
        <button
          onClick={loadData}
          style={{
            padding: '12px 20px',
            background: 'rgba(148, 163, 184, 0.2)',
            color: '#94a3b8',
            border: '1px solid #94a3b8',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px'
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <CheckCircle size={20} color="#10b981" />
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Sent Today</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{todaySent}</div>
        </div>

        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <XCircle size={20} color="#ef4444" />
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Failed Today</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>{todayFailed}</div>
        </div>

        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <TrendingUp size={20} color="#3b82f6" />
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Success Rate</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>{successRate}%</div>
        </div>

        <div style={{ background: 'rgba(167, 139, 250, 0.1)', border: '1px solid #a78bfa', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Zap size={20} color="#a78bfa" />
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Total Tokens</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#a78bfa' }}>
            {aiStats?.total_tokens.toLocaleString() || 0}
          </div>
        </div>
      </div>

      {/* AI Performance */}
      {aiStats && (
        <div style={{ background: 'rgba(26, 21, 16, 0.8)', border: '1px solid #2c2213', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#C5A059', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} />
            AI Performance (Today)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Gemini Usage</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{aiStats.gemini_count}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Groq Usage</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>{aiStats.groq_count}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Avg Tokens/Horoscope</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#a78bfa' }}>{aiStats.avg_tokens}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Est. Cost</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fbbf24' }}>${aiStats.estimated_cost.toFixed(4)}</div>
            </div>
          </div>
        </div>
      )}

      {/* User Eligibility */}
      {eligibilityStats && (
        <div style={{ background: 'rgba(26, 21, 16, 0.8)', border: '1px solid #2c2213', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#C5A059', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} />
            User Eligibility Stats
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Total Users</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e2e8f0' }}>{eligibilityStats.total_users}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>With Sun Sign</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{eligibilityStats.with_sun_sign}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Push Enabled</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>{eligibilityStats.with_push_notifications}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>With Telegram ID</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#a78bfa' }}>{eligibilityStats.with_telegram_chat_id}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Eligible</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fbbf24' }}>{eligibilityStats.eligible}</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Logs */}
      <div style={{ background: 'rgba(26, 21, 16, 0.8)', border: '1px solid #2c2213', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#C5A059', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} />
            Recent Logs
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '6px 12px',
                background: filter === 'all' ? 'rgba(197, 160, 89, 0.3)' : 'transparent',
                border: '1px solid #2c2213',
                borderRadius: '6px',
                color: filter === 'all' ? '#C5A059' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setFilter('sent')}
              style={{
                padding: '6px 12px',
                background: filter === 'sent' ? 'rgba(16, 185, 129, 0.3)' : 'transparent',
                border: '1px solid #2c2213',
                borderRadius: '6px',
                color: filter === 'sent' ? '#10b981' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Sent ({logs.filter(l => l.status === 'sent').length})
            </button>
            <button
              onClick={() => setFilter('failed')}
              style={{
                padding: '6px 12px',
                background: filter === 'failed' ? 'rgba(239, 68, 68, 0.3)' : 'transparent',
                border: '1px solid #2c2213',
                borderRadius: '6px',
                color: filter === 'failed' ? '#ef4444' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Failed ({logs.filter(l => l.status === 'failed').length})
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2c2213' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: '600' }}>User</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: '600' }}>Sign</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: '600' }}>AI Model</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: '600' }}>Tokens</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: '600' }}>Time</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: '600' }}>Error</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    No logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(44, 34, 19, 0.5)' }}>
                    <td style={{ padding: '12px 8px', color: '#e2e8f0' }}>
                      {log.user?.display_name || log.user?.username || 'Unknown'}
                    </td>
                    <td style={{ padding: '12px 8px', color: '#C5A059', fontWeight: '600' }}>
                      {log.sun_sign}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        background: log.status === 'sent' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: log.status === 'sent' ? '#10b981' : '#ef4444'
                      }}>
                        {log.status === 'sent' ? '✓ Sent' : '✗ Failed'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', color: '#a78bfa', fontSize: '12px' }}>
                      {log.ai_model || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 8px', color: '#94a3b8', fontSize: '12px' }}>
                      {log.tokens_used || 0}
                    </td>
                    <td style={{ padding: '12px 8px', color: '#94a3b8', fontSize: '11px' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 8px', color: '#ef4444', fontSize: '11px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.error_message || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}