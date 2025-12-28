import { useQuery } from '@tanstack/react-query';

import { BINANCE_EXCHANGE_INFO_URL } from '@/consts/config';
/**
 * React hook to fetch and parse exchange info for a specific trading pair from Binance API.
 *
 * @param {string} pair - The trading pair symbol (e.g., 'BTCUSDC').
 * @returns {{
 *   data: { tickSize?: string, stepSize?: string } | undefined;
 *   isLoading: boolean;
 *   isError: boolean;
 * }} An object containing exchange info data, loading and error status.
 *
 * @throws Will throw an error if the pair parameter is not provided, or if the API response does not contain the symbol.
 *
 * @example
 * const { data, isLoading, isError } = useExchangeInfo('BTCUSDC');
 * if (data) {
 *   console.log(data.tickSize, data.stepSize);
 * }
 */

const useExchangeInfo = (pair: string) => {
  if (!pair) throw new Error('The pair is mandatory');

  const formattedPair = pair.toUpperCase();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['exchange-info', formattedPair],
    queryFn: async () => {
      const response = await fetch(`${BINANCE_EXCHANGE_INFO_URL}?symbol=${formattedPair}`);
      if (!response.ok) throw new Error('Failed to fetch exchange info');
      const json = await response.json();
      return json;
    },
    select: (data) => {
      const symbol = data.symbols?.[0];
      if (!symbol) throw new Error('Symbol not found');

      const priceFilter = symbol.filters.find((f: any) => f.filterType === 'PRICE_FILTER');

      const lotSizeFilter = symbol.filters.find((f: any) => f.filterType === 'LOT_SIZE');

      return {
        tickSize: priceFilter?.tickSize,
        stepSize: lotSizeFilter?.stepSize,
      };
    },
  });

  console.log(data);
  return {
    data,
    isLoading,
    isError,
  };
};

export default useExchangeInfo;
