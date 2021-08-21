import axios, {AxiosInstance} from 'axios';
// eslint-disable-next-line import/no-extraneous-dependencies
import {UserAccount} from '@tinkoff/invest-openapi-js-sdk';
import {CurrencyInfo, PositionMap, Totals} from '../@types/server';
import {PositionRow} from '../@types';

const isProd = true;

let instance: AxiosInstance;
if (isProd) {
  instance = axios.create({
    baseURL: 'http://localhost:5000/investment/prod',
  });
} else {
  instance = axios.create({
    baseURL: 'http://localhost:5000/investment/sandbox',
  });
}

type BrokerAccountId = string;

const responseConverter = <T>({data}: {data: T}) => data;

function convertPositionsToRows(portfolios: PositionMap): PositionRow[] {
  if (!portfolios) {
    return [];
  }
  return Object.keys(portfolios).map((figi) => {
    const accountPositions = portfolios[figi];
    const {
      instrumentType,
      name,
      lastPrice = 0,
      currency,
    } = accountPositions[0];

    const totalQuantity = accountPositions.reduce((sum, {instrumentQuantity}) => (
      sum + instrumentQuantity
    ), 0);
    const totalBalance = accountPositions.reduce((sum, {balance}) => (
      sum + balance
    ), 0);
    const totalNet = accountPositions
      .reduce((sum, {totalNet: positionNet}) => sum + positionNet, 0);
    const totalOperationsCost = accountPositions
      .reduce((sum, {operationsTotal}) => sum + operationsTotal, 0);
    const buyCostTotal = accountPositions.reduce((sum, {buyCost}) => sum + buyCost, 0);
    const averagePrice = totalQuantity
      ? Math.abs((lastPrice * totalQuantity - totalNet) / totalQuantity)
      : lastPrice;

    return {
      figi,
      name,
      instrumentType,
      lastPrice,
      totalBalance,
      totalNet,
      totalNetPercent: accountPositions[0].netPercent,
      averagePrice,
      totalOperationsCost,
      buyCostTotal,
      currency,
      portfolioPercent: null,
      totalNetRub: null,
    };
  });
}

export default class InvestApiService {
  static setToken(token: string) {
    instance.defaults.headers.common.Authorization = `Bearer ${token}`;
  }

  static async getPortfolios(brokerAccountId: BrokerAccountId): Promise<PositionRow[]> {
    return instance
      .get(`/portfolio/${brokerAccountId}`)
      .then((res) => (
        convertPositionsToRows(
          responseConverter(res),
        )));
  }

  static async getHistoricPositions(brokerAccountId: BrokerAccountId): Promise<PositionRow[]> {
    return instance
      .get(`/historicPositions/${brokerAccountId}`)
      .then((res) => (
        convertPositionsToRows(
          responseConverter(res),
        )));
  }

  static async getAccounts(): Promise<UserAccount[]> {
    return instance.get('/accounts').then(responseConverter);
  }

  static async getCurrencyInfos(currenciesList: string[]): Promise<CurrencyInfo[]> {
    if (!Array.isArray(currenciesList)) {
      return Promise.resolve([]);
    }
    return instance.get('/currenciesInfo', {
      params: {
        list: currenciesList.join(','),
      },
    }).then(responseConverter);
  }

  static async getTotals(brokerAccountId: BrokerAccountId): Promise<Totals> {
    return instance.get(`/total/${brokerAccountId}`)
      .then(responseConverter);
  }
}
