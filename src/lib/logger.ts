// src/lib/logger.ts
// 🧹 ცენტრალური logger - production-ში console გამორთულია
// Development-ში ლოგები ჩანს, Production-ში - არა

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: any[]) => {
    if (isDev) console.error(...args);
  },
};