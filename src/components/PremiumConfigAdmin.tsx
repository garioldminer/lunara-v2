import { useState, useEffect } from 'react';
import { RefreshCw, Save, Crown, Sparkles, Star, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Plan {
  id: string;
  plan_type: string;
  stars: number;
  usd_cents: number;
  days: number;
  label: string;
  description: string;
  savings_text: string | null;
  is_active: boolean;
}

interface Feature {
  id: string;
  feature_id: string;
  name: string;
  description: string;
  stars: number;
  usd_cents: number;
  type: string;
  icon: string;
  is_active: boolean;
}

interface Benefit {
  id: string;
  icon: string;
  text: string;
  is_active: boolean;
}

export default function PremiumConfigAdmin() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const [p, f, b] = await Promise.all([
        supabase.from('subscription_plans').select('*').order('sort_order', { ascending: true }),
        supabase.from('premium_features').select('*').order('sort_order', { ascending: true }),
        supabase.from('premium_benefits').select('*').order('sort_order', { ascending: true })
      ]);
      if (p.data) setPlans(p.data);
      if (f.data) setFeatures(f.data);
      if (b.data) setBenefits(b.data);
    } catch (err: any) {
      console.error('Failed to load premium config:', err);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const inputStyle: React.CSSProperties = {
    width: '70px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(197,160,89,0.3)',
    borderRadius: '6px', padding: '6px 8px', color: '#fff', fontSize: '12px', outline: 'none', textAlign: 'center'
  };

  const saveBtnStyle = (isSaving: boolean): React.CSSProperties => ({
    background: isSaving ? 'rgba(251,191,36,0.3)' : 'rgba(197,160,89,0.2)', border: '1px solid #C5A059',
    color: '#C5A059', borderRadius: '6px', padding: '6px 10px', fontSize: '10px', fontWeight: 'bold',
    cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
  });

  const toggleBtnStyle = (active: boolean, color: string): React.CSSProperties => ({
    background: active ? `${color}33` : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? color : 'rgba(255,255,255,0.15)'}`,
    color: active ? color : '#94a3b8', borderRadius: '6px', padding: '4px 8px', fontSize: '9px', fontWeight: 'bold',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px'
  });

  // ============================================
  // PLANS
  // ============================================
  const handleSavePlan = async (id: string) => {
    if (!supabase) return;
    const stars = parseInt(editValues[`plan_${id}_stars`] ?? '', 10);
    const usd = parseInt(editValues[`plan_${id}_usd`] ?? '', 10);
    const days = parseInt(editValues[`plan_${id}_days`] ?? '', 10);
    const label = editValues[`plan_${id}_label`] ?? '';
    if (isNaN(stars) || stars <= 0 || isNaN(usd) || usd <= 0 || isNaN(days) || days <= 0 || !label.trim()) {
      showMessage('error', 'Enter valid stars, USD, days and label');
      return;
    }
    setSaving(`plan_${id}`);
    const { error } = await supabase.from('subscription_plans')
      .update({ stars, usd_cents: usd, days, label: label.trim(), updated_at: new Date().toISOString() })
      .eq('id', id);
    setSaving(null);
    if (error) showMessage('error', `Failed: ${error.message}`);
    else { showMessage('success', `Plan "${label}" saved!`); await loadData(); }
  };

  const handleTogglePlan = async (id: string, value: boolean) => {
    if (!supabase) return;
    setSaving(`plan_toggle_${id}`);
    const { error } = await supabase.from('subscription_plans').update({ is_active: value }).eq('id', id);
    setSaving(null);
    if (error) showMessage('error', `Failed: ${error.message}`);
    else { showMessage('success', `Plan ${value ? 'enabled' : 'disabled'}!`); await loadData(); }
  };

  // ============================================
  // FEATURES
  // ============================================
  const handleSaveFeature = async (id: string) => {
    if (!supabase) return;
    const stars = parseInt(editValues[`feat_${id}_stars`] ?? '', 10);
    const usd = parseInt(editValues[`feat_${id}_usd`] ?? '', 10);
    const name = editValues[`feat_${id}_name`] ?? '';
    if (isNaN(stars) || stars <= 0 || isNaN(usd) || usd <= 0 || !name.trim()) {
      showMessage('error', 'Enter valid stars, USD and name');
      return;
    }
    setSaving(`feat_${id}`);
    const { error } = await supabase.from('premium_features')
      .update({ stars, usd_cents: usd, name: name.trim(), updated_at: new Date().toISOString() })
      .eq('id', id);
    setSaving(null);
    if (error) showMessage('error', `Failed: ${error.message}`);
    else { showMessage('success', `Feature "${name}" saved!`); await loadData(); }
  };

  const handleToggleFeature = async (id: string, value: boolean) => {
    if (!supabase) return;
    setSaving(`feat_toggle_${id}`);
    const { error } = await supabase.from('premium_features').update({ is_active: value }).eq('id', id);
    setSaving(null);
    if (error) showMessage('error', `Failed: ${error.message}`);
    else { showMessage('success', `Feature ${value ? 'enabled' : 'disabled'}!`); await loadData(); }
  };

  // ============================================
  // BENEFITS
  // ============================================
  const handleSaveBenefit = async (id: string) => {
    if (!supabase) return;
    const icon = editValues[`ben_${id}_icon`] ?? '';
    const text = editValues[`ben_${id}_text`] ?? '';
    if (!icon.trim() || !text.trim()) {
      showMessage('error', 'Enter icon and text');
      return;
    }
    setSaving(`ben_${id}`);
    const { error } = await supabase.from('premium_benefits').update({ icon: icon.trim(), text: text.trim() }).eq('id', id);
    setSaving(null);
    if (error) showMessage('error', `Failed: ${error.message}`);
    else { showMessage('success', `Benefit saved!`); await loadData(); }
  };

  const handleAddBenefit = async () => {
    if (!supabase) return;
    const icon = editValues['new_ben_icon'] ?? '';
    const text = editValues['new_ben_text'] ?? '';
    if (!icon.trim() || !text.trim()) {
      showMessage('error', 'Enter icon and text for new benefit');
      return;
    }
    setSaving('new_ben');
    const maxOrder = benefits.reduce((m, b) => Math.max(m, 0), 0) + benefits.length + 1;
    const { error } = await supabase.from('premium_benefits').insert({ icon: icon.trim(), text: text.trim(), sort_order: maxOrder, is_active: true });
    setSaving(null);
    if (error) showMessage('error', `Failed: ${error.message}`);
    else { showMessage('success', `Benefit added!`); setEditValues(p => { const n = { ...p }; delete n['new_ben_icon']; delete n['new_ben_text']; return n; }); await loadData(); }
  };

  const handleDeleteBenefit = async (id: string, text: string) => {
    if (!supabase) return;
    if (!confirm(`Delete benefit "${text}"?`)) return;
    setSaving(`ben_del_${id}`);
    const { error } = await supabase.from('premium_benefits').delete().eq('id', id);
    setSaving(null);
    if (error) showMessage('error', `Failed: ${error.message}`);
    else { showMessage('success', `Benefit deleted!`); await loadData(); }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
        <RefreshCw size={24} className="spin" style={{ marginBottom: '8px' }} />
        <p style={{ fontSize: '12px' }}>Loading premium config…</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#C5A059', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Crown size={16} /> Premium Configuration
        </span>
        <button onClick={loadData} style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid #3b82f6', color: '#60a5fa', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {message && (
        <div style={{ padding: '10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', background: message.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`, color: message.type === 'success' ? '#10b981' : '#ef4444' }}>
          {message.text}
        </div>
      )}

      {/* ============ SUBSCRIPTION PLANS ============ */}
      <div style={{ padding: '14px', background: 'rgba(251,191,36,0.08)', borderRadius: '10px', border: '1px solid rgba(251,191,36,0.3)' }}>
        <div style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '12px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Crown size={14} /> Subscription Plans
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {plans.map((plan) => (
            <div key={plan.id} style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <input type="text" placeholder={plan.label} value={editValues[`plan_${plan.id}_label`] ?? ''} onChange={(e) => setEditValues(p => ({ ...p, [`plan_${plan.id}_label`]: e.target.value }))} style={{ ...inputStyle, width: '110px', textAlign: 'left' }} />
                <input type="number" placeholder={`⭐ ${plan.stars}`} value={editValues[`plan_${plan.id}_stars`] ?? ''} onChange={(e) => setEditValues(p => ({ ...p, [`plan_${plan.id}_stars`]: e.target.value }))} style={inputStyle} />
                <input type="number" placeholder={`$ ${plan.usd_cents}`} value={editValues[`plan_${plan.id}_usd`] ?? ''} onChange={(e) => setEditValues(p => ({ ...p, [`plan_${plan.id}_usd`]: e.target.value }))} style={inputStyle} />
                <input type="number" placeholder={`${plan.days}d`} value={editValues[`plan_${plan.id}_days`] ?? ''} onChange={(e) => setEditValues(p => ({ ...p, [`plan_${plan.id}_days`]: e.target.value }))} style={inputStyle} />
                <button onClick={() => handleSavePlan(plan.id)} disabled={saving === `plan_${plan.id}`} style={saveBtnStyle(saving === `plan_${plan.id}`)}>
                  <Save size={11} /> Save
                </button>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <button onClick={() => handleTogglePlan(plan.id, !plan.is_active)} style={toggleBtnStyle(plan.is_active, '#10b981')}>
                  {plan.is_active ? 'Active ✓' : 'Inactive'}
                </button>
                <span style={{ fontSize: '10px', color: '#94a3b8', alignSelf: 'center' }}>{plan.savings_text || 'No savings badge'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============ PREMIUM FEATURES ============ */}
      <div style={{ padding: '14px', background: 'rgba(167,139,250,0.08)', borderRadius: '10px', border: '1px solid rgba(167,139,250,0.3)' }}>
        <div style={{ color: '#a78bfa', fontWeight: 'bold', fontSize: '12px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} /> Premium Features (Single Readings)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {features.map((feat) => (
            <div key={feat.id} style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px' }}>{feat.icon}</span>
                <input type="text" placeholder={feat.name} value={editValues[`feat_${feat.id}_name`] ?? ''} onChange={(e) => setEditValues(p => ({ ...p, [`feat_${feat.id}_name`]: e.target.value }))} style={{ ...inputStyle, width: '120px', textAlign: 'left' }} />
                <input type="number" placeholder={`⭐ ${feat.stars}`} value={editValues[`feat_${feat.id}_stars`] ?? ''} onChange={(e) => setEditValues(p => ({ ...p, [`feat_${feat.id}_stars`]: e.target.value }))} style={inputStyle} />
                <input type="number" placeholder={`$ ${feat.usd_cents}`} value={editValues[`feat_${feat.id}_usd`] ?? ''} onChange={(e) => setEditValues(p => ({ ...p, [`feat_${feat.id}_usd`]: e.target.value }))} style={inputStyle} />
                <button onClick={() => handleSaveFeature(feat.id)} disabled={saving === `feat_${feat.id}`} style={saveBtnStyle(saving === `feat_${feat.id}`)}>
                  <Save size={11} /> Save
                </button>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <button onClick={() => handleToggleFeature(feat.id, !feat.is_active)} style={toggleBtnStyle(feat.is_active, '#10b981')}>
                  {feat.is_active ? 'Active ✓' : 'Inactive'}
                </button>
                <span style={{ fontSize: '10px', color: '#94a3b8', alignSelf: 'center', textTransform: 'capitalize' }}>{feat.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============ PREMIUM BENEFITS ============ */}
      <div style={{ padding: '14px', background: 'rgba(244,114,182,0.08)', borderRadius: '10px', border: '1px solid rgba(244,114,182,0.3)' }}>
        <div style={{ color: '#f472b6', fontWeight: 'bold', fontSize: '12px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Star size={14} /> Premium Benefits (What's Included)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {benefits.map((ben) => (
            <div key={ben.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', flexWrap: 'wrap' }}>
              <input type="text" placeholder={ben.icon} value={editValues[`ben_${ben.id}_icon`] ?? ''} onChange={(e) => setEditValues(p => ({ ...p, [`ben_${ben.id}_icon`]: e.target.value }))} style={{ ...inputStyle, width: '40px' }} />
              <input type="text" placeholder={ben.text} value={editValues[`ben_${ben.id}_text`] ?? ''} onChange={(e) => setEditValues(p => ({ ...p, [`ben_${ben.id}_text`]: e.target.value }))} style={{ ...inputStyle, width: '160px', textAlign: 'left' }} />
              <button onClick={() => handleSaveBenefit(ben.id)} disabled={saving === `ben_${ben.id}`} style={saveBtnStyle(saving === `ben_${ben.id}`)}>
                <Save size={11} /> Save
              </button>
              <button onClick={() => handleDeleteBenefit(ben.id, ben.text)} disabled={saving === `ben_del_${ben.id}`} style={{ ...toggleBtnStyle(false, '#ef4444'), padding: '6px 8px' }}>
                <Trash2 size={11} />
              </button>
            </div>
          ))}

          {/* Add new benefit */}
          <div style={{ padding: '10px', background: 'rgba(244,114,182,0.08)', borderRadius: '8px', border: '1px dashed rgba(244,114,182,0.4)' }}>
            <div style={{ fontSize: '10px', color: '#f472b6', fontWeight: 'bold', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={11} /> Add New Benefit
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Icon (e.g. 🎁)" value={editValues['new_ben_icon'] ?? ''} onChange={(e) => setEditValues(p => ({ ...p, ['new_ben_icon']: e.target.value }))} style={{ ...inputStyle, width: '60px' }} />
              <input type="text" placeholder="Text (e.g. Exclusive badges)" value={editValues['new_ben_text'] ?? ''} onChange={(e) => setEditValues(p => ({ ...p, ['new_ben_text']: e.target.value }))} style={{ ...inputStyle, width: '160px', textAlign: 'left' }} />
              <button onClick={handleAddBenefit} disabled={saving === 'new_ben'} style={saveBtnStyle(saving === 'new_ben')}>
                <Plus size={11} /> Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}