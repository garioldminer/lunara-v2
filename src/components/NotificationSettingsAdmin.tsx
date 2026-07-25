import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import { Bell, Moon, Sun, RefreshCw, Send, Sparkles, X, Check, Loader2 } from 'lucide-react';

const palette = {
  bgTop: '#120c07',
  bgBottom: '#050301',
  surface: '#171009',
  surfaceRaised: '#1e1509',
  border: '#2c2213',
  borderSubtle: '#231a0f',
  gold: '#C5A059',
  goldDeep: '#8B6914',
  ink: '#F3ECDD',
  inkMuted: '#9C9280',
  purple: '#A78BDA',
  danger: '#C1443F',
  dangerDeep: '#3A1414',
  dangerBorder: '#4A1D1D',
  success: '#7FAE7A',
  successBg: '#152016',
};

const css = `
.nsa-root {
  box-sizing: border-box;
  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  padding-bottom: 110px;
  background: linear-gradient(to bottom, ${palette.bgTop}, ${palette.bgBottom});
  color: ${palette.ink};
  font-family: 'Noto Sans Georgian', system-ui, sans-serif;
}
.nsa-root * { box-sizing: border-box; }

.nsa-header {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(9,6,3,0.92);
  border-bottom: 1px solid ${palette.border};
  backdrop-filter: blur(8px);
}
.nsa-header-left { display: flex; align-items: center; gap: 12px; }
.nsa-logo {
  width: 40px; height: 40px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, ${palette.gold}, ${palette.goldDeep});
  flex-shrink: 0;
}
.nsa-title {
  font-family: 'Noto Serif Georgian', serif;
  font-size: 17px; font-weight: 700; color: ${palette.gold};
  margin: 0; line-height: 1.3;
}
.nsa-subtitle { font-size: 12px; color: ${palette.inkMuted}; margin: 2px 0 0; }
.nsa-refresh-btn {
  width: 38px; height: 38px; border-radius: 12px;
  background: ${palette.surface}; border: 1px solid ${palette.border};
  color: ${palette.gold}; display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
}
.nsa-refresh-btn:active { transform: scale(0.95); }
.nsa-spin { animation: nsa-spin 1s linear infinite; }
@keyframes nsa-spin { to { transform: rotate(360deg); } }

.nsa-content { padding: 16px; max-width: 480px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

.nsa-card { border-radius: 16px; overflow: hidden; background: ${palette.surface}; border: 1px solid ${palette.border}; }
.nsa-card-danger { border-color: ${palette.dangerBorder}; }
.nsa-card-header { padding: 14px 16px; border-bottom: 1px solid ${palette.border}; display: flex; align-items: center; gap: 8px; }
.nsa-card-header-danger { border-bottom-color: ${palette.dangerBorder}; background: rgba(58,20,20,0.35); justify-content: space-between; }
.nsa-card-title { font-size: 15px; font-weight: 600; margin: 0; display: flex; align-items: center; gap: 8px; }
.nsa-card-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; }

.nsa-badge { font-size: 11px; padding: 4px 10px; border-radius: 999px; background: ${palette.dangerDeep}; color: ${palette.danger}; white-space: nowrap; }

.nsa-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; gap: 12px; }
.nsa-row-left { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; }
.nsa-row-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: rgba(197,160,89,0.1); }
.nsa-row-icon-purple { background: rgba(167,139,218,0.1); }
.nsa-row-text { min-width: 0; }
.nsa-row-title { font-size: 14px; font-weight: 500; }
.nsa-row-sub { font-size: 12px; color: ${palette.inkMuted}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.nsa-toggle {
  width: 48px; height: 28px; border-radius: 999px; position: relative;
  border: none; cursor: pointer; flex-shrink: 0; padding: 0;
  background: #3a3226; transition: background 0.2s;
}
.nsa-toggle-knob {
  position: absolute; top: 4px; left: 4px; width: 20px; height: 20px;
  border-radius: 999px; background: #fff; transition: left 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.4);
}

.nsa-time-wrap { padding-left: 52px; padding-bottom: 4px; }
.nsa-time-box { border-radius: 12px; padding: 12px; background: ${palette.bgTop}; border: 1px solid ${palette.border}; }
.nsa-time-label { font-size: 12px; color: ${palette.inkMuted}; display: block; margin-bottom: 8px; }
.nsa-time-input {
  width: 100%; border-radius: 8px; padding: 8px 12px; font-size: 14px;
  background: ${palette.surfaceRaised}; border: 1px solid ${palette.border};
  color: ${palette.gold}; color-scheme: dark;
}

.nsa-divider { display: flex; align-items: center; gap: 12px; padding: 4px 0; }
.nsa-divider-line { height: 1px; flex: 1; background: ${palette.border}; }

.nsa-save-btn {
  width: 100%; padding: 13px; font-weight: 700; border-radius: 12px; margin-top: 10px;
  border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  font-size: 14px;
  background: linear-gradient(135deg, ${palette.gold}, ${palette.goldDeep});
  color: ${palette.bgBottom};
}
.nsa-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.nsa-save-btn-saved { background: ${palette.successBg}; color: ${palette.success}; border: 1px solid ${palette.success}; }
.nsa-save-btn:active:not(:disabled) { transform: scale(0.98); }

.nsa-warning-box { border-radius: 12px; padding: 12px; display: flex; gap: 10px; background: ${palette.dangerDeep}; border: 1px solid ${palette.dangerBorder}; margin-bottom: 14px; }
.nsa-warning-text { font-size: 12px; line-height: 1.5; color: #DDB2B0; margin: 0; }

.nsa-field-label-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.nsa-field-label { font-size: 12px; color: ${palette.inkMuted}; }
.nsa-char-count { font-size: 12px; font-weight: 500; }

.nsa-textarea {
  width: 100%; border-radius: 12px; padding: 12px; font-size: 14px; resize: none;
  background: ${palette.bgTop}; border: 1px solid ${palette.border}; color: ${palette.ink};
  font-family: inherit; line-height: 1.5;
}
.nsa-char-bar { height: 4px; border-radius: 999px; margin-top: 8px; overflow: hidden; background: ${palette.borderSubtle}; }
.nsa-char-bar-fill { height: 100%; transition: width 0.2s; }

.nsa-preview-label { font-size: 12px; color: ${palette.inkMuted}; margin-bottom: 8px; }
.nsa-preview-box { border-radius: 12px; padding: 12px; display: flex; gap: 10px; background: ${palette.surfaceRaised}; border: 1px solid ${palette.border}; }
.nsa-preview-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: linear-gradient(135deg, ${palette.gold}, ${palette.goldDeep}); }
.nsa-preview-name { font-size: 12px; font-weight: 600; }
.nsa-preview-text { font-size: 12px; color: ${palette.inkMuted}; margin-top: 2px; word-break: break-word; white-space: pre-wrap; }

.nsa-send-btn {
  width: 100%; padding: 13px; font-weight: 700; border-radius: 12px; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; color: #fff;
  background: linear-gradient(135deg, #A83A36, ${palette.dangerDeep});
}
.nsa-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.nsa-send-btn:active:not(:disabled) { transform: scale(0.98); }

.nsa-result-box { border-radius: 12px; padding: 14px; border: 1px solid; }
.nsa-result-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.nsa-result-title { font-weight: 700; font-size: 14px; }
.nsa-result-text { font-size: 13px; color: ${palette.inkMuted}; }
.nsa-result-details { font-size: 12px; padding-top: 8px; margin-top: 8px; border-top: 1px solid ${palette.border}; display: flex; flex-direction: column; gap: 2px; }

.nsa-overlay {
  position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center;
  padding: 16px; background: rgba(5,3,1,0.7); backdrop-filter: blur(2px);
}
.nsa-modal { width: 100%; max-width: 380px; border-radius: 16px; padding: 20px; background: ${palette.surface}; border: 1px solid ${palette.dangerBorder}; }
.nsa-modal-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.nsa-modal-title { font-family: 'Noto Serif Georgian', serif; font-weight: 700; font-size: 16px; margin: 0; }
.nsa-modal-text { font-size: 12px; color: ${palette.inkMuted}; margin: 0 0 16px; line-height: 1.5; }
.nsa-modal-input {
  width: 100%; border-radius: 8px; padding: 10px 12px; font-size: 14px; margin-bottom: 16px;
  background: ${palette.bgTop}; border: 1px solid ${palette.border}; color: ${palette.ink};
}
.nsa-modal-actions { display: flex; gap: 8px; }
.nsa-modal-cancel, .nsa-modal-confirm {
  flex: 1; padding: 11px; border-radius: 12px; font-size: 14px; font-weight: 600; border: none; cursor: pointer;
}
.nsa-modal-cancel { background: ${palette.surfaceRaised}; border: 1px solid ${palette.border}; color: ${palette.inkMuted}; }
.nsa-modal-confirm { background: linear-gradient(135deg, #A83A36, ${palette.dangerDeep}); color: #fff; }
.nsa-modal-confirm:disabled { opacity: 0.4; cursor: not-allowed; }

.nsa-toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 60;
  padding: 10px 18px; border-radius: 999px; font-size: 14px; font-weight: 500;
  display: flex; align-items: center; gap: 8px;
  background: ${palette.surfaceRaised}; border: 1px solid ${palette.gold}; color: ${palette.gold};
}

@media (prefers-reduced-motion: reduce) {
  .nsa-root * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
}
`;

