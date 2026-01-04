import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ConnectStatus from '@/components/connect-status/connect-status';
import type { IConnectStatusProps } from '@/components/connect-status/connect-status';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { EConnectStuses } from '@/client/types';

jest.mock('../../hooks/use-is-mobile', () => ({
  useIsMobile: jest.fn(),
}));

const mockedUseIsMobile = useIsMobile as jest.Mock;

const { connected, connecting, disconnected } = EConnectStuses;

const statuses = [connected, connecting, disconnected];

const statusLabelMap: Record<EConnectStuses, string> = {
  [connected]: 'Live data',
  [connecting]: 'Connecting...',
  [disconnected]: 'Disconnected',
};

const renderConnectStatus = (props: IConnectStatusProps, isMobile = false) => {
  mockedUseIsMobile.mockReturnValue(isMobile);
  render(<ConnectStatus {...props} />);
};

describe('ConnectStatus', () => {
  describe('Desktop behavior', () => {
    statuses.forEach((status) => {
      it(`should render '${statusLabelMap[status]}' inline on desktop`, () => {
        renderConnectStatus({ status }, false);

        expect(screen.getByText(statusLabelMap[status])).toBeInTheDocument();
      });
    });
  });

  describe('Mobile behavior', () => {
    statuses.forEach((status) => {
      it(`should not render '${statusLabelMap[status]}' inline on mobile`, () => {
        renderConnectStatus({ status }, true);

        expect(screen.queryByText(statusLabelMap[status])).not.toBeInTheDocument();
      });
    });

    it('should show `status label` inside popover when clicked', async () => {
      const user = userEvent.setup();

      renderConnectStatus({ status: connected }, true);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(await screen.findByText('Live data')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply custom `className` to the badge', () => {
      renderConnectStatus({ status: connected, className: 'test-className' }, false);

      const label = screen.getByText('Live data');
      const badge = label.closest('[class]');

      expect(badge).toHaveClass('test-className');
    });
  });
});
