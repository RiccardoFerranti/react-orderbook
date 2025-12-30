import { Skeleton } from '../ui/skeleton';
import { ROW_HEIGHT } from './consts';

export default function OrderbookSkeletonRow({ index }: { index: number }) {
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
