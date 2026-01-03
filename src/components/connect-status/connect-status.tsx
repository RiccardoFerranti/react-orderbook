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

  return (
    <Badge className={`rounded-full px-3 h-10 min-w-10 flex gap-2 ${className || ''}`} variant="outline">
      <div className="relative">
        <div
          className={cn(`size-2 rounded-full`, {
            'bg-yellow-500': status === EConnectStuses.connecting,
            'bg-green-500': status === EConnectStuses.connected,
            'bg-red-500': status === EConnectStuses.disconnected,
          })}
        />
        <div
          className={cn(`absolute inset-0 size-2 rounded-full`, {
            'bg-yellow-500 animate-ping': status === EConnectStuses.connecting,
            'bg-green-500 animate-ping': status === EConnectStuses.connected,
            'bg-red-500': status === EConnectStuses.disconnected,
          })}
        />
      </div>

      {!isMobile ? status : null}
    </Badge>
  );
}
