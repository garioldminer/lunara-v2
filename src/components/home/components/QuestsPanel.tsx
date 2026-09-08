import { useState, useEffect } from 'react';
import { Trophy, RefreshCw, CheckCircle, X, Gem } from 'lucide-react';
import { useTranslation } from '../../../i18n/TranslationContext';
import type { QuestProgress } from '../../../lib/questService';

interface DailyQuestDisplay extends QuestProgress {
  isClaimable: boolean;
}

function CountdownTimer({ style }: { style?: React.CSSProperties }) {
  const [timeLeft, setTimeLeft] = useState('00:00:00');
  
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  
  return <span style={style}>{timeLeft}</span>;
}

const getQuestIcon = (actionType: string): React.ReactNode => {
  const icons: Record<string, string> = {
    draw_daily_card: '📜',
    check_horoscope: '✨',
    complete_reading: '🎴',
    discover_card: '💎',
    maintain_streak: '🔥',
    view_gallery: '🖼️'
  };
  return <span>{icons[actionType] || '📜'}</span>;
};

interface QuestsPanelProps {
  questsLoading: boolean;
  dailyQuests: DailyQuestDisplay[];
  activeDailyQuest: DailyQuestDisplay | null;
  isClaimingQuest: boolean;
  onOpenModal: () => void;
  onClaimQuest: (quest: DailyQuestDisplay) => void;
}

export function QuestsPanel({
  questsLoading,
  dailyQuests,
  activeDailyQuest,
  isClaimingQuest,
  onOpenModal,
  onClaimQuest
}: QuestsPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="daily-quests-compact" onClick={onOpenModal}>
      <div className="quests-header-compact">
        <h3>{t('home.dailyQuests')}</h3>
        <CountdownTimer style={{ fontSize: '9px', color: '#b3a68c', fontFamily: 'monospace' }} />
      </div>
      <div className="quest-list-compact">
        {questsLoading ? (
          <div className="quest-loading">{t('home.loading')}</div>
        ) : dailyQuests.length === 0 ? (
          <div className="quest-empty">{t('home.noQuests')}</div>
        ) : activeDailyQuest ? (
          <div className="quest-item-compact">
            <div className="quest-icon-compact" style={{ color: activeDailyQuest.isClaimable ? '#10b981' : '#C5A059' }}>
              {getQuestIcon(activeDailyQuest.quest?.action_type || '')}
            </div>
            <div className="quest-info-compact">
              <span className="quest-name-compact">
                {activeDailyQuest.quest?.title || t('home.quest')}
              </span>
              <div className="quest-progress-compact">
                <div className="progress-bar-compact">
                  <div
                    className="progress-fill-compact"
                    style={{ width: `${Math.min((activeDailyQuest.current_progress / (activeDailyQuest.quest?.target_count || 1)) * 100, 100)}%` }}
                  />
                </div>
                <span className="progress-text-compact">
                  {activeDailyQuest.current_progress}/{activeDailyQuest.quest?.target_count}
                </span>
              </div>
            </div>
            <div className="quest-reward-compact" style={{ color: activeDailyQuest.isClaimable ? '#10b981' : '#C5A059' }}>
              {activeDailyQuest.isClaimable ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onClaimQuest(activeDailyQuest); }}
                  disabled={isClaimingQuest}
                  className="quest-claim-btn-compact"
                >
                  {isClaimingQuest ? <RefreshCw size={10} className="spin" /> : t('home.claim')}
                </button>
              ) : (
                <><Gem size={9} /> +{activeDailyQuest.quest?.reward_coins}</>
              )}
            </div>
          </div>
        ) : (
          <div className="quest-complete">{t('home.allComplete')}</div>
        )}
      </div>
    </div>
  );
}

// Quest Modal Component
interface QuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyQuests: DailyQuestDisplay[];
  isClaimingQuest: boolean;
  onClaimQuest: (quest: DailyQuestDisplay) => void;
}

export function QuestModal({
  isOpen,
  onClose,
  dailyQuests,
  isClaimingQuest,
  onClaimQuest
}: QuestModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const allComplete = dailyQuests.length > 0 && dailyQuests.every(q => q.is_claimed);

  return (
    <div className="quest-modal-overlay" onClick={onClose}>
      <div className="quest-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="quest-modal-header">
          <h3><Trophy size={18} /> {t('home.questModal.title')}</h3>
          <button onClick={onClose} className="quest-modal-close">
            <X size={20} />
          </button>
        </div>
        <div className="quest-modal-body">
          {dailyQuests.length === 0 ? (
            <div className="quest-modal-empty">{t('home.questModal.noQuests')}</div>
          ) : (
            dailyQuests.map((q) => (
              <div key={q.id} className={`quest-modal-item ${q.is_claimed ? 'claimed' : ''}`}>
                <div className="quest-modal-top">
                  <div className="quest-modal-info">
                    <div className="quest-modal-icon" style={{ color: q.isClaimable ? '#10b981' : '#C5A059' }}>
                      {getQuestIcon(q.quest?.action_type || '')}
                    </div>
                    <div>
                      <div className="quest-modal-title">{q.quest?.title}</div>
                      <div className="quest-modal-desc">{q.quest?.description}</div>
                    </div>
                  </div>
                  <div className="quest-modal-reward">
                    <Gem size={12} /> +{q.quest?.reward_coins}
                  </div>
                </div>
                <div className="quest-modal-progress">
                  <div className="progress-bar-modal">
                    <div
                      className="progress-fill-modal"
                      style={{ width: `${Math.min((q.current_progress / (q.quest?.target_count || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="quest-modal-progress-text">
                    {q.current_progress}/{q.quest?.target_count}
                  </span>
                </div>
                {q.isClaimable && (
                  <button
                    onClick={() => onClaimQuest(q)}
                    disabled={isClaimingQuest}
                    className="quest-modal-claim-btn"
                  >
                    {isClaimingQuest ? (
                      <RefreshCw size={14} className="spin" />
                    ) : (
                      <><CheckCircle size={14} /> {t('home.questModal.claimReward')}</>
                    )}
                  </button>
                )}
                {q.is_claimed && (
                  <div className="quest-modal-completed">
                    <CheckCircle size={14} /> {t('home.questModal.completed')}
                  </div>
                )}
              </div>
            ))
          )}
          {allComplete && (
            <div className="quest-modal-all-complete">
              <div className="quest-modal-all-complete-title">
                {t('home.questModal.allCompleteTitle')}
              </div>
              <div className="quest-modal-comeback">
                {t('home.questModal.comeBack', { time: '' })} <CountdownTimer style={{ fontFamily: 'monospace', fontWeight: 'bold' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}