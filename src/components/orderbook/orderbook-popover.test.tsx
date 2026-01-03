import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { IOrderbookPopoverProps } from './orderbook-popover';
import OrderbookPopover from './orderbook-popover';

describe('OrderbookPopover', () => {
  const mockedOnCheckedChange = jest.fn();

  let mockedProps: IOrderbookPopoverProps;

  beforeEach(() => {
    mockedProps = {
      onCheckedChange: mockedOnCheckedChange,
      popoverFields: { rounding: true },
    };
    mockedOnCheckedChange.mockClear();
  });

  it('should render the `popover trigger` button', () => {
    render(<OrderbookPopover {...mockedProps} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should open `popover` and `display content` when button is clicked', async () => {
    const user = userEvent.setup();
    render(<OrderbookPopover {...mockedProps} />);

    const button = screen.getByRole('button');
    await user.click(button);

    // Wait for popover content to appear
    const title = await screen.findByText('Order Book Display Options');
    expect(title).toBeInTheDocument();

    // Check that the checkbox and label are visible
    expect(screen.getByLabelText('Rounding')).toBeInTheDocument();
  });

  it('should display `checkbox` as checked when `rounding` is `true`', async () => {
    const user = userEvent.setup();
    render(<OrderbookPopover {...mockedProps} />);

    const button = screen.getByRole('button');
    await user.click(button);

    const checkbox = await screen.findByRole('checkbox', { name: /rounding/i });
    expect(checkbox).toBeChecked();
  });

  it('should display `checkbox` as unchecked when `rounding` is `false`', async () => {
    mockedProps.popoverFields.rounding = false;
    const user = userEvent.setup();

    render(<OrderbookPopover {...mockedProps} />);

    const button = screen.getByRole('button');
    await user.click(button);

    const checkbox = await screen.findByRole('checkbox', { name: /rounding/i });
    expect(checkbox).not.toBeChecked();
  });

  it('should call `onCheckedChange` with correct parameters when `checkbox` is `toggled`', async () => {
    const user = userEvent.setup();

    render(<OrderbookPopover {...mockedProps} />);

    const button = screen.getByRole('button');
    await user.click(button);

    const checkbox = await screen.findByRole('checkbox', { name: /rounding/i });
    await user.click(checkbox);

    expect(mockedOnCheckedChange).toHaveBeenCalledWith(false, 'rounding');
  });

  it('should call `onCheckedChange` with `true` when unchecking and then checking', async () => {
    mockedProps.popoverFields.rounding = false;
    const user = userEvent.setup();

    render(<OrderbookPopover {...mockedProps} />);

    const button = screen.getByRole('button');
    await user.click(button);

    const checkbox = await screen.findByRole('checkbox', { name: /rounding/i });
    await user.click(checkbox);

    expect(mockedOnCheckedChange).toHaveBeenCalledWith(true, 'rounding');
  });
});
