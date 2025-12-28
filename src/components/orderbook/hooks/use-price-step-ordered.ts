import { useMemo } from 'react';

/**
 * Groups and sorts bids or asks by a given priceStep.
 * - Step = '0.01' → returns original array (no grouping)
 * - Step > 0.01 → groups prices into steps, sums sizes, and sorts
 * @param orders Array of orders (bids or asks)
 * @param priceStep Step as string, e.g., '0.01', '0.1', '1', '10'
 * @param isBid Whether the orders are bids (descending) or asks (ascending)
 */
const usePriceStepOrdered = (orders: { price: number; size: number }[], priceStep: string, isBid: boolean) => {
  return useMemo(() => {
    if (priceStep === '0.01') return orders;

    const grouped = orders.reduce(
      (acc, next) => {
        // 1. Divide the price by the step size → how many steps fit into this price
        // 2. Math.floor → round down to the start of the step group
        // 3. Multiply by step → convert back to actual grouped price
        const price = Math.floor(next.price / Number(priceStep)) * Number(priceStep);

        if (!acc[price]) {
          acc[price] = { ...next, price };
        } else {
          acc[price] = { ...next, size: acc[price].size + next.size };
        }

        return acc;
      },
      {} as Record<string, { price: number; size: number }>,
    );

    // Convert grouped object to array and sort:
    // - bids → descending
    // - asks → ascending
    const sorted = Object.values(grouped).sort((a, b) => (isBid ? b.price - a.price : a.price - b.price));

    return sorted;
  }, [orders, priceStep, isBid]);
};

export default usePriceStepOrdered;
