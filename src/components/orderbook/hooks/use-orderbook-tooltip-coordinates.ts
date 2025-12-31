import type { RefObject } from 'react';
import { useMemo } from 'react';

import { TOOLTIP_HEIGHT } from '../consts';
import type { IHoverTooltipContent } from '../types';
import { EOrderTypes } from '../types';

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

    let tooltipTop;
    let tooltipLeft;

    if (rowNode && containerRef.current) {
      const rowRect = rowNode.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      // row position relative to container
      const topRelativeToContainer = rowRect.top - containerRect.top;

      // center tooltip vertically on row
      tooltipTop = topRelativeToContainer + rowRect.height / 2 - TOOLTIP_HEIGHT / 2;

      // tooltip left/right
      // tooltipLeft =
      //   hoverTooltipContent && hoverTooltipContent.orderType === EOrderTypes.bid
      //     ? rowRect.right - containerRect.left + 8
      //     : rowRect.left - containerRect.left - TOOLTIP_WIDTH - 8;
      tooltipLeft = rowRect.right - containerRect.left + 8;
    }

    return { tooltipTop, tooltipLeft };
  }, [hoverTooltipContent]);

  return tooltipCoordinates;
};

export default useOrderBookTooltipCoordinates;
