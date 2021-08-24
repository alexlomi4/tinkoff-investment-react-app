// eslint-disable-next-line import/no-extraneous-dependencies
import {UserAccount} from '@tinkoff/invest-openapi-js-sdk';
import {PositionRow} from '../../@types';
import {CurrencyInfo, Totals} from '../../@types/server';

export default class InvestApiClientService {
  static token: string;

  static setToken(token: string) {
    this.token = token;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async getPortfolios(brokerAccountId: string): Promise<PositionRow[]> {
    return [] as PositionRow[];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async getHistoricPositions(brokerAccountId: string): Promise<PositionRow[]> {
    return [] as PositionRow[];
  }

  static async getAccounts(): Promise<UserAccount[]> {
    return [] as UserAccount[];
  }

  static async getCurrencyInfo(currenciesList: string[]): Promise<CurrencyInfo[]> {
    if (!Array.isArray(currenciesList) || !currenciesList.length) {
      return Promise.resolve([]);
    }
    return [] as CurrencyInfo[];
  }

  static async getTotals(): Promise<Totals> {
    return {} as Totals;
  }
}
