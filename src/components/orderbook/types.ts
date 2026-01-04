export type TOrderType = 'bid' | 'ask';

export interface IHoverTooltipContent {
  price: number;
  orderType: TOrderType;
}
export interface ITooltipData {
  base: bigint;
  quote: bigint;
  avgPrice: bigint;
}

export enum EOrderTypes {
  bid = 'bid',
  ask = 'ask',
}
