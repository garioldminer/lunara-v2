export interface TarotCard {
    id: number;
    name: string;
    number: string;
    arcana: 'major' | 'minor';
    suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
    symbol: string;
    zodiac: string;
    element: string;
    keywords: {
      upright: string[];
      reversed: string[];
    };
    meaning: {
      upright: string;
      reversed: string;
    };
  }
  
  export const tarotCards: TarotCard[] = [
    // MAJOR ARCANA (22 cards)
    {
      id: 0,
      name: 'The Fool',
      number: '0',
      arcana: 'major',
      symbol: '🃏',
      zodiac: 'Uranus',
      element: 'Air',
      keywords: {
        upright: ['New beginnings', 'Innocence', 'Adventure', 'Spontaneity'],
        reversed: ['Recklessness', 'Naivety', 'Foolishness', 'Risk']
      },
      meaning: {
        upright: 'New beginnings, innocence, spontaneity, a free spirit.',
        reversed: 'Recklessness, risk-taking, holding back, playing it safe.'
      }
    },
    {
      id: 1,
      name: 'The Magician',
      number: 'I',
      arcana: 'major',
      symbol: '🎩',
      zodiac: 'Mercury',
      element: 'Air',
      keywords: {
        upright: ['Manifestation', 'Resourcefulness', 'Power', 'Inspired action'],
        reversed: ['Manipulation', 'Poor planning', 'Untapped talents', 'Trickery']
      },
      meaning: {
        upright: 'Manifestation, resourcefulness, power, inspired action.',
        reversed: 'Manipulation, poor planning, untapped talents, trickery.'
      }
    },
    {
      id: 2,
      name: 'The High Priestess',
      number: 'II',
      arcana: 'major',
      symbol: '🌙',
      zodiac: 'Moon',
      element: 'Water',
      keywords: {
        upright: ['Intuition', 'Sacred knowledge', 'Divine feminine', 'Subconscious mind'],
        reversed: ['Secrets', 'Disconnected from intuition', 'Withdrawal', 'Silence']
      },
      meaning: {
        upright: 'Intuition, sacred knowledge, divine feminine, the subconscious mind.',
        reversed: 'Secrets, disconnected from intuition, withdrawal, silence.'
      }
    },
    {
      id: 3,
      name: 'The Empress',
      number: 'III',
      arcana: 'major',
      symbol: '👑',
      zodiac: 'Venus',
      element: 'Earth',
      keywords: {
        upright: ['Femininity', 'Beauty', 'Nature', 'Nurturing', 'Abundance'],
        reversed: ['Creative block', 'Dependence on others', 'Emptiness', 'Smothering']
      },
      meaning: {
        upright: 'Femininity, beauty, nature, nurturing, abundance.',
        reversed: 'Creative block, dependence on others, emptiness, smothering.'
      }
    },
    {
      id: 4,
      name: 'The Emperor',
      number: 'IV',
      arcana: 'major',
      symbol: '🏛️',
      zodiac: 'Aries',
      element: 'Fire',
      keywords: {
        upright: ['Authority', 'Structure', 'Control', 'Fatherhood'],
        reversed: ['Tyranny', 'Rigidity', 'Coldness', 'Domination']
      },
      meaning: {
        upright: 'Authority, structure, control, fatherhood.',
        reversed: 'Tyranny, rigidity, coldness, domination.'
      }
    },
    {
      id: 5,
      name: 'The Hierophant',
      number: 'V',
      arcana: 'major',
      symbol: '⛪',
      zodiac: 'Taurus',
      element: 'Earth',
      keywords: {
        upright: ['Spiritual wisdom', 'Tradition', 'Conformity', 'Morality'],
        reversed: ['Rebellion', 'Subversiveness', 'New methods', 'Freedom']
      },
      meaning: {
        upright: 'Spiritual wisdom, tradition, conformity, morality.',
        reversed: 'Rebellion, subversiveness, new methods, freedom.'
      }
    },
    {
      id: 6,
      name: 'The Lovers',
      number: 'VI',
      arcana: 'major',
      symbol: '💕',
      zodiac: 'Gemini',
      element: 'Air',
      keywords: {
        upright: ['Love', 'Harmony', 'Relationships', 'Values alignment', 'Choices'],
        reversed: ['Disharmony', 'Imbalance', 'Misalignment', 'Indecision']
      },
      meaning: {
        upright: 'Love, harmony, relationships, values alignment, choices.',
        reversed: 'Disharmony, imbalance, misalignment, indecision.'
      }
    },
    {
      id: 7,
      name: 'The Chariot',
      number: 'VII',
      arcana: 'major',
      symbol: '🏆',
      zodiac: 'Cancer',
      element: 'Water',
      keywords: {
        upright: ['Control', 'Willpower', 'Success', 'Determination'],
        reversed: ['Lack of control', 'Aggression', 'No direction', 'Defeat']
      },
      meaning: {
        upright: 'Control, willpower, success, determination.',
        reversed: 'Lack of control, aggression, no direction, defeat.'
      }
    },
    {
      id: 8,
      name: 'Strength',
      number: 'VIII',
      arcana: 'major',
      symbol: '🦁',
      zodiac: 'Leo',
      element: 'Fire',
      keywords: {
        upright: ['Courage', 'Patience', 'Compassion', 'Inner strength'],
        reversed: ['Self-doubt', 'Weakness', 'Insecurity', 'Lack of courage']
      },
      meaning: {
        upright: 'Courage, patience, compassion, inner strength.',
        reversed: 'Self-doubt, weakness, insecurity, lack of courage.'
      }
    },
    {
      id: 9,
      name: 'The Hermit',
      number: 'IX',
      arcana: 'major',
      symbol: '🏔️',
      zodiac: 'Virgo',
      element: 'Earth',
      keywords: {
        upright: ['Soul-searching', 'Introspection', 'Being alone', 'Inner guidance'],
        reversed: ['Isolation', 'Loneliness', 'Withdrawal', 'Lost']
      },
      meaning: {
        upright: 'Soul-searching, introspection, being alone, inner guidance.',
        reversed: 'Isolation, loneliness, withdrawal, lost.'
      }
    },
    {
      id: 10,
      name: 'Wheel of Fortune',
      number: 'X',
      arcana: 'major',
      symbol: '🎡',
      zodiac: 'Jupiter',
      element: 'Fire',
      keywords: {
        upright: ['Good luck', 'Karma', 'Life cycles', 'Destiny', 'Turning point'],
        reversed: ['Bad luck', 'Resistance to change', 'Breaking cycles', 'Negative forces']
      },
      meaning: {
        upright: 'Good luck, karma, life cycles, destiny, turning point.',
        reversed: 'Bad luck, resistance to change, breaking cycles, negative forces.'
      }
    },
    {
      id: 11,
      name: 'Justice',
      number: 'XI',
      arcana: 'major',
      symbol: '⚖️',
      zodiac: 'Libra',
      element: 'Air',
      keywords: {
        upright: ['Justice', 'Fairness', 'Truth', 'Cause and effect', 'Law'],
        reversed: ['Unfairness', 'Lack of accountability', 'Dishonesty', 'Unfairness']
      },
      meaning: {
        upright: 'Justice, fairness, truth, cause and effect, law.',
        reversed: 'Unfairness, lack of accountability, dishonesty, injustice.'
      }
    },
    {
      id: 12,
      name: 'The Hanged Man',
      number: 'XII',
      arcana: 'major',
      symbol: '🙃',
      zodiac: 'Neptune',
      element: 'Water',
      keywords: {
        upright: ['Pause', 'Surrender', 'Letting go', 'New perspectives'],
        reversed: ['Delays', 'Resistance', 'Stalling', 'Indecision']
      },
      meaning: {
        upright: 'Pause, surrender, letting go, new perspectives.',
        reversed: 'Delays, resistance, stalling, indecision.'
      }
    },
    {
      id: 13,
      name: 'Death',
      number: 'XIII',
      arcana: 'major',
      symbol: '💀',
      zodiac: 'Scorpio',
      element: 'Water',
      keywords: {
        upright: ['Endings', 'Change', 'Transformation', 'Transition', 'Release'],
        reversed: ['Resistance to change', 'Fear of change', 'Stagnation', 'Decay']
      },
      meaning: {
        upright: 'Endings, change, transformation, transition, release.',
        reversed: 'Resistance to change, fear of change, stagnation, decay.'
      }
    },
    {
      id: 14,
      name: 'Temperance',
      number: 'XIV',
      arcana: 'major',
      symbol: '⚗️',
      zodiac: 'Sagittarius',
      element: 'Fire',
      keywords: {
        upright: ['Balance', 'Moderation', 'Patience', 'Purpose', 'Meaning'],
        reversed: ['Imbalance', 'Excess', 'Self-healing', 'Re-alignment']
      },
      meaning: {
        upright: 'Balance, moderation, patience, purpose, meaning.',
        reversed: 'Imbalance, excess, self-healing, re-alignment.'
      }
    },
    {
      id: 15,
      name: 'The Devil',
      number: 'XV',
      arcana: 'major',
      symbol: '😈',
      zodiac: 'Capricorn',
      element: 'Earth',
      keywords: {
        upright: ['Shadow self', 'Attachment', 'Addiction', 'Restriction', 'Darkness'],
        reversed: ['Recovery', 'Freedom', 'Release', 'Restoring balance', 'Breaking free']
      },
      meaning: {
        upright: 'Shadow self, attachment, addiction, restriction, darkness.',
        reversed: 'Recovery, freedom, release, restoring balance, breaking free.'
      }
    },
    {
      id: 16,
      name: 'The Tower',
      number: 'XVI',
      arcana: 'major',
      symbol: '🗼',
      zodiac: 'Mars',
      element: 'Fire',
      keywords: {
        upright: ['Sudden change', 'Upheaval', 'Revelation', 'Awakening', 'Destruction'],
        reversed: ['Fear of change', 'Averting disaster', 'Delaying the inevitable', 'Personal transformation']
      },
      meaning: {
        upright: 'Sudden change, upheaval, revelation, awakening, destruction.',
        reversed: 'Fear of change, averting disaster, delaying the inevitable, personal transformation.'
      }
    },
    {
      id: 17,
      name: 'The Star',
      number: 'XVII',
      arcana: 'major',
      symbol: '⭐',
      zodiac: 'Aquarius',
      element: 'Air',
      keywords: {
        upright: ['Hope', 'Faith', 'Purpose', 'Inspiration', 'Serenity'],
        reversed: ['Lack of faith', 'Despair', 'Disconnection', 'Reversal']
      },
      meaning: {
        upright: 'Hope, faith, purpose, inspiration, serenity.',
        reversed: 'Lack of faith, despair, disconnection, reversal.'
      }
    },
    {
      id: 18,
      name: 'The Moon',
      number: 'XVIII',
      arcana: 'major',
      symbol: '🌕',
      zodiac: 'Pisces',
      element: 'Water',
      keywords: {
        upright: ['Illusion', 'Fear', 'Anxiety', 'Subconscious', 'Intuition'],
        reversed: ['Release of fear', 'Repressed emotion', 'Inner confusion', 'Clarity']
      },
      meaning: {
        upright: 'Illusion, fear, anxiety, subconscious, intuition.',
        reversed: 'Release of fear, repressed emotion, inner confusion, clarity.'
      }
    },
    {
      id: 19,
      name: 'The Sun',
      number: 'XIX',
      arcana: 'major',
      symbol: '☀️',
      zodiac: 'Sun',
      element: 'Fire',
      keywords: {
        upright: ['Positivity', 'Fun', 'Warmth', 'Success', 'Vitality'],
        reversed: ['Inner child', 'Feeling down', 'Overly optimistic', 'Exaggerated']
      },
      meaning: {
        upright: 'Positivity, fun, warmth, success, vitality.',
        reversed: 'Inner child, feeling down, overly optimistic, exaggerated.'
      }
    },
    {
      id: 20,
      name: 'Judgement',
      number: 'XX',
      arcana: 'major',
      symbol: '📯',
      zodiac: 'Pluto',
      element: 'Fire',
      keywords: {
        upright: ['Judgement', 'Rebirth', 'Inner calling', 'Absolution'],
        reversed: ['Self-doubt', 'Inner critic', 'Ignoring the call', 'Refusal of self-examination']
      },
      meaning: {
        upright: 'Judgement, rebirth, inner calling, absolution.',
        reversed: 'Self-doubt, inner critic, ignoring the call, refusal of self-examination.'
      }
    },
    {
      id: 21,
      name: 'The World',
      number: 'XXI',
      arcana: 'major',
      symbol: '🌍',
      zodiac: 'Saturn',
      element: 'Earth',
      keywords: {
        upright: ['Completion', 'Integration', 'Accomplishment', 'Travel'],
        reversed: ['Seeking personal closure', 'Short-cuts', 'Delays', 'Incompletion']
      },
      meaning: {
        upright: 'Completion, integration, accomplishment, travel.',
        reversed: 'Seeking personal closure, short-cuts, delays, incompletion.'
      }
    },
    
    // MINOR ARCANA - WANDS (14 cards)
    {
      id: 22,
      name: 'Ace of Wands',
      number: 'Ace',
      arcana: 'minor',
      suit: 'wands',
      symbol: '🔥',
      zodiac: 'Aries',
      element: 'Fire',
      keywords: {
        upright: ['Inspiration', 'New opportunities', 'Growth', 'Potential'],
        reversed: ['Lack of energy', 'Delays', 'Blocks', 'Creative blocks']
      },
      meaning: {
        upright: 'Inspiration, new opportunities, growth, potential.',
        reversed: 'Lack of energy, delays, blocks, creative blocks.'
      }
    },
    {
      id: 23,
      name: 'Two of Wands',
      number: 'II',
      arcana: 'minor',
      suit: 'wands',
      symbol: '🌍',
      zodiac: 'Mars',
      element: 'Fire',
      keywords: {
        upright: ['Future planning', 'Progress', 'Decisions', 'Discovery'],
        reversed: ['Fear of unknown', 'Lack of planning', 'Playing it safe', 'Playing small']
      },
      meaning: {
        upright: 'Future planning, progress, decisions, discovery.',
        reversed: 'Fear of unknown, lack of planning, playing it safe, playing small.'
      }
    },
    // ... დანარჩენი 54 minor arcana ბარათი
    // (შეგიძლია დავამატოთ მოგვიანებით)
  ];
  
  // Helper function to get card by ID
  export const getCardById = (id: number): TarotCard | undefined => {
    return tarotCards.find(card => card.id === id);
  };
  
  // Helper function to get random card
  export const getRandomCard = (): TarotCard => {
    const randomIndex = Math.floor(Math.random() * tarotCards.length);
    return tarotCards[randomIndex];
  };
  
  // Helper function to get daily card (based on date)
  export const getDailyCard = (): TarotCard => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const cardIndex = dayOfYear % tarotCards.length;
    return tarotCards[cardIndex];
  };