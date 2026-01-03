import type { IOrder } from '@/components/orderbook/adapters/types';

/**
 * Merge new order book values with previous ones while preserving references
 * for rows that haven't changed.
 *
 * This optimization prevents unnecessary re-renders of OrderBookRow components
 * when only some prices/sizes change in the real-time WebSocket stream.
 *
 * @param {IOrder[]} prevValues - The previous array of order book values.
 * @param {IOrder[]} newValues - The new array of order book values from the WebSocket.
 * @returns {IOrder[]} The merged values, reusing references where size hasn't changed.
 */
const mergeValues = (prevValues: IOrder[], newValues: IOrder[]): IOrder[] => {
  const prevMap = new Map(prevValues.map((v) => [v.price, v]));

  const mergedValues = newValues.map((value: IOrder) => {
    const equalValue = prevMap.get(value.price);

    if (equalValue && equalValue?.size === value.size) return equalValue;

    return value;
  });

  return mergedValues;
};

export default mergeValues;
