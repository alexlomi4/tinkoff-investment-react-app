// eslint-disable-next-line import/no-extraneous-dependencies
import {Currency, InstrumentType} from '@tinkoff/invest-openapi-js-sdk';

export declare type LoadingWrapperProps = {
  loading: boolean,
  loadingError: boolean,
};

export declare type PositionRow = {
  figi: string,
  name: string,
  instrumentType: InstrumentType,
  lastPrice?: number,
  totalBalance: number,
  totalNet: number,
  averagePrice: number,
  totalOperationsCost: number,
  buyCostTotal: number,
  currency: Currency | undefined,
  totalNetPercent: number;
  portfolioPercent: number | null,
  totalNetRub: number | null,
};

export declare type PositionKey = keyof PositionRow;
export declare type PositionColumn = PositionKey | '#' | 'toolbar';
