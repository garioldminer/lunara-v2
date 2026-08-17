import { ReactNode } from 'react';
import { AppLoader } from './AppLoader';

type LoaderContext = 'horoscope' | 'tarot' | 'astro' | 'numerology' | 'profile' | 'default';

interface ScreenLoaderProps {
  /** true = ბაზიდან პირველი ჩატვირთვა ამ სესიაში (cache ცარიელია) */
  isLoading: boolean;
  context?: LoaderContext;
  children: ReactNode;
}

/**
 * 🌙 ScreenLoader — უნივერსალური wrapper ყველა გვერდისთვის.
 *
 * ლოგიკა:
 * ─ isLoading=true  → AppLoader (მანდალა) ჩანს,
 *   children რჩება mounted მაგრამ უხილავი
 *   (მონაცემები იტვირთება ფონში, layout მზადდება)
 * ─ isLoading=false → AppLoader გლუვად ქრება (exit ანიმაცია),
 *   children ჩანს — ეკრანი უკვე "მოერგა"
 */
export function ScreenLoader({ isLoading, context = 'default', children }: ScreenLoaderProps) {
  return (
    <>
      <AppLoader isLoading={isLoading} context={context} />
      <div
        aria-hidden={isLoading}
        style={{
          visibility: isLoading ? 'hidden' : 'visible',
          height: '100%',
        }}
      >
        {children}
      </div>
    </>
  );
}