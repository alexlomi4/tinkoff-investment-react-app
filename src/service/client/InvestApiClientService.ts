// eslint-disable-next-line import/no-extraneous-dependencies
import {UserAccount} from '@tinkoff/invest-openapi-js-sdk';
import InvestmentService, {
  CustomApi,
} from 'tinkoff-investment-aggregate-service';
import {PositionRow} from '../../@types';
import {CurrencyInfo, Totals} from '../../@types/server';
import {convertPositionsToRows} from '../InvestApiServerService';

const isProd = true;
const apiUrl = isProd
  ? 'https://api-invest.tinkoff.ru/openapi'
  : 'https://api-invest.tinkoff.ru/openapi/sandbox';

export default class InvestApiClientService {
  private static api: CustomApi;

  static setToken(token: string) {
    this.api = new CustomApi({
      apiURL: apiUrl,
      secretToken: token,
      socketURL: 'wss://api-invest.tinkoff.ru/openapi/md/v1/md-openapi/ws',
    });
  }

  static async getPortfolios(brokerAccountId: string): Promise<PositionRow[]> {
    let portfolio;
    if (!brokerAccountId) {
      portfolio = await InvestmentService.getCurrentPositions(this.api);
    } else {
      portfolio = await InvestmentService.getCurrentPositionsByIds(this.api, [brokerAccountId]);
    }
    return convertPositionsToRows(portfolio);
  }

  static async getHistoricPositions(brokerAccountId: string): Promise<PositionRow[]> {
    let portfolio;
    if (!brokerAccountId) {
      portfolio = await InvestmentService.getHistoricPositions(this.api);
    } else {
      portfolio = await InvestmentService.getHistoricPositionsByIds(this.api, [brokerAccountId]);
    }
    return convertPositionsToRows(portfolio);
  }

  static async getAccounts(): Promise<UserAccount[]> {
    return InvestmentService.getAccounts(this.api);
  }

  static async getCurrencyInfo(currenciesList: string[]): Promise<CurrencyInfo[]> {
    if (!Array.isArray(currenciesList) || !currenciesList.length) {
      return Promise.resolve([]);
    }
    // TODO add actual types
    return InvestmentService.getCurrenciesInfo(this.api, currenciesList as any);
  }

  static async getTotals(): Promise<Totals> {
    return InvestmentService.getTotal(this.api);
  }
}
