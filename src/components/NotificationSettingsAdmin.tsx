import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, Moon, Sun, Target, Megaphone, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface NotificationSettings {
  id: string;
  daily_horoscope_enabled: boolean;
  moon_phase_enabled: boolean;
  quest_reminders_enabled: boolean;
  system_announcements_enabled: boolean;
  daily_horoscope_time: string;
}

export default function NotificationSettingsAdmin() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // მონაცემების ჩატვირთვა
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!supabase) return; // 🆕 დამატებულია null შემოწმება
    
    setLoading(true);
    setStatus({ type: null, message: '' });
    
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .single();

    if (error) {
      console.error('Error loading settings:', error);
      setStatus({ type: 'error', message: 'მონაცემების ჩატვირთვა ვერ მოხერხდა.' });
    } else {
      setSettings(data);
    }
    setLoading(false);
  };

  const handleToggle = (key: keyof NotificationSettings) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [key]: !settings[key]
    });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!settings) return;
    setSettings({
      ...settings,
      daily_horoscope_time: e.target.value
    });
  };

  const handleSave = async () => {
    if (!supabase || !settings) return; // 🆕 დამატებულია null შემოწმება
    
    setSaving(true);
    setStatus({ type: null, message: '' });

    const { error } = await supabase
      .from('notification_settings')
      .update({
        daily_horoscope_enabled: settings.daily_horoscope_enabled,
        moon_phase_enabled: settings.moon_phase_enabled,
        quest_reminders_enabled: settings.quest_reminders_enabled,
        system_announcements_enabled: settings.system_announcements_enabled,
        daily_horoscope_time: settings.daily_horoscope_time,
        updated_by: (await supabase.auth.getUser()).data.user?.id || null
      })
      .eq('id', settings.id);

    if (error) {
      console.error('Error saving settings:', error);
      setStatus({ type: 'error', message: 'შენახვა ვერ მოხერხდა: ' + error.message });
    } else {
      setStatus({ type: 'success', message: 'პარამეტრები წარმატებით შეინახა!' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-[#C5A059]">
        <RefreshCw className="animate-spin mr-2" size={20} />
        პარამეტრების ჩატვირთვა...
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8 text-center text-red-400">
        <AlertCircle className="mx-auto mb-2" size={32} />
        პარამეტრები ვერ მოიძებნა.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#C5A059] flex items-center gap-2">
          <Bell size={24} />
          შეტყობინებების მართვა
        </h2>
        <button 
          onClick={loadSettings}
          className="p-2 rounded-lg bg-[#1a1510] border border-[#332a1a] text-[#C5A059] hover:bg-[#2a2215] transition-colors"
          title="განახლება"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {status.message && (
        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
          status.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'
        }`}>
          {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {status.message}
        </div>
      )}

      <div className="bg-[#1a1510] border border-[#332a1a] rounded-xl p-5 space-y-6">
        {/* Daily Horoscope */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C5A059]/10 rounded-lg text-[#C5A059]">
              <Sun size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-100">ყოველდღიური ჰოროსკოპი</h3>
              <p className="text-xs text-gray-400">ავტომატური შეტყობინება ყოველ დილით</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('daily_horoscope_enabled')}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.daily_horoscope_enabled ? 'bg-[#C5A059]' : 'bg-gray-600'
            }`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              settings.daily_horoscope_enabled ? 'left-7' : 'left-1'
            }`} />
          </button>
        </div>

        {settings.daily_horoscope_enabled && (
          <div className="ml-11 p-3 bg-[#0f0c08] rounded-lg border border-[#332a1a]">
            <label className="text-xs text-gray-400 block mb-1">გაგზავნის დრო:</label>
            <input
              type="time"
              value={settings.daily_horoscope_time}
              onChange={handleTimeChange}
              className="bg-[#1a1510] border border-[#332a1a] rounded px-3 py-1.5 text-sm text-[#C5A059] focus:outline-none focus:border-[#C5A059]"
            />
          </div>
        )}

        <div className="border-t border-[#332a1a]" />

        {/* Moon Phase */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <Moon size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-100">მთვარის ფაზები</h3>
              <p className="text-xs text-gray-400">შეტყობინება მთვარის ფაზის შეცვლისას</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('moon_phase_enabled')}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.moon_phase_enabled ? 'bg-purple-500' : 'bg-gray-600'
            }`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              settings.moon_phase_enabled ? 'left-7' : 'left-1'
            }`} />
          </button>
        </div>

        <div className="border-t border-[#332a1a]" />

        {/* Quest Reminders */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
              <Target size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-100">დავალებების შეხსენება</h3>
              <p className="text-xs text-gray-400">შეხსენება დაუსრულებელი დავალებების შესახებ</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('quest_reminders_enabled')}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.quest_reminders_enabled ? 'bg-green-500' : 'bg-gray-600'
            }`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              settings.quest_reminders_enabled ? 'left-7' : 'left-1'
            }`} />
          </button>
        </div>

        <div className="border-t border-[#332a1a]" />

        {/* System Announcements */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Megaphone size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-100">სისტემური განცხადებები</h3>
              <p className="text-xs text-gray-400">მნიშვნელოვანი სიახლეები და განახლებები</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('system_announcements_enabled')}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.system_announcements_enabled ? 'bg-blue-500' : 'bg-gray-600'
            }`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              settings.system_announcements_enabled ? 'left-7' : 'left-1'
            }`} />
          </button>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-gradient-to-r from-[#C5A059] to-[#8B6914] text-[#0f0c08] font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? (
          <>
            <RefreshCw className="animate-spin" size={20} />
            ინახება...
          </>
        ) : (
          <>
            <Save size={20} />
            ცვლილებების შენახვა.
          </>
        )}
      </button>
    </div>
  );
}