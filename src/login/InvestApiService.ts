import axios, {AxiosInstance} from 'axios';

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

type Currency = 'RUB' | 'USD' | 'EUR' | 'GBP' | 'HKD' | 'CHF' | 'JPY' | 'CNY' | 'TRY';

export const CURRENCY_SIGNS: {[currency: string]: string} = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GBR: '£',
  HKD: 'HK$',
  CHF: 'CHF',
  JPY: '¥',
  CNY: 'CN¥',
  TRY: '₺',
};

export type Position = {
  name: string,
  ticker: string,
  balance: number,
  instrumentType: string,
  totalNet: number,
  operationsNet: number,
  lastPrice: number,
  currency: Currency,
};

export type PositionMap = {
  [ticker: string]: Position[],
};

type BrokerAccountType = 'Tinkoff' | 'TinkoffIis';

export type Account = {
  brokerAccountType: BrokerAccountType;
  brokerAccountId: string;
};

export type CurrencyInfo = {
  currency: string,
  lastPrice: number,
};

const responseConverter = ({data}: {data: any}) => data;

export const ALL_ACCOUNTS = 'ALL';

export default class InvestApiService {
  static setToken(token: string) {
    instance.defaults.headers.common.Authorization = `Bearer ${token}`;
  }

  static async getPortfolios(brokerAccountId: string): Promise<PositionMap> {
    return instance
      .get(`/portfolio/${brokerAccountId}`)
      .then(responseConverter);
  }

  static getAccounts(): Promise<Account[]> {
    return instance.get('/accounts').then(responseConverter);
  }

  static getCurrencyInfos(currenciesList: string[]): Promise<CurrencyInfo[]> {
    if (!Array.isArray(currenciesList)) {
      return Promise.resolve([]);
    }
    return instance.get('/currenciesInfo', {
      params: {
        list: currenciesList.join(','),
      },
    }).then(responseConverter);
  }
}
