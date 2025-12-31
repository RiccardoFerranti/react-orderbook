import type { ITooltipContent } from './types';

import { formatNumber } from '@/utils/format-number';

interface IOrderbookRowTooltipProps {
  tooltipData: ITooltipContent;
  sizeDecimals: number;
  tickDecimals: number;
}

export default function OrderbookRowTooltip({ tooltipData, sizeDecimals, tickDecimals }: IOrderbookRowTooltipProps) {
  if (!tooltipData) return null;

  const { avgPrice, base, quote } = tooltipData;

  const displayBase = Number(base) / 10 ** sizeDecimals;
  const displayQuote = Number(quote) / 10 ** tickDecimals;
  const displayAvgPrice = Number(avgPrice) / 10 ** tickDecimals;

  return (
    <div className="rounded-md border bg-popover p-3 shadow-md h-full w-full">
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between">
          <span>Avg Price:</span>
          <span>≈ {formatNumber(displayAvgPrice)}</span>
        </div>
        <div className="flex justify-between">
          <span>Sum BTC:</span>
          <span>{formatNumber(displayBase, 5)}</span>
        </div>
        <div className="flex justify-between">
          <span>Sum USDC:</span>
          <span>{formatNumber(displayQuote, 0)}</span>
        </div>
      </div>
    </div>
  );
}
