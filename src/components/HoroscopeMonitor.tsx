import { useState, useEffect } from 'react';
import {
  RefreshCw, Send, Trash2, Download, CheckCircle, XCircle,
  Zap, Users, TrendingUp, Database
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// 🎨 Lunara Premium Palette
const palette = {
  bg: 'rgba(10, 6, 0, 0.4)',
  surface: 'rgba(23, 16, 9, 0.6)',
  surfaceHover: 'rgba(30, 21, 9, 0.8)',
  border: 'rgba(197, 160, 89, 0.2)',
  borderActive: 'rgba(197, 160, 89, 0.5)',
  gold: '#C5A059',
  goldDim: 'rgba(197, 160, 89, 0.15)',
  success: '#10b981',
  successDim: 'rgba(16, 185, 129, 0.15)',
  error: '#ef4444',
  errorDim: 'rgba(239, 68, 68, 0.15)',
  text: '#f3ecdd',
  muted: '#9c9280',
};

interface HoroscopeLog {
  id: string;
  user_id: string;
  sun_sign: string;
  status: 'sent' | 'failed';
  error_message: string | null;
  ai_model: string;
  tokens_used: number;
  created_at: string;
  user?: { display_name: string; username: string };
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
  const [logs, setLogs] = useState<HoroscopeLog[]>([]);
  const [eligibilityStats, setEligibilityStats] = useState<EligibilityStats | null>(null);
  const [aiStats, setAiStats] = useState<AIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<'all' | 'sent' | 'failed'>('all');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: logsData } = await supabase
        .from('horoscope_logs')
        .select(`*, user:users(display_name, username)`)
        .order('created_at', { ascending: false })
        .limit(50);
      setLogs(logsData || []);

      const [total, sun, push, telegram, eligible] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).not('sun_sign', 'is', null),
        supabase.from('user_preferences').select('*', { count: 'exact', head: true }).eq('push_notifications', true),
        supabase.from('user_preferences').select('*', { count: 'exact', head: true }).not('telegram_chat_id', 'is', null),
        supabase.from('users').select(`id, sun_sign, user_preferences(telegram_chat_id, push_notifications)`).not('sun_sign', 'is', null).eq('user_preferences.push_notifications', true).not('user_preferences.telegram_chat_id', 'is', null)
      ]);

      setEligibilityStats({
        total_users: total.count || 0,
        with_sun_sign: sun.count || 0,
        with_push_notifications: push.count || 0,
        with_telegram_chat_id: telegram.count || 0,
        eligible: eligible.count || 0
      });

      const today = new Date().toISOString().split('T')[0];
      const { data: todayLogs } = await supabase
        .from('horoscope_logs')
        .select('ai_model, tokens_used')
        .gte('created_at', `${today}T00:00:00`);

      if (todayLogs && todayLogs.length > 0) {
        const geminiCount = todayLogs.filter((l: any) => l.ai_model === 'gemini').length;
        const groqCount = todayLogs.filter((l: any) => l.ai_model === 'groq').length;
        const totalTokens = todayLogs.reduce((sum: number, l: any) => sum + (l.tokens_used || 0), 0);
        
        setAiStats({
          gemini_count: geminiCount,
          groq_count: groqCount,
          total_tokens: totalTokens,
          avg_tokens: Math.round(totalTokens / todayLogs.length),
          estimated_cost: (totalTokens / 1000000) * 0.5
        });
      }
    } catch (error) {
      console.error('Error loading monitor data:', error);
    }
    setLoading(false);
  };

  const handleManualTrigger = async () => {
    if (!confirm('Manually trigger daily horoscope dispatch?')) return;
    setSending(true);
    try {
      const res = await fetch('https://eutavdhcxpfhpfsyaskb.supabase.co/functions/v1/send-daily-horoscope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer my-super-secret-horoscope-token-2024' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      alert(`Dispatch complete!\nSuccess: ${data.details?.successCount || 0}\nFailed: ${data.details?.failCount || 0}`);
      await loadData();
    } catch (error) {
      alert('Failed: ' + (error as Error).message);
    }
    setSending(false);
  };

  const handleClearOldLogs = async () => {
    if (!confirm('Delete logs older than 30 days?') || !supabase) return;
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { error } = await supabase.from('horoscope_logs').delete().lt('created_at', thirtyDaysAgo.toISOString());
      if (error) throw error;
      await loadData();
    } catch (error) {
      alert('Failed to clear logs: ' + (error as Error).message);
    }
  };

  const handleExportLogs = () => {
    const csvContent = [
      ['User', 'Sign', 'Status', 'Model', 'Tokens', 'Time', 'Error'].join(','),
      ...logs.map(log => [
        log.user?.display_name || log.user?.username || 'Unknown',
        log.sun_sign, log.status, log.ai_model, log.tokens_used,
        new Date(log.created_at).toLocaleString(), log.error_message || ''
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horoscope_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredLogs = logs.filter(log => filter === 'all' ? true : log.status === filter);
  const todaySent = logs.filter(l => l.created_at.startsWith(new Date().toISOString().split('T')[0]) && l.status === 'sent').length;
  const todayFailed = logs.filter(l => l.created_at.startsWith(new Date().toISOString().split('T')[0]) && l.status === 'failed').length;
  const successRate = todaySent + todayFailed > 0 ? Math.round((todaySent / (todaySent + todayFailed)) * 100) : 0;

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: palette.muted }}>
        <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
        <p style={{ fontSize: '14px' }}>Loading monitor data...</p>
      </div>
    );
  }

  // 🧩 Reusable Compact Stat Component
  const StatBox = ({ icon: Icon, label, value, color, subtext }: any) => (
    <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, flexShrink: 0 }}>
        <Icon size={18} />
      </div>
      <div>
        <div style={{ fontSize: '11px', color: palette.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '20px', fontWeight: '700', color: palette.text, lineHeight: 1 }}>{value}</div>
        {subtext && <div style={{ fontSize: '11px', color: color, marginTop: '4px' }}>{subtext}</div>}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '16px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* 📌 Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: palette.gold, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={20} /> Horoscope Monitor
          </h2>
          <p style={{ fontSize: '13px', color: palette.muted, margin: '4px 0 0 0' }}>Track deliveries, AI performance, and user eligibility</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ActionButton icon={Send} label={sending ? 'Sending...' : 'Trigger Now'} onClick={handleManualTrigger} disabled={sending} primary />
          <ActionButton icon={Download} label="Export CSV" onClick={handleExportLogs} />
          <ActionButton icon={Trash2} label="Clear Old" onClick={handleClearOldLogs} danger />
          <ActionButton icon={RefreshCw} label="" onClick={loadData} />
        </div>
      </div>

      {/* 📊 Key Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <StatBox icon={CheckCircle} label="Sent Today" value={todaySent} color={palette.success} />
        <StatBox icon={XCircle} label="Failed Today" value={todayFailed} color={palette.error} />
        <StatBox icon={TrendingUp} label="Success Rate" value={`${successRate}%`} color={palette.gold} subtext={todaySent + todayFailed > 0 ? 'Last 24h' : 'No data yet'} />
        <StatBox icon={Zap} label="Total Tokens" value={aiStats?.total_tokens.toLocaleString() || '0'} color="#a78bfa" subtext={`~$${aiStats?.estimated_cost.toFixed(4) || '0.0000'}`} />
      </div>

      {/* 📈 Detailed Stats (Combined for compactness) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {/* AI Performance */}
        <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: '12px', padding: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: palette.gold, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={16} /> AI Performance (Today)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <MiniStat label="Gemini" value={aiStats?.gemini_count || 0} color={palette.success} />
            <MiniStat label="Groq" value={aiStats?.groq_count || 0} color="#3b82f6" />
            <MiniStat label="Avg Tokens" value={aiStats?.avg_tokens || 0} color="#a78bfa" />
            <MiniStat label="Est. Cost" value={`$${aiStats?.estimated_cost.toFixed(4) || '0.0000'}`} color={palette.gold} />
          </div>
        </div>

        {/* User Eligibility */}
        <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: '12px', padding: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: palette.gold, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={16} /> User Eligibility
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <MiniStat label="Total Users" value={eligibilityStats?.total_users || 0} color={palette.text} />
            <MiniStat label="Eligible" value={eligibilityStats?.eligible || 0} color={palette.gold} />
            <MiniStat label="Has Sun Sign" value={eligibilityStats?.with_sun_sign || 0} color={palette.success} />
            <MiniStat label="Push + TG ID" value={eligibilityStats?.with_push_notifications || 0} color="#3b82f6" />
          </div>
        </div>
      </div>

      {/* 📋 Recent Logs Table */}
      <div style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${palette.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: palette.text, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={16} /> Recent Logs
          </h3>
          <div style={{ display: 'flex', background: palette.bg, borderRadius: '6px', padding: '3px', border: `1px solid ${palette.border}` }}>
            {(['all', 'sent', 'failed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  background: filter === f ? (f === 'sent' ? palette.successDim : f === 'failed' ? palette.errorDim : palette.goldDim) : 'transparent',
                  color: filter === f ? (f === 'sent' ? palette.success : f === 'failed' ? palette.error : palette.gold) : palette.muted,
                  transition: 'all 0.2s'
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} {f === 'all' ? `(${logs.length})` : `(${logs.filter(l => l.status === f).length})`}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: palette.bg }}>
                {['User', 'Sign', 'Status', 'Model', 'Tokens', 'Time', 'Error'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: palette.muted, fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${palette.border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: palette.muted, fontSize: '13px' }}>No logs found for this filter</td></tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: `1px solid ${palette.border}`, transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = palette.surfaceHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 16px', color: palette.text, fontWeight: '500' }}>
                      {log.user?.display_name || log.user?.username || 'Unknown'}
                    </td>
                    <td style={{ padding: '10px 16px', color: palette.gold, fontWeight: '600', fontSize: '12px' }}>
                      {log.sun_sign?.charAt(0).toUpperCase() + log.sun_sign?.slice(1)}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600',
                        background: log.status === 'sent' ? palette.successDim : palette.errorDim,
                        color: log.status === 'sent' ? palette.success : palette.error,
                        display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        {log.status === 'sent' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                        {log.status === 'sent' ? 'Sent' : 'Failed'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', color: palette.muted, fontSize: '12px', fontFamily: 'monospace' }}>
                      {log.ai_model || '-'}
                    </td>
                    <td style={{ padding: '10px 16px', color: palette.muted, fontSize: '12px' }}>
                      {log.tokens_used || 0}
                    </td>
                    <td style={{ padding: '10px 16px', color: palette.muted, fontSize: '11px', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '10px 16px', color: palette.error, fontSize: '11px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.error_message || ''}>
                      {log.error_message || <span style={{ color: palette.muted }}>-</span>}
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

// 🧩 Helper Components for Compactness
function ActionButton({ icon: Icon, label, onClick, disabled, primary, danger }: any) {
  const bg = primary ? 'linear-gradient(135deg, #C5A059, #8B6914)' : danger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)';
  const color = primary ? '#0a0600' : danger ? '#ef4444' : '#9c9280';
  const border = primary ? 'none' : danger ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(197, 160, 89, 0.2)';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '8px 14px',
        background: disabled ? 'rgba(255,255,255,0.05)' : bg,
        color: disabled ? '#555' : color,
        border: border,
        borderRadius: '8px',
        fontWeight: '600',
        fontSize: '12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s',
        opacity: disabled ? 0.6 : 1
      }}
      onMouseEnter={(e) => { if(!disabled) e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={(e) => { if(!disabled) e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function MiniStat({ label, value, color }: any) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ fontSize: '11px', color: '#9c9280', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: '700', color: color }}>{value}</div>
    </div>
  );
}