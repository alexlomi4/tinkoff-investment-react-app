// eslint-disable-next-line import/no-extraneous-dependencies
import {Currency} from '@tinkoff/invest-openapi-js-sdk';

const CURRENCY_SIGNS: { [currency: string]: string } = {
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

// eslint-disable-next-line import/prefer-default-export
export function formatPrice(price: number, currency?: Currency | undefined): string {
  return `${price.toLocaleString(
    'en-US', {maximumFractionDigits: 2},
  )}${currency ? CURRENCY_SIGNS[currency] || '' : ''}`;
}
