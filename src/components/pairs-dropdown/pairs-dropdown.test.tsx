import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { IOrderbookPairsDropdownProps } from './pairs-dropdown';
import PairsDropdown from './pairs-dropdown';

import { EPairs } from '@/types';

describe('PairsDropdown', () => {
  const mockedHandleSetPair = jest.fn();

  const mockedProps: IOrderbookPairsDropdownProps = {
    value: EPairs.btcusdc,
    handleSetPair: mockedHandleSetPair,
  };

  beforeEach(() => {
    mockedHandleSetPair.mockClear();
  });

  it('renders the selected value', () => {
    render(<PairsDropdown value={mockedProps.value} handleSetPair={mockedProps.handleSetPair} />);
    expect(screen.getByRole('button', { name: /btcusdc/i })).toBeInTheDocument();
  });

  it('calls handleSetPair when an option is selected', async () => {
    // Creates a userEvent instance that simulates real user interactions.
    // userEvent is better than fireEvent because it handles async behavior, focus, and realistic browser events.
    const user = userEvent.setup();

    render(<PairsDropdown value={mockedProps.value} handleSetPair={mockedProps.handleSetPair} />);

    const button = screen.getByRole('button', { name: /btcusdc/i });
    await user.click(button); // open the dropdown

    // Wait for the dropdown content to appear (it's rendered in a Portal)
    const option = await screen.findByRole('menuitemradio', { name: /ethusdc/i });
    await user.click(option);

    expect(mockedHandleSetPair).toHaveBeenCalledWith(EPairs.ethusdc);
  });
});
