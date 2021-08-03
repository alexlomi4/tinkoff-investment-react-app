import React, {useCallback, useMemo, useState} from 'react';
// @ts-ignore
import {Table, Column, CellRendererParams} from 'react-virtualized';
import InvestApiService, {
  Account, ALL_ACCOUNTS, CURRENCY_SIGNS, CurrencyInfo, PositionMap,
} from '../login/InvestApiService';
import useGetData from '../hooks/useGetData';

type TableRow = {
  index: number,
  name: string,
  instrumentType: string,
  lastPrice: string,
  totalBalance: number,
  totalNet: string,
  averagePrice: string,
  totalOperationsCost: string,
  currency: string,
};

function formatPrice(price: number, currencySymbol: string): string {
  return `${price.toFixed(2)}${currencySymbol}`;
}

function getTableData(portfolios: PositionMap) {
  if (!portfolios) {
    return [];
  }
  return Object.keys(portfolios).map((ticker, index) => {
    const positions = portfolios[ticker];
    const {
      instrumentType = '',
      name = '',
      lastPrice = 0,
      currency,
    } = positions[0];

    const totalBalance = positions.reduce((sum, {balance}) => sum + balance, 0);
    const totalNet = positions.reduce((sum, {totalNet: positionNet}) => sum + positionNet, 0);
    const totalOperationsCost = positions.reduce((sum, {operationsNet}) => sum + operationsNet, 0);
    const averagePrice = Math.abs((lastPrice * totalBalance - totalNet) / totalBalance);
    const currencySymbol = CURRENCY_SIGNS[currency];

    return {
      index,
      name,
      instrumentType,
      lastPrice: formatPrice(lastPrice, currencySymbol),
      totalBalance,
      totalNet: formatPrice(totalNet, currencySymbol),
      averagePrice: formatPrice(averagePrice, currencySymbol),
      totalOperationsCost: formatPrice(totalOperationsCost, currencySymbol),
      currency,
    };
  }).sort(({name: name1}, {name: name2}) => name1.localeCompare(name2));
}

function netRenderer({
  cellData,
  rowData,
}: CellRendererParams): string | JSX.Element {
  if (cellData == null) {
    return '';
  }
  const totalNet = parseFloat(cellData);
  const operationCost = parseFloat(rowData.totalOperationsCost);
  const percentage = (totalNet / Math.abs(operationCost)) * 100;

  return (
    <div className={totalNet < 0 ? 'Loss-net' : 'Profit-net'}>
      {`${cellData} (${percentage.toFixed(2)}%)`}
    </div>
  );
}

function Dashboard() {
  const [accounts, accsLoading] = useGetData<Account[]>(
    InvestApiService.getAccounts,
    [],
  );
  const [accountId, setAccountId] = useState<string>(ALL_ACCOUNTS);
  const onSelectorChange = useCallback(({target}) => {
    setAccountId(target.value);
  }, []);

  const [portfolios, loading, error] = useGetData<PositionMap>(
    useCallback(() => (
      InvestApiService.getPortfolios(accountId)
    ), [accountId]),
    {},
  );

  const data: TableRow[] = useMemo(() => (
    getTableData(portfolios)
  ), [portfolios]);
  const rowGetter = useCallback(({index}: {index:number}) => data[index], [data]);

  const currencies = useMemo(() => (
    Array.from(new Set(data.map(({currency}) => currency)))
  ), [data]);
  const [priceInfos, pricesLoading] = useGetData<CurrencyInfo[]>(
    useCallback(() => (
      InvestApiService.getCurrencyInfos(currencies)
    ), [currencies]),
    [],
  );
  const rubPriceRenderer = useCallback(({rowData, cellData}) => {
    if (pricesLoading) {
      return <>Loading</>;
    }
    const totalNet = parseFloat(cellData);
    const {currency: instrumentCurrency} = rowData;
    const {lastPrice} = priceInfos.find(({currency}) => currency === instrumentCurrency) || {};
    if (!lastPrice) {
      return cellData;
    }
    return formatPrice(lastPrice * totalNet, CURRENCY_SIGNS.RUB);
  }, [priceInfos, pricesLoading]);

  const selectOptions = useMemo(() => [
    {
      value: 'ALL',
      text: 'ALL',
    },
    ...accounts.map(({brokerAccountId, brokerAccountType}) => ({
      value: brokerAccountId,
      text: brokerAccountType,
    })),
  ], [accounts]);

  return (
    <>
      <div className="Account-selector-panel">
        {loading && <p>Loading</p>}
        {!loading && (
          <>
            Account selection for statistics
            {accsLoading ? (
              <p>Loading</p>
            ) : (
              <select
                className="Account-selector"
                onChange={onSelectorChange}
              >
                {selectOptions.map(({value, text}) => (
                  <option
                    value={value}
                    selected={value === accountId}
                  >
                    {text}
                  </option>
                ))}
              </select>
            )}
            {!loading && error && <>Unexpected error</>}
            {!loading && !error && (
            <Table
              width={1000}
              height={500}
              headerHeight={150}
              rowHeight={100}
              rowCount={data.length}
              rowGetter={rowGetter}
              headerClassName="Header-text"
            >
              <Column width={40} label="#" dataKey="index" />
              <Column width={380} label="Name" dataKey="name" />
              <Column width={180} label="Type" dataKey="instrumentType" />
              <Column width={200} label="Total balance" dataKey="totalBalance" />
              <Column width={200} label="Current price" dataKey="lastPrice" />
              <Column width={200} label="Average price" dataKey="averagePrice" />
              <Column width={220} label="Operations cost" dataKey="totalOperationsCost" />
              <Column
                width={200}
                label="Net"
                dataKey="totalNet"
                cellRenderer={netRenderer}
              />
              <Column
                width={200}
                label="Net RUB"
                dataKey="totalNet"
                cellRenderer={rubPriceRenderer}
              />
            </Table>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default Dashboard;
