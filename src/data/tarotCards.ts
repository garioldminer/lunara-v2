export interface TarotCard {
  id: number;
  name: string;
  number: string;
  arcana: 'major' | 'minor';
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
  meaning: string;
  keywords: string[];
  image_url: string;
  back_image_url: string;
}

// Supabase Storage URL
const SUPABASE_STORAGE_URL = 'https://eutavdhcxpfhpfsyaskb.supabase.co/storage/v1/object/public/tarot-cards';

export const tarotCards: TarotCard[] = [
  // ===== MAJOR ARCANA (22 კარტი) =====
  {
    id: 1,
    name: 'The Fool',
    number: '0',
    arcana: 'major',
    meaning: 'New beginnings, innocence, spontaneity',
    keywords: ['beginnings', 'innocence', 'spontaneity', 'free spirit'],
    image_url: `${SUPABASE_STORAGE_URL}/front/0-the-fool.png`,
    back_image_url: ''
  },
  {
    id: 2,
    name: 'The Magician',
    number: 'I',
    arcana: 'major',
    meaning: 'Manifestation, resourcefulness, power',
    keywords: ['manifestation', 'resourcefulness', 'power', 'inspired action'],
    image_url: `${SUPABASE_STORAGE_URL}/front/1-the-magician.png`,
    back_image_url: ''
  },
  {
    id: 3,
    name: 'The High Priestess',
    number: 'II',
    arcana: 'major',
    meaning: 'Intuition, sacred knowledge, divine feminine',
    keywords: ['intuition', 'sacred knowledge', 'divine feminine', 'subconscious mind'],
    image_url: `${SUPABASE_STORAGE_URL}/front/2-the-high-priestess.png`,
    back_image_url: ''
  },
  {
    id: 4,
    name: 'The Empress',
    number: 'III',
    arcana: 'major',
    meaning: 'Femininity, beauty, nature, nurturing',
    keywords: ['femininity', 'beauty', 'nature', 'nurturing', 'abundance'],
    image_url: `${SUPABASE_STORAGE_URL}/front/3-the-empress.png`,
    back_image_url: ''
  },
  {
    id: 5,
    name: 'The Emperor',
    number: 'IV',
    arcana: 'major',
    meaning: 'Authority, establishment, structure, father figure',
    keywords: ['authority', 'establishment', 'structure', 'father figure'],
    image_url: `${SUPABASE_STORAGE_URL}/front/4-the-emperor.png`,
    back_image_url: ''
  },
  {
    id: 6,
    name: 'The Hierophant',
    number: 'V',
    arcana: 'major',
    meaning: 'Spiritual wisdom, religious beliefs, conformity',
    keywords: ['spiritual wisdom', 'religious beliefs', 'conformity', 'tradition'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 7,
    name: 'The Lovers',
    number: 'VI',
    arcana: 'major',
    meaning: 'Love, harmony, relationships, values alignment',
    keywords: ['love', 'harmony', 'relationships', 'values alignment'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 8,
    name: 'The Chariot',
    number: 'VII',
    arcana: 'major',
    meaning: 'Control, willpower, success, determination',
    keywords: ['control', 'willpower', 'success', 'determination'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 9,
    name: 'Strength',
    number: 'VIII',
    arcana: 'major',
    meaning: 'Strength, courage, persuasion, influence',
    keywords: ['strength', 'courage', 'persuasion', 'influence'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 10,
    name: 'The Hermit',
    number: 'IX',
    arcana: 'major',
    meaning: 'Soul searching, introspection, inner guidance',
    keywords: ['soul searching', 'introspection', 'inner guidance', 'solitude'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 11,
    name: 'Wheel of Fortune',
    number: 'X',
    arcana: 'major',
    meaning: 'Good luck, karma, life cycles, destiny',
    keywords: ['good luck', 'karma', 'life cycles', 'destiny'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 12,
    name: 'Justice',
    number: 'XI',
    arcana: 'major',
    meaning: 'Justice, fairness, truth, cause and effect',
    keywords: ['justice', 'fairness', 'truth', 'cause and effect'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 13,
    name: 'The Hanged Man',
    number: 'XII',
    arcana: 'major',
    meaning: 'Pause, surrender, letting go, new perspectives',
    keywords: ['pause', 'surrender', 'letting go', 'new perspectives'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 14,
    name: 'Death',
    number: 'XIII',
    arcana: 'major',
    meaning: 'Endings, change, transformation, transition',
    keywords: ['endings', 'change', 'transformation', 'transition'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 15,
    name: 'Temperance',
    number: 'XIV',
    arcana: 'major',
    meaning: 'Balance, moderation, patience, purpose',
    keywords: ['balance', 'moderation', 'patience', 'purpose'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 16,
    name: 'The Devil',
    number: 'XV',
    arcana: 'major',
    meaning: 'Shadow self, attachment, addiction, restriction',
    keywords: ['shadow self', 'attachment', 'addiction', 'restriction'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 17,
    name: 'The Tower',
    number: 'XVI',
    arcana: 'major',
    meaning: 'Sudden change, upheaval, chaos, revelation',
    keywords: ['sudden change', 'upheaval', 'chaos', 'revelation'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 18,
    name: 'The Star',
    number: 'XVII',
    arcana: 'major',
    meaning: 'Hope, faith, purpose, renewal, spirituality',
    keywords: ['hope', 'faith', 'purpose', 'renewal', 'spirituality'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 19,
    name: 'The Moon',
    number: 'XVIII',
    arcana: 'major',
    meaning: 'Illusion, fear, anxiety, subconscious, intuition',
    keywords: ['illusion', 'fear', 'anxiety', 'subconscious', 'intuition'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 20,
    name: 'The Sun',
    number: 'XIX',
    arcana: 'major',
    meaning: 'Positivity, fun, warmth, success, vitality',
    keywords: ['positivity', 'fun', 'warmth', 'success', 'vitality'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 21,
    name: 'Judgement',
    number: 'XX',
    arcana: 'major',
    meaning: 'Judgement, rebirth, inner calling, absolution',
    keywords: ['judgement', 'rebirth', 'inner calling', 'absolution'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 22,
    name: 'The World',
    number: 'XXI',
    arcana: 'major',
    meaning: 'Completion, integration, accomplishment, travel',
    keywords: ['completion', 'integration', 'accomplishment', 'travel'],
    image_url: '',
    back_image_url: ''
  },

  // ===== MINOR ARCANA - WANDS (14 კარტი) =====
  {
    id: 23,
    name: 'Ace of Wands',
    number: 'Ace',
    arcana: 'minor',
    suit: 'wands',
    meaning: 'Inspiration, new opportunities, growth',
    keywords: ['inspiration', 'new opportunities', 'growth'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 24,
    name: 'Two of Wands',
    number: '2',
    arcana: 'minor',
    suit: 'wands',
    meaning: 'Future planning, progress, decisions',
    keywords: ['future planning', 'progress', 'decisions'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 25,
    name: 'Three of Wands',
    number: '3',
    arcana: 'minor',
    suit: 'wands',
    meaning: 'Progress, expansion, foresight',
    keywords: ['progress', 'expansion', 'foresight'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 26,
    name: 'Four of Wands',
    number: '4',
    arcana: 'minor',
    suit: 'wands',
    meaning: 'Celebration, joy, harmony, relaxation',
    keywords: ['celebration', 'joy', 'harmony', 'relaxation'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 27,
    name: 'Five of Wands',
    number: '5',
    arcana: 'minor',
    suit: 'wands',
    meaning: 'Conflict, disagreements, competition',
    keywords: ['conflict', 'disagreements', 'competition'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 28,
    name: 'Six of Wands',
    number: '6',
    arcana: 'minor',
    suit: 'wands',
    meaning: 'Success, public recognition, progress',
    keywords: ['success', 'public recognition', 'progress'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 29,
    name: 'Seven of Wands',
    number: '7',
    arcana: 'minor',
    suit: 'wands',
    meaning: 'Challenge, competition, protection',
    keywords: ['challenge', 'competition', 'protection'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 30,
    name: 'Eight of Wands',
    number: '8',
    arcana: 'minor',
    suit: 'wands',
    meaning: 'Movement, fast paced change, action',
    keywords: ['movement', 'fast paced change', 'action'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 31,
    name: 'Nine of Wands',
    number: '9',
    arcana: 'minor',
    suit: 'wands',
    meaning: 'Resilience, courage, persistence',
    keywords: ['resilience', 'courage', 'persistence'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 32,
    name: 'Ten of Wands',
    number: '10',
    arcana: 'minor',
    suit: 'wands',
    meaning: 'Burden, extra responsibility, hard work',
    keywords: ['burden', 'extra responsibility', 'hard work'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 33,
    name: 'Page of Wands',
    number: 'Page',
    arcana: 'minor',
    suit: 'wands',
    meaning: 'Inspiration, ideas, discovery, limitless potential',
    keywords: ['inspiration', 'ideas', 'discovery', 'limitless potential'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 34,
    name: 'Knight of Wands',
    number: 'Knight',
    arcana: 'minor',
    suit: 'wands',
    meaning: 'Energy, passion, inspired action, adventure',
    keywords: ['energy', 'passion', 'inspired action', 'adventure'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 35,
    name: 'Queen of Wands',
    number: 'Queen',
    arcana: 'minor',
    suit: 'wands',
    meaning: 'Courage, confidence, independence, social butterfly',
    keywords: ['courage', 'confidence', 'independence', 'social butterfly'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 36,
    name: 'King of Wands',
    number: 'King',
    arcana: 'minor',
    suit: 'wands',
    meaning: 'Natural-born leader, vision, entrepreneur',
    keywords: ['natural-born leader', 'vision', 'entrepreneur'],
    image_url: '',
    back_image_url: ''
  },

  // ===== MINOR ARCANA - CUPS (14 კარტი) =====
  {
    id: 37,
    name: 'Ace of Cups',
    number: 'Ace',
    arcana: 'minor',
    suit: 'cups',
    meaning: 'Love, new relationships, compassion, creativity',
    keywords: ['love', 'new relationships', 'compassion', 'creativity'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 38,
    name: 'Two of Cups',
    number: '2',
    arcana: 'minor',
    suit: 'cups',
    meaning: 'Unified love, partnership, mutual attraction',
    keywords: ['unified love', 'partnership', 'mutual attraction'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 39,
    name: 'Three of Cups',
    number: '3',
    arcana: 'minor',
    suit: 'cups',
    meaning: 'Celebration, friendship, creativity, collaborations',
    keywords: ['celebration', 'friendship', 'creativity', 'collaborations'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 40,
    name: 'Four of Cups',
    number: '4',
    arcana: 'minor',
    suit: 'cups',
    meaning: 'Meditation, contemplation, apathy, reevaluation',
    keywords: ['meditation', 'contemplation', 'apathy', 'reevaluation'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 41,
    name: 'Five of Cups',
    number: '5',
    arcana: 'minor',
    suit: 'cups',
    meaning: 'Regret, failure, disappointment, pessimism',
    keywords: ['regret', 'failure', 'disappointment', 'pessimism'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 42,
    name: 'Six of Cups',
    number: '6',
    arcana: 'minor',
    suit: 'cups',
    meaning: 'Revisiting the past, childhood memories, innocence',
    keywords: ['revisiting the past', 'childhood memories', 'innocence'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 43,
    name: 'Seven of Cups',
    number: '7',
    arcana: 'minor',
    suit: 'cups',
    meaning: 'Opportunities, choices, wishful thinking, illusion',
    keywords: ['opportunities', 'choices', 'wishful thinking', 'illusion'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 44,
    name: 'Eight of Cups',
    number: '8',
    arcana: 'minor',
    suit: 'cups',
    meaning: 'Disappointment, abandonment, withdrawal, escapism',
    keywords: ['disappointment', 'abandonment', 'withdrawal', 'escapism'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 45,
    name: 'Nine of Cups',
    number: '9',
    arcana: 'minor',
    suit: 'cups',
    meaning: 'Contentment, satisfaction, gratitude, wish come true',
    keywords: ['contentment', 'satisfaction', 'gratitude', 'wish come true'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 46,
    name: 'Ten of Cups',
    number: '10',
    arcana: 'minor',
    suit: 'cups',
    meaning: 'Divine love, blissful relationships, harmony, alignment',
    keywords: ['divine love', 'blissful relationships', 'harmony', 'alignment'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 47,
    name: 'Page of Cups',
    number: 'Page',
    arcana: 'minor',
    suit: 'cups',
    meaning: 'Creative opportunities, curiosity, possibility',
    keywords: ['creative opportunities', 'curiosity', 'possibility'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 48,
    name: 'Knight of Cups',
    number: 'Knight',
    arcana: 'minor',
    suit: 'cups',
    meaning: 'Creativity, romance, charm, imagination',
    keywords: ['creativity', 'romance', 'charm', 'imagination'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 49,
    name: 'Queen of Cups',
    number: 'Queen',
    arcana: 'minor',
    suit: 'cups',
    meaning: 'Compassion, calm, comfort, emotional security',
    keywords: ['compassion', 'calm', 'comfort', 'emotional security'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 50,
    name: 'King of Cups',
    number: 'King',
    arcana: 'minor',
    suit: 'cups',
    meaning: 'Emotionally balanced, compassionate, diplomatic',
    keywords: ['emotionally balanced', 'compassionate', 'diplomatic'],
    image_url: '',
    back_image_url: ''
  },

  // ===== MINOR ARCANA - SWORDS (14 კარტი) =====
  {
    id: 51,
    name: 'Ace of Swords',
    number: 'Ace',
    arcana: 'minor',
    suit: 'swords',
    meaning: 'Breakthroughs, new ideas, mental clarity, success',
    keywords: ['breakthroughs', 'new ideas', 'mental clarity', 'success'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 52,
    name: 'Two of Swords',
    number: '2',
    arcana: 'minor',
    suit: 'swords',
    meaning: 'Difficult decisions, weighing options, stalemate',
    keywords: ['difficult decisions', 'weighing options', 'stalemate'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 53,
    name: 'Three of Swords',
    number: '3',
    arcana: 'minor',
    suit: 'swords',
    meaning: 'Heartbreak, emotional pain, sorrow, grief',
    keywords: ['heartbreak', 'emotional pain', 'sorrow', 'grief'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 54,
    name: 'Four of Swords',
    number: '4',
    arcana: 'minor',
    suit: 'swords',
    meaning: 'Rest, relaxation, meditation, contemplation',
    keywords: ['rest', 'relaxation', 'meditation', 'contemplation'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 55,
    name: 'Five of Swords',
    number: '5',
    arcana: 'minor',
    suit: 'swords',
    meaning: 'Conflict, disagreements, competition, defeat',
    keywords: ['conflict', 'disagreements', 'competition', 'defeat'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 56,
    name: 'Six of Swords',
    number: '6',
    arcana: 'minor',
    suit: 'swords',
    meaning: 'Transition, change, rite of passage, releasing baggage',
    keywords: ['transition', 'change', 'rite of passage', 'releasing baggage'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 57,
    name: 'Seven of Swords',
    number: '7',
    arcana: 'minor',
    suit: 'swords',
    meaning: 'Betrayal, deception, getting away with something',
    keywords: ['betrayal', 'deception', 'getting away with something'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 58,
    name: 'Eight of Swords',
    number: '8',
    arcana: 'minor',
    suit: 'swords',
    meaning: 'Negative thoughts, self-imposed restriction, imprisonment',
    keywords: ['negative thoughts', 'self-imposed restriction', 'imprisonment'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 59,
    name: 'Nine of Swords',
    number: '9',
    arcana: 'minor',
    suit: 'swords',
    meaning: 'Anxiety, worry, fear, depression, nightmares',
    keywords: ['anxiety', 'worry', 'fear', 'depression', 'nightmares'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 60,
    name: 'Ten of Swords',
    number: '10',
    arcana: 'minor',
    suit: 'swords',
    meaning: 'Painful endings, deep wounds, betrayal, loss',
    keywords: ['painful endings', 'deep wounds', 'betrayal', 'loss'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 61,
    name: 'Page of Swords',
    number: 'Page',
    arcana: 'minor',
    suit: 'swords',
    meaning: 'New ideas, curiosity, thirst for knowledge',
    keywords: ['new ideas', 'curiosity', 'thirst for knowledge'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 62,
    name: 'Knight of Swords',
    number: 'Knight',
    arcana: 'minor',
    suit: 'swords',
    meaning: 'Ambitious, action-oriented, driven to succeed',
    keywords: ['ambitious', 'action-oriented', 'driven to succeed'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 63,
    name: 'Queen of Swords',
    number: 'Queen',
    arcana: 'minor',
    suit: 'swords',
    meaning: 'Independent, unbiased judgement, clear boundaries',
    keywords: ['independent', 'unbiased judgement', 'clear boundaries'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 64,
    name: 'King of Swords',
    number: 'King',
    arcana: 'minor',
    suit: 'swords',
    meaning: 'Mental clarity, intellectual power, authority, truth',
    keywords: ['mental clarity', 'intellectual power', 'authority', 'truth'],
    image_url: '',
    back_image_url: ''
  },

  // ===== MINOR ARCANA - PENTACLES (14 კარტი) =====
  {
    id: 65,
    name: 'Ace of Pentacles',
    number: 'Ace',
    arcana: 'minor',
    suit: 'pentacles',
    meaning: 'A new financial or career opportunity, manifestation',
    keywords: ['new financial opportunity', 'career opportunity', 'manifestation'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 66,
    name: 'Two of Pentacles',
    number: '2',
    arcana: 'minor',
    suit: 'pentacles',
    meaning: 'Multiple priorities, time management, prioritization',
    keywords: ['multiple priorities', 'time management', 'prioritization'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 67,
    name: 'Three of Pentacles',
    number: '3',
    arcana: 'minor',
    suit: 'pentacles',
    meaning: 'Teamwork, collaboration, learning, implementation',
    keywords: ['teamwork', 'collaboration', 'learning', 'implementation'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 68,
    name: 'Four of Pentacles',
    number: '4',
    arcana: 'minor',
    suit: 'pentacles',
    meaning: 'Saving money, security, conservatism, scarcity',
    keywords: ['saving money', 'security', 'conservatism', 'scarcity'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 69,
    name: 'Five of Pentacles',
    number: '5',
    arcana: 'minor',
    suit: 'pentacles',
    meaning: 'Financial loss, poverty, lack mindset, isolation',
    keywords: ['financial loss', 'poverty', 'lack mindset', 'isolation'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 70,
    name: 'Six of Pentacles',
    number: '6',
    arcana: 'minor',
    suit: 'pentacles',
    meaning: 'Giving, receiving, sharing wealth, generosity',
    keywords: ['giving', 'receiving', 'sharing wealth', 'generosity'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 71,
    name: 'Seven of Pentacles',
    number: '7',
    arcana: 'minor',
    suit: 'pentacles',
    meaning: 'Long-term view, sustainable results, perseverance',
    keywords: ['long-term view', 'sustainable results', 'perseverance'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 72,
    name: 'Eight of Pentacles',
    number: '8',
    arcana: 'minor',
    suit: 'pentacles',
    meaning: 'Apprenticeship, repetitive tasks, mastery, skill development',
    keywords: ['apprenticeship', 'repetitive tasks', 'mastery', 'skill development'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 73,
    name: 'Nine of Pentacles',
    number: '9',
    arcana: 'minor',
    suit: 'pentacles',
    meaning: 'Abundance, luxury, self-sufficiency, financial independence',
    keywords: ['abundance', 'luxury', 'self-sufficiency', 'financial independence'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 74,
    name: 'Ten of Pentacles',
    number: '10',
    arcana: 'minor',
    suit: 'pentacles',
    meaning: 'Wealth, financial security, family, long-term success',
    keywords: ['wealth', 'financial security', 'family', 'long-term success'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 75,
    name: 'Page of Pentacles',
    number: 'Page',
    arcana: 'minor',
    suit: 'pentacles',
    meaning: 'Manifestation, financial opportunity, skill development',
    keywords: ['manifestation', 'financial opportunity', 'skill development'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 76,
    name: 'Knight of Pentacles',
    number: 'Knight',
    arcana: 'minor',
    suit: 'pentacles',
    meaning: 'Hard work, productivity, routine, conservatism',
    keywords: ['hard work', 'productivity', 'routine', 'conservatism'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 77,
    name: 'Queen of Pentacles',
    number: 'Queen',
    arcana: 'minor',
    suit: 'pentacles',
    meaning: 'Nurturing, practical, providing financially, working parent',
    keywords: ['nurturing', 'practical', 'providing financially', 'working parent'],
    image_url: '',
    back_image_url: ''
  },
  {
    id: 78,
    name: 'King of Pentacles',
    number: 'King',
    arcana: 'minor',
    suit: 'pentacles',
    meaning: 'Wealth, business, leadership, security, discipline',
    keywords: ['wealth', 'business', 'leadership', 'security', 'discipline'],
    image_url: '',
    back_image_url: ''
  }
];

export const SUITS = {
  wands: { name: 'Wands', element: 'Fire', color: '#ff6b35' },
  cups: { name: 'Cups', element: 'Water', color: '#60a5fa' },
  swords: { name: 'Swords', element: 'Air', color: '#e5e7eb' },
  pentacles: { name: 'Pentacles', element: 'Earth', color: '#34d399' }
};