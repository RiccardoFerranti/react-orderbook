import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';

import { Badge } from '@/components/ui/badge';
import { EConnectStuses, type TConnectionStatus } from '@/client/types';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-is-mobile';

export interface IConnectStatusProps {
  status: TConnectionStatus;
  className?: string;
}

export default function ConnectStatus(props: IConnectStatusProps) {
  const { status, className } = props;

  const isMobile = useIsMobile();

  const statusLabel = {
    connecting: 'Connecting...',
    connected: 'Live data',
    disconnected: 'Disconnected',
  }[status];

  return (
    <Badge className={`flex h-10 w-10 gap-2 rounded-full px-3 md:min-w-30! ${className || ''}`} variant="outline">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className={cn(
              `text-foreground/30 hover:text-foreground/80 relative cursor-pointer bg-transparent p-0! hover:bg-transparent`,
              {
                'pointer-events-none': !isMobile,
              },
            )}
          >
            <div className="relative" role="status" aria-label={`Connection status: ${status}`}>
              <div
                className={cn(`size-2 rounded-full`, {
                  'bg-yellow-500': status === EConnectStuses.connecting,
                  'bg-green-500': status === EConnectStuses.connected,
                  'bg-red-500': status === EConnectStuses.disconnected,
                })}
              />
              <div
                className={cn(`absolute inset-0 size-2 rounded-full`, {
                  'animate-ping bg-yellow-500': status === EConnectStuses.connecting,
                  'bg-green-500': status === EConnectStuses.connected,
                  'bg-red-500': status === EConnectStuses.disconnected,
                })}
              />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40">
          <div className="flex items-center justify-center text-sm">{statusLabel}</div>
        </PopoverContent>
      </Popover>
      {!isMobile ? <span>{statusLabel}</span> : null}
    </Badge>
  );
}
