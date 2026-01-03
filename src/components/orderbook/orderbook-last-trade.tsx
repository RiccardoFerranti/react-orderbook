import { ArrowDown, ArrowUp } from 'lucide-react';
import NumberFlow, { continuous } from '@number-flow/react';

import { Skeleton } from '../ui/skeleton';

import { EOrderTypes } from '@/components/orderbook/types';
import { cn } from '@/lib/utils';

export interface IOrderbookLastTradeProps {
  spread: string | null;
  spreadPct: string | null;
  lastTradePrice?: number;
  orderType?: EOrderTypes.bid | EOrderTypes.ask;
}

export default function OrderbookLastTrade(props: IOrderbookLastTradeProps) {
  const { spread, spreadPct, lastTradePrice, orderType } = props;

  return (
    <div className="flex flex-col items-center gap-2">
      {lastTradePrice ? (
        <p
          data-testid="orderbook-last-trade"
          className={cn('text-foreground flex items-center justify-center gap-2 text-lg font-medium', {
            'text-red-500': orderType === EOrderTypes.ask,
            'text-green-500': orderType === EOrderTypes.bid,
          })}
        >
          <NumberFlow
            value={lastTradePrice}
            plugins={[continuous]}
            format={{
              style: 'decimal',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }}
            locales="en-IN"
          />
          {orderType === EOrderTypes.ask ? <ArrowDown /> : <ArrowUp />}
        </p>
      ) : (
        <Skeleton className="my-1 h-5 w-30" />
      )}
      <div className="text-muted-foreground flex items-center justify-center gap-1 text-xs">
        <span>Spread</span>
        <span>{spread ? `$${spread}` : <Skeleton className="h-2.5 w-8" />}</span>
        <span>{spreadPct ? `(${spreadPct}%)` : <Skeleton className="h-2.5 w-14" />}</span>
      </div>
    </div>
  );
}
