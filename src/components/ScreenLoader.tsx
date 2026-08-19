import { ReactNode } from 'react';

type LoaderContext = 'horoscope' | 'tarot' | 'astro' | 'numerology' | 'profile' | 'default';

interface ScreenLoaderProps {
  /** true = ბაზიდან პირველი ჩატვირთვა ამ სესიაში (cache ცარიელია) */
  isLoading: boolean;
  context?: LoaderContext;
  children: ReactNode;
}

/**
 * 🌙 ScreenLoader — loader გამორთულია
 *
 * რატომ:
 * ─ ძველი AppLoader exit animation (0.5s) ანელებდა გვერდის გახსნას
 * ─ useHoroscopeQuery-ს აქვს 2-წუთიანი cache (staleTime: 2min)
 * ─ fetch ~200ms-ში სრულდება — loader ზედმეტია
 *
 * ქცევა:
 * ─ children ყოველთვის ჩანს, loader-ის გარეშე
 * ─ თუ მონაცემები ჯერ არ არის — skeleton/loading state იქნება children-ში
 * ─ თუ cache-შია — ეგრევე ჩანს
 */
export function ScreenLoader({ children }: ScreenLoaderProps) {
  return <>{children}</>;
}