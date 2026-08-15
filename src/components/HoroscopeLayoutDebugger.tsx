import { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, Ruler, Copy, Check } from 'lucide-react';

interface Metric { label: string; value: string; ok?: boolean; bad?: boolean; }

const r = (n: number) => Math.round(n);

export default function HoroscopeLayoutDebugger({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [lastUpdate, setLastUpdate] = useState('');
  const [copied, setCopied] = useState(false);

  const q = (sel: string) => document.querySelector(sel) as HTMLElement | null;
  const rect = (el: HTMLElement | null) => (el ? el.getBoundingClientRect() : null);
  const gapCheck = (g: number, expected = 3) => ({ ok: Math.abs(g - expected) <= 1, bad: Math.abs(g - expected) > 1 });

  const measure = useCallback(() => {
    const topbar = q('.horoscope-topbar');
    const subbar = q('.horoscope-subbar');
    const hero = q('.premium-hero-banner');
    const energy = q('.premium-energy-grid');
    const moon = q('.premium-moon-card');
    const predictions = q('.premium-predictions-grid');
    const nav = q('.bottom-nav-container') || q('.bottom-nav');
    const subtitle = q('.premium-hero-subtitle');
    const title = q('.premium-hero-title');
    const readFull = q('.premium-read-full-btn');
    const tarotCard = q('.premium-tarot-card');

    const m: Metric[] = [];
    m.push({ label: 'innerW/H', value: `${window.innerWidth} / ${window.innerHeight}` });

    const topbarR = rect(topbar), subbarR = rect(subbar), heroR = rect(hero),
          energyR = rect(energy), moonR = rect(moon), predR = rect(predictions), navR = rect(nav);

    if (topbarR && subbarR) {
      const g = r(subbarR.top - topbarR.bottom);
      m.push({ label: 'gap topbar→subbar', value: `${g}px`, ...gapCheck(g) });
    }
    if (subbarR && heroR) {
      const g = r(heroR.top - subbarR.bottom);
      m.push({ label: 'gap subbar→hero', value: `${g}px`, ...gapCheck(g) });
    }
    if (heroR) m.push({ label: 'hero height', value: `${r(heroR.height)}px` });
    if (heroR && energyR) {
      const g = r(energyR.top - heroR.bottom);
      m.push({ label: 'gap hero→energy', value: `${g}px`, ...gapCheck(g) });
    }
    if (energyR && moonR) {
      const g = r(moonR.top - energyR.bottom);
      m.push({ label: 'gap energy→moon', value: `${g}px`, ...gapCheck(g) });
    }
    if (moonR && predR) {
      const g = r(predR.top - moonR.bottom);
      m.push({ label: 'gap moon→predictions', value: `${g}px`, ...gapCheck(g) });
    }
    if (predR && navR) {
      const g = r(navR.top - predR.bottom);
      m.push({ label: 'gap predictions→nav', value: `${g}px`, ...gapCheck(g) });
    }

    if (subtitle) {
      const lh = parseFloat(getComputedStyle(subtitle).lineHeight) || 12;
      const lines = Math.round(subtitle.scrollHeight / lh);
      m.push({ label: 'subtitle ხაზები', value: `${lines}`, ok: lines === 1, bad: lines > 1 });
      m.push({ label: 'subtitle font-size', value: getComputedStyle(subtitle).fontSize });
    }
    if (title) {
      const lh = parseFloat(getComputedStyle(title).lineHeight) || 20;
      const lines = Math.round(title.scrollHeight / lh);
      m.push({ label: 'title ხაზები', value: `${lines}`, ok: lines === 1, bad: lines > 1 });
    }
    if (readFull && tarotCard) {
      const rf = rect(readFull), tc = rect(tarotCard);
      if (rf && tc) {
        const diff = r(Math.abs(rf.bottom - tc.bottom));
        m.push({ label: 'readFull↔card ქვედა კიდე', value: `${diff}px`, ok: diff <= 3, bad: diff > 3 });
      }
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

  const copyAll = () => {
    const lines = ['=== HOROSCOPE LAYOUT DEBUG ===', `Time: ${lastUpdate}`, ...metrics.map(m => `${m.label}: ${m.value}`)];
    navigator.clipboard.writeText(lines.join('\n')).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', top: 60, right: 8, left: 8, zIndex: 999999,
      maxWidth: 360, margin: '0 auto', maxHeight: '70vh',
      background: 'rgba(10, 6, 0, 0.97)', border: '2px solid rgba(217, 182, 111, 0.8)',
      borderRadius: 14, boxShadow: '0 10px 60px rgba(217,182,111,0.6), 0 0 80px rgba(0,0,0,0.8)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: 'monospace', fontSize: 11, color: '#ffe566'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid rgba(217,182,111,0.3)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#D9B66F' }}>
          <Ruler size={14} /> HOROSCOPE DEBUG
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderBottom: '1px solid rgba(217,182,111,0.2)' }}>
        <button onClick={measure} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 7, background: 'rgba(96,165,250,0.2)', border: '1px solid #3b82f6', borderRadius: 8, color: '#60a5fa', fontWeight: 700, cursor: 'pointer', fontSize: 10 }}>
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