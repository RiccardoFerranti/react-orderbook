import { ArrowDown, ArrowUp } from 'lucide-react';

import { EOrderTypes } from './types';

import { useOrderBookTrade } from '@/client/use-order-book-trade';
import { formatNumber } from '@/utils/format-number';
import type { EPairs } from '@/types';
import { cn } from '@/lib/utils';

interface IOrderbookLastTradeProps {
  spread: string;
  spreadPct: string;
  pair: EPairs;
}

export default function OrderbookLastTrade(props: IOrderbookLastTradeProps) {
  const { spread, spreadPct, pair } = props;

  const tradeData = useOrderBookTrade(pair);

  const lastTrade = tradeData?.value ? formatNumber(tradeData?.value) : '--';

  return (
    <div className="flex flex-col items-center gap-0.5">
      <p
        className={cn(`text-lg font-medium text-foreground flex items-center gap-2`, {
          'text-red-500': tradeData?.orderType === EOrderTypes.ask,
          'text-green-500': tradeData?.orderType === EOrderTypes.bid,
        })}
      >
        {lastTrade}
        {tradeData?.orderType === EOrderTypes.ask ? <ArrowDown /> : <ArrowUp />}
      </p>
      <span className="text-xs text-muted-foreground">
        Spread {spread} ({spreadPct}%)
      </span>
    </div>
  );
}
