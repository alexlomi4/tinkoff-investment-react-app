import React, {
  useCallback, useMemo, useState,
} from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import {UserAccount} from '@tinkoff/invest-openapi-js-sdk';
import {createTheme, ThemeProvider} from '@material-ui/core';
import {SortDirection} from 'react-virtualized';
import InvestApiService, {
} from '../service/InvestApiService';
import useGetData from '../generic/hooks/useGetData';
import LoadingWrapper from '../generic/components/LoadingWrapper';
import {PositionsTable, AccountSelector, PlaygroundTable} from './components/index';
import {Totals} from '../@types/server';
import {formatPrice} from '../generic/utils';
import TabWrapper from '../generic/components/TabPanel';
import {PositionColumn} from '../@types';

const HISTORY_COLUMNS: PositionColumn[] = [
  '#',
  'name',
  'instrumentType',
  'lastPrice',
  'totalNet',
  'totalNetRub',
];

const darkTheme = createTheme({
  palette: {
    type: 'dark',
  },
});

function Dashboard() {
  const [accounts, accsLoading] = useGetData<UserAccount[]>(
    InvestApiService.getAccounts,
    [],
  );
  const [accountId, setAccountId] = useState<string>('');
  const selectOptions = useMemo(() => [
    {
      value: '',
      text: 'ALL',
    },
    ...accounts.map(({brokerAccountId, brokerAccountType}) => ({
      value: brokerAccountId,
      text: brokerAccountType,
    })),
  ], [accounts]);
  const onSelectorChange = useCallback(
    (event) => {
      setAccountId(event.target.value);
    }, [],
  );

  const [totals, loadingTotals, loadingTotalsError] = useGetData<Totals>(
    useCallback(() => (
      InvestApiService.getTotals(accountId)
    ), [accountId]),
    {} as Totals,
  );

  const portfolioCost = totals.totalPayIn + totals.netTotal;

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="Account-selector-panel">
        <AccountSelector
          title="Account"
          isDataLoading={accsLoading}
          onSelectorChange={onSelectorChange}
          data={selectOptions}
          selectedValue={accountId}
        />
        <TabWrapper
          label="position tabs"
          tabLabels={['Current positions', 'Playground', 'Position History']}
        >
          <PositionsTable
            totalPortfolioCostLoading={loadingTotals}
            totalPortfolioCost={portfolioCost}
            onLoad={useCallback(() => (
              InvestApiService.getPortfolios(accountId)
            ), [accountId])}
          />
          <PlaygroundTable
            totalPortfolioCostLoading={loadingTotals}
            totalPortfolioCost={portfolioCost}
            initialSortBy="totalNetRub"
            initialSortDirection={SortDirection.ASC}
            onLoad={useCallback(() => (
              InvestApiService.getPortfolios(accountId)
            ), [accountId])}
          />
          <PositionsTable
            visibleColumns={HISTORY_COLUMNS}
            initialSortBy="totalNetRub"
            initialSortDirection={SortDirection.DESC}
            onLoad={useCallback(() => (
              InvestApiService.getHistoricPositions(accountId)
            ), [accountId])}
          />
        </TabWrapper>
        <LoadingWrapper loading={loadingTotals} loadingError={!!loadingTotalsError}>
          {!loadingTotals && !loadingTotalsError && (
            <div className="Total-Section">
              <pre>{`${formatPrice(portfolioCost, 'RUB')}:    `}</pre>
              <pre className={totals.netTotal >= 0 ? 'Profit-net' : 'Loss-net'}>
                {`${formatPrice(totals.netTotal, 'RUB')} (${formatPrice(totals.percent)}%)`}
              </pre>
            </div>
          )}
        </LoadingWrapper>
      </div>
    </ThemeProvider>
  );
}

export default Dashboard;
