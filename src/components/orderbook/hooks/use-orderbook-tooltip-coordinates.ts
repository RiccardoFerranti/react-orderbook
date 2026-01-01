import type { RefObject } from 'react';
import { useMemo } from 'react';

import type { IHoverTooltipContent } from '@/components/orderbook/types';
import { EOrderTypes } from '@/components/orderbook/types';
import { TOOLTIP_HEIGHT, TOOLTIP_WIDTH } from '@/components/orderbook/consts';

interface IUseTooltipCoordinates {
  hoverTooltipContent: IHoverTooltipContent | null;
  rowBidRefs: RefObject<Map<number, HTMLElement>>;
  rowAskRefs: RefObject<Map<number, HTMLElement>>;
  containerRef: RefObject<HTMLDivElement | null>;
}

interface IUseTooltipCoordinatesReturn {
  tooltipTop?: number;
  tooltipLeft?: number;
}

const useOrderBookTooltipCoordinates = ({
  hoverTooltipContent,
  rowBidRefs,
  rowAskRefs,
  containerRef,
}: IUseTooltipCoordinates): IUseTooltipCoordinatesReturn => {
  const tooltipCoordinates = useMemo(() => {
    const rowNode =
      hoverTooltipContent?.orderType === EOrderTypes.bid
        ? hoverTooltipContent && rowBidRefs.current.get(hoverTooltipContent.price)
        : hoverTooltipContent && rowAskRefs.current.get(hoverTooltipContent.price);

    let tooltipTop = 0;
    let tooltipLeft = 0;

    if (rowNode && containerRef.current) {
      const rowRect = rowNode.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      const offset = 8;

      // Row coordinates relative to container
      const rowTop = rowRect.top - containerRect.top;
      const rowBottom = rowRect.bottom - containerRect.top;
      const rowLeft = rowRect.left - containerRect.left;
      const rowRight = rowRect.right - containerRect.left;

      // Row coordinates relative to viewport
      const rowViewportTop = rowRect.top;
      const rowViewportBottom = rowRect.bottom;
      const rowViewportLeft = rowRect.left;
      const rowViewportRight = rowRect.right;

      // HORIZONTAL: try right first (viewport check)
      if (rowViewportRight + TOOLTIP_WIDTH + offset <= window.innerWidth) {
        tooltipLeft = rowRight + offset; // container-relative left position
        tooltipTop = rowTop + rowRect.height / 2 - TOOLTIP_HEIGHT / 2; // vertical center aligned with row
      } else if (rowViewportLeft - TOOLTIP_WIDTH - offset >= 0) {
        tooltipLeft = rowLeft - TOOLTIP_WIDTH - offset; // container-relative left position
        tooltipTop = rowTop + rowRect.height / 2 - TOOLTIP_HEIGHT / 2; // vertical center aligned with row
      }
      // VERTICAL fallback: use viewport check
      else if (rowViewportTop >= TOOLTIP_HEIGHT + offset) {
        tooltipTop = rowTop - TOOLTIP_HEIGHT - offset; // place tooltip above row (container-relative)
        tooltipLeft = rowLeft + rowRect.width / 2 - TOOLTIP_WIDTH / 2; // horizontal center aligned
      } else if (window.innerHeight - rowViewportBottom >= TOOLTIP_HEIGHT + offset) {
        tooltipTop = rowBottom + offset; // place tooltip below row (container-relative)
        tooltipLeft = rowLeft + rowRect.width / 2 - TOOLTIP_WIDTH / 2; // horizontal center aligned
      } else {
        // Fallback inside container if tooltip cannot fit in preferred positions
        // This ensures tooltip is always fully visible inside container, even if it overlaps row or offset is reduced
        tooltipTop = Math.max(Math.min(rowTop, containerRect.height - TOOLTIP_HEIGHT), 0); // tooltip won’t overflow bottom
        tooltipLeft = Math.max(Math.min(rowLeft, containerRect.width - TOOLTIP_WIDTH), 0); // tooltip won’t go above container
      }
    }

    return { tooltipTop, tooltipLeft };
  }, [hoverTooltipContent]);

  return tooltipCoordinates;
};

export default useOrderBookTooltipCoordinates;
