import type { EPairs } from '@/types';

export const STEP_PRICES: Record<keyof typeof EPairs, string[]> = {
  btcusdc: ['0.01', '0.1', '1', '10', '50', '100', '1000'],
  ethusdc: ['0.01', '0.1', '1', '10', '50', '100'],
};

export const DEFAULT_PRICE_STEP = '0.01';

export const TOOLTIP_HEIGHT = 90;

export const TOOLTIP_WIDTH = 220;

export const ROW_HEIGHT = 25;

export const ROWS_NUMBER_NOT_EXPANDED = 10;

export const ROWS_NUMBER_EXPANDED = 20;

export const ORDERBOOK_LABELS = {
  btcusdc: {
    priceToken: 'USDC',
    amountToken: 'BTC',
    totalToken: 'USDC',
  },
  ethusdc: {
    priceToken: 'USDC',
    amountToken: 'ETH',
    totalToken: 'USDC',
  },
};
