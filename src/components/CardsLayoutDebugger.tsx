import { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, Ruler, Copy, Check } from 'lucide-react';

interface Metric { label: string; value: string; ok?: boolean; bad?: boolean; }

export default function CardsLayoutDebugger({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [lastUpdate, setLastUpdate] = useState('');
  const [copied, setCopied] = useState(false);

  const q = (sel: string) => document.querySelector(sel) as HTMLElement | null;
  const rect = (el: HTMLElement | null) => (el ? el.getBoundingClientRect() : null);

  const measure = useCallback(() => {
    const topbar = q('.cards-topbar');
    const subbar = q('.cards-subbar');
    const scrollArea = q('.cards-scroll-area');
    const grid = q('.cards-grid-enhanced');
    const firstCard = q('.card-item-enhanced');
    const cards = grid ? (Array.from(grid.children) as HTMLElement[]) : [];
    const lastCard = cards.length ? cards[cards.length - 1] : null;
    const nav = q('.bottom-nav-container');
    const preview = q('.floating-preview-enhanced');

    const topbarR = rect(topbar), subbarR = rect(subbar), areaR = rect(scrollArea),
          gridR = rect(grid), firstR = rect(firstCard), lastR = rect(lastCard),
          navR = rect(nav), prevR = rect(preview);
    const m: Metric[] = [];

    m.push({ label: 'innerHeight', value: `${window.innerHeight}px` });
    if (topbarR) m.push({ label: 'topbar', value: `top:${r(topbarR.top)} bottom:${r(topbarR.bottom)} h:${r(topbarR.height)}` });
    if (subbarR) m.push({ label: 'subbar', value: `top:${r(subbarR.top)} bottom:${r(subbarR.bottom)} h:${r(subbarR.height)}` });
    if (areaR) m.push({ label: 'scrollArea', value: `top:${r(areaR.top)} bottom:${r(areaR.bottom)}` });
    if (scrollArea) m.push({ label: 'scrollArea padT/padB', value: `${getComputedStyle(scrollArea).paddingTop} / ${getComputedStyle(scrollArea).paddingBottom}` });

    if (subbarR && areaR) {
      const gap = r(areaR.top - subbarR.bottom);
      m.push({ label: 'gap subbar→scrollArea', value: `${gap}px`, ok: gap >= 0 && gap <= 6, bad: gap < 0 || gap > 6 });
    }
    if (gridR) m.push({ label: 'grid padL/padR', value: `${getComputedStyle(grid!).paddingLeft} / ${getComputedStyle(grid!).paddingRight}` });
    if (navR) m.push({ label: 'nav left/right', value: `${r(navR.left)} / ${r(window.innerWidth - navR.right)}` });
    if (gridR && navR) {
      const lDiff = r(Math.abs(parseFloat(getComputedStyle(grid!).paddingLeft) - navR.left));
      m.push({ label: 'grid↔nav კიდეები სწორია?', value: lDiff <= 2 ? '✅ დიახ' : `❌ ${lDiff}px`, ok: lDiff <= 2, bad: lDiff > 2 });
    }
    if (firstR && subbarR) {
      const gap = r(firstR.top - subbarR.bottom);
      m.push({ label: 'gap subbar→1st card', value: `${gap}px`, ok: gap >= 0 && gap <= 8, bad: gap < 0 || gap > 8 });
    }
    if (lastR && navR) {
      const gap = r(navR.top - lastR.bottom);
      m.push({ label: 'gap last card→nav', value: `${gap}px`, ok: gap >= 0 && gap <= 8, bad: gap < 0 || gap > 8 });
    }
    if (prevR) {
      const centered = Math.abs(prevR.left - prevR.right) < 4;
      m.push({ label: 'preview ცენტრშია?', value: centered ? '✅ დიახ' : '❌ არა', ok: centered, bad: !centered });
    } else {
      m.push({ label: 'preview', value: 'დამალულია (ნორმა)' });
    }

    setMetrics(m);
    setLastUpdate(new Date().toLocaleTimeString('en-US', { hour12: false }));
  }, []);

  const r = (n: number) => Math.round(n);

  useEffect(() => {
    if (!open) return;
    measure();
    const id = setInterval(measure, 1000);
    window.addEventListener('resize', measure);
    return () => { clearInterval(id); window.removeEventListener('resize', measure); };
  }, [open, measure]);

  const copyAll = () => {
    const lines = ['=== CARDS LAYOUT DEBUG ===', `Time: ${lastUpdate}`, ...metrics.map(m => `${m.label}: ${m.value}`)];
    navigator.clipboard.writeText(lines.join('\n')).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

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
        <button onClick={copyAll} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 7, background: copied ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)', border: `1px solid ${copied ? '#10b981' : 'rgba(16,185,129,0.5)'}`, borderRadius: 8, color: '#34d399', fontWeight: 700, cursor: 'pointer', fontSize: 10 }}>
          {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'დაკოპირდა!' : 'Copy'}
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