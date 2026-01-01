import { forwardRef, memo } from 'react';

import { EOrderTypes, type TOrderType } from '@/components/orderbook/types';
import { ROW_HEIGHT } from '@/components/orderbook/consts';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/utils/format-number';
import formatNumberTruncate from '@/utils/format-number-truncate';

interface IOrderBookRowProps {
  price: number;
  size: number;
  handleHover: (price: number, orderType: TOrderType, index: number) => void;
  handleLeave: () => void;
  orderType: TOrderType;
  isRounding: boolean;
  maxSize: number;
  index: number;
}

const OrderBookRow = forwardRef<HTMLDivElement, IOrderBookRowProps>(
  ({ price, size, handleHover, handleLeave, orderType, isRounding, maxSize, index }, ref) => {
    const displayBaseFormatted = formatNumber(price, 2);
    const displayQuoteFormatted = formatNumber(size, 5);
    const safeMaxSize = maxSize || 1;

    const displayAvgPriceFormatted = isRounding ? formatNumberTruncate(price * size) : formatNumber(price * size, 3);

    return (
      <div
        key={price}
        ref={ref}
        style={{
          ...(orderType === EOrderTypes.ask ? { bottom: index * ROW_HEIGHT } : { top: index * ROW_HEIGHT }),
          height: ROW_HEIGHT,
        }}
        className="absolute left-0 w-full cursor-pointer py-0.5"
        onPointerEnter={() => handleHover(price, orderType, index)}
        onPointerLeave={handleLeave}
      >
        <div
          className={cn(
            `absolute right-0 top-0 h-full z-0 ${orderType === EOrderTypes.bid ? 'bg-green-500/10' : 'bg-red-500/10'}`,
          )}
          style={{
            width: `${((size * price) / safeMaxSize) * 100}%`,
          }}
        />
        <div className="relative flex w-full *:text-sm">
          <span className={cn(`flex-1 text-start ${orderType === EOrderTypes.bid ? 'text-green-500' : 'text-red-500'}`)}>
            {displayBaseFormatted}
          </span>
          <span className="flex-1 text-end text-muted-foreground">{displayQuoteFormatted}</span>
          <span className="flex-1 text-end text-muted-foreground">{displayAvgPriceFormatted}</span>
        </div>
      </div>
    );
  },
);

export default memo(OrderBookRow);
