/**
 * Retrieves the Binance Exchange Info URL from environment variables.
 *
 * @throws {Error} If NEXT_PUBLIC_BINANCE_EXCHANGE_INFO_URL is not defined.
 * @returns {string} The Binance Exchange Info URL.
 */

export function getBinanceExchangeInfoUrl(): string {
  const url = process.env.NEXT_PUBLIC_BINANCE_EXCHANGE_INFO_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_BINANCE_EXCHANGE_INFO_URL is not defined');
  }
  return url;
}
