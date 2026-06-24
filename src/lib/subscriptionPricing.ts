// ============================================
// SUBSCRIPTION PRICING
// ============================================
export const SUBSCRIPTION_PRICING = {
    monthly: {
      stars: 499,
      usd: 999, // cents
      days: 30,
      label: 'Monthly',
      description: 'Unlimited readings + AI Insights',
      savings: null
    },
    yearly: {
      stars: 3999,
      usd: 7999, // cents
      days: 365,
      label: 'Yearly',
      description: 'Full year access - Best value!',
      savings: 'SAVE 33%'
    }
  } as const;
  
  export type SubscriptionPlanType = keyof typeof SUBSCRIPTION_PRICING;