// eslint-disable-next-line import/no-extraneous-dependencies
import {Currency} from '@tinkoff/invest-openapi-js-sdk';

export declare type LoadingWrapperProps = {
  loading: boolean,
  loadingError: boolean,
};

export declare type PositionRow = {
  name: string,
  instrumentType: string,
  lastPrice?: number,
  totalBalance: number,
  totalNet: number,
  averagePrice: number,
  totalOperationsCost: number,
  buyCostTotal: number,
  currency: Currency | undefined,
  totalPrice: number,
  totalNetPercent: number;
};

export declare type PositionKey = keyof PositionRow;
export declare type PositionColumn = PositionKey | '#';
