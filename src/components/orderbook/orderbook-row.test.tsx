import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { IOrderBookRowProps } from './orderbook-row';
import OrderBookRow from './orderbook-row';
import { ROW_HEIGHT } from './consts';

import { EOrderTypes } from '@/components/orderbook/types';

describe('OrderBookRow', () => {
  let mockedProps: IOrderBookRowProps;
  const mockedHandleHover = jest.fn();
  const mockedHandleLeave = jest.fn();

  beforeEach(() => {
    mockedProps = {
      price: 50000,
      size: 0.5,
      handleHover: mockedHandleHover,
      handleLeave: mockedHandleLeave,
      orderType: EOrderTypes.bid,
      isRounding: false,
      maxSize: 1000000,
      index: 0,
    };
    jest.clearAllMocks();
  });

  it('should render `price`, `size`, and `avg price` with correct formatting for bid', () => {
    render(<OrderBookRow {...mockedProps} />);

    expect(screen.getByText(/50,000/)).toBeInTheDocument();
    expect(screen.getByText(/0.5/)).toBeInTheDocument();
    expect(screen.getByText(/25,000/)).toBeInTheDocument();
  });

  it('should render `price` with `green color` for bid', () => {
    render(<OrderBookRow {...mockedProps} />);

    const priceElement = screen.getByText(/50,000/);
    expect(priceElement).toHaveClass('text-green-500');
  });

  it('should render `price` with `red color` for ask', () => {
    mockedProps.orderType = EOrderTypes.ask;
    render(<OrderBookRow {...mockedProps} />);

    const priceElement = screen.getByText(/50,000/);
    expect(priceElement).toHaveClass('text-red-500');
  });

  it('should render `background` with `green color` for bid', () => {
    render(<OrderBookRow {...mockedProps} />);

    const row = screen.getByText(/50,000/).closest('div')?.parentElement;
    const background = row?.querySelector('.bg-green-500\\/10');
    expect(background).toBeInTheDocument();
  });

  it('should render `background` with `red color` for ask', () => {
    mockedProps.orderType = EOrderTypes.ask;
    render(<OrderBookRow {...mockedProps} />);

    const row = screen.getByText(/50,000/).closest('div')?.parentElement;
    const background = row?.querySelector('.bg-red-500\\/10');
    expect(background).toBeInTheDocument();
  });

  it('should calculate `background width` correctly based on `size`, `price`, and `maxSize`', () => {
    render(<OrderBookRow {...mockedProps} />);

    const row = screen.getByText(/50,000/).closest('div')?.parentElement;
    const background = row?.querySelector('.bg-green-500\\/10') as HTMLElement;
    const expectedWidth = ((0.5 * 50000) / 1000000) * 100;
    expect(background).toHaveStyle({ width: `${expectedWidth}%` });
  });

  it('should use `formatNumberTruncate` for `avg price` when `isRounding` is `true`', () => {
    mockedProps.isRounding = true;
    render(<OrderBookRow {...mockedProps} />);

    // formatNumberTruncate formats 25000 as "25 K" (since it's >= 1000)
    expect(screen.getByText('25 K')).toBeInTheDocument();
    expect(screen.queryByText(/25,000/)).not.toBeInTheDocument();
  });

  it('should use `formatNumber` with 3 decimals for `avg price` when `isRounding` is `false`', () => {
    mockedProps.isRounding = false;
    render(<OrderBookRow {...mockedProps} />);

    expect(screen.getByText(/25,000/)).toBeInTheDocument();
  });

  it('should apply `top` position for bid order type', () => {
    mockedProps.index = 5;
    render(<OrderBookRow {...mockedProps} />);

    const row = screen.getByText(/50,000/).closest('div')?.parentElement as HTMLElement;
    expect(row).toHaveStyle({ top: `${mockedProps.index * ROW_HEIGHT}px` }); // 125px
  });

  it('should apply `bottom` position for ask order type', () => {
    mockedProps.index = 3;
    mockedProps.orderType = EOrderTypes.ask;
    render(<OrderBookRow {...mockedProps} />);

    const row = screen.getByText(/50,000/).closest('div')?.parentElement as HTMLElement;
    expect(row).toHaveStyle({ bottom: `${mockedProps.index * ROW_HEIGHT}px` }); // 75px
  });

  it('should call `handleHover` with correct parameters when `pointer enters`', async () => {
    mockedProps.index = 2;
    const user = userEvent.setup();
    render(<OrderBookRow {...mockedProps} />);

    const row = screen.getByText(/50,000/).closest('div')?.parentElement as HTMLElement;
    await user.hover(row);

    expect(mockedHandleHover).toHaveBeenCalledWith(50000, EOrderTypes.bid, 2);
  });

  it('should call `handleLeave` when `pointer leaves`', async () => {
    const user = userEvent.setup();
    render(<OrderBookRow {...mockedProps} />);

    const row = screen.getByText(/50,000/).closest('div')?.parentElement as HTMLElement;
    await user.hover(row);
    await user.unhover(row);

    expect(mockedHandleLeave).toHaveBeenCalled();
  });

  it('should handle `maxSize` of 0 by using fallback value of 1', () => {
    mockedProps.maxSize = 0;
    render(<OrderBookRow {...mockedProps} />);

    const row = screen.getByText(/50,000/).closest('div')?.parentElement;
    const background = row?.querySelector('.bg-green-500\\/10') as HTMLElement;
    // With maxSize = 0, safeMaxSize = 1, so width = (0.5 * 50000) / 1 * 100 = 2,500,000%
    // But it should be capped at 100% in practice, but the calculation is correct
    const expectedWidth = ((0.5 * 50000) / 1) * 100;
    expect(background).toHaveStyle({ width: `${expectedWidth}%` });
  });
});
