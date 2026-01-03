import { render, screen } from '@testing-library/react';

import type { IOrderbookBidAskPercentageProps } from './orderbook-bid-ask-percentage';
import OrderbookBidAskPercentage from './orderbook-bid-ask-percentage';

describe('OrderbookBidAskPercentage', () => {
  const mockedProps: IOrderbookBidAskPercentageProps = {
    bidPercentage: 60,
    askPercentage: 40,
  };

  it('should render `bid` and `ask` percentages correctly', () => {
    render(<OrderbookBidAskPercentage bidPercentage={mockedProps.bidPercentage} askPercentage={mockedProps.askPercentage} />);

    // Check the text
    expect(screen.getByText('60.00%')).toBeInTheDocument();
    expect(screen.getByText('40.00%')).toBeInTheDocument();
  });

  it('should apply correct `flex values` for bars', () => {
    mockedProps.askPercentage = 30;
    mockedProps.bidPercentage = 70;

    const { container } = render(
      <OrderbookBidAskPercentage bidPercentage={mockedProps.bidPercentage} askPercentage={mockedProps.askPercentage} />,
    );

    const bidBar = container.querySelector('.bg-green-500');
    const askBar = container.querySelector('.bg-red-500');

    expect(bidBar).toHaveStyle({ flex: '70' });
    expect(askBar).toHaveStyle({ flex: '30' });
  });
});
