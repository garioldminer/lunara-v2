import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, RefreshCw, Ruler, Copy, Check, Download, Eye } from 'lucide-react';

interface Metric {
  label: string;
  value: string;
  ok?: boolean;
  bad?: boolean;
  warn?: boolean;
  details?: string;
}

interface ElementInfo {
  selector: string;
  element: HTMLElement | null;
  rect: DOMRect | null;
  computed: CSSStyleDeclaration | null;
}

const r = (n: number) => Math.round(n);

export default function HoroscopeLayoutDebugger({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [lastUpdate, setLastUpdate] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<'gaps' | 'elements' | 'text' | 'fonts'>('gaps');

  const q = (sel: string) => document.querySelector(sel) as HTMLElement | null;
  const rect = (el: HTMLElement | null) => (el ? el.getBoundingClientRect() : null);

  const getElementInfo = (selector: string): ElementInfo => {
    const element = q(selector);
    return {
      selector,
      element,
      rect: rect(element),
      computed: element ? getComputedStyle(element) : null,
    };
  };

  const gapCheck = (g: number, expected = 5) => ({
    ok: Math.abs(g - expected) <= 1,
    bad: Math.abs(g - expected) > 1,
    details: `expected ${expected}px, got ${g}px`,
  });

  const measure = useCallback(() => {
    const m: Metric[] = [];

    m.push({
      label: '📐 Window Size',
      value: `${window.innerWidth} × ${window.innerHeight}`,
      details: `DPR: ${window.devicePixelRatio}`,
    });

    const topbar = getElementInfo('.horoscope-topbar');
    const subbar = getElementInfo('.horoscope-subbar');
    const hero = getElementInfo('.premium-hero-banner');
    const energy = getElementInfo('.premium-energy-grid');
    const moon = getElementInfo('.premium-moon-card');
    const predictions = getElementInfo('.premium-predictions-grid');
    const nav = getElementInfo('.bottom-nav-container') || getElementInfo('.bottom-nav');
    const subtitle = getElementInfo('.premium-hero-subtitle');
    const title = getElementInfo('.premium-hero-title');
    const readFull = getElementInfo('.premium-read-full-btn');
    const tarotCard = getElementInfo('.premium-tarot-card');

    // === GAPS ===
    if (topbar.rect && subbar.rect) {
      const g = r(subbar.rect.top - topbar.rect.bottom);
      m.push({ label: '↕️ topbar → subbar', value: `${g}px`, ...gapCheck(g) });
    }

    if (subbar.rect && hero.rect) {
      const g = r(hero.rect.top - subbar.rect.bottom);
      m.push({ label: '↕️ subbar → hero', value: `${g}px`, ...gapCheck(g) });
    }

    if (hero.rect && energy.rect) {
      const g = r(energy.rect.top - hero.rect.bottom);
      m.push({ label: '↕️ hero → energy', value: `${g}px`, ...gapCheck(g) });
    }

    if (energy.rect && moon.rect) {
      const g = r(moon.rect.top - energy.rect.bottom);
      m.push({ label: '↕️ energy → moon', value: `${g}px`, ...gapCheck(g) });
    }

    if (moon.rect && predictions.rect) {
      const g = r(predictions.rect.top - moon.rect.bottom);
      m.push({ label: '↕️ moon → predictions', value: `${g}px`, ...gapCheck(g) });
    }

    if (predictions.rect && nav.rect) {
      const g = r(nav.rect.top - predictions.rect.bottom);
      m.push({ label: '↕️ predictions → nav', value: `${g}px`, ...gapCheck(g, 65) });
    }

    // === ELEMENTS ===
    if (hero.rect) {
      m.push({
        label: '🎯 Hero Banner',
        value: `${r(hero.rect.width)}×${r(hero.rect.height)}`,
        details: `padding: ${hero.computed?.padding}`,
      });
    }

    if (energy.rect) {
      m.push({
        label: '⚡ Energy Grid',
        value: `${r(energy.rect.width)}×${r(energy.rect.height)}`,
        details: `gap: ${energy.computed?.gap}`,
      });
    }

    if (moon.rect) {
      m.push({
        label: '🌙 Moon Card',
        value: `${r(moon.rect.width)}×${r(moon.rect.height)}`,
        details: `padding: ${moon.computed?.padding}`,
      });
    }

    if (predictions.rect) {
      m.push({
        label: '🔮 Predictions',
        value: `${r(predictions.rect.width)}×${r(predictions.rect.height)}`,
        details: `gap: ${predictions.computed?.gap}`,
      });
    }

    if (tarotCard.rect) {
      m.push({
        label: '🃏 Tarot Card',
        value: `${r(tarotCard.rect.width)}×${r(tarotCard.rect.height)}`,
        details: `transform: ${tarotCard.computed?.transform?.substring(0, 30)}...`,
      });
    }

    if (readFull.rect && tarotCard.rect) {
      const diff = r(Math.abs(readFull.rect.bottom - tarotCard.rect.bottom));
      m.push({
        label: '🎯 ReadFull ↔ Card bottom',
        value: `${diff}px`,
        ok: diff <= 5,
        bad: diff > 5,
        details: `ReadFull: ${r(readFull.rect.bottom)}, Card: ${r(tarotCard.rect.bottom)}`,
      });
    }

    // === TEXT ===
    if (subtitle.element && subtitle.computed) {
      const lh = parseFloat(subtitle.computed.lineHeight) || 12;
      const lines = Math.round(subtitle.element.scrollHeight / lh);
      m.push({
        label: '📝 Subtitle lines',
        value: `${lines}`,
        ok: lines === 1,
        bad: lines > 1,
        details: `scrollHeight: ${subtitle.element.scrollHeight}, lineHeight: ${lh}`,
      });
      m.push({
        label: '📝 Subtitle font-size',
        value: subtitle.computed.fontSize,
      });
    }

    if (title.element && title.computed) {
      const lh = parseFloat(title.computed.lineHeight) || 20;
      const lines = Math.round(title.element.scrollHeight / lh);
      m.push({
        label: '📝 Title lines',
        value: `${lines}`,
        ok: lines === 1,
        bad: lines > 1,
        details: `scrollHeight: ${title.element.scrollHeight}, lineHeight: ${lh}`,
      });
      m.push({
        label: '📝 Title font-size',
        value: title.computed.fontSize,
      });
    }

    // === FONTS / VARS ===
    const navInset = getComputedStyle(document.documentElement).getPropertyValue('--nav-inset').trim();
    m.push({
      label: '📏 --nav-inset',
      value: navInset || 'undefined',
      details: 'CSS variable for content padding',
    });

    const gap = getComputedStyle(document.documentElement).getPropertyValue('--gap').trim();
    m.push({
      label: '📏 --gap',
      value: gap || 'undefined',
      details: 'CSS variable for section gaps',
    });

    setMetrics(m);
    setLastUpdate(new Date().toLocaleTimeString('en-US', { hour12: false }));
  }, []);

  useEffect(() => {
    if (!open) return;
    measure();
    const id = setInterval(measure, 1500);
    window.addEventListener('resize', measure);
    return () => {
      clearInterval(id);
      window.removeEventListener('resize', measure);
    };
  }, [open, measure]);

  const highlight = (selector: string) => {
    const el = q(selector);
    if (el) {
      const originalOutline = el.style.outline;
      const originalOutlineOffset = el.style.outlineOffset;
      el.style.outline = '3px solid #D9B66F';
      el.style.outlineOffset = '2px';
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        el.style.outline = originalOutline;
        el.style.outlineOffset = originalOutlineOffset;
      }, 3000);
    }
  };

  const copyAll = () => {
    const output = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      window: { width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio },
      metrics: metrics.map(m => ({
        label: m.label,
        value: m.value,
        status: m.bad ? 'BAD' : m.ok ? 'OK' : 'INFO',
        details: m.details,
      })),
    };
    navigator.clipboard.writeText(JSON.stringify(output, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const exportReport = () => {
    const report = [
      '═══════════════════════════════════════',
      '  HOROSCOPE LAYOUT DEBUG REPORT',
      '═══════════════════════════════════════',
      '',
      `Time: ${lastUpdate}`,
      `URL: ${window.location.href}`,
      `Window: ${window.innerWidth}×${window.innerHeight} (DPR: ${window.devicePixelRatio})`,
      '',
      '─── METRICS ───',
      '',
      ...metrics.map(m => {
        const status = m.bad ? '❌' : m.ok ? '✅' : 'ℹ️';
        const line = `${status} ${m.label}: ${m.value}`;
        return m.details ? `${line}\n   → ${m.details}` : line;
      }),
      '',
      '═══════════════════════════════════════',
    ];
    const blob = new Blob([report.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horoscope-debug-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  const sections = {
    gaps: metrics.filter(m => m.label.includes('↕️')),
    elements: metrics.filter(m => m.label.includes('🎯') || m.label.includes('⚡') || m.label.includes('🌙') || m.label.includes('🔮') || m.label.includes('🃏')),
    text: metrics.filter(m => m.label.includes('📝')),
    fonts: metrics.filter(m => m.label.includes('📏') || m.label.includes('📐')),
  };

  const currentMetrics = sections[activeSection];

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 60,
      right: 8,
      left: 8,
      zIndex: 2147483647,
      maxWidth: 380,
      margin: '0 auto',
      maxHeight: '80vh',
      background: 'rgba(10, 6, 0, 0.98)',
      border: '2px solid rgba(217, 182, 111, 0.8)',
      borderRadius: 16,
      boxShadow: '0 12px 60px rgba(217,182,111,0.6), 0 0 100px rgba(0,0,0,0.9)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'monospace',
      fontSize: 11,
      color: '#ffe566',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 14px',
        borderBottom: '2px solid rgba(217,182,111,0.4)',
        background: 'rgba(217, 182, 111, 0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ruler size={18} color="#D9B66F" />
          <span style={{ fontWeight: 900, color: '#D9B66F', fontSize: 13, letterSpacing: 1 }}>
            LAYOUT DEBUGGER
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            color: '#ef4444',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '10px 14px',
        borderBottom: '1px solid rgba(217,182,111,0.2)',
      }}>
        <button
          onClick={measure}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: 8,
            background: 'rgba(96,165,250,0.15)',
            border: '1px solid rgba(96,165,250,0.4)',
            borderRadius: 8,
            color: '#60a5fa',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: 10,
          }}
        >
          <RefreshCw size={14} />
          REFRESH
        </button>
        <button
          onClick={copyAll}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: 8,
            background: copied ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.15)',
            border: `1px solid ${copied ? '#10b981' : 'rgba(16,185,129,0.4)'}`,
            borderRadius: 8,
            color: '#34d399',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: 10,
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'COPIED!' : 'COPY JSON'}
        </button>
        <button
          onClick={exportReport}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: 8,
            background: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            borderRadius: 8,
            color: '#c084fc',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: 10,
          }}
        >
          <Download size={14} />
          EXPORT
        </button>
      </div>

      {/* Section Tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: '8px 14px 4px',
        borderBottom: '1px solid rgba(217,182,111,0.15)',
      }}>
        {(['gaps', 'elements', 'text', 'fonts'] as const).map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            style={{
              flex: 1,
              padding: '6px 4px',
              background: activeSection === section ? 'rgba(217, 182, 111, 0.25)' : 'transparent',
              border: `1px solid ${activeSection === section ? 'rgba(217, 182, 111, 0.6)' : 'rgba(217, 182, 111, 0.15)'}`,
              borderRadius: 6,
              color: activeSection === section ? '#D9B66F' : 'rgba(255, 229, 102, 0.5)',
              fontWeight: activeSection === section ? 800 : 600,
              cursor: 'pointer',
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {section}
          </button>
        ))}
      </div>

      {/* Metrics List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
        {currentMetrics.map((m, i) => {
          const selector = m.label.includes('topbar') ? '.horoscope-topbar'
            : m.label.includes('subbar') ? '.horoscope-subbar'
            : m.label.includes('hero') ? '.premium-hero-banner'
            : m.label.includes('energy') ? '.premium-energy-grid'
            : m.label.includes('moon') ? '.premium-moon-card'
            : m.label.includes('predictions') ? '.premium-predictions-grid'
            : m.label.includes('nav') ? '.bottom-nav-container'
            : m.label.includes('subtitle') ? '.premium-hero-subtitle'
            : m.label.includes('title') ? '.premium-hero-title'
            : m.label.includes('ReadFull') ? '.premium-read-full-btn'
            : m.label.includes('Tarot') ? '.premium-tarot-card'
            : null;

          return (
            <div
              key={i}
              style={{
                padding: '8px 10px',
                marginBottom: 6,
                background: 'rgba(0, 0, 0, 0.4)',
                border: `1px solid ${m.bad ? 'rgba(239, 68, 68, 0.4)' : m.ok ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: 8,
                cursor: selector ? 'pointer' : 'default',
                transition: 'all 0.2s',
              }}
              onClick={() => selector && highlight(selector)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ color: '#c87800', fontSize: 10, fontWeight: 700 }}>
                  {m.label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{
                    color: m.bad ? '#f87171' : m.ok ? '#34d399' : '#e2e8f0',
                    fontWeight: 800,
                    fontSize: 11,
                  }}>
                    {m.value}
                  </span>
                  {selector && (
                    <Eye size={10} color="#94a3b8" style={{ marginLeft: 4 }} />
                  )}
                </div>
              </div>
              {m.details && (
                <div style={{ color: '#94a3b8', fontSize: 9, marginTop: 3, fontStyle: 'italic' }}>
                  → {m.details}
                </div>
              )}
            </div>
          );
        })}
        <div style={{ color: '#64748b', fontSize: 9, marginTop: 10, textAlign: 'right' }}>
          Updated: {lastUpdate} | Click any metric to highlight element
        </div>
      </div>
    </div>,
    document.body
  );
}