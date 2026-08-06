import { useState, useEffect } from 'react';
import { RefreshCw, DollarSign, Settings2, Save, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

export default function EconomyConfigAdmin() {
  const [readingCosts, setReadingCosts] = useState<ReadingCost[]>([]);
  const [gameConfigs, setGameConfigs] = useState<GameConfig[]>([]);
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
      showMessage('success', `${reading_type_label(readingType)} → ${newValue}⚡ saved!`);
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

      {/* Info */}
      <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: '10px', color: '#94a3b8', lineHeight: 1.5 }}>
        💡 ცვლილებები დაუყოვნებლივ აისახება აპლიკაციაში (მომხმარებლის შემდეგი ჩატვირთვისას). Hardcoded მონაცემები აღარ გამოიყენება.
      </div>
    </div>
  );
}