import { useCallback, useRef, useState } from 'react';

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
  // It maps the reference of every row by stable ID, it's used Map in order to have quicker access
  // to the rows and improve performance
  const rowBidRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const rowAskRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  // Maps price to stable row ID for quick lookups
  const priceToBidIdRef = useRef<Map<number, string>>(new Map());
  const priceToAskIdRef = useRef<Map<number, string>>(new Map());
  const rafRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // It tracks when tooltip is hovered
  const isHoveringTooltipRef = useRef(false);
  // It tracks when row is hovered
  const isHoveringRowRef = useRef(false);
  // It tracks when buy or sell row are hovered
  const rowBuyHovered = useRef<number | null>(null);
  const rowSellHovered = useRef<number | null>(null);

  const handleHover = useCallback((price: number, orderType: TOrderType) => {
    // === NEW: Skip if hovering the same row ===
    const currentHovered = orderType === EOrderTypes.bid ? rowBuyHovered.current : rowSellHovered.current;
    if (currentHovered === price && isTooltipOpen) return;

    // It cancels pending close
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    // It sets that we currently hovering a row
    isHoveringRowRef.current = true;

    if (orderType === EOrderTypes.bid) {
      rowBuyHovered.current = price;
    } else {
      rowSellHovered.current = price;
    }

    // It deletes the previous animation when a new row is hovered
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    // It stores the animation reference
    rafRef.current = requestAnimationFrame(() => {
      // Get stable ID from price, then get node from stable ID
      const priceToIdMap = orderType === EOrderTypes.bid ? priceToBidIdRef.current : priceToAskIdRef.current;
      const rowRefsMap = orderType === EOrderTypes.bid ? rowBidRefs.current : rowAskRefs.current;
      const stableId = priceToIdMap.get(price);
      
      if (!stableId) return;
      
      const node = rowRefsMap.get(stableId);

      if (!node || !containerRef.current) return;

      const nodeRect = node.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const relativeNodeRect = new DOMRect(
        nodeRect.left - containerRect.left,
        nodeRect.top - containerRect.top,
        nodeRect.width,
        nodeRect.height,
      );

      // It sets the row position relative to its wrapper
      setHoverRect(relativeNodeRect);

      setHoverTooltipContent({ price, orderType });

      setIsTooltipOpen(true);
    });
  }, [isTooltipOpen]);

  const handleLeave = useCallback(() => {
    isHoveringRowRef.current = false;
    rowBuyHovered.current = null;
    rowSellHovered.current = null;

    // The delay is used to avoid to clsoe the tooltip when we pass from one row to another one
    closeTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRowRef.current && !isHoveringTooltipRef.current) {
        setIsTooltipOpen(false);
        setHoverTooltipContent(null);
        setHoverRect(null);
      }
    }, 80); // 50–120ms is a good compromise
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
    if (!isHoveringRowRef.current) {
      setIsTooltipOpen(false);
      setHoverTooltipContent(null);
      setHoverRect(null);
    }
  }, []);

  // useEffect(() => {
  //   return () => {
  //     if (rafRef.current) cancelAnimationFrame(rafRef.current);
  //     if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  //   };
  // }, []);

  return {
    isTooltipOpen,
    hoverTooltipContent,
    hoverRect,
    containerRef,
    rowBidRefs,
    rowAskRefs,
    priceToBidIdRef,
    priceToAskIdRef,
    rowBuyHovered,
    rowSellHovered,
    handleHover,
    handleLeave,
    handleTooltipEnter,
    handleTooltipLeave,
  };
};

export default useOrderBookTooltip;
