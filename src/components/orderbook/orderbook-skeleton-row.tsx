import { ROW_HEIGHT } from '@/components/orderbook/consts';
import { Skeleton } from '@/components/ui/skeleton';

export interface IOrderbookSkeletonRowProps {
  index: number;
}

export default function OrderbookSkeletonRow(props: IOrderbookSkeletonRowProps) {
  const { index } = props;

  return (
    <div
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
