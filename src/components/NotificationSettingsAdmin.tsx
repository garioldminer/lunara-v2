import { useEffect, useState, useRef } from 'react';
import { Bell, Moon, Sun, RefreshCw, Send, Sparkles, X, Check, Loader2 } from 'lucide-react';

/* ============================================================
   LUNARA — Notification Settings (Admin)
   Redesign notes for გიო:
   - Colors are applied via inline style objects, not Tailwind
     arbitrary-value classes (bg-[#...]) — this sandbox has no
     Tailwind JIT compiler, so bracket classes silently fail here.
     In your real Next.js project (which DOES compile Tailwind),
     you can keep using bg-[#0a0600] etc. if you prefer — just
     know the two approaches aren't interchangeable environments.
   - Replace mockLoad / mockSave / mockBroadcast with your real
     Supabase calls — the shape of the data is unchanged.
   ============================================================ */

const palette = {
  bgTop: '#120c07',
  bgBottom: '#050301',
  surface: '#171009',
  surfaceRaised: '#1e1509',
  border: '#2c2213',
  borderSubtle: '#231a0f',
  gold: '#C5A059',
  goldBright: '#E8CA8F',
  goldDeep: '#8B6914',
  ink: '#F3ECDD',
  inkMuted: '#9C9280',
  purple: '#A78BDA',
  purpleDim: '#3D3555',
  danger: '#C1443F',
  dangerDeep: '#3A1414',
  dangerBorder: '#4A1D1D',
  success: '#7FAE7A',
  successBg: '#152016',
};

