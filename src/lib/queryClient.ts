import { QueryClient } from '@tanstack/react-query';

/**
 * 🌙 LUNARA — Global Query Client
 *
 * Caching სტრატეგია (session-scoped, შენი ლოგიკით):
 * ─ Memory-only cache → WebView დახურვისას ავტომატურად იშლება (ახალი ციკლი)
 * ─ staleTime: 0 → მონაცემები ყოველთვის "ლაივ" (ფონური განახლება)
 * ─ gcTime: 10 წუთი → გამოუყენებელი cache იშლება სესიაში
 * ─ refetchOnMount: 'always' → ეკრანზე დაბრუნებისას fresh შემოწმება
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 10 * 60 * 1000,
      refetchOnMount: 'always',
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    },
  },
});

/**
 * 🛡️ Edge-case დაზღვევა:
 * app დიდი ხნით background-ში რომ დარჩეს (>5 წუთი),
 * დაბრუნებისას cache იშლება → ახალი ციკლი.
 * სწრაფი app-switch → cache რჩება → მყისიერი დაბრუნება.
 */
let hiddenAt: number | null = null;
const BACKGROUND_THRESHOLD = 5 * 60 * 1000; // 5 წუთი

export function initSessionGuard(): () => void {
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now();
    } else if (document.visibilityState === 'visible') {
      if (hiddenAt !== null && Date.now() - hiddenAt > BACKGROUND_THRESHOLD) {
        queryClient.clear();
      }
      hiddenAt = null;
    }
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  return () => document.removeEventListener('visibilitychange', onVisibilityChange);
}