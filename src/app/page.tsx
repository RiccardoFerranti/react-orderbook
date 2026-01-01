'use client';

import { useState } from 'react';

import OrderBook from '@/components/orderbook/orderbook';
import { EPairs } from '@/types';
import PairsDropdown from '@/components/pairs-dropdown/pairs-dropdown';
import { useOrderBook } from '@/client/use-order-book';
import { binanceOrderBookAdapter } from '@/components/orderbook/adapters/binance';
import { useOrderBookTrades } from '@/client/use-order-book-trade';
import useExchangeInfo from '@/client/use-exchange-info';
import ConnectStatus from '@/components/connect-status/connect-status';

export default function Home() {
  const [pair, setPair] = useState<EPairs>(EPairs.btcusdc);

  const handleSetPair = (newValue: string) => {
    if (newValue in EPairs) setPair(newValue as EPairs);
  };

  const {
    orderBook: { bids, asks },
    isInitialOrdersLoading,
    status: ordersStatus,
  } = useOrderBook({ pair, adapter: binanceOrderBookAdapter });

  const {
    price,
    orderType,
    status: tradesStatus,
  } = useOrderBookTrades({
    pair,
    adapter: binanceOrderBookAdapter,
  });

  const { data } = useExchangeInfo(pair);

  return (
    <div className="min-h-screen font-sans bg-(--background)/30">
      <main className="flex min-h-screen w-full flex-col items-center justify-between py-8 px-4">
        <div className="w-full max-w-md flex flex-col gap-8">
          <div className="relative w-full flex flex-col items-center justify-between">
            <PairsDropdown value={pair} handleSetPair={handleSetPair} />
            <ConnectStatus status={tradesStatus} className="absolute top-0 right-0" />
          </div>
          <OrderBook
            pair={pair}
            bids={bids}
            asks={asks}
            lastTradePrice={price}
            orderType={orderType}
            tickSize={data?.tickSize}
            stepSize={data?.stepSize}
            capabilities={binanceOrderBookAdapter.capabilities}
            isInitialOrdersLoading={isInitialOrdersLoading}
            status={ordersStatus}
          />
        </div>
      </main>
    </div>
  );
}
