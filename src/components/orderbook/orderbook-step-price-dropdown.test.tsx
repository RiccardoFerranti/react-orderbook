import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { IOrderbookDropdownProps } from './orderbook-step-price-dropdown';
import OrderbookStepPriceDropdown from './orderbook-step-price-dropdown';

import { MINIMUM_PRICE_STEP, STEP_PRICES } from '@/components/orderbook/consts';
import { EPairs } from '@/types';

describe('OrderbookStepPriceDropdown', () => {
  let mockedProps: IOrderbookDropdownProps;
  const mockedHandleSetPriceStep = jest.fn();

  beforeEach(() => {
    mockedProps = {
      value: MINIMUM_PRICE_STEP,
      handleSetPriceStep: mockedHandleSetPriceStep,
      pair: EPairs.btcusdc,
    };
    mockedHandleSetPriceStep.mockClear();
  });

  it('should render the `button` with the current `value`', () => {
    render(<OrderbookStepPriceDropdown {...mockedProps} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent(MINIMUM_PRICE_STEP);
  });

  it('should display all `dropdown options` for `btcusdc` pair when opened', async () => {
    const user = userEvent.setup();
    render(<OrderbookStepPriceDropdown {...mockedProps} />);

    const button = screen.getByRole('button');
    await user.click(button);

    // Wait for dropdown content to appear
    const expectedOptions = STEP_PRICES.btcusdc;
    for (const option of expectedOptions) {
      const menuItem = await screen.findByRole('menuitemradio', { name: option });
      expect(menuItem).toBeInTheDocument();
    }
  });

  it('should display all `dropdown options` for `ethusdc` pair when opened', async () => {
    mockedProps.pair = EPairs.ethusdc;
    const user = userEvent.setup();
    render(<OrderbookStepPriceDropdown {...mockedProps} />);

    const button = screen.getByRole('button');
    await user.click(button);

    // Wait for dropdown content to appear
    const expectedOptions = STEP_PRICES.ethusdc;
    for (const option of expectedOptions) {
      const menuItem = await screen.findByRole('menuitemradio', { name: option });
      expect(menuItem).toBeInTheDocument();
    }
  });

  it('should call `handleSetPriceStep` with the selected `value` when an option is clicked', async () => {
    const user = userEvent.setup();
    render(<OrderbookStepPriceDropdown {...mockedProps} />);

    const button = screen.getByRole('button');
    await user.click(button);

    const option = await screen.findByRole('menuitemradio', { name: '0.1' });
    await user.click(option);

    expect(mockedHandleSetPriceStep).toHaveBeenCalledWith('0.1');
    expect(mockedHandleSetPriceStep).toHaveBeenCalledTimes(1);
  });

  it('should show the `selected value` as checked in the dropdown', async () => {
    mockedProps.value = '1';
    const user = userEvent.setup();
    render(<OrderbookStepPriceDropdown {...mockedProps} />);

    const button = screen.getByRole('button');
    await user.click(button);

    const selectedOption = await screen.findByRole('menuitemradio', { name: '1' });
    expect(selectedOption).toHaveAttribute('data-state', 'checked');
  });

  it('should render `ChevronDown` icon in the button', () => {
    render(<OrderbookStepPriceDropdown {...mockedProps} />);

    const button = screen.getByRole('button');
    // The ChevronDown icon should be present (lucide-react icons render as SVGs)
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
