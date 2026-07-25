import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import { Bell, Moon, Sun, RefreshCw, Send, AlertTriangle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface NotificationSettings {
  id: string;
  daily_horoscope_enabled: boolean;
  moon_phase_enabled: boolean;
  daily_horoscope_time: string;
}

export default function NotificationSettingsAdmin() {
  const { user } = useUser();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase.from('notification_settings').select('*').single();
    if (data) setSettings(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!supabase || !settings) return;
    setSaving(true);
    await supabase.from('notification_settings').update(settings).eq('id', settings.id);
    setSaving(false);
  };

  const handleBroadcast = async () => {
    if (!user || !message.trim()) return;
    if (!confirm(`გაგზავნა ყველა მომხმარებელს?\n\n"${message.substring(0, 50)}..."`)) return;

    setSending(true);
    try {
      const res = await fetch('https://eutavdhcxpfhpfsyaskb.supabase.co/functions/v1/send-broadcast-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': (supabase as any).supabaseKey },
        body: JSON.stringify({
          admin_user_id: user.id,
          message: message.trim(),
          target_audience: 'all'
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setResult({ success: false, error: e.message });
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0600] to-[#1a1510] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#C5A059] animate-spin mx-auto mb-3" />
          <p className="text-[#C5A059] text-sm">იტვირთება...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0600] to-[#1a1510] flex items-center justify-center">
        <div className="text-center text-red-400">
          <div className="rounded-full w-12 h-12 bg-red-900/20 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p>ვერ მოიძებნა</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0600] to-[#1a1510] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0600]/95 backdrop-blur-md border-b border-[#332a1a] px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#C5A059] to-[#8B6914] rounded-xl flex items-center justify-center shadow-lg shadow-[#C5A059]/20">
              <Bell className="w-5 h-5 text-[#0a0600]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#C5A059]">შეტყობინებები</h1>
              <p className="text-xs text-gray-400">მართე და გაგზავნე</p>
            </div>
          </div>
          <button 
            onClick={loadSettings} 
            className="p-2 rounded-xl bg-[#1a1510] border border-[#332a1a] text-[#C5A059] active:scale-95 transition-transform"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Global Settings Card */}
        <div className="bg-[#1a1510] rounded-2xl border border-[#332a1a] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#332a1a] bg-[#1f1912]">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Sun className="w-5 h-5 text-[#C5A059]" />
              გლობალური პარამეტრები
            </h2>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Daily Horoscope Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-[#C5A059]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sun className="w-5 h-5 text-[#C5A059]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">ყოველდღიური ჰოროსკოპი</div>
                  <div className="text-xs text-gray-400 truncate">ავტომატური გაგზავნა</div>
                </div>
              </div>
              <button 
                onClick={() => setSettings({...settings, daily_horoscope_enabled: !settings.daily_horoscope_enabled})}
                className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${settings.daily_horoscope_enabled ? 'bg-[#C5A059]' : 'bg-gray-600'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${settings.daily_horoscope_enabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            {settings.daily_horoscope_enabled && (
              <div className="ml-14 pl-2">
                <div className="bg-[#0f0c08] rounded-xl p-3 border border-[#332a1a]">
                  <label className="text-xs text-gray-400 block mb-2">გაგზავნის დრო:</label>
                  <input 
                    type="time" 
                    value={settings.daily_horoscope_time}
                    onChange={(e) => setSettings({...settings, daily_horoscope_time: e.target.value})}
                    className="w-full bg-[#1a1510] border border-[#332a1a] rounded-lg px-3 py-2 text-sm text-[#C5A059] focus:outline-none focus:border-[#C5A059] transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Moon Phase Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-[#332a1a]">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Moon className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">მთვარის ფაზები</div>
                  <div className="text-xs text-gray-400 truncate">ფაზის შეცვლისას</div>
                </div>
              </div>
              <button 
                onClick={() => setSettings({...settings, moon_phase_enabled: !settings.moon_phase_enabled})}
                className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${settings.moon_phase_enabled ? 'bg-purple-500' : 'bg-gray-600'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${settings.moon_phase_enabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            <button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full py-3 bg-gradient-to-r from-[#C5A059] to-[#8B6914] text-[#0a0600] font-bold rounded-xl mt-4 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-5 h-5 animate-spin" />}
              {saving ? 'ინახება...' : 'შენახვა'}
            </button>
          </div>
        </div>

        {/* Broadcast Card */}
        <div className="bg-[#1a1510] rounded-2xl border border-red-900/30 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-red-900/30 bg-red-950/20">
            <h2 className="text-base font-semibold text-red-400 flex items-center gap-2">
              <Send className="w-5 h-5" />
              მასობრივი გაგზავნა
            </h2>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Warning */}
            <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-3 flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300 leading-relaxed">
                შეტყობინება გაიგზავნება <strong>ყველა</strong> მომხმარებელთან. იგნორირება უკეთებს მათ პირად პარამეტრებს.
              </p>
            </div>

            {/* Message Input */}
            <div>
              <label className="text-xs text-gray-400 block mb-2">შეტყობინების ტექსტი:</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="მაგალითად: გილოცავთ ახალ განახლებას!..."
                rows={4}
                className="w-full bg-[#0f0c08] border border-[#332a1a] rounded-xl p-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-red-500/50 resize-none transition-colors"
              />
              <div className="text-xs text-gray-500 mt-1 text-right">{message.length} სიმბოლო</div>
            </div>

            {/* Send Button */}
            <button
              onClick={handleBroadcast}
              disabled={sending || !message.trim()}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  იგზავნება...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  გაგზავნა ყველას
                </>
              )}
            </button>

            {/* Result */}
            {result && (
              <div className={`rounded-xl p-4 border ${result.success ? 'bg-green-950/30 border-green-800/50' : 'bg-red-950/30 border-red-800/50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <div className={`font-bold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                    {result.success ? '✅ წარმატება' : '❌ შეცდომა'}
                  </div>
                </div>
                <div className="text-sm text-gray-300 mb-2">{result.message || result.error}</div>
                {result.details && (
                  <div className="text-xs space-y-1 pt-2 border-t border-gray-700">
                    <div className="text-green-400">✓ წარმატებული: {result.details.successCount}</div>
                    {result.details.failCount > 0 && (
                      <div className="text-red-400">✗ ვერ მოხერხდა: {result.details.failCount}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}