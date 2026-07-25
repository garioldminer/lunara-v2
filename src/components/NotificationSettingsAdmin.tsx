import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import { Bell, Moon, Sun, RefreshCw, Send } from 'lucide-react';

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

  if (loading) return <div className="p-8 text-center text-[#C5A059]">იტვირთება...</div>;
  if (!settings) return <div className="p-8 text-center text-red-400">ვერ მოიძებნა</div>;

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#332a1a] pb-4">
        <h2 className="text-xl font-bold text-[#C5A059] flex items-center gap-2">
          <Bell size={24} /> შეტყობინებები
        </h2>
        <button onClick={loadSettings} className="p-2 rounded bg-[#1a1510] text-[#C5A059]">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Global Settings */}
      <div className="bg-[#1a1510] rounded-xl p-4 space-y-4 border border-[#332a1a]">
        <h3 className="text-lg font-semibold text-gray-100">გლობალური პარამეტრები</h3>
        
        <div className="flex items-center justify-between p-3 bg-[#0f0c08] rounded-lg">
          <div className="flex items-center gap-3">
            <Sun size={20} className="text-[#C5A059]" />
            <div>
              <div className="text-sm font-medium text-gray-100">ყოველდღიური ჰოროსკოპი</div>
              <div className="text-xs text-gray-400">ავტომატური გაგზავნა</div>
            </div>
          </div>
          <button 
            onClick={() => setSettings({...settings, daily_horoscope_enabled: !settings.daily_horoscope_enabled})}
            className={`w-12 h-6 rounded-full transition-colors ${settings.daily_horoscope_enabled ? 'bg-[#C5A059]' : 'bg-gray-600'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.daily_horoscope_enabled ? 'translate-x-7' : 'translate-x-1'} mt-1`} />
          </button>
        </div>

        {settings.daily_horoscope_enabled && (
          <div className="ml-11 p-3 bg-[#0f0c08] rounded-lg border border-[#332a1a]">
            <label className="text-xs text-gray-400 block mb-1">დრო:</label>
            <input 
              type="time" 
              value={settings.daily_horoscope_time}
              onChange={(e) => setSettings({...settings, daily_horoscope_time: e.target.value})}
              className="bg-[#1a1510] border border-[#332a1a] rounded px-3 py-1.5 text-sm text-[#C5A059]"
            />
          </div>
        )}

        <div className="flex items-center justify-between p-3 bg-[#0f0c08] rounded-lg">
          <div className="flex items-center gap-3">
            <Moon size={20} className="text-purple-400" />
            <div>
              <div className="text-sm font-medium text-gray-100">მთვარის ფაზები</div>
              <div className="text-xs text-gray-400">ფაზის შეცვლისას</div>
            </div>
          </div>
          <button 
            onClick={() => setSettings({...settings, moon_phase_enabled: !settings.moon_phase_enabled})}
            className={`w-12 h-6 rounded-full transition-colors ${settings.moon_phase_enabled ? 'bg-purple-500' : 'bg-gray-600'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.moon_phase_enabled ? 'translate-x-7' : 'translate-x-1'} mt-1`} />
          </button>
        </div>

        <button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full py-2 bg-gradient-to-r from-[#C5A059] to-[#8B6914] text-[#0f0c08] font-bold rounded-lg mt-4"
        >
          {saving ? 'ინახება...' : 'შენახვა'}
        </button>
      </div>

      {/* Broadcast Section */}
      <div className="bg-[#1a1510] rounded-xl p-4 border border-red-900/50">
        <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2 mb-3">
          <Send size={20} /> მასობრივი გაგზავნა
        </h3>
        
        <div className="bg-red-950/30 border border-red-800 rounded p-3 mb-4">
          <p className="text-xs text-red-300">
            ⚠️ გაგზავნა ყველა მომხმარებელს (იგნორირებს მათ პარამეტრებს)
          </p>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="შეტყობინების ტექსტი..."
          rows={3}
          className="w-full bg-[#0f0c08] border border-[#332a1a] rounded-lg p-3 text-sm text-gray-100 mb-3"
        />

        <button
          onClick={handleBroadcast}
          disabled={sending || !message.trim()}
          className="w-full py-3 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold rounded-lg disabled:opacity-50"
        >
          {sending ? 'იგზავნება...' : 'გაგზავნა ყველას'}
        </button>

        {result && (
          <div className={`mt-3 p-3 rounded text-sm ${result.success ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
            <div className="font-bold mb-1">{result.success ? '✅ წარმატება' : '❌ შეცდომა'}</div>
            <div>{result.message || result.error}</div>
            {result.details && (
              <div className="mt-2 text-xs">
                <div>წარმატებული: {result.details.successCount}</div>
                {result.details.failCount > 0 && <div>ვერ მოხერხდა: {result.details.failCount}</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}