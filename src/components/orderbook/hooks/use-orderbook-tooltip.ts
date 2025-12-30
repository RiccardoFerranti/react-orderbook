import { useCallback, useEffect, useRef, useState } from 'react';

import type { TOrderType } from '../types';
import { EOrderTypes } from '../types';

/**
 * Custom hook for managing tooltip state and refs in the order book.
 *
 * Exposes:
 * - isTooltipOpen: Boolean state, whether the tooltip is currently open.
 * - hoverTooltipContent: Object containing the hovered row's price and orderType, or null if none.
 * - hoverRect: DOMRect giving the position of the hovered row, or null if none.
 * - containerRef: Ref to the order book container (div).
 * - rowBidRefs: Ref (Map<string,HTMLDivElement>) of bid row DOM nodes, keyed by stable ID.
 * - rowAskRefs: Ref (Map<string,HTMLDivElement>) of ask row DOM nodes, keyed by stable ID.
 * - priceToBidIdRef: Ref (Map<number,string>) mapping price to stable bid row ID.
 * - priceToAskIdRef: Ref (Map<number,string>) mapping price to stable ask row ID.
 * - rowBuyHovered: Ref (number | null), the price of the currently hovered buy row.
 * - rowSellHovered: Ref (number | null), the price of the currently hovered sell row.
 * - handleHover: Function called when a user hovers a row; updates position and tooltip content.
 * - handleLeave: Function called when a user leaves a row; schedules hiding of the tooltip.
 * - handleTooltipEnter: Function called when mouse enters the tooltip; prevents premature close.
 * - handleTooltipLeave: Function called when mouse leaves the tooltip; allows close timer.
 *
 * Designed for integration with OrderBook UI and tooltips showing cumulative and per-row data.
 *
 * @returns {{
 *   isTooltipOpen: boolean,
 *   hoverTooltipContent: { price: number, orderType: TOrderType } | null,
 *   hoverRect: DOMRect | null,
 *   containerRef: React.RefObject<HTMLDivElement>,
 *   rowBidRefs: React.RefObject<Map<string, HTMLDivElement>>,
 *   rowAskRefs: React.RefObject<Map<string, HTMLDivElement>>,
 *   priceToBidIdRef: React.RefObject<Map<number, string>>,
 *   priceToAskIdRef: React.RefObject<Map<number, string>>,
 *   rowBuyHovered: React.MutableRefObject<number | null>,
 *   rowSellHovered: React.MutableRefObject<number | null>,
 *   handleHover: (price: number, orderType: TOrderType) => void,
 *   handleLeave: () => void,
 *   handleTooltipEnter: () => void,
 *   handleTooltipLeave: () => void
 * }}
 */

const useOrderBookTooltip = () => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [hoverTooltipContent, setHoverTooltipContent] = useState<{
    price: number;
    orderType: TOrderType;
  } | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // It maps the reference of every row, it's used Map in order to have quicker access to the rows and improve performance
  const rowBidRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const rowAskRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // It tracks when tooltip is hovered
  const isHoveringTooltipRef = useRef(false);

  // It tracks when row is hovered
  const isHoveringBidRowRef = useRef(false);
  const isHoveringAskRowRef = useRef(false);

  // It tracks by index when a bid or ask row are hovered
  const bidRowHoveredById = useRef<number | null>(null);
  const askRowHoveredById = useRef<number | null>(null);

  const hoveredIndexRef = useRef<number | null>(null);

  const handleHover = useCallback((price: number, orderType: TOrderType, index: number) => {
    // cancel pending close
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    // store hovered price (for range highlight)
    if (orderType === EOrderTypes.bid) {
      isHoveringBidRowRef.current = true;
      bidRowHoveredById.current = index;
    } else {
      isHoveringAskRowRef.current = true;
      askRowHoveredById.current = index;
    }

    // store hovered index (for tooltip positioning)
    hoveredIndexRef.current = index;

    // tooltip content
    setHoverTooltipContent({ price, orderType });
    setIsTooltipOpen(true);
  }, []);

  const handleLeave = useCallback(() => {
    isHoveringBidRowRef.current = false;
    isHoveringAskRowRef.current = false;
    bidRowHoveredById.current = null;
    askRowHoveredById.current = null;

    closeTimeoutRef.current = setTimeout(() => {
      if (!isHoveringBidRowRef.current && isHoveringAskRowRef.current && !isHoveringTooltipRef.current) {
        setIsTooltipOpen(false);
        setHoverTooltipContent(null);
        hoveredIndexRef.current = null;
      }
    }, 80);
  }, []);

  const handleTooltipEnter = useCallback(() => {
    isHoveringTooltipRef.current = true;

    // Since the hover is moved on the tooltip, we can cancel the timeout applied to the row
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const handleTooltipLeave = useCallback(() => {
    isHoveringTooltipRef.current = false;

    // When we leave the tooltip if the hover is not on the row, we can close the tooltip and reset all
    if (!isHoveringBidRowRef.current && !isHoveringAskRowRef.current) {
      setIsTooltipOpen(false);
      setHoverTooltipContent(null);
      setHoverRect(null);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  return {
    isTooltipOpen,
    hoverTooltipContent,
    hoverRect,
    containerRef,
    hoveredIndexRef,
    rowBidRefs,
    rowAskRefs,
    handleHover,
    handleLeave,
    handleTooltipEnter,
    handleTooltipLeave,
    bidRowHoveredById,
    askRowHoveredById,
    isHoveringBidRowRef,
    isHoveringAskRowRef,
  };
};

export default useOrderBookTooltip;
