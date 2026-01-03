import { render, screen } from '@testing-library/react';

import type { IOrderbookLastTradeProps } from './orderbook-last-trade';
import OrderbookLastTrade from './orderbook-last-trade';

import { EOrderTypes } from '@/components/orderbook/types';

jest.mock('@number-flow/react', () => {
  return {
    __esModule: true,
    default: ({ value }: { value: number }) => <span>{value.toLocaleString('en-IN')}</span>,
    continuous: {},
  };
});

describe('OrderbookLastTrade', () => {
  let mockedProps: IOrderbookLastTradeProps;

  beforeEach(() => {
    mockedProps = {
      spread: '12.5',
      spreadPct: '0.42',
      lastTradePrice: 25000,
      orderType: EOrderTypes.bid,
    };
  });

  it('should render skeleton when `lastTradePrice` is not provided', () => {
    render(<OrderbookLastTrade spread={null} spreadPct={null} lastTradePrice={undefined} orderType={undefined} />);

    // No price text
    expect(screen.queryByTestId('orderbook-last-trade')).not.toBeInTheDocument();

    // Spread skeletons
    expect(screen.queryByText(/spread/i)).toBeInTheDocument();
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });

  it('should render `last trade price` with `green color` and `up arrow` for bid', () => {
    render(<OrderbookLastTrade {...mockedProps} />);

    expect(screen.getByText(/25,000/)).toBeInTheDocument();
    expect(screen.getByTestId('orderbook-last-trade')).toHaveClass('text-green-500');

    // Spread values
    expect(screen.getByText('$12.5')).toBeInTheDocument();
    expect(screen.getByText('(0.42%)')).toBeInTheDocument();
  });

  it('should render `last trade price` with `red color` and `down arrow` for ask', () => {
    mockedProps.orderType = EOrderTypes.ask;
    render(<OrderbookLastTrade {...mockedProps} />);

    expect(screen.getByText(/25,000/)).toBeInTheDocument();
    expect(screen.getByTestId('orderbook-last-trade')).toHaveClass('text-red-500');
  });

  it('should render `spread skeletons` when `spread data` is missing', () => {
    mockedProps.spread = null;
    mockedProps.spreadPct = null;

    render(<OrderbookLastTrade {...mockedProps} />);

    expect(screen.getByText(/25,000/)).toBeInTheDocument();

    // Skeletons instead of values
    expect(screen.queryByText('$')).not.toBeInTheDocument();
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });
});
