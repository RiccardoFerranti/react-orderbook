import { render, screen, fireEvent } from '@testing-library/react';

import Header from '@/components/header/header';

// Create a mock toggle function
const toggleMock = jest.fn();

// Mock the module once
jest.mock('../providers/theme-provider', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: toggleMock,
  }),
}));

describe('Header', () => {
  beforeEach(() => {
    toggleMock.mockClear(); // reset calls before each test
  });

  it('should render the `title link`', () => {
    render(<Header />);
    const titleLink = screen.getByRole('link', { name: /order book/i });
    expect(titleLink).toBeInTheDocument();
    expect(titleLink).toHaveAttribute('href', '/');
  });

  it('should render the `toggle button`', () => {
    render(<Header />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should call `toggleTheme` when button is clicked', () => {
    render(<Header />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(toggleMock).toHaveBeenCalledTimes(1);
  });
});