interface NotificationSettings {
  id: string;
  daily_horoscope_enabled: boolean;
  moon_phase_enabled: boolean;
  daily_horoscope_time: string;
}

const CONFIRM_PHRASE = 'გაგზავნა';
const MESSAGE_LIMIT = 500;

function Toggle({ checked, onChange, activeColor }: { checked: boolean; onChange: () => void; activeColor: string }) {
  return (
    <button className="nsa-toggle" onClick={onChange} aria-pressed={checked} style={{ background: checked ? activeColor : undefined }}>
      <div className="nsa-toggle-knob" style={{ left: checked ? '24px' : '4px' }} />
    </button>
  );
}

export default function NotificationSettingsAdmin() {
  const { user } = useUser();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [toast, setToast] = useState<{ text: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    load();
  }, []);

  const showToast = (text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ text });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase.from('notification_settings').select('*').single();
    if (data) setSettings(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!supabase || !settings) return;
    setSaving(true);
    const { error } = await supabase.from('notification_settings').update(settings).eq('id', settings.id);
    setSaving(false);
    if (!error) {
      setSaved(true);
      showToast('პარამეტრები შენახულია');
      setTimeout(() => setSaved(false), 2000);
    } else {
      showToast('შეცდომა შენახვისას');
    }
  };

  const openConfirm = () => {
    if (!message.trim()) return;
    setConfirmInput('');
    setConfirmOpen(true);
  };

  const handleBroadcast = async () => {
    if (!user) {
      showToast('სისტემაში შესვლა აუცილებელია');
      return;
    }
    
    setConfirmOpen(false);
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('https://eutavdhcxpfhpfsyaskb.supabase.co/functions/v1/send-broadcast-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': (supabase as any).supabaseKey },
        body: JSON.stringify({ admin_user_id: user.id, message: message.trim(), target_audience: 'all' }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        setMessage('');
        showToast('შეტყობინება წარმატებით გაიგზავნა');
      }
    } catch (e: any) {
      setResult({ success: false, error: e.message });
      showToast('ვერ გაიგზავნა');
    }
    setSending(false);
  };

  const charCount = message.length;
  const charPct = Math.min(100, (charCount / MESSAGE_LIMIT) * 100);
  const charTone = charCount > MESSAGE_LIMIT ? palette.danger : charCount > MESSAGE_LIMIT * 0.85 ? palette.gold : palette.inkMuted;
  const overLimit = charCount > MESSAGE_LIMIT;

  return (
    <div className="nsa-root">
      <style>{css}</style>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Georgian:wght@500;700&family=Noto+Sans+Georgian:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div className="nsa-header">
        <div className="nsa-header-left">
          <div className="nsa-logo"><Bell size={18} color={palette.bgBottom} /></div>
          <div>
            <h1 className="nsa-title">შეტყობინებები</h1>
            <p className="nsa-subtitle">მართვა და მასობრივი გაგზავნა</p>
          </div>
        </div>
        <button className="nsa-refresh-btn" onClick={load} aria-label="განახლება">
          <RefreshCw size={18} className={loading ? 'nsa-spin' : ''} />
        </button>
      </div>

      <div className="nsa-content">
        <div className="nsa-card">
          <div className="nsa-card-header">
            <h2 className="nsa-card-title"><Sun size={16} color={palette.gold} /> ავტომატური შეტყობინებები</h2>
          </div>

          {loading ? (
            <div className="nsa-card-body">
              <div style={{ height: 48, borderRadius: 12, background: palette.borderSubtle }} />
            </div>
          ) : settings && (
            <div className="nsa-card-body">
              <div className="nsa-row">
                <div className="nsa-row-left">
                  <div className="nsa-row-icon"><Sun size={20} color={palette.gold} /></div>
                  <div className="nsa-row-text">
                    <div className="nsa-row-title">ყოველდღიური ჰოროსკოპი</div>
                    <div className="nsa-row-sub">იგზავნება ავტომატურად, ყოველდღე</div>
                  </div>
                </div>
                <Toggle checked={settings.daily_horoscope_enabled} activeColor={palette.gold} onChange={() => setSettings({ ...settings, daily_horoscope_enabled: !settings.daily_horoscope_enabled })} />
              </div>

              {settings.daily_horoscope_enabled && (
                <div className="nsa-time-wrap">
                  <div className="nsa-time-box">
                    <label className="nsa-time-label">გაგზავნის დრო</label>
                    <input
                      type="time"
                      value={settings.daily_horoscope_time}
                      onChange={(e) => setSettings({ ...settings, daily_horoscope_time: e.target.value })}
                      className="nsa-time-input"
                    />
                  </div>
                </div>
              )}

              <div className="nsa-divider"><div className="nsa-divider-line" /></div>

              <div className="nsa-row">
                <div className="nsa-row-left">
                  <div className="nsa-row-icon nsa-row-icon-purple"><Moon size={20} color={palette.purple} /></div>
                  <div className="nsa-row-text">
                    <div className="nsa-row-title">მთვარის ფაზები</div>
                    <div className="nsa-row-sub">იგზავნება ფაზის შეცვლისას</div>
                  </div>
                </div>
                <Toggle checked={settings.moon_phase_enabled} activeColor={palette.purple} onChange={() => setSettings({ ...settings, moon_phase_enabled: !settings.moon_phase_enabled })} />
              </div>

              <button className={`nsa-save-btn ${saved ? 'nsa-save-btn-saved' : ''}`} onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={16} className="nsa-spin" /> : saved ? (<><Check size={16} /> შენახულია</>) : 'ცვლილებების შენახვა'}
              </button>
            </div>
          )}
        </div>

        <div className="nsa-card nsa-card-danger">
          <div className="nsa-card-header nsa-card-header-danger">
            <h2 className="nsa-card-title" style={{ color: palette.danger }}><Send size={16} /> მასობრივი გაგზავნა</h2>
            <span className="nsa-badge">ყველა მომხმარებელი</span>
          </div>

          <div className="nsa-card-body">
            <div className="nsa-warning-box">
              <Sparkles size={16} color={palette.danger} style={{ flexShrink: 0, marginTop: 2 }} />
              <p className="nsa-warning-text">გაეგზავნება <strong>ყველა</strong> მომხმარებელს, მათი პერსონალური პარამეტრების მიუხედავად. ეს ქმედება ვერ გაუქმდება გაგზავნის შემდეგ.</p>
            </div>

            <div>
              <div className="nsa-field-label-row">
                <label className="nsa-field-label">შეტყობინების ტექსტი</label>
                <span className="nsa-char-count" style={{ color: charTone }}>{charCount} / {MESSAGE_LIMIT}</span>
              </div>
              <textarea
                className="nsa-textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="მაგ. გილოცავთ ახალ განახლებას — ახალი ტაროს დაფა უკვე ხელმისაწვდომია"
                rows={4}
                style={{ borderColor: overLimit ? palette.danger : palette.border }}
              />
              <div className="nsa-char-bar"><div className="nsa-char-bar-fill" style={{ width: `${charPct}%`, background: charTone }} /></div>
            </div>

            {message.trim() && (
              <div>
                <div className="nsa-preview-label">გამოიყურება ასე</div>
                <div className="nsa-preview-box">
                  <div className="nsa-preview-icon"><Moon size={16} color={palette.bgBottom} /></div>
                  <div>
                    <div className="nsa-preview-name">LUNARA</div>
                    <div className="nsa-preview-text">{message.trim().slice(0, MESSAGE_LIMIT)}</div>
                  </div>
                </div>
              </div>
            )}

            <button className="nsa-send-btn" onClick={openConfirm} disabled={sending || !message.trim() || overLimit}>
              {sending ? (<><Loader2 size={16} className="nsa-spin" /> იგზავნება...</>) : (<><Send size={16} /> გაგზავნა ყველას</>)}
            </button>

            {result && (
              <div className="nsa-result-box" style={{ background: result.success ? palette.successBg : palette.dangerDeep, borderColor: result.success ? palette.success : palette.dangerBorder }}>
                <div className="nsa-result-head">
                  {result.success ? <Check size={16} color={palette.success} /> : <X size={16} color={palette.danger} />}
                  <div className="nsa-result-title" style={{ color: result.success ? palette.success : palette.danger }}>{result.success ? 'გაგზავნილია' : 'ვერ გაიგზავნა'}</div>
                </div>
                <div className="nsa-result-text">{result.message || result.error}</div>
                {result.details && (
                  <div className="nsa-result-details">
                    <div style={{ color: palette.success }}>წარმატებული: {result.details.successCount?.toLocaleString?.() ?? result.details.successCount}</div>
                    {result.details.failCount > 0 && <div style={{ color: palette.danger }}>ვერ მოხერხდა: {result.details.failCount}</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmOpen && (
        <div className="nsa-overlay" onClick={() => setConfirmOpen(false)}>
          <div className="nsa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nsa-modal-title-row">
              <Send size={16} color={palette.danger} />
              <h3 className="nsa-modal-title">დაადასტურე გაგზავნა</h3>
            </div>
            <p className="nsa-modal-text">
              შეტყობინება მიიღებს <strong style={{ color: palette.ink }}>ყველა</strong> მომხმარებელი. დასადასტურებლად ჩაწერე{' '}
              <span style={{ color: palette.gold }}>„{CONFIRM_PHRASE}“</span>.
            </p>
            <input autoFocus className="nsa-modal-input" value={confirmInput} onChange={(e) => setConfirmInput(e.target.value)} placeholder={CONFIRM_PHRASE} />
            <div className="nsa-modal-actions">
              <button className="nsa-modal-cancel" onClick={() => setConfirmOpen(false)}>გაუქმება</button>
              <button className="nsa-modal-confirm" onClick={handleBroadcast} disabled={confirmInput.trim() !== CONFIRM_PHRASE}>გაგზავნა</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="nsa-toast"><Check size={16} /> {toast.text}</div>
      )}
    </div>
  );
}