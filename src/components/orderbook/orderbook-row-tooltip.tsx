import type { ITooltipData } from '@/components/orderbook/types';
import { formatNumber } from '@/utils/format-number';

interface IOrderbookRowTooltipProps {
  tooltipData: ITooltipData;
  sizeDecimals: number;
  tickDecimals: number;
}

export default function OrderbookRowTooltip({ tooltipData, sizeDecimals, tickDecimals }: IOrderbookRowTooltipProps) {
  if (!tooltipData) return null;

  const { avgPrice, base, quote } = tooltipData;

  // Convert the raw BigInt-like base, quote, and avgPrice values—which are scaled up by the number of decimals for precision—
  // back to floating point numbers for display, by dividing by 10**decimals. This ensures the values are human-readable.
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
