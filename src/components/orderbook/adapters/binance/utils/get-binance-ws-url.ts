/**
 * Retrieves the Binance WebSocket URL from environment variables.
 *
 * @throws {Error} If NEXT_PUBLIC_BINANCE_WS_URL is not defined.
 * @returns {string} The Binance WebSocket URL.
 */
export function getBinanceWsUrl(): string {
  const url = process.env.NEXT_PUBLIC_BINANCE_WS_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_BINANCE_WS_URL is not defined');
  }
  return url;
}
