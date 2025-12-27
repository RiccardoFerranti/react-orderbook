import type { EPairsTypes } from './types';

export const STEP_PRICES: Record<keyof typeof EPairsTypes, string[]> = {
  btcusdc: ['0.01', '0.1', '1', '10', '50', '100', '1000'],
  ethusdc: ['0.01', '0.1', '1', '10', '50', '100'],
};
