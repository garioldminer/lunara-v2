import { useEffect, useState } from 'react';

export default function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    
    const info = {
      platform: 'unknown',
      webAppExists: !!tg,
      version: tg?.version || 'N/A',
      platformName: tg?.platform || 'N/A',
      colorScheme: tg?.colorScheme || 'N/A',
      initDataExists: !!tg?.initData,
      initDataLength: tg?.initData?.length || 0,
      initDataUnsafe: tg?.initDataUnsafe || null,
      user: tg?.initDataUnsafe?.user || null,
      isExpanded: tg?.isExpanded || false,
      viewportHeight: tg?.viewportHeight || 0,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    setDebugInfo(info);
    console.log('🔍 Debug Panel Info:', info);
  }, []);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.95)',
      border: '2px solid #ffe566',
      borderRadius: '10px',
      padding: '12px',
      color: '#ffe566',
      fontFamily: 'monospace',
      fontSize: '11px',
      zIndex: 9999,
      maxHeight: '70vh',
      overflowY: 'auto',
      boxShadow: '0 4px 20px rgba(255, 229, 102, 0.3)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <strong style={{ color: '#fff', fontSize: '13px' }}>🔍 DEBUG PANEL</strong>
        <button 
          onClick={() => setIsVisible(false)}
          style={{
            background: '#c87800',
            border: 'none',
            color: '#0a0600',
            padding: '4px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          ✕ Close
        </button>
      </div>
      
      <div style={{ display: 'grid', gap: '6px' }}>
        <div>
          <span style={{ color: '#888' }}>Platform:</span>{' '}
          <span style={{ color: debugInfo.webAppExists ? '#4ade80' : '#f87171' }}>
            {debugInfo.platformName}
          </span>
        </div>
        
        <div>
          <span style={{ color: '#888' }}>WebApp SDK:</span>{' '}
          <span style={{ color: debugInfo.webAppExists ? '#4ade80' : '#f87171' }}>
            {debugInfo.webAppExists ? '✅ Loaded' : '❌ NOT LOADED'}
          </span>
        </div>
        
        <div>
          <span style={{ color: '#888' }}>Version:</span>{' '}
          <span>{debugInfo.version}</span>
        </div>
        
        <div>
          <span style={{ color: '#888' }}>initData:</span>{' '}
          <span style={{ color: debugInfo.initDataExists ? '#4ade80' : '#f87171' }}>
            {debugInfo.initDataExists ? `✅ (${debugInfo.initDataLength} chars)` : '❌ EMPTY'}
          </span>
        </div>
        
        <div>
          <span style={{ color: '#888' }}>User:</span>{' '}
          <span style={{ color: debugInfo.user ? '#4ade80' : '#f87171' }}>
            {debugInfo.user ? '✅ FOUND' : '❌ NOT FOUND'}
          </span>
        </div>
        
        {debugInfo.user && (
          <div style={{ 
            background: 'rgba(74, 222, 128, 0.1)', 
            padding: '8px', 
            borderRadius: '6px',
            border: '1px solid #4ade80',
            marginTop: '4px',
          }}>
            <div><span style={{ color: '#888' }}>ID:</span> {debugInfo.user.id}</div>
            <div><span style={{ color: '#888' }}>Name:</span> {debugInfo.user.first_name} {debugInfo.user.last_name || ''}</div>
            <div><span style={{ color: '#888' }}>Username:</span> @{debugInfo.user.username || 'N/A'}</div>
          </div>
        )}
        
        {!debugInfo.user && (
          <div style={{ 
            background: 'rgba(248, 113, 113, 0.1)', 
            padding: '8px', 
            borderRadius: '6px',
            border: '1px solid #f87171',
            marginTop: '4px',
          }}>
            <div style={{ color: '#f87171' }}>
              {debugInfo.webAppExists 
                ? '⚠️ SDK loaded but user not found - check BotFather Menu Button!'
                : '⚠️ Telegram SDK not loaded!'}
            </div>
          </div>
        )}
        
        <div style={{ marginTop: '8px', borderTop: '1px solid #333', paddingTop: '8px' }}>
          <div><span style={{ color: '#888' }}>URL:</span> {debugInfo.url}</div>
          <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>
            {debugInfo.userAgent}
          </div>
        </div>
      </div>
    </div>
  );
}