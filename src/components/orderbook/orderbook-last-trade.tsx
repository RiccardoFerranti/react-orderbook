import { ArrowDown, ArrowUp } from 'lucide-react';

import { EOrderTypes } from '@/components/orderbook/types';
import type { IOrderBookTradeRaw } from '@/components/orderbook/adapters/types';
import { formatNumber } from '@/utils/format-number';
import { cn } from '@/lib/utils';

interface IOrderbookLastTradeProps {
  spread: string;
  spreadPct: string;
  lastTrade: IOrderBookTradeRaw;
}

export default function OrderbookLastTrade(props: IOrderbookLastTradeProps) {
  const { spread, spreadPct, lastTrade } = props;

  const lastTradePrice = lastTrade?.price ? formatNumber(lastTrade.price) : '--';

  return (
    <div className="flex flex-col items-center gap-0.5">
      <p
        className={cn(`text-lg font-medium text-foreground flex items-center gap-2`, {
          'text-red-500': lastTrade?.orderType === EOrderTypes.ask,
          'text-green-500': lastTrade?.orderType === EOrderTypes.bid,
        })}
      >
        {lastTradePrice}
        {lastTrade?.orderType === EOrderTypes.ask ? <ArrowDown /> : <ArrowUp />}
      </p>
      <span className="text-xs text-muted-foreground">
        Spread {spread} ({spreadPct}%)
      </span>
    </div>
  );
}
