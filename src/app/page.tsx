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

  const { price, orderType } = useOrderBookTrades({
    pair,
    adapter: binanceOrderBookAdapter,
  });

  const { data } = useExchangeInfo(pair);

  return (
    <div className="min-h-screen bg-(--background)/30 font-sans">
      <main className="flex min-h-screen w-full flex-col items-center justify-between px-4 py-8">
        <div className="flex w-full max-w-md flex-col gap-8">
          <div className="relative flex w-full flex-col items-center justify-between">
            <PairsDropdown value={pair} handleSetPair={handleSetPair} />
            <ConnectStatus status={ordersStatus} className="absolute top-0 right-0" />
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
