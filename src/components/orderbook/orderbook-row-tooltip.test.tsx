import { render, screen } from '@testing-library/react';

import type { IOrderbookRowTooltipProps } from './orderbook-row-tooltip';
import OrderbookRowTooltip from './orderbook-row-tooltip';

describe('OrderbookRowTooltip', () => {
  const mockedProps: IOrderbookRowTooltipProps = {
    // raw scaled values
    tooltipData: {
      avgPrice: 1234500,
      base: 250000,
      quote: 98765,
    },
    sizeDecimals: 5,
    tickDecimals: 2,
  };

  it('renders formatted values correctly', () => {
    render(
      <OrderbookRowTooltip
        tooltipData={mockedProps.tooltipData}
        sizeDecimals={mockedProps.sizeDecimals}
        tickDecimals={mockedProps.tickDecimals}
      />,
    );

    // Avg Price
    expect(screen.getByText(/Avg Price:/)).toBeInTheDocument();
    expect(screen.getByText(/≈/)).toBeInTheDocument();
    expect(screen.getByText(/12,345/)).toBeInTheDocument();

    // Sum BTC (base)
    expect(screen.getByText(/Sum BTC:/)).toBeInTheDocument();
    expect(screen.getByText('2.50000')).toBeInTheDocument();

    // Sum USDC (quote)
    expect(screen.getByText(/Sum USDC:/)).toBeInTheDocument();
    expect(screen.getByText('988')).toBeInTheDocument(); // 987.65 rounded with 0 decimals
  });
});
