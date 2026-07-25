import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';
import { Bell, Moon, Sun, Target, Megaphone, Save, RefreshCw, CheckCircle, AlertCircle, Send, Image as ImageIcon, Plus, Trash2, Eye } from 'lucide-react';

interface NotificationSettings {
  id: string;
  daily_horoscope_enabled: boolean;
  moon_phase_enabled: boolean;
  quest_reminders_enabled: boolean;
  system_announcements_enabled: boolean;
  daily_horoscope_time: string;
}

interface BroadcastButton {
  text: string;
  url: string;
}

export default function NotificationSettingsAdmin() {
  const { user } = useUser();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // Broadcast სტეიტები
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastImageUrl, setBroadcastImageUrl] = useState('');
  const [broadcastButtons, setBroadcastButtons] = useState<BroadcastButton[]>([{ text: '', url: '' }]);
  const [targetAudience, setTargetAudience] = useState<'all' | 'active' | 'premium' | 'free'>('all');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!supabase) return;
    setLoading(true);
    setStatus({ type: null, message: '' });
    
    const { data, error } = await supabase.from('notification_settings').select('*').single();
    if (error) {
      setStatus({ type: 'error', message: 'მონაცემების ჩატვირთვა ვერ მოხერხდა.' });
    } else {
      setSettings(data);
    }
    setLoading(false);
  };

  const handleToggle = (key: keyof NotificationSettings) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!settings) return;
    setSettings({ ...settings, daily_horoscope_time: e.target.value });
  };

  const handleSave = async () => {
    if (!supabase || !settings) return;
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
        updated_by: user?.id || null
      })
      .eq('id', settings.id);

    if (error) {
      setStatus({ type: 'error', message: 'შენახვა ვერ მოხერხდა: ' + error.message });
    } else {
      setStatus({ type: 'success', message: 'პარამეტრები წარმატებით შეინახა!' });
    }
    setSaving(false);
  };

  const handleAddButton = () => {
    setBroadcastButtons([...broadcastButtons, { text: '', url: '' }]);
  };

  const handleRemoveButton = (index: number) => {
    const newButtons = [...broadcastButtons];
    newButtons.splice(index, 1);
    setBroadcastButtons(newButtons);
  };

  const handleButtonChange = (index: number, field: 'text' | 'url', value: string) => {
    const newButtons = [...broadcastButtons];
    newButtons[index][field] = value;
    setBroadcastButtons(newButtons);
  };

  const handleSendBroadcast = async () => {
    if (!user || !broadcastMessage.trim()) {
      setStatus({ type: 'error', message: 'შეტყობინების ტექსტი ცარიელია!' });
      return;
    }

    const cleanButtons = broadcastButtons.filter(b => b.text.trim() && b.url.trim());
    
    const confirmMsg = `დარწმუნებული ხარ, რომ გინდა ეს შეტყობინება გაუგზავნო "${targetAudience === 'all' ? 'ყველა' : targetAudience}" აუდიტორიას?\n\nტექსტი: "${broadcastMessage.substring(0, 50)}..."`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setIsSendingBroadcast(true);
    setBroadcastResult(null);

    try {
      const response = await fetch('https://eutavdhcxpfhpfsyaskb.supabase.co/functions/v1/send-broadcast-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': (supabase as any).supabaseKey
        },
        body: JSON.stringify({
          admin_user_id: user.id,
          message: broadcastMessage.trim(),
          image_url: broadcastImageUrl.trim() || undefined,
          buttons: cleanButtons.length > 0 ? cleanButtons : undefined,
          target_audience: targetAudience
        })
      });

      const result = await response.json();

      if (result.success) {
        setBroadcastResult(result);
        setStatus({ type: 'success', message: result.message });
      } else {
        setStatus({ type: 'error', message: result.error || 'გაგზავნა ვერ მოხერხდა' });
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: 'ქსელური შეცდომა: ' + error.message });
    } finally {
      setIsSendingBroadcast(false);
    }
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
        <button onClick={loadSettings} className="p-2 rounded-lg bg-[#1a1510] border border-[#332a1a] text-[#C5A059] hover:bg-[#2a2215] transition-colors" title="განახლება">
          <RefreshCw size={18} />
        </button>
      </div>

      {status.message && (
        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${status.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
          {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {status.message}
        </div>
      )}

      {/* 1. გლობალური პარამეტრები */}
      <div className="bg-[#1a1510] border border-[#332a1a] rounded-xl p-5 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C5A059]/10 rounded-lg text-[#C5A059]"><Sun size={20} /></div>
            <div>
              <h3 className="font-semibold text-gray-100">ყოველდღიური ჰოროსკოპი</h3>
              <p className="text-xs text-gray-400">ავტომატური შეტყობინება ყოველ დილით</p>
            </div>
          </div>
          <button onClick={() => handleToggle('daily_horoscope_enabled')} className={`relative w-12 h-6 rounded-full transition-colors ${settings.daily_horoscope_enabled ? 'bg-[#C5A059]' : 'bg-gray-600'}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.daily_horoscope_enabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
        {settings.daily_horoscope_enabled && (
          <div className="ml-11 p-3 bg-[#0f0c08] rounded-lg border border-[#332a1a]">
            <label className="text-xs text-gray-400 block mb-1">გაგზავნის დრო:</label>
            <input type="time" value={settings.daily_horoscope_time} onChange={handleTimeChange} className="bg-[#1a1510] border border-[#332a1a] rounded px-3 py-1.5 text-sm text-[#C5A059] focus:outline-none focus:border-[#C5A059]" />
          </div>
        )}
        <div className="border-t border-[#332a1a]" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Moon size={20} /></div>
            <div><h3 className="font-semibold text-gray-100">მთვარის ფაზები</h3><p className="text-xs text-gray-400">შეტყობინება მთვარის ფაზის შეცვლისას</p></div>
          </div>
          <button onClick={() => handleToggle('moon_phase_enabled')} className={`relative w-12 h-6 rounded-full transition-colors ${settings.moon_phase_enabled ? 'bg-purple-500' : 'bg-gray-600'}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.moon_phase_enabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
        <div className="border-t border-[#332a1a]" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg text-green-400"><Target size={20} /></div>
            <div><h3 className="font-semibold text-gray-100">დავალებების შეხსენება</h3><p className="text-xs text-gray-400">შეხსენება დაუსრულებელი დავალებების შესახებ</p></div>
          </div>
          <button onClick={() => handleToggle('quest_reminders_enabled')} className={`relative w-12 h-6 rounded-full transition-colors ${settings.quest_reminders_enabled ? 'bg-green-500' : 'bg-gray-600'}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.quest_reminders_enabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
        <div className="border-t border-[#332a1a]" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Megaphone size={20} /></div>
            <div><h3 className="font-semibold text-gray-100">სისტემური განცხადებები</h3><p className="text-xs text-gray-400">მნიშვნელოვანი სიახლეები და განახლებები</p></div>
          </div>
          <button onClick={() => handleToggle('system_announcements_enabled')} className={`relative w-12 h-6 rounded-full transition-colors ${settings.system_announcements_enabled ? 'bg-blue-500' : 'bg-gray-600'}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.system_announcements_enabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-gradient-to-r from-[#C5A059] to-[#8B6914] text-[#0f0c08] font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
        {saving ? (<><RefreshCw className="animate-spin" size={20} /> ინახება...</>) : (<><Save size={20} /> ცვლილებების შენახვა</>)}
      </button>

      {/* 2. მასობრივი გაგზავნის სექცია (Broadcast) */}
      <div className="bg-[#1a1510] border border-red-900/50 rounded-xl p-5 space-y-4 shadow-[0_0_15px_rgba(220,38,38,0.1)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-500/20 rounded-lg text-red-400"><Send size={20} /></div>
          <div>
            <h3 className="font-semibold text-red-400">📢 მასობრივი გაგზავნა (Broadcast)</h3>
            <p className="text-xs text-gray-400">ადმინისტრატორის პირადი შეტყობინება ყველა ან კონკრეტულ მომხმარებელთან</p>
          </div>
        </div>

        <div className="bg-red-950/40 border border-red-800/50 rounded-lg p-3 flex gap-3 items-start">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-300 leading-relaxed">
            <strong>ყურადღება:</strong> ეს შეტყობინება გაიგზავნება არჩეული აუდიტორიის <strong>ყველა</strong> მომხმარებელთან, ვისაც აქვს დაკავშირებული Telegram. 
            ეს ფუნქცია <strong>იგნორირებას უკეთებს</strong> მომხმარებლის პირად პარამეტრებს.
          </p>
        </div>

        {/* სამიზნე აუდიტორია */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">სამიზნე აუდიტორია:</label>
          <select 
            value={targetAudience} 
            onChange={(e) => setTargetAudience(e.target.value as any)}
            className="w-full bg-[#0f0c08] border border-[#332a1a] rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-[#C5A059]"
          >
            <option value="all">ყველა მომხმარებელი</option>
            <option value="active">მხოლოდ აქტიური (ბოლო 7 დღე)</option>
            <option value="premium">მხოლოდ Premium მომხმარებლები</option>
            <option value="free">მხოლოდ Free მომხმარებლები</option>
          </select>
        </div>

        {/* ტექსტი */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">შეტყობინების ტექსტი (Emoji-ები დასაშვებია):</label>
          <textarea
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            placeholder="მაგალითად: 🎉 გილოცავთ ახალ განახლებას! აპში დაემატა ახალი ფუნქციები."
            rows={4}
            className="w-full bg-[#0f0c08] border border-[#332a1a] rounded-lg p-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none transition-colors"
          />
        </div>

        {/* სურათი */}
        <div>
          <label className="text-xs text-gray-400 block mb-1 flex items-center gap-1"><ImageIcon size={12} /> სურათის URL (არასავალდებულო):</label>
          <input
            type="text"
            value={broadcastImageUrl}
            onChange={(e) => setBroadcastImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full bg-[#0f0c08] border border-[#332a1a] rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
          />
        </div>

        {/* ღილაკები */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-400 flex items-center gap-1"><Plus size={12} /> Inline ღილაკები (არასავალდებულო):</label>
            <button onClick={handleAddButton} className="text-xs text-[#C5A059] hover:underline">+ ღილაკის დამატება</button>
          </div>
          <div className="space-y-2">
            {broadcastButtons.map((btn, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  placeholder="ტექსტი (მაგ: ვებსაიტი)"
                  value={btn.text}
                  onChange={(e) => handleButtonChange(index, 'text', e.target.value)}
                  className="flex-1 bg-[#0f0c08] border border-[#332a1a] rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                />
                <input
                  type="text"
                  placeholder="URL (https://...)"
                  value={btn.url}
                  onChange={(e) => handleButtonChange(index, 'url', e.target.value)}
                  className="flex-[2] bg-[#0f0c08] border border-[#332a1a] rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#C5A059]"
                />
                <button onClick={() => handleRemoveButton(index)} className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        {(broadcastMessage || broadcastImageUrl) && (
          <div className="bg-[#0f0c08] border border-[#332a1a] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
              <Eye size={14} /> Telegram Preview
            </div>
            <div className="bg-[#1a1510] rounded-lg p-3 max-w-sm mx-auto border border-gray-800">
              {broadcastImageUrl && (
                <img src={broadcastImageUrl} alt="Preview" className="w-full h-32 object-cover rounded-md mb-2 bg-gray-800" onError={(e) => (e.currentTarget.style.display = 'none')} />
              )}
              <p className="text-sm text-gray-200 whitespace-pre-wrap mb-3">{broadcastMessage || 'ტექსტი...'}</p>
              {broadcastButtons.filter(b => b.text && b.url).length > 0 && (
                <div className="space-y-1">
                  {broadcastButtons.filter(b => b.text && b.url).map((btn, i) => (
                    <div key={i} className="text-center py-1.5 bg-[#2a2215] text-[#C5A059] text-sm rounded-md font-medium border border-[#332a1a]">
                      {btn.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* გაგზავნის ღილაკი */}
        <button
          onClick={handleSendBroadcast}
          disabled={isSendingBroadcast || !broadcastMessage.trim()}
          className="w-full py-3 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:from-red-500 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20"
        >
          {isSendingBroadcast ? (
            <><RefreshCw className="animate-spin" size={20} /> იგზავნება...</>
          ) : (
            <><Send size={20} /> გაგზავნა არჩეულ აუდიტორიასთან</>
          )}
        </button>

        {/* შედეგი */}
        {broadcastResult && (
          <div className={`p-3 rounded-lg text-sm border ${broadcastResult.details.failCount > 0 ? 'bg-yellow-900/20 border-yellow-700 text-yellow-400' : 'bg-green-900/20 border-green-700 text-green-400'}`}>
            <div className="font-bold mb-1">📊 გაგზავნის სტატისტიკა:</div>
            <div>✅ წარმატებით მივიდა: {broadcastResult.details.successCount} მომხმარებელთან</div>
            {broadcastResult.details.failCount > 0 && <div>❌ ვერ მოხერხდა: {broadcastResult.details.failCount} მომხმარებელთან</div>}
            {broadcastResult.details.errors && broadcastResult.details.errors.length > 0 && (
              <details className="mt-2 text-xs opacity-80">
                <summary className="cursor-pointer hover:underline">შეცდომების დეტალების ნახვა</summary>
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  {broadcastResult.details.errors.map((err: string, i: number) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}