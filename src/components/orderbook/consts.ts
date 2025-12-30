import type { EPairs } from '@/types';

export const STEP_PRICES: Record<keyof typeof EPairs, string[]> = {
  btcusdc: ['0.01', '0.1', '1', '10', '50', '100', '1000'],
  ethusdc: ['0.01', '0.1', '1', '10', '50', '100'],
};

export const TOOLTIP_HEIGHT = 90;

export const TOOLTIP_WIDTH = 220;
