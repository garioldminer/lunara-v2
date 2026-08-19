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
 * 🌙 ScreenLoader — loader ჩანს სანამ მონაცემები ბოლომდე არ ჩაიტვირთება,
 * მერე გვერდი მყისიერად ჩანს.
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