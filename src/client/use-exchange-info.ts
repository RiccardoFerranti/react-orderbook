import { useQuery } from '@tanstack/react-query';

import { BINANCE_EXCHANGE_INFO_URL } from '@/consts/config';

const useExchangeInfo = (pair: string) => {
  if (!pair) throw new Error('The pair is mandatory');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['exchange-info', pair],
    queryFn: async () => {
      const response = await fetch(`${BINANCE_EXCHANGE_INFO_URL}?symbol=${pair}`);
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

  return {
    data,
    isLoading,
    isError,
  };
};

export default useExchangeInfo;
