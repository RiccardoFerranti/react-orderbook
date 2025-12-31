'use client';

import { useState } from 'react';

import OrderBook from '@/components/orderbook/orderbook';
import { EPairs } from '@/types';
import PairsDropdown from '@/components/pairs-dropdown/pairs-dropdown';
import { useOrderBook } from '@/client/use-order-book';
import { binanceOrderBookAdapter } from '@/components/orderbook/adapters/binance';
import { useOrderBookTrades } from '@/client/use-order-book-trade';
import useExchangeInfo from '@/client/use-exchange-info';

export default function Home() {
  const [pair, setPair] = useState<EPairs>(EPairs.btcusdc);

  const handleSetPair = (newValue: string) => {
    if (newValue in EPairs) setPair(newValue as EPairs);
  };

  const {
    orderBook: { bids, asks },
    isLoading,
  } = useOrderBook(pair, binanceOrderBookAdapter);

  const lastTrade = useOrderBookTrades(pair, binanceOrderBookAdapter);

  const { data } = useExchangeInfo(pair);

  return (
    <div className="min-h-screen font-sans bg-(--background)/30">
      <main className="flex min-h-screen w-full flex-col items-center justify-between py-8 px-4 gap-8">
        <PairsDropdown value={pair} handleSetPair={handleSetPair} />
        <OrderBook
          pair={pair}
          bids={bids}
          asks={asks}
          isOrdersLoading={isLoading}
          lastTrade={lastTrade}
          tickSize={data?.tickSize}
          stepSize={data?.stepSize}
          capabilities={binanceOrderBookAdapter.capabilities}
        />
      </main>
    </div>
  );
}
