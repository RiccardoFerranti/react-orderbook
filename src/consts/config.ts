export const BINANCE_WS_URL = process.env.NEXT_PUBLIC_BINANCE_WS_URL;
export const BINANCE_EXCHANGE_INFO_URL = process.env.NEXT_PUBLIC_BINANCE_EXCHANGE_INFO_URL;

if (!BINANCE_WS_URL) {
  throw new Error('NEXT_PUBLIC_BINANCE_WS_URL is not defined');
}

if (!BINANCE_EXCHANGE_INFO_URL) {
  throw new Error('NEXT_PUBLIC_BINANCE_EXCHANGE_INFO_URL is not defined');
}
