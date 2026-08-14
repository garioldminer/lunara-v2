import { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, Ruler, Wrench } from 'lucide-react';

interface Metric {
  label: string;
  value: string;
  ok?: boolean;
  bad?: boolean;
}

/**
 * 🎯 HomeLayoutDebugger
 * რეალურ დროში ზომავს home layout-ის ყველა ელემენტს და გვიჩვენებს
 * ზუსტ პიქსელებს, რომ ვნახოთ რატომ იჭრება quick actions nav-ში.
 */
export default function HomeLayoutDebugger({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [overlap, setOverlap] = useState<number | null>(null);
  const [expected, setExpected] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState('');

  const q = (sel: string) => document.querySelector(sel) as HTMLElement | null;
  const rect = (el: HTMLElement | null) => (el ? el.getBoundingClientRect() : null);

  const measure = useCallback(() => {
    const home = q('.home-screen');
    const nav = q('.bottom-nav-container');
    const qa = q('.quick-access');
    const grid = q('.quick-grid');
    const rows = grid ? (Array.from(grid.children) as HTMLElement[]) : [];
    const lastRow = rows.length ? rows[rows.length - 1] : null;

    const homeR = rect(home), navR = rect(nav), qaR = rect(qa), gridR = rect(grid), lastR = rect(lastRow);
    const m: Metric[] = [];

    m.push({ label: 'window.innerHeight', value: `${window.innerHeight}px` });
    if ((window as any).visualViewport) {
      m.push({ label: 'visualViewport.height', value: `${Math.round((window as any).visualViewport.height)}px` });
    }
    if (homeR) m.push({ label: 'home.top', value: `${Math.round(homeR.top)}px` });
    if (homeR) m.push({ label: 'home.height (რეალური)', value: `${Math.round(homeR.height)}px` });
    if (home) m.push({ label: 'home.style.height (JS)', value: home.style.height || '— არ არის დაყენებული!', ok: !!home.style.height, bad: !home.style.height });
    if (navR) m.push({ label: 'nav.top (ზღვარი)', value: `${Math.round(navR.top)}px` });
    if (navR) m.push({ label: 'nav.height', value: `${Math.round(navR.height)}px` });
    if (qaR) m.push({ label: 'quick-access.bottom', value: `${Math.round(qaR.bottom)}px` });
    if (gridR) m.push({ label: 'grid.bottom', value: `${Math.round(gridR.bottom)}px` });
    if (lastR) m.push({ label: 'ბოლო რიგის.bottom', value: `${Math.round(lastR.bottom)}px` });

    // მოსალოდნელი სწორი სიმაღლე
    if (homeR && navR) setExpected(Math.round(navR.top - homeR.top - 8));
    // გადაფარვა
    if (navR && lastR) setOverlap(Math.round(lastR.bottom - navR.top));

    setMetrics(m);
    setLastUpdate(new Date().toLocaleTimeString('en-US', { hour12: false }));
  }, []);

  // ხელით გასწორება — დაუყოვნებლივ ვნახოთ მუშაობს თუ არა
  const fixNow = useCallback(() => {
    const home = q('.home-screen');
    const nav = q('.bottom-nav-container');
    if (!home || !nav) return;
    const h = nav.getBoundingClientRect().top - home.getBoundingClientRect().top - 8;
    if (h > 0) home.style.height = `${h}px`;
    setTimeout(measure, 50);
  }, [measure]);

  useEffect(() => {
    if (!open) return;
    measure();
    const id = setInterval(measure, 1000);
    window.addEventListener('resize', measure);
    return () => { clearInterval(id); window.removeEventListener('resize', measure); };
  }, [open, measure]);

  if (!open) return null;

  const isOverlapping = overlap !== null && overlap > 0;

  return (
    <div style={{
      position: 'fixed', top: 60, right: 8, left: 8, zIndex: 10005,
      maxWidth: 360, margin: '0 auto', maxHeight: '70vh',
      background: 'rgba(10,8,4,0.97)', border: '1px solid rgba(16,185,129,0.5)',
      borderRadius: 14, boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: 'monospace', fontSize: 11, color: '#d1fae5'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid rgba(16,185,129,0.3)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#34d399' }}>
          <Ruler size={14} /> LAYOUT DEBUGGER
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}>
          <X size={16} />
        </button>
      </div>

      {/* Verdict */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(16,185,129,0.2)', background: isOverlapping ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.1)' }}>
        {isOverlapping ? (
          <div style={{ color: '#f87171', fontWeight: 700 }}>❌ გადაფარვა: ბოლო რიგი nav-ს ცდება {overlap}px-ით!</div>
        ) : (
          <div style={{ color: '#34d399', fontWeight: 700 }}>✅ გადაფარვა არ არის</div>
        )}
        {expected !== null && (
          <div style={{ color: '#94a3b8', marginTop: 4 }}>სწორი home სიმაღლე უნდა იყოს ≈ <b style={{ color: '#fbbf24' }}>{expected}px</b></div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderBottom: '1px solid rgba(16,185,129,0.2)' }}>
        <button onClick={measure} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px', background: 'rgba(59,130,246,0.2)', border: '1px solid #3b82f6', borderRadius: 8, color: '#60a5fa', fontWeight: 700, cursor: 'pointer', fontSize: 10 }}>
          <RefreshCw size={12} /> გაზომვა
        </button>
        <button onClick={fixNow} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px', background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', borderRadius: 8, color: '#34d399', fontWeight: 700, cursor: 'pointer', fontSize: 10 }}>
          <Wrench size={12} /> FIX NOW
        </button>
      </div>

      {/* Metrics */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#94a3b8' }}>{m.label}</span>
            <span style={{ color: m.bad ? '#f87171' : m.ok ? '#34d399' : '#e2e8f0', fontWeight: 600 }}>{m.value}</span>
          </div>
        ))}
        <div style={{ color: '#64748b', fontSize: 9, marginTop: 6, textAlign: 'right' }}>განახლდა: {lastUpdate}</div>
      </div>
    </div>
  );
}