export type TOrderType = 'bid' | 'ask';

export interface IHoverTooltipContent {
  price: number;
  orderType: TOrderType;
}
export interface ITooltipData {
  base: number;
  quote: number;
  avgPrice: number;
}

export enum EOrderTypes {
  bid = 'bid',
  ask = 'ask',
}
