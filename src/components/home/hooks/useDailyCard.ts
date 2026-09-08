import { useState, useEffect } from 'react';
import { tarotCards } from '../../../data/tarotCards';
import { getTodayReading } from '../../../lib/dailyCardService';
import { logger } from '../../../lib/logger';

export const useDailyCard = (userId: string | undefined) => {
  const [dailyCard, setDailyCard] = useState<typeof tarotCards[0] | null>(null);
  const [isDailyReversed, setIsDailyReversed] = useState(false);
  const [isDailyRevealed, setIsDailyRevealed] = useState(false);

  useEffect(() => {
    const loadDailyCard = async () => {
      if (!userId) return;

      try {
        const reading = await getTodayReading(userId);
        
        if (reading) {
          const card = tarotCards.find(c => c.id === reading.cards[0]?.id);
          if (card) {
            setDailyCard(card);
            setIsDailyReversed(reading.cards[0]?.is_reversed || false);
            setIsDailyRevealed(true);
          }
        } else {
          setDailyCard(null);
          setIsDailyRevealed(false);
        }
      } catch (error: any) {
        logger.error('Failed to load daily card:', error.message);
      }
    };

    loadDailyCard();
  }, [userId]);

  return {
    dailyCard,
    isDailyReversed,
    isDailyRevealed
  };
};