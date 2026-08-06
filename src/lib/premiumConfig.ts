import { supabase } from './supabase';

// ============================================
// TYPES
// ============================================
export interface SubscriptionPlan {
  id: string;
  plan_type: 'monthly' | 'yearly';
  stars: number;
  usd_cents: number;
  days: number;
  label: string;
  description: string;
  savings_text: string | null;
  is_active: boolean;
}

export interface PremiumFeature {
  id: string;
  feature_id: string;
  name: string;
  description: string;
  stars: number;
  usd_cents: number;
  type: 'subscription' | 'single';
  icon: string;
  is_active: boolean;
}

export interface PremiumBenefit {
  id: string;
  icon: string;
  text: string;
}

// ============================================
// CACHE (performance)
// ============================================
interface Cache {
  plans: SubscriptionPlan[] | null;
  features: PremiumFeature[] | null;
  benefits: PremiumBenefit[] | null;
  lastFetch: number;
}

const CACHE_TTL_MS = 60_000; // 1 წუთი
const cache: Cache = {
  plans: null,
  features: null,
  benefits: null,
  lastFetch: 0
};

// ============================================
// FALLBACK (თუ DB ჩავარდა - hardcoded)
// ============================================
const FALLBACK_PLANS: SubscriptionPlan[] = [
  { id: 'fallback-1', plan_type: 'monthly', stars: 499, usd_cents: 999, days: 30, label: 'Premium Monthly', description: 'Unlimited readings + AI Insights', savings_text: null, is_active: true },
  { id: 'fallback-2', plan_type: 'yearly', stars: 3999, usd_cents: 7999, days: 365, label: 'Premium Yearly', description: 'Full year access - Best value!', savings_text: 'SAVE 33%', is_active: true }
];

const FALLBACK_FEATURES: PremiumFeature[] = [
  { id: 'f-1', feature_id: 'subscription_monthly', name: 'Premium Monthly', description: 'Unlimited readings + AI Insights', stars: 499, usd_cents: 999, type: 'subscription', icon: '💎', is_active: true },
  { id: 'f-2', feature_id: 'subscription_yearly', name: 'Premium Yearly', description: 'Save 33% - Full year access', stars: 3999, usd_cents: 7999, type: 'subscription', icon: '💎', is_active: true },
  { id: 'f-3', feature_id: 'celtic_cross', name: 'Celtic Cross Reading', description: '10-card deep analysis', stars: 299, usd_cents: 299, type: 'single', icon: '✝️', is_active: true },
  { id: 'f-4', feature_id: 'horseshoe', name: 'Horseshoe Reading', description: '7-card life path analysis', stars: 100, usd_cents: 199, type: 'single', icon: '🐎', is_active: true },
  { id: 'f-5', feature_id: 'relationship', name: 'Relationship Spread', description: '6-card love analysis', stars: 200, usd_cents: 399, type: 'single', icon: '❤️', is_active: true },
  { id: 'f-6', feature_id: 'ai_weekly', name: 'AI Weekly Insight', description: 'Personalized weekly analysis', stars: 250, usd_cents: 499, type: 'single', icon: '🧠', is_active: true }
];

const FALLBACK_BENEFITS: PremiumBenefit[] = [
  { id: 'b-1', icon: '🔮', text: 'Unlimited readings' },
  { id: 'b-2', icon: '🃏', text: 'Full 78-card collection' },
  { id: 'b-3', icon: '🌙', text: 'Daily + weekly horoscope' },
  { id: 'b-4', icon: '🔢', text: 'Complete numerology' },
  { id: 'b-5', icon: '💎', text: '50+ crystals' },
  { id: 'b-6', icon: '🌕', text: 'Moon rituals' },
  { id: 'b-7', icon: '📊', text: 'Birth chart analysis' },
  { id: 'b-8', icon: '🤖', text: 'AI-powered insights' },
  { id: 'b-9', icon: '🚫', text: 'No ads' }
];

// ============================================
// LOADERS
// ============================================
const isCacheValid = (): boolean => {
  return cache.plans !== null && cache.features !== null && cache.benefits !== null 
    && (Date.now() - cache.lastFetch < CACHE_TTL_MS);
};

const loadFromDB = async (): Promise<void> => {
  if (!supabase) {
    console.warn('⚠️ Supabase not available, using fallback');
    return;
  }
  
  try {
    const [plansRes, featuresRes, benefitsRes] = await Promise.all([
      supabase.from('subscription_plans').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('premium_features').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('premium_benefits').select('*').eq('is_active', true).order('sort_order')
    ]);
    
    if (plansRes.data && plansRes.data.length > 0) cache.plans = plansRes.data as SubscriptionPlan[];
    if (featuresRes.data && featuresRes.data.length > 0) cache.features = featuresRes.data as PremiumFeature[];
    if (benefitsRes.data && benefitsRes.data.length > 0) cache.benefits = benefitsRes.data as PremiumBenefit[];
    
    cache.lastFetch = Date.now();
    console.log('✅ Premium config loaded from DB');
  } catch (err) {
    console.error('❌ Failed to load premium config, using fallback:', err);
  }
};

// ============================================
// PUBLIC API (რომელსაც ყველა კომპონენტი იყენებს)
// ============================================
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  if (!isCacheValid()) await loadFromDB();
  return cache.plans && cache.plans.length > 0 ? cache.plans : FALLBACK_PLANS;
};

export const getPremiumFeatures = async (): Promise<PremiumFeature[]> => {
  if (!isCacheValid()) await loadFromDB();
  return cache.features && cache.features.length > 0 ? cache.features : FALLBACK_FEATURES;
};

export const getPremiumBenefits = async (): Promise<PremiumBenefit[]> => {
  if (!isCacheValid()) await loadFromDB();
  return cache.benefits && cache.benefits.length > 0 ? cache.benefits : FALLBACK_BENEFITS;
};

// ============================================
// HELPERS (ერთეული feature-ის / plan-ის წასაკითხად)
// ============================================
export const getFeatureById = async (featureId: string): Promise<PremiumFeature | null> => {
  const features = await getPremiumFeatures();
  return features.find(f => f.feature_id === featureId) || null;
};

export const getPlanByType = async (planType: 'monthly' | 'yearly'): Promise<SubscriptionPlan | null> => {
  const plans = await getSubscriptionPlans();
  return plans.find(p => p.plan_type === planType) || null;
};

export const getStarsForFeature = async (featureId: string): Promise<number> => {
  const feature = await getFeatureById(featureId);
  return feature?.stars || 0;
};

export const getStarsForPlan = async (planType: 'monthly' | 'yearly'): Promise<number> => {
  const plan = await getPlanByType(planType);
  return plan?.stars || 0;
};

// ============================================
// CACHE INVALIDATION (admin-ისთვის, როცა რამეს შეცვლის)
// ============================================
export const invalidatePremiumCache = (): void => {
  cache.plans = null;
  cache.features = null;
  cache.benefits = null;
  cache.lastFetch = 0;
  console.log('🔄 Premium config cache invalidated');
};