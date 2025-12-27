export type TOrderType = 'buy' | 'sell';

export interface ITooltipContent {
  base: number;
  quote: number;
  avgPrice: number;
}

export enum EOrderTypes {
  buy = 'buy',
  sell = 'sell',
}

export enum EPairsTypes {
  btcusdc = 'btcusdc',
  ethusdc = 'ethusdc',
}
