import { forwardRef, memo } from 'react';

import { EOrderTypes, type TOrderType } from './types';

import { cn } from '@/lib/utils';
import { formatNumber } from '@/utils/format-number';
import formatNumberTruncate from '@/utils/format-number-truncate';

interface IOrderBookRowProps {
  price: number;
  size: number;
  handleHover: (price: number, orderType: TOrderType) => void;
  handleLeave: () => void;
  orderType: TOrderType;
  rowHovered: number | null;
  isRounding: boolean;
  // maxSize: number;
}

const OrderBookRow = forwardRef<HTMLDivElement, IOrderBookRowProps>(
  ({ price, size, handleHover, handleLeave, rowHovered, orderType, isRounding }, ref) => {
    const displayBaseFormatted = formatNumber(price, 2);
    const displayQuoteFormatted = formatNumber(size, 5);

    // const safeMaxSize = maxSize || 1;

    const displayAvgPriceFormatted = isRounding ? formatNumberTruncate(price * size) : formatNumber(price * size, 3);
    // console.log('size', size);
    // console.log('maxSize', maxSize);
    // console.log('(size / maxSize) * 100', (size / maxSize) * 100);
    return (
      <div
        key={price}
        ref={ref}
        className={cn(
          `flex ${orderType === EOrderTypes.bid ? 'text-green-500' : 'text-red-500'} cursor-pointer py-0.5 
          transition-colors duration-200 relative *:text-sm`,
          {
            'after:pointer-events-none after:content-[""] after:absolute after:left-0 after:w-full':
              (rowHovered ?? 0) >= price || (rowHovered ?? 0) === price,
            'after:h-full after:bg-(--card-foreground)/5': (rowHovered ?? 0) >= price,
            'after:border-dotted after:border-border': (rowHovered ?? 0) === price,
            'after:top-0 after:border-t': orderType === EOrderTypes.bid && rowHovered === price,
            'after:top-0': orderType === EOrderTypes.bid && (rowHovered ?? 0) >= price,
            'after:bottom-0 after:border-b': orderType === EOrderTypes.ask && rowHovered === price,
            'after:bottom-0': orderType === EOrderTypes.ask && (rowHovered ?? 0) >= price,
          },
        )}
        onPointerEnter={() => handleHover(price, orderType)}
        onPointerLeave={handleLeave}
      >
        {/* <div
          className={cn(`absolute left-0 top-0 h-full ${orderType === EOrderTypes.bid ? 'bg-green-500' : 'bg-red-500'}`)}
          style={{ width: `${((size * price) / safeMaxSize) * 100}%` }}
        /> */}
        <div className="relative flex w-full">
          <span className="flex-1 text-start">{displayBaseFormatted}</span>
          <span className="flex-1 text-end">{displayQuoteFormatted}</span>
          <span className="flex-1 text-end">{displayAvgPriceFormatted}</span>
        </div>
      </div>
    );
  },
);

export default memo(OrderBookRow);
