export const ENV = process.env.NEXT_PUBLIC_ENV;

export const BINANCE_DEPTH_LEVEL = process.env.NEXT_PUBLIC_BINANCE_DEPTH_LEVEL
  ? Number(process.env.NEXT_PUBLIC_BINANCE_DEPTH_LEVEL)
  : 20;

export const BINANCE_UPDATE_MS = process.env.NEXT_PUBLIC_BINANCE_UPDATE_MS
  ? Number(process.env.NEXT_PUBLIC_BINANCE_UPDATE_MS)
  : 100;
