import { Trophy, X, CheckCircle, RefreshCw, Gem, Scroll, Sparkles, LayoutGrid, Flame } from 'lucide-react';
import { CountdownTimer } from './CountdownTimer';
import type { ReactNode } from 'react';

interface Quest {
  id: string;
  quest_id: string;
  quest?: {
    quest_type?: string;
    action_type?: string;
    title?: string;
    description?: string;
    target_count?: number;
    reward_coins?: number;
    reward_xp?: number;
  };
  current_progress: number;
  is_completed: boolean;
  is_claimed: boolean;
  isClaimable?: boolean;
}

interface QuestsPanelProps {
  quests: Quest[];
  loading: boolean;
  activeQuest: Quest | null;
  isClaiming: boolean;
  showModal: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onClaim: (quest: Quest) => void;
  t: (key: string, params?: any) => string;
}

function getQuestIcon(actionType: string): ReactNode {
  switch (actionType) {
    case 'draw_daily_card': return <Scroll size={16} />;
    case 'check_horoscope': return <Sparkles size={16} />;
    case 'complete_reading': return <LayoutGrid size={16} />;
    case 'discover_card': return <Gem size={16} />;
    case 'maintain_streak': return <Flame size={16} />;
    case 'view_gallery': return <LayoutGrid size={16} />;
    default: return <Scroll size={16} />;
  }
}

export function QuestsPanel({
  quests,
  loading,
  activeQuest,
  isClaiming,
  showModal,
  onOpenModal,
  onCloseModal,
  onClaim,
  t
}: QuestsPanelProps) {
  return (
    <>
      <div className="quests-and-actions-split" style={{ display: 'flex', flexDirection: 'row', gap: '2px', marginBottom: '2px', width: '100%', alignItems: 'stretch' }}>
        <div className="daily-quests-compact" style={{ flex: '0 0 60%', minWidth: 0 }} onClick={onOpenModal}>
          <div className="quests-header-compact">
            <h3>{t('home.dailyQuests')}</h3>
            <CountdownTimer style={{ fontSize: '9px', color: '#b3a68c', fontFamily: 'monospace' }} />
          </div>
          <div className="quest-list-compact">
            {loading ? (
              <div style={{ textAlign: 'center', color: '#b3a68c', fontSize: '9px', padding: '10px' }}>{t('home.loading')}</div>
            ) : quests.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#b3a68c', fontSize: '9px', padding: '10px' }}>{t('home.noQuests')}</div>
            ) : activeQuest ? (
              <div className="quest-item-compact">
                <div className="quest-icon-compact" style={{ color: activeQuest.isClaimable ? '#10b981' : '#C5A059' }}>
                  {getQuestIcon(activeQuest.quest?.action_type || '')}
                </div>
                <div className="quest-info-compact">
                  <span className="quest-name-compact">
                    {activeQuest.quest?.title || t('home.quest')}
                  </span>
                  <div className="quest-progress-compact">
                    <div className="progress-bar-compact">
                      <div className="progress-fill-compact" style={{ width: `${Math.min((activeQuest.current_progress / (activeQuest.quest?.target_count || 1)) * 100, 100)}%` }}></div>
                    </div>
                    <span style={{ fontSize: '8px', color: '#b3a68c', minWidth: '18px' }}>{activeQuest.current_progress}/{activeQuest.quest?.target_count}</span>
                  </div>
                </div>
                <div className="quest-reward-compact" style={{ color: activeQuest.isClaimable ? '#10b981' : '#C5A059' }}>
                  {activeQuest.isClaimable ? (
                    <button onClick={(e) => { e.stopPropagation(); onClaim(activeQuest); }} disabled={isClaiming} className="quest-claim-btn-compact">
                      {isClaiming ? <RefreshCw size={10} className="spin" /> : t('home.claim')}
                    </button>
                  ) : (
                    <><Gem size={9} /> +{activeQuest.quest?.reward_coins}</>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#10b981', fontSize: '9px', padding: '10px' }}>{t('home.allComplete')}</div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="quest-modal-overlay" onClick={onCloseModal}>
          <div className="quest-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="quest-modal-header">
              <h3>
                <Trophy size={18} /> {t('home.questModal.title')}
              </h3>
              <button onClick={onCloseModal} className="quest-modal-close">
                <X size={20} />
              </button>
            </div>
            <div className="quest-modal-body">
              {quests.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>{t('home.questModal.noQuests')}</div>
              ) : (
                quests.map((q) => (
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
                        <div className="progress-fill-modal" style={{ width: `${Math.min((q.current_progress / (q.quest?.target_count || 1)) * 100, 100)}%` }}></div>
                      </div>
                      <span className="quest-modal-progress-text">{q.current_progress}/{q.quest?.target_count}</span>
                    </div>
                    {q.isClaimable && (
                      <button onClick={() => onClaim(q)} disabled={isClaiming} className="quest-modal-claim-btn">
                        {isClaiming ? <RefreshCw size={14} className="spin" /> : <><CheckCircle size={14} /> {t('home.questModal.claimReward')}</>}
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
              {quests.length > 0 && quests.every(q => q.is_claimed) && (
                <div className="quest-modal-all-complete">
                  <div className="quest-modal-all-complete-title">{t('home.questModal.allCompleteTitle')}</div>
                  <div className="quest-modal-comeback">
                    {t('home.questModal.comeBack', { time: '' })} <CountdownTimer style={{ fontFamily: 'monospace', fontWeight: 'bold' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}