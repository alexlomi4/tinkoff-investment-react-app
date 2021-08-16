// eslint-disable-next-line import/no-extraneous-dependencies
import { Currency, PortfolioPosition } from '@tinkoff/invest-openapi-js-sdk';
// TODO share with server

export declare type CurrencyInfo = {
  lastPrice?: number;
  figi?: string;
  currency: Currency;
};
export declare type PositionWithPrices = PortfolioPosition & {
  lastPrice?: number;
  totalNet: number;
  buyCost: number;
  operationsTotal: number;
  instrumentQuantity: number;
  currency: Currency | undefined;
  netPercent: number;
};

export declare type PositionMap = {
  [figi: string]: PositionWithPrices[];
};

export declare type Totals = {
  totalPayIn: number;
  netTotal: number;
  percent: number;
};
