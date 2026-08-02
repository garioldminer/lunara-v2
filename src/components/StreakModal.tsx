import { X, Flame, Calendar } from 'lucide-react';

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
}

export default function StreakModal({ isOpen, onClose, currentStreak }: StreakModalProps) {
  if (!isOpen) return null;

  const milestones = [
    { days: 3, reward: '50 💎', claimed: currentStreak >= 3 },
    { days: 7, reward: '200 💎', claimed: currentStreak >= 7 },
    { days: 14, reward: '500 💎', claimed: currentStreak >= 14 },
    { days: 30, reward: '2000 💎 + VIP', claimed: currentStreak >= 30 },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm rounded-2xl p-6"
        style={{ 
          background: 'linear-gradient(135deg, #1a1510 0%, #0f0c08 100%)',
          border: '1px solid rgba(197, 160, 89, 0.3)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(197, 160, 89, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
          style={{ color: '#94a3b8' }}
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3" style={{ background: 'rgba(255, 107, 53, 0.15)', border: '1px solid rgba(255, 107, 53, 0.3)' }}>
            <Flame size={32} style={{ color: '#ff6b35', filter: 'drop-shadow(0 0 8px rgba(255, 107, 53, 0.6))' }} />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: '#ffe566', fontFamily: 'Georgia, serif' }}>
            {currentStreak} დღიანი სტრიქი!
          </h2>
          <p className="text-sm mt-2" style={{ color: '#94a3b8' }}>
            შეინარჩუნე ყოველდღიური ვიზიტი და მიიღე ჯილდოები.
          </p>
        </div>

        <div className="space-y-3">
          {milestones.map((milestone, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 rounded-xl transition-all"
              style={{ 
                background: milestone.claimed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                border: milestone.claimed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                opacity: milestone.claimed ? 0.7 : 1
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: milestone.claimed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(197, 160, 89, 0.1)' }}>
                  <Calendar size={16} style={{ color: milestone.claimed ? '#10b981' : '#C5A059' }} />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: '#fff' }}>{milestone.days} დღე</div>
                  <div className="text-xs" style={{ color: '#94a3b8' }}>{milestone.claimed ? 'მიღებულია' : 'ჯილდო'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: milestone.claimed ? '#10b981' : '#ffe566' }}>
                  {milestone.reward}
                </span>
                {milestone.claimed && <span className="text-lg">✅</span>}
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ 
            background: 'linear-gradient(135deg, #C5A059 0%, #8B6914 100%)',
            color: '#0f0c08',
            boxShadow: '0 4px 15px rgba(197, 160, 89, 0.3)'
          }}
        >
          გავაგრძელოთ
        </button>
      </div>
    </div>
  );
}