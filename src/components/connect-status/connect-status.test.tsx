import { render, screen } from '@testing-library/react';

import { useIsMobile } from '../../hooks/use-is-mobile';
import type { IConnectStatusProps } from './connect-status';
import ConnectStatus from './connect-status';

import { EConnectStuses } from '@/client/types';

jest.mock('../../hooks/use-is-mobile', () => ({
  useIsMobile: jest.fn(),
}));

const mockedUseIsMobile = useIsMobile as jest.Mock;

const { connected, connecting, disconnected } = EConnectStuses;

const statuses = [connected, connecting, disconnected];

const renderConnectStatus = (props: IConnectStatusProps, isMobile: boolean = false) => {
  mockedUseIsMobile.mockReturnValue(isMobile);
  render(<ConnectStatus status={props.status} className={props.className} />);
};

describe('Header', () => {
  statuses.forEach((status) => {
    it(`should render '${status}' status on desktop`, () => {
      renderConnectStatus({ status }, false);
      const connectStatus = screen.getByText(status);
      expect(connectStatus).toBeInTheDocument();
    });
  });

  statuses.forEach((status) => {
    it(`should not render '${status}' status on mobile`, () => {
      renderConnectStatus({ status }, true);
      const connectStatus = screen.queryByText(status);
      expect(connectStatus).not.toBeInTheDocument();
    });
  });

  it('should render the correct class name', () => {
    renderConnectStatus({ status: connected, className: 'test-className' }, false);
    const connectStatus = screen.getByText(connected);
    expect(connectStatus).toHaveClass('test-className');
  });
});
