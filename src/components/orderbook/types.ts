export type TOrderType = 'bid' | 'ask';

export interface ITooltipContent {
  base: number;
  quote: number;
  avgPrice: number;
}

export enum EOrderTypes {
  bid = 'bid',
  ask = 'ask',
}
