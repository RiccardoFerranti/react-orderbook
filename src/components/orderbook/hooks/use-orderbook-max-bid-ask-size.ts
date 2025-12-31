import { useMemo } from 'react';

import type { IOrderBook } from '@/client/use-order-book';

const useOrderbookMaxBidAskSize = ({ bids, asks }: IOrderBook) => {
  const maxBidSize = useMemo(() => {
    if (bids.length === 0) return 1; // prevent divide by 0 / NaN
    return Math.max(...bids.slice(0, 20).map((r) => r.size * r.price));
  }, [bids]);

  const maxAskSize = useMemo(() => {
    if (asks.length === 0) return 1; // prevent divide by 0 / NaN
    return Math.max(...asks.slice(0, 20).map((r) => r.size * r.price));
  }, [asks]);

  return {
    maxBidSize,
    maxAskSize,
  };
};

export default useOrderbookMaxBidAskSize;
