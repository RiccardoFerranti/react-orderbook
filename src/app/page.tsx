'use client';

import { useState } from 'react';

import OrderBook from '@/components/orderbook/orderbook';
import { EPairs } from '@/types';
import PairsDropdown from '@/components/pairs-dropdown/pairs-dropdown';

export default function Home() {
  const [pair, setPair] = useState<EPairs>(EPairs.btcusdc);

  const handleSetPair = (newValue: string) => {
    if (newValue in EPairs) setPair(newValue as EPairs);
  };

  return (
    <div className="min-h-screen font-sans bg-(--background)/30">
      <main className="flex min-h-screen w-full flex-col items-center justify-between py-8 px-4 gap-8">
        <PairsDropdown value={pair} handleSetPair={handleSetPair} />
        <OrderBook pair={pair} />
      </main>
    </div>
  );
}
