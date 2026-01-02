export const BINANCE_WS_URL = process.env.NEXT_PUBLIC_BINANCE_WS_URL;
export const BINANCE_EXCHANGE_INFO_URL = process.env.NEXT_PUBLIC_BINANCE_EXCHANGE_INFO_URL;
export const ENV = process.env.NEXT_PUBLIC_ENV;

export const BINANCE_DEPTH_LEVEL = process.env.NEXT_PUBLIC_BINANCE_DEPTH_LEVEL
  ? Number(process.env.NEXT_PUBLIC_BINANCE_DEPTH_LEVEL)
  : 20;

export const BINANCE_UPDATE_MS = process.env.NEXT_PUBLIC_BINANCE_UPDATE_MS
  ? Number(process.env.NEXT_PUBLIC_BINANCE_UPDATE_MS)
  : 100;

if (!BINANCE_WS_URL) {
  throw new Error('NEXT_PUBLIC_BINANCE_WS_URL is not defined');
}

if (!BINANCE_EXCHANGE_INFO_URL) {
  throw new Error('NEXT_PUBLIC_BINANCE_EXCHANGE_INFO_URL is not defined');
}
