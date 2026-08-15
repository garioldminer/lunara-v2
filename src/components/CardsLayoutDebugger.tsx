import { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, Ruler, Wrench } from 'lucide-react';

interface Metric { label: string; value: string; ok?: boolean; bad?: boolean; }

export default function CardsLayoutDebugger({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [lastUpdate, setLastUpdate] = useState('');

  const q = (sel: string) => document.querySelector(sel) as HTMLElement | null;
  const rect = (el: HTMLElement | null) => (el ? el.getBoundingClientRect() : null);

  const measure = useCallback(() => {
    const topbar = q('.cards-topbar');
    const subbar = q('.cards-subbar');
    const grid = q('.cards-grid-enhanced');
    const firstCard = q('.card-item-enhanced');
    const preview = q('.floating-preview-enhanced');

    const topbarR = rect(topbar), subbarR = rect(subbar), gridR = rect(grid), firstR = rect(firstCard), prevR = rect(preview);
    const m: Metric[] = [];

    m.push({ label: 'window.innerHeight', value: `${window.innerHeight}px` });
    if ((window as any).visualViewport) m.push({ label: 'visualViewport.height', value: `${Math.round((window as any).visualViewport.height)}px` });

    if (topbarR) m.push({ label: 'topbar (title)', value: `top:${Math.round(topbarR.top)} h:${Math.round(topbarR.height)}` });
    if (subbarR) m.push({ label: 'subbar (back+filters)', value: `top:${Math.round(subbarR.top)} h:${Math.round(subbarR.height)} bottom:${Math.round(subbarR.bottom)}` });
    if (firstR && subbarR) {
      const gap = Math.round(firstR.top - subbarR.bottom);
      m.push({ label: 'gap subbar→1st card', value: `${gap}px`, ok: gap >= 0 && gap <= 10, bad: gap < 0 || gap > 10 });
    }
    if (gridR) m.push({ label: 'grid top', value: `${Math.round(gridR.top)}px` });

    if (prevR) {
      const centered = Math.abs(prevR.left - prevR.right) < 4;
      m.push({ label: 'preview left', value: `${Math.round(prevR.left)}px`, ok: centered, bad: !centered });
      m.push({ label: 'preview right', value: `${Math.round(prevR.right)}px`, ok: centered, bad: !centered });
      m.push({ label: 'preview width', value: `${Math.round(prevR.width)}px` });
      m.push({ label: 'preview center-შია?', value: centered ? '✅ დიახ' : '❌ არა', ok: centered, bad: !centered });
    } else {
      m.push({ label: 'preview', value: 'დამალულია (კარგია სანამ არ დააჭერ)' });
    }

    setMetrics(m);
    setLastUpdate(new Date().toLocaleTimeString('en-US', { hour12: false }));
  }, []);

  useEffect(() => {
    if (!open) return;
    measure();
    const id = setInterval(measure, 1000);
    window.addEventListener('resize', measure);
    return () => { clearInterval(id); window.removeEventListener('resize', measure); };
  }, [open, measure]);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', top: 60, right: 8, left: 8, zIndex: 10005,
      maxWidth: 360, margin: '0 auto', maxHeight: '70vh',
      background: 'rgba(10,8,4,0.97)', border: '1px solid rgba(16,185,129,0.5)',
      borderRadius: 14, boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: 'monospace', fontSize: 11, color: '#d1fae5'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid rgba(16,185,129,0.3)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#34d399' }}>
          <Ruler size={14} /> CARDS LAYOUT DEBUGGER
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderBottom: '1px solid rgba(16,185,129,0.2)' }}>
        <button onClick={measure} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 7, background: 'rgba(59,130,246,0.2)', border: '1px solid #3b82f6', borderRadius: 8, color: '#60a5fa', fontWeight: 700, cursor: 'pointer', fontSize: 10 }}>
          <RefreshCw size={12} /> გაზომვა
        </button>
      </div>

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