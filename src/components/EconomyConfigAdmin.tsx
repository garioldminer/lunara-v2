import { useState, useEffect } from 'react';
import { RefreshCw, DollarSign, Settings2, Save, Zap, Gem, Plus, Trash2, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PremiumConfigAdmin from './PremiumConfigAdmin';

interface ReadingCost {
  id: string;
  reading_type: string;
  energy_cost: number;
  description: string;
}

interface GameConfig {
  key: string;
  value: number;
  description: string;
}

interface DiamondPackage {
  id: string;
  coins: number;
  stars: number;
  label: string;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

export default function EconomyConfigAdmin() {
  const [readingCosts, setReadingCosts] = useState<ReadingCost[]>([]);
  const [gameConfigs, setGameConfigs] = useState<GameConfig[]>([]);
  const [packages, setPackages] = useState<DiamondPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadConfigs = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: costData, error: costError } = await supabase
        .from('reading_costs')
        .select('id, reading_type, energy_cost, description')
        .order('energy_cost', { ascending: true });
      if (!costError && costData) setReadingCosts(costData);

      const { data: configData, error: configError } = await supabase
        .from('game_config')
        .select('key, value, description');
      if (!configError && configData) {
        setGameConfigs(configData.map((c: any) => ({ 
          key: c.key, 
          value: parseFloat(c.value) || 0, 
          description: c.description 
        })));
      }

      const { data: pkgData, error: pkgError } = await supabase
        .from('diamond_packages')
        .select('*')
        .order('sort_order', { ascending: true });
      if (!pkgError && pkgData) setPackages(pkgData);
    } catch (err: any) {
      console.error('Failed to load configs:', err);
    }
    setLoading(false);
  };

  useEffect(() => { loadConfigs(); }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveReadingCost = async (id: string, readingType: string) => {
    if (!supabase) return;
    const newValue = parseInt(editValues[`cost_${id}`] ?? '', 10);
    if (isNaN(newValue) || newValue < 0) {
      showMessage('error', 'Enter a valid cost (0 or higher)');
      return;
    }
    setSaving(`cost_${id}`);
    const { error } = await supabase
      .from('reading_costs')
      .update({ energy_cost: newValue })
      .eq('id', id);
    setSaving(null);
    if (error) {
      showMessage('error', `Failed: ${error.message}`);
    } else {
      showMessage('success', `${readingType} → ${newValue}⚡ saved!`);
      setEditValues(prev => { const n = { ...prev }; delete n[`cost_${id}`]; return n; });
      await loadConfigs();
    }
  };

  const handleSaveGameConfig = async (key: string) => {
    if (!supabase) return;
    const newValue = parseFloat(editValues[`config_${key}`] ?? '');
    if (isNaN(newValue) || newValue < 0) {
      showMessage('error', 'Enter a valid value (0 or higher)');
      return;
    }
    setSaving(`config_${key}`);
    const { error } = await supabase
      .from('game_config')
      .update({ value: newValue, updated_at: new Date().toISOString() })
      .eq('key', key);
    setSaving(null);
    if (error) {
      showMessage('error', `Failed: ${error.message}`);
    } else {
      showMessage('success', `${key} → ${newValue} saved!`);
      setEditValues(prev => { const n = { ...prev }; delete n[`config_${key}`]; return n; });
      await loadConfigs();
    }
  };

  const handleSavePackage = async (id: string, pkg: DiamondPackage) => {
    if (!supabase) return;
    const coinsRaw = editValues[`pkg_${id}_coins`];
    const starsRaw = editValues[`pkg_${id}_stars`];
    const labelRaw = editValues[`pkg_${id}_label`];

    const coins = coinsRaw !== undefined && coinsRaw !== '' ? parseInt(coinsRaw, 10) : pkg.coins;
    const stars = starsRaw !== undefined && starsRaw !== '' ? parseInt(starsRaw, 10) : pkg.stars;
    const label = labelRaw !== undefined && labelRaw !== '' ? labelRaw.trim() : pkg.label;

    if (isNaN(coins) || coins <= 0 || isNaN(stars) || stars <= 0 || !label) {
      showMessage('error', 'Enter valid values (coins & stars must be > 0)');
      return;
    }
    setSaving(`pkg_${id}`);
    const { error } = await supabase
      .from('diamond_packages')
      .update({ coins, stars, label })
      .eq('id', id);
    setSaving(null);
    if (error) {
      showMessage('error', `Failed: ${error.message}`);
    } else {
      showMessage('success', `Package "${label}" saved! (${coins}💎 / ${stars}⭐)`);
      setEditValues(prev => { const n = { ...prev }; delete n[`pkg_${id}_coins`]; delete n[`pkg_${id}_stars`]; delete n[`pkg_${id}_label`]; return n; });
      await loadConfigs();
    }
  };

  const handleTogglePackage = async (id: string, field: 'is_popular' | 'is_active', value: boolean) => {
    if (!supabase) return;
    setSaving(`pkg_${id}_${field}`);
    const { error } = await supabase
      .from('diamond_packages')
      .update({ [field]: value })
      .eq('id', id);
    setSaving(null);
    if (error) {
      showMessage('error', `Failed: ${error.message}`);
    } else {
      showMessage('success', `${field === 'is_popular' ? 'Popular' : 'Active'} ${value ? 'enabled' : 'disabled'}!`);
      await loadConfigs();
    }
  };

  const handleAddPackage = async () => {
    if (!supabase) return;
    const coins = parseInt(editValues['new_pkg_coins'] ?? '', 10);
    const stars = parseInt(editValues['new_pkg_stars'] ?? '', 10);
    const label = (editValues['new_pkg_label'] ?? '').trim();
    if (isNaN(coins) || coins <= 0 || isNaN(stars) || stars <= 0 || !label) {
      showMessage('error', 'New package: fill ALL 3 fields (label, coins, stars)');
      return;
    }
    setSaving('new_pkg');
    const maxOrder = packages.reduce((m, p) => Math.max(m, p.sort_order), 0);
    const { error } = await supabase
      .from('diamond_packages')
      .insert({ coins, stars, label, is_popular: false, is_active: true, sort_order: maxOrder + 1 });
    setSaving(null);
    if (error) {
      showMessage('error', `Failed: ${error.message}`);
    } else {
      showMessage('success', `Package "${label}" added!`);
      setEditValues(prev => { const n = { ...prev }; delete n['new_pkg_coins']; delete n['new_pkg_stars']; delete n['new_pkg_label']; return n; });
      await loadConfigs();
    }
  };

  const handleDeletePackage = async (id: string, label: string) => {
    if (!supabase) return;
    if (!confirm(`Delete package "${label}"?`)) return;
    setSaving(`pkg_del_${id}`);
    const { error } = await supabase
      .from('diamond_packages')
      .delete()
      .eq('id', id);
    setSaving(null);
    if (error) {
      showMessage('error', `Failed: ${error.message}`);
    } else {
      showMessage('success', `Package "${label}" deleted!`);
      await loadConfigs();
    }
  };

  const reading_type_label = (type: string) => type.replace(/_/g, ' ');

  const inputStyle: React.CSSProperties = {
    width: '70px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(197, 160, 89, 0.3)',
    borderRadius: '6px',
    padding: '6px 8px',
    color: '#fff',
    fontSize: '12px',
    outline: 'none',
    textAlign: 'center'
  };

  const saveBtnStyle = (isSaving: boolean): React.CSSProperties => ({
    background: isSaving ? 'rgba(251, 191, 36, 0.3)' : 'rgba(197, 160, 89, 0.2)',
    border: '1px solid #C5A059',
    color: '#C5A059',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '10px',
    fontWeight: 'bold',
    cursor: isSaving ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  });

  const toggleBtnStyle = (active: boolean, color: string): React.CSSProperties => ({
    background: active ? `${color}33` : 'rgba(255,255,255,0.05)',
    border: `1px solid ${active ? color : 'rgba(255,255,255,0.15)'}`,
    color: active ? color : '#94a3b8',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '9px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '3px'
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
        <RefreshCw size={24} className="spin" style={{ marginBottom: '8px' }} />
        <p style={{ fontSize: '12px' }}>Loading economy configs…</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#C5A059', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <DollarSign size={16} /> Economy Configuration
        </span>
        <button onClick={loadConfigs} style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#60a5fa', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Message */}
      {message && (
        <div style={{ padding: '10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`, color: message.type === 'success' ? '#10b981' : '#ef4444' }}>
          {message.text}
        </div>
      )}

      {/* Diamond Packages */}
      <div style={{ padding: '14px', background: 'rgba(147, 112, 219, 0.08)', borderRadius: '10px', border: '1px solid rgba(147, 112, 219, 0.3)' }}>
        <div style={{ color: '#9370db', fontWeight: 'bold', fontSize: '12px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Gem size={14} /> Diamond Packages
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {packages.map((pkg) => (
            <div key={pkg.id} style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <input 
                  type="text"
                  placeholder={pkg.label}
                  value={editValues[`pkg_${pkg.id}_label`] ?? ''}
                  onChange={(e) => setEditValues(prev => ({ ...prev, [`pkg_${pkg.id}_label`]: e.target.value }))}
                  style={{ ...inputStyle, width: '110px', textAlign: 'left' }}
                />
                <input 
                  type="number"
                  placeholder={`💎 ${pkg.coins}`}
                  value={editValues[`pkg_${pkg.id}_coins`] ?? ''}
                  onChange={(e) => setEditValues(prev => ({ ...prev, [`pkg_${pkg.id}_coins`]: e.target.value }))}
                  style={inputStyle}
                />
                <input 
                  type="number"
                  placeholder={`⭐ ${pkg.stars}`}
                  value={editValues[`pkg_${pkg.id}_stars`] ?? ''}
                  onChange={(e) => setEditValues(prev => ({ ...prev, [`pkg_${pkg.id}_stars`]: e.target.value }))}
                  style={inputStyle}
                />
                <button onClick={() => handleSavePackage(pkg.id, pkg)} disabled={saving === `pkg_${pkg.id}`} style={saveBtnStyle(saving === `pkg_${pkg.id}`)}>
                  <Save size={11} /> Save
                </button>
                <button onClick={() => handleDeletePackage(pkg.id, pkg.label)} disabled={saving === `pkg_del_${pkg.id}`} style={{ ...toggleBtnStyle(false, '#ef4444'), padding: '6px 8px' }}>
                  <Trash2 size={11} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <button onClick={() => handleTogglePackage(pkg.id, 'is_popular', !pkg.is_popular)} style={toggleBtnStyle(pkg.is_popular, '#fbbf24')}>
                  <Star size={10} /> {pkg.is_popular ? 'Popular ✓' : 'Popular'}
                </button>
                <button onClick={() => handleTogglePackage(pkg.id, 'is_active', !pkg.is_active)} style={toggleBtnStyle(pkg.is_active, '#10b981')}>
                  {pkg.is_active ? 'Active ✓' : 'Inactive'}
                </button>
              </div>
            </div>
          ))}

          {/* New Package */}
          <div style={{ padding: '10px', background: 'rgba(147, 112, 219, 0.08)', borderRadius: '8px', border: '1px dashed rgba(147, 112, 219, 0.4)' }}>
            <div style={{ fontSize: '10px', color: '#9370db', fontWeight: 'bold', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={11} /> Add New Package (fill all 3 fields)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <input 
                type="text"
                placeholder="Label (e.g. Mega Pack)"
                value={editValues['new_pkg_label'] ?? ''}
                onChange={(e) => setEditValues(prev => ({ ...prev, ['new_pkg_label']: e.target.value }))}
                style={{ ...inputStyle, width: '130px', textAlign: 'left' }}
              />
              <input 
                type="number"
                placeholder="💎 coins"
                value={editValues['new_pkg_coins'] ?? ''}
                onChange={(e) => setEditValues(prev => ({ ...prev, ['new_pkg_coins']: e.target.value }))}
                style={inputStyle}
              />
              <input 
                type="number"
                placeholder="⭐ stars"
                value={editValues['new_pkg_stars'] ?? ''}
                onChange={(e) => setEditValues(prev => ({ ...prev, ['new_pkg_stars']: e.target.value }))}
                style={inputStyle}
              />
              <button onClick={handleAddPackage} disabled={saving === 'new_pkg'} style={saveBtnStyle(saving === 'new_pkg')}>
                <Plus size={11} /> Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reading Costs */}
      <div style={{ padding: '14px', background: 'rgba(167, 139, 250, 0.08)', borderRadius: '10px', border: '1px solid rgba(167, 139, 250, 0.3)' }}>
        <div style={{ color: '#a78bfa', fontWeight: 'bold', fontSize: '12px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Zap size={14} /> Reading Energy Costs
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {readingCosts.map((cost) => (
            <div key={cost.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 'bold', textTransform: 'capitalize' }}>{reading_type_label(cost.reading_type)}</div>
                <div style={{ color: '#94a3b8', fontSize: '9px' }}>{cost.description}</div>
              </div>
              <div style={{ color: cost.energy_cost === 0 ? '#10b981' : '#fbbf24', fontWeight: 'bold', fontSize: '12px', minWidth: '36px', textAlign: 'center' }}>
                {cost.energy_cost === 0 ? 'FREE' : `${cost.energy_cost}⚡`}
              </div>
              <input 
                type="number" 
                min="0"
                placeholder={`${cost.energy_cost}`}
                value={editValues[`cost_${cost.id}`] ?? ''}
                onChange={(e) => setEditValues(prev => ({ ...prev, [`cost_${cost.id}`]: e.target.value }))}
                style={inputStyle}
              />
              <button 
                onClick={() => handleSaveReadingCost(cost.id, cost.reading_type)}
                disabled={saving === `cost_${cost.id}`}
                style={saveBtnStyle(saving === `cost_${cost.id}`)}
              >
                <Save size={11} /> Save
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Game Config */}
      <div style={{ padding: '14px', background: 'rgba(251, 191, 36, 0.08)', borderRadius: '10px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
        <div style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '12px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Settings2 size={14} /> Game Configuration
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {gameConfigs.map((config) => (
            <div key={config.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 'bold' }}>{config.key}</div>
                <div style={{ color: '#94a3b8', fontSize: '9px' }}>{config.description}</div>
              </div>
              <div style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '12px', minWidth: '36px', textAlign: 'center' }}>
                {config.value}
              </div>
              <input 
                type="number" 
                min="0"
                placeholder={`${config.value}`}
                value={editValues[`config_${config.key}`] ?? ''}
                onChange={(e) => setEditValues(prev => ({ ...prev, [`config_${config.key}`]: e.target.value }))}
                style={inputStyle}
              />
              <button 
                onClick={() => handleSaveGameConfig(config.key)}
                disabled={saving === `config_${config.key}`}
                style={saveBtnStyle(saving === `config_${config.key}`)}
              >
                <Save size={11} /> Save
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 🆕 Premium Configuration (separate component) */}
      <PremiumConfigAdmin />

      {/* Info */}
      <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: '10px', color: '#94a3b8', lineHeight: 1.5 }}>
        💡 Changes are reflected immediately in the app (on next user load). No hardcoded data is used.
      </div>
    </div>
  );
}