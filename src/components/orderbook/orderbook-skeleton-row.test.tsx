import { render, screen } from '@testing-library/react';

import type { IOrderbookSkeletonRowProps } from './orderbook-skeleton-row';
import OrderbookSkeletonRow from './orderbook-skeleton-row';

import { ROW_HEIGHT } from '@/components/orderbook/consts';

describe('OrderbookSkeletonRow', () => {
  const mockedProps: IOrderbookSkeletonRowProps = {
    index: 3,
  };

  it('should render `Skeleton` with correct top position', () => {
    const { container } = render(<OrderbookSkeletonRow index={mockedProps.index} />);

    const rowDiv = container.firstChild as HTMLElement;
    expect(rowDiv).toBeInTheDocument();

    // Check inline styles
    expect(rowDiv).toHaveStyle({
      top: `${mockedProps.index * ROW_HEIGHT}px`,
      height: `${ROW_HEIGHT}px`,
    });
  });
});