const fontImport = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Georgian:wght@500;700&family=Noto+Sans+Georgian:wght@400;500;600;700&display=swap');
* { font-family: 'Noto Sans Georgian', system-ui, sans-serif; }
.lunara-display { font-family: 'Noto Serif Georgian', serif; letter-spacing: 0.01em; }
@keyframes lunara-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes lunara-toast { from { opacity: 0; transform: translate(-50%, 12px); } to { opacity: 1; transform: translate(-50%, 0); } }
@keyframes lunara-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
}
`;

// --- Mock data layer — swap these three for your real Supabase calls ---
const MOCK_AUDIENCE = 1284;
function mockLoad() {
  return new Promise((res) =>
    setTimeout(
      () =>
        res({
          id: '1',
          daily_horoscope_enabled: true,
          moon_phase_enabled: false,
          daily_horoscope_time: '09:00',
        }),
      650
    )
  );
}
function mockSave(settings) {
  return new Promise((res) => setTimeout(() => res(settings), 500));
}
function mockBroadcast(message) {
  return new Promise((res) =>
    setTimeout(
      () =>
        res({
          success: true,
          message: 'შეტყობინება წარმატებით გაიგზავნა',
          details: { successCount: MOCK_AUDIENCE - 12, failCount: 12 },
        }),
      1400
    )
  );
}
// -------------------------------------------------------------------

const CONFIRM_PHRASE = 'გაგზავნა';
const MESSAGE_LIMIT = 180;

function OrnamentDivider() {
  return (
    <div className="flex items-center gap-3 px-4">
      <div className="h-px flex-1" style={{ backgroundColor: palette.border }} />
      <svg width="10" height="10" viewBox="0 0 10 10">
        <path d="M5 0L6.2 3.8L10 5L6.2 6.2L5 10L3.8 6.2L0 5L3.8 3.8Z" fill={palette.gold} opacity="0.55" />
      </svg>
      <div className="h-px flex-1" style={{ backgroundColor: palette.border }} />
    </div>
  );
}

function Toggle({ checked, onChange, activeColor }) {
  return (
    <button
      onClick={onChange}
      aria-pressed={checked}
      className="w-12 h-7 rounded-full relative flex-shrink-0 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        backgroundColor: checked ? activeColor : '#3a3226',
        outlineColor: palette.gold,
      }}
    >
      <div
        className="absolute top-1 w-5 h-5 rounded-full shadow-md transition-all duration-200"
        style={{ backgroundColor: '#fff', left: checked ? '26px' : '4px' }}
      />
    </button>
  );
}

function Skeleton({ className }) {
  return (
    <div
      className={className}
      style={{ backgroundColor: palette.borderSubtle, animation: 'lunara-pulse 1.6s ease-in-out infinite' }}
    />
  );
}

export default function NotificationSettingsAdmin() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    load();
  }, []);

  const showToast = (text, tone = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ text, tone });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const load = async () => {
    setLoading(true);
    const data = await mockLoad();
    setSettings(data);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await mockSave(settings);
    setSaving(false);
    setSaved(true);
    showToast('პარამეტრები შენახულია');
    setTimeout(() => setSaved(false), 2000);
  };

  const openConfirm = () => {
    if (!message.trim()) return;
    setConfirmInput('');
    setConfirmOpen(true);
  };

  const handleBroadcast = async () => {
    setConfirmOpen(false);
    setSending(true);
    setResult(null);
    try {
      const data = await mockBroadcast(message.trim());
      setResult(data);
      if (data.success) setMessage('');
    } catch (e) {
      setResult({ success: false, error: e.message });
    }
    setSending(false);
  };

  const charCount = message.length;
  const charPct = Math.min(100, (charCount / MESSAGE_LIMIT) * 100);
  const charTone = charCount > MESSAGE_LIMIT ? palette.danger : charCount > MESSAGE_LIMIT * 0.85 ? palette.gold : palette.inkMuted;
  const overLimit = charCount > MESSAGE_LIMIT;

  return (
    <div
      className="min-h-screen pb-28"
      style={{ background: `linear-gradient(to bottom, ${palette.bgTop}, ${palette.bgBottom})`, color: palette.ink }}
    >
      <style>{fontImport}</style>

      {/* Header */}
      <div
        className="sticky top-0 z-40 backdrop-blur-md px-4 py-4"
        style={{ backgroundColor: 'rgba(9,6,3,0.9)', borderBottom: `1px solid ${palette.border}` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${palette.gold}, ${palette.goldDeep})` }}
            >
              <Bell className="w-5 h-5" style={{ color: palette.bgBottom }} />
            </div>
            <div>
              <h1 className="lunara-display text-lg font-bold" style={{ color: palette.gold }}>
                შეტყობინებები
              </h1>
              <p className="text-xs" style={{ color: palette.inkMuted }}>
                მართვა და მასობრივი გაგზავნა
              </p>
            </div>
          </div>
          <button
            onClick={load}
            aria-label="განახლება"
            className="p-2 rounded-xl active:scale-95 transition-transform focus:outline-none focus-visible:ring-2"
            style={{ backgroundColor: palette.surface, border: `1px solid ${palette.border}`, color: palette.gold, outlineColor: palette.gold }}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* ============ Global settings ============ */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: palette.surface, border: `1px solid ${palette.border}`, animation: 'lunara-rise 0.35s ease-out' }}>
          <div className="p-4" style={{ borderBottom: `1px solid ${palette.border}` }}>
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Sun className="w-4 h-4" style={{ color: palette.gold }} />
              ავტომატური შეტყობინებები
            </h2>
          </div>

          {loading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
          ) : (
            <div className="p-4 space-y-1">
              {/* Daily horoscope */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(197,160,89,0.1)' }}>
                    <Sun className="w-5 h-5" style={{ color: palette.gold }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">ყოველდღიური ჰოროსკოპი</div>
                    <div className="text-xs truncate" style={{ color: palette.inkMuted }}>
                      იგზავნება ავტომატურად, ყოველდღე
                    </div>
                  </div>
                </div>
                <Toggle
                  checked={settings.daily_horoscope_enabled}
                  activeColor={palette.gold}
                  onChange={() => setSettings({ ...settings, daily_horoscope_enabled: !settings.daily_horoscope_enabled })}
                />
              </div>

              {settings.daily_horoscope_enabled && (
                <div className="pl-13 pb-1" style={{ paddingLeft: '52px', animation: 'lunara-rise 0.2s ease-out' }}>
                  <div className="rounded-xl p-3" style={{ backgroundColor: palette.bgTop, border: `1px solid ${palette.border}` }}>
                    <label className="text-xs block mb-2" style={{ color: palette.inkMuted }}>
                      გაგზავნის დრო
                    </label>
                    <input
                      type="time"
                      value={settings.daily_horoscope_time}
                      onChange={(e) => setSettings({ ...settings, daily_horoscope_time: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{ backgroundColor: palette.surfaceRaised, border: `1px solid ${palette.border}`, color: palette.gold, colorScheme: 'dark' }}
                    />
                  </div>
                </div>
              )}

              <OrnamentDivider />

              {/* Moon phase */}
              <div className="flex items-center justify-between py-2 pt-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(167,139,218,0.1)' }}>
                    <Moon className="w-5 h-5" style={{ color: palette.purple }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">მთვარის ფაზები</div>
                    <div className="text-xs truncate" style={{ color: palette.inkMuted }}>
                      იგზავნება ფაზის შეცვლისას
                    </div>
                  </div>
                </div>
                <Toggle
                  checked={settings.moon_phase_enabled}
                  activeColor={palette.purple}
                  onChange={() => setSettings({ ...settings, moon_phase_enabled: !settings.moon_phase_enabled })}
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 font-bold rounded-xl mt-3 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  background: saved ? palette.successBg : `linear-gradient(135deg, ${palette.gold}, ${palette.goldDeep})`,
                  color: saved ? palette.success : palette.bgBottom,
                  border: saved ? `1px solid ${palette.success}` : 'none',
                }}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saved ? (
                  <>
                    <Check className="w-4 h-4" /> შენახულია
                  </>
                ) : (
                  'ცვლილებების შენახვა'
                )}
              </button>
            </div>
          )}
        </div>

        {/* ============ Broadcast ============ */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: palette.surface, border: `1px solid ${palette.dangerBorder}`, animation: 'lunara-rise 0.4s ease-out' }}>
          <div className="p-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${palette.dangerBorder}`, backgroundColor: 'rgba(58,20,20,0.35)' }}>
            <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: palette.danger }}>
              <Send className="w-4 h-4" />
              მასობრივი გაგზავნა
            </h2>
            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: palette.dangerDeep, color: palette.danger }}>
              {MOCK_AUDIENCE.toLocaleString()} მიმღები
            </span>
          </div>

          <div className="p-4 space-y-4">
            <div className="rounded-xl p-3 flex gap-3" style={{ backgroundColor: palette.dangerDeep, border: `1px solid ${palette.dangerBorder}` }}>
              <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: palette.danger }} />
              <p className="text-xs leading-relaxed" style={{ color: '#DDB2B0' }}>
                გაეგზავნება <strong>ყველა</strong> მომხმარებელს, მათი პერსონალური პარამეტრების მიუხედავად. ეს ქმედება ვერ გაუქმდება გაგზავნის შემდეგ.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs" style={{ color: palette.inkMuted }}>
                  შეტყობინების ტექსტი
                </label>
                <span className="text-xs font-medium" style={{ color: charTone }}>
                  {charCount} / {MESSAGE_LIMIT}
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="მაგ. გილოცავთ ახალ განახლებას — ახალი ტაროს დაფა უკვე ხელმისაწვდომია"
                rows={4}
                className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none transition-colors"
                style={{
                  backgroundColor: palette.bgTop,
                  border: `1px solid ${overLimit ? palette.danger : palette.border}`,
                  color: palette.ink,
                }}
              />
              <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: palette.borderSubtle }}>
                <div className="h-full transition-all duration-200" style={{ width: `${charPct}%`, backgroundColor: charTone }} />
              </div>
            </div>

            {/* Live preview */}
            {message.trim() && (
              <div style={{ animation: 'lunara-rise 0.2s ease-out' }}>
                <div className="text-xs mb-2" style={{ color: palette.inkMuted }}>
                  გამოიყურება ასე
                </div>
                <div className="rounded-xl p-3 flex gap-3" style={{ backgroundColor: palette.surfaceRaised, border: `1px solid ${palette.border}` }}>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${palette.gold}, ${palette.goldDeep})` }}
                  >
                    <Moon className="w-4 h-4" style={{ color: palette.bgBottom }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold" style={{ color: palette.ink }}>
                      LUNARA
                    </div>
                    <div className="text-xs mt-0.5 break-words" style={{ color: palette.inkMuted }}>
                      {message.trim().slice(0, MESSAGE_LIMIT)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={openConfirm}
              disabled={sending || !message.trim() || overLimit}
              className="w-full py-3 font-bold rounded-xl active:scale-[0.98] transition-transform disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, #A83A36, ${palette.dangerDeep})`, color: '#fff' }}
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> იგზავნება...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> გაგზავნა ყველას
                </>
              )}
            </button>

            {result && (
              <div
                className="rounded-xl p-4 border"
                style={{
                  animation: 'lunara-rise 0.2s ease-out',
                  backgroundColor: result.success ? palette.successBg : palette.dangerDeep,
                  borderColor: result.success ? palette.success : palette.dangerBorder,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {result.success ? <Check className="w-4 h-4" style={{ color: palette.success }} /> : <X className="w-4 h-4" style={{ color: palette.danger }} />}
                  <div className="font-bold text-sm" style={{ color: result.success ? palette.success : palette.danger }}>
                    {result.success ? 'გაგზავნილია' : 'ვერ გაიგზავნა'}
                  </div>
                </div>
                <div className="text-sm" style={{ color: palette.inkMuted }}>
                  {result.message || result.error}
                </div>
                {result.details && (
                  <div className="text-xs space-y-1 pt-2 mt-2" style={{ borderTop: `1px solid ${palette.border}` }}>
                    <div style={{ color: palette.success }}>წარმატებული: {result.details.successCount.toLocaleString()}</div>
                    {result.details.failCount > 0 && <div style={{ color: palette.danger }}>ვერ მოხერხდა: {result.details.failCount}</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation ritual — deliberately has friction; this is an irreversible action */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(5,3,1,0.7)', backdropFilter: 'blur(2px)', animation: 'lunara-rise 0.15s ease-out' }}
          onClick={() => setConfirmOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl p-5"
            style={{ backgroundColor: palette.surface, border: `1px solid ${palette.dangerBorder}` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Send className="w-4 h-4" style={{ color: palette.danger }} />
              <h3 className="lunara-display font-bold" style={{ color: palette.ink }}>
                დაადასტურე გაგზავნა
              </h3>
            </div>
            <p className="text-xs mb-4" style={{ color: palette.inkMuted }}>
              შეტყობინება მიიღებს <strong style={{ color: palette.ink }}>{MOCK_AUDIENCE.toLocaleString()}</strong> მომხმარებელი. დასადასტურებლად ჩაწერე{' '}
              <span style={{ color: palette.gold }}>„{CONFIRM_PHRASE}“</span>.
            </p>
            <input
              autoFocus
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              className="w-full rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none"
              style={{ backgroundColor: palette.bgTop, border: `1px solid ${palette.border}`, color: palette.ink }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ backgroundColor: palette.surfaceRaised, border: `1px solid ${palette.border}`, color: palette.inkMuted }}
              >
                გაუქმება
              </button>
              <button
                onClick={handleBroadcast}
                disabled={confirmInput.trim() !== CONFIRM_PHRASE}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, #A83A36, ${palette.dangerDeep})`, color: '#fff' }}
              >
                გაგზავნა
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-50 px-4 py-2.5 rounded-full text-sm font-medium flex items-center gap-2"
          style={{
            backgroundColor: palette.surfaceRaised,
            border: `1px solid ${palette.gold}`,
            color: palette.gold,
            animation: 'lunara-toast 0.2s ease-out',
          }}
        >
          <Check className="w-4 h-4" />
          {toast.text}
        </div>
      )}
    </div>
  );
}