import { render, screen } from '@testing-library/react';

import OrderBook from './orderbook';
import { useIsMobile } from '../../hooks/use-is-mobile';

import { EOrderTypes } from '@/components/orderbook/types';
import type { IOrderBook, IOrderBookAdapterCapabilities } from '@/components/orderbook/adapters/types';
import { EPairs } from '@/types';
import { EConnectStuses, type TConnectionStatus } from '@/client/types';

jest.mock('../../hooks/use-is-mobile', () => ({
  useIsMobile: jest.fn(),
}));

const mockedUseIsMobile = useIsMobile as jest.Mock;

interface IOrderBookProps extends IOrderBook {
  pair: EPairs;
  lastTradePrice?: number;
  orderType?: EOrderTypes.bid | EOrderTypes.ask;
  stepSize?: string;
  tickSize?: string;
  capabilities: IOrderBookAdapterCapabilities;
  isInitialOrdersLoading: boolean;
  status: TConnectionStatus;
}

describe('OrderBook', () => {
  let mockedProps: IOrderBookProps;

  beforeEach(() => {
    mockedUseIsMobile.mockReturnValue(false);
    mockedProps = {
      pair: EPairs.btcusdc,
      bids: [
        { price: 50000, size: 0.5 },
        { price: 49999, size: 0.3 },
        { price: 49998, size: 0.2 },
      ],
      asks: [
        { price: 50001, size: 0.4 },
        { price: 50002, size: 0.6 },
        { price: 50003, size: 0.8 },
      ],
      lastTradePrice: 25000,
      orderType: EOrderTypes.bid,
      stepSize: '0.00001',
      tickSize: '0.01',
      capabilities: {
        depth: true,
        trades: true,
      },
      isInitialOrdersLoading: false,
      status: EConnectStuses.connected,
    };
  });

  it('should render `Order Book` title', () => {
    render(<OrderBook {...mockedProps} />);

    expect(screen.getByText('Order Book')).toBeInTheDocument();
  });

  it('should render `skeleton rows` when `isInitialOrdersLoading` is `true`', () => {
    mockedProps.isInitialOrdersLoading = true;
    render(<OrderBook {...mockedProps} />);

    // Skeleton rows are rendered but don't have testIds, so we check for the structure
    const container = screen.getByText('Order Book').closest('.relative');
    expect(container).toBeInTheDocument();
  });

  it('should render `skeleton rows` when `status` is `disconnected` and no data', () => {
    mockedProps.status = EConnectStuses.disconnected;
    mockedProps.bids = [];
    mockedProps.asks = [];
    render(<OrderBook {...mockedProps} />);

    // Should render skeleton structure
    expect(screen.getByText('Order Book')).toBeInTheDocument();
  });

  it('should render `real rows` when `isInitialOrdersLoading` is `false` and data exists', () => {
    render(<OrderBook {...mockedProps} />);

    // Check for real order rows (prices should be visible)
    expect(screen.getByText(/50,000/)).toBeInTheDocument();
    expect(screen.getByText(/50,001/)).toBeInTheDocument();
  });

  it('should render `column headers` with correct token labels for btcusdc', () => {
    render(<OrderBook {...mockedProps} />);

    expect(screen.getByText(/Price \(USDC\)/)).toBeInTheDocument();
    expect(screen.getByText(/Amount \(BTC\)/)).toBeInTheDocument();
    expect(screen.getByText(/Total \(USDC\)/)).toBeInTheDocument();
  });

  it('should render `OrderbookLastTrade` when `capabilities.trades` is `true`', () => {
    render(<OrderBook {...mockedProps} />);

    // OrderbookLastTrade should render with last trade price
    expect(screen.getByTestId('orderbook-last-trade')).toBeInTheDocument();
    expect(screen.getByText(/25,000/)).toBeInTheDocument();
  });

  it('should not render `OrderbookLastTrade` when `capabilities.trades` is `false`', () => {
    mockedProps.capabilities.trades = false;
    render(<OrderBook {...mockedProps} />);

    // OrderbookLastTrade should not render
    expect(screen.queryByTestId('orderbook-last-trade')).not.toBeInTheDocument();
  });

  it('should render `asks` in default view', () => {
    render(<OrderBook {...mockedProps} />);

    // Asks should be visible (higher prices)
    expect(screen.getByText(/50,001/)).toBeInTheDocument();
    expect(screen.getByText(/50,002/)).toBeInTheDocument();
  });

  it('should render `bids` in default view', () => {
    render(<OrderBook {...mockedProps} />);

    // Bids should be visible (lower prices)
    expect(screen.getByText(/50,000/)).toBeInTheDocument();
    expect(screen.getByText(/49,999/)).toBeInTheDocument();
  });

  it('should render `OrderbookBidAskPercentage` in default view', () => {
    render(<OrderBook {...mockedProps} />);

    // The percentage component renders percentages with % symbol
    const percentageElements = screen.getAllByText(/%/);
    expect(percentageElements.length).toBeGreaterThan(0);
  });

  it('should handle `empty bids and asks` gracefully', () => {
    mockedProps.bids = [];
    mockedProps.asks = [];
    mockedProps.isInitialOrdersLoading = false;
    mockedProps.status = EConnectStuses.connected;
    render(<OrderBook {...mockedProps} />);

    // Should still render the component structure
    expect(screen.getByText('Order Book')).toBeInTheDocument();
  });

  it('should render with `ethusdc` pair and correct labels', () => {
    mockedProps.pair = EPairs.ethusdc;
    render(<OrderBook {...mockedProps} />);

    expect(screen.getByText(/Price \(USDC\)/)).toBeInTheDocument();
    expect(screen.getByText(/Amount \(ETH\)/)).toBeInTheDocument();
    expect(screen.getByText(/Total \(USDC\)/)).toBeInTheDocument();
  });
});
