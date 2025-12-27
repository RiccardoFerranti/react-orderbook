import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import type { ITooltipContent } from './types';

import { formatNumber } from '@/utils/format-number';

interface IOrderbookRowTooltipProps {
  hoverRect: DOMRect | null;
  isTooltipOpen: boolean;
  handleTooltipEnter: () => void;
  handleTooltipLeave: () => void;
  tooltipData: ITooltipContent;
  sizeDecimals: number;
  tickDecimals: number;
}

export default function OrderbookRowTooltip(props: IOrderbookRowTooltipProps) {
  const { hoverRect, isTooltipOpen, handleTooltipEnter, handleTooltipLeave, tooltipData, sizeDecimals, tickDecimals } = props;

  if (!hoverRect || !tooltipData) return null;

  const { avgPrice, base, quote } = tooltipData;

  const displayBase = Number(base) / 10 ** sizeDecimals; // BTC
  const displayQuote = Number(quote) / 10 ** tickDecimals; // USDC
  const displayAvgPrice = Number(avgPrice) / 10 ** tickDecimals; // USDC/BTC

  return (
    <Tooltip open={isTooltipOpen}>
      <TooltipTrigger asChild>
        {/* Invisible trigger positioned at the row */}
        <div
          style={{
            position: 'absolute',
            top: hoverRect.y,
            left: hoverRect.x,
            width: hoverRect.width,
            height: hoverRect.height,
          }}
          className="pointer-events-none"
        />
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={10}
        onPointerEnter={handleTooltipEnter}
        onPointerLeave={handleTooltipLeave}
        className="w-50"
      >
        <div className="flex flex-col">
          <div className="flex justify-between w-full">
            <span>Avg Price: </span>
            <span>≈{formatNumber(displayAvgPrice)}</span>
          </div>
          <div className="flex justify-between w-full">
            <span>Sum BTC:</span>
            <span>{formatNumber(displayBase, 5)}</span>
          </div>
          <div className="flex justify-between w-full">
            <span>Sum USDC:</span>
            <span>{formatNumber(displayQuote, 0)}</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
