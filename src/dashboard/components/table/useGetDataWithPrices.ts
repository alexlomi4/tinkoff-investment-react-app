import {useCallback, useMemo} from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import {Currency} from '@tinkoff/invest-openapi-js-sdk';
import {PositionRow} from '../../../@types';
import useGetData from '../../../generic/hooks/useGetData';
import {CurrencyInfo} from '../../../@types/server';
import {InvestApiService} from '../../../service';

type RubPriceConverter = (
  {cellData, rowData}: {cellData: number, rowData: PositionRow}
) => number | null;

function convertDataWithPortfolioPrice(
  rows: PositionRow[],
  getPriceRub: RubPriceConverter,
  totalPortfolioCost: number | null,
): PositionRow[] {
  return rows.map((rowData) => {
    const {lastPrice = 0, totalBalance} = rowData;
    const totalPriceRub = getPriceRub({cellData: lastPrice * totalBalance, rowData});
    const priceDefined = totalPriceRub !== null && totalPortfolioCost !== null;
    return {
      ...rowData,
      portfolioPercent: priceDefined ? 100 * (totalPriceRub! / totalPortfolioCost!) : null,
      totalNetRub: getPriceRub({cellData: rowData.totalNet, rowData}),
    };
  });
}

export default function useGetDataWithPrices(
  positions: PositionRow[],
  totalPortfolioCost: number | null,
): [PositionRow[]] {
  const currencies = useMemo(() => (
    Array.from(new Set(
      positions.map(({currency}) => currency).filter(Boolean),
    ))
  ), [positions]) as Currency[];

  const [pricesInfo, pricesLoading] = useGetData<CurrencyInfo[]>(
    useCallback(() => (
      InvestApiService.getCurrencyInfo(currencies)
    ), [currencies]),
    [],
  );
  const getPriceRub = useCallback<RubPriceConverter>(({cellData, rowData}) => {
    if (pricesLoading) {
      return null;
    }
    const {currency: instrumentCurrency} = rowData;
    const {lastPrice} = pricesInfo.find(({currency}) => currency === instrumentCurrency) || {};
    return lastPrice ? cellData * lastPrice : cellData;
  }, [pricesInfo, pricesLoading]);

  const newData = useMemo(() => (
    convertDataWithPortfolioPrice(positions, getPriceRub, totalPortfolioCost)
  ), [getPriceRub, positions, totalPortfolioCost]);
  return [newData];
}
