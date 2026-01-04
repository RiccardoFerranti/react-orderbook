import type { EOrderTypes } from './types';

import { ROW_HEIGHT } from '@/components/orderbook/consts';
import { Skeleton } from '@/components/ui/skeleton';

export interface IOrderbookSkeletonRowProps {
  index: number;
  orderType?: EOrderTypes.bid | EOrderTypes.ask;
}

export default function OrderbookSkeletonRow(props: IOrderbookSkeletonRowProps) {
  const { index, orderType } = props;

  return (
    <div
      data-testid={`${orderType}-skeleton-${index}`}
      className="absolute left-0 w-full p-1"
      style={{
        top: index * ROW_HEIGHT,
        height: ROW_HEIGHT,
      }}
    >
      <Skeleton className="h-full w-full rounded-sm" />
    </div>
  );
}
