import { useState } from 'react';
import { X, Gem, Sparkles, Bug } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Package {
  id: string;
  coins: number;
  stars: number;
  label: string;
  isPopular?: boolean;
}

const packages: Package[] = [
  { id: 'small', coins: 50, stars: 50, label: 'Small Pack' },
  { id: 'medium', coins: 120, stars: 100, label: 'Medium Pack', isPopular: true },
  { id: 'large', coins: 300, stars: 200, label: 'Large Pack' },
];

interface DiamondShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  isAdmin: boolean;
  onSuccess: () => void;
}

export default function DiamondShopModal({ isOpen, onClose, userId, isAdmin, onSuccess }: DiamondShopModalProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  if (!isOpen) return null;

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleBuy = async (pkg: Package) => {
    setDebugLogs([]);
    setShowDebug(true);
    addLog('🚀 Starting purchase process...');
    addLog(`📦 Package: ${pkg.label} (${pkg.coins}  for ${pkg.stars} ⭐)`);
    
    if (!(window as any).Telegram?.WebApp) {
      addLog('❌ ERROR: Telegram WebApp not available');
      alert('This feature is only available in Telegram.');
      return;
    }

    addLog('✅ Telegram WebApp detected');

    if (!supabase) {
      addLog('❌ ERROR: Supabase client is null');
      alert('System error: Cannot connect to database.');
      return;
    }

    addLog('✅ Supabase client ready');
    addLog(`👤 User ID: ${userId}`);

    setIsLoading(pkg.id);
    
    try {
      addLog('🔄 Calling create-diamond-invoice function...');

      const requestBody = {
        user_id: userId,
        coins_amount: pkg.coins,
        stars_amount: pkg.stars,
        description: `Purchase ${pkg.coins} diamonds`
      };
      
      addLog(`📤 Request: ${JSON.stringify(requestBody)}`);

      const { data, error } = await supabase.functions.invoke('create-diamond-invoice', {
        body: requestBody
      });

      if (error) {
        addLog(`❌ Edge Function error: ${error.message}`);
        throw new Error(`Edge Function error: ${error.message}`);
      }

      if (!data?.invoice_url) {
        addLog(`❌ No invoice_url in response`);
        addLog(`Response: ${JSON.stringify(data)}`);
        throw new Error('Failed to create invoice');
      }

      addLog(`✅ Invoice URL received`);
      addLog(`🚀 Opening Telegram invoice...`);

      const tg = (window as any).Telegram.WebApp;
      
      tg.openInvoice(data.invoice_url, async (status: string) => {
        addLog(`💳 Invoice status: ${status}`);
        
        if (status === 'paid') {
          addLog(`✅ Payment successful!`);
          addLog(`🔄 Calling onSuccess...`);
          onSuccess();
        } else if (status === 'cancelled') {
          addLog(`⚠️ Payment cancelled by user`);
        } else if (status === 'failed') {
          addLog(`❌ Payment failed`);
        }
        
        setIsLoading(null);
      });
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      addLog(`💥 Exception: ${errorMsg}`);
      alert(`Error: ${errorMsg}`);
      setIsLoading(null);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.9)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px'
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1510 0%, #0f0c08 100%)',
        border: '1px solid rgba(197, 160, 89, 0.3)', borderRadius: '20px',
        width: '100%', maxWidth: '400px', maxHeight: '90vh', overflow: 'auto',
        position: 'relative'
      }} onClick={(e) => e.stopPropagation()}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', zIndex: 10 }}>
          <X size={24} />
        </button>

        <div style={{ padding: '20px 20px 10px 20px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(197, 160, 89, 0.2)', padding: '12px', borderRadius: '50%' }}>
              <Gem size={32} color="#C5A059" />
            </div>
          </div>
          <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 'bold', margin: 0 }}>Diamond Shop</h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '8px' }}>Purchase diamonds with Telegram Stars</p>
        </div>

        <div style={{ padding: '0 20px 20px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handleBuy(pkg)}
                disabled={isLoading !== null}
                style={{
                  background: pkg.isPopular ? 'rgba(197, 160, 89, 0.15)' : 'rgba(255,255,255,0.05)',
                  border: pkg.isPopular ? '1px solid #C5A059' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', padding: '14px', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  opacity: isLoading === pkg.id ? 0.5 : 1, position: 'relative'
                }}
              >
                {pkg.isPopular && (
                  <div style={{
                    position: 'absolute', top: '0', right: '0',
                    background: '#C5A059', color: '#000', fontSize: '9px',
                    padding: '2px 6px', borderBottomLeftRadius: '8px', fontWeight: 'bold'
                  }}>
                    POPULAR
                  </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Gem size={18} color="#C5A059" />
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>{pkg.coins}</span>
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>{pkg.label}</span>
                </div>

                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '4px', 
                  background: 'rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: '15px',
                  color: '#fff', fontWeight: 'bold', fontSize: '13px'
                }}>
                  <Sparkles size={14} color="#FFD700" /> {pkg.stars} ⭐
                </div>
              </button>
            ))}
          </div>

          {isLoading && (
            <div style={{ textAlign: 'center', marginTop: '16px', color: '#C5A059', fontSize: '13px' }}>
              Creating invoice...
            </div>
          )}
        </div>

        {/* Admin Debug Panel - Only visible for admins */}
        {isAdmin && (
          <div style={{ 
            borderTop: '1px solid rgba(197, 160, 89, 0.3)',
            background: 'rgba(0,0,0,0.5)',
            padding: '12px'
          }}>
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              marginBottom: '8px'
            }}>
              <button
                onClick={() => setShowDebug(!showDebug)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: showDebug ? 'rgba(244, 114, 182, 0.2)' : 'rgba(244, 114, 182, 0.1)',
                  border: '1px solid #f472b6',
                  borderRadius: '8px', padding: '8px 12px',
                  color: '#f472b6', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
                }}
              >
                <Bug size={14} />
                <span>Debug Logs ({debugLogs.length})</span>
              </button>
              
              <button 
                onClick={() => setDebugLogs([])}
                style={{ 
                  background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', 
                  borderRadius: '6px', color: '#ef4444', cursor: 'pointer', 
                  padding: '6px 10px', fontSize: '11px', fontWeight: 'bold'
                }}
              >
                Clear
              </button>
            </div>
            
            {showDebug && (
              <div style={{ 
                background: 'rgba(0,0,0,0.6)', borderRadius: '8px', padding: '8px', 
                maxHeight: '200px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '10px'
              }}>
                {debugLogs.length === 0 ? (
                  <div style={{ color: '#64748b', textAlign: 'center', padding: '10px' }}>
                    No logs yet. Click a package to start...
                  </div>
                ) : (
                  debugLogs.map((log, i) => (
                    <div key={i} style={{ 
                      padding: '4px', marginBottom: '2px', 
                      background: 'rgba(255,255,255,0.05)', borderRadius: '4px',
                      color: log.includes('ERROR') || log.includes('❌') ? '#f87171' :
                             log.includes('✅') ? '#4ade80' :
                             log.includes('⚠️') ? '#fbbf24' : '#e2e8f0',
                      wordBreak: 'break-word'
                    }}>
                      {log}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}