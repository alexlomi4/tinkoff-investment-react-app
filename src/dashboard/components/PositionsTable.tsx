import React, {
  ReactNode, useCallback, useMemo, useState,
} from 'react';
// @ts-ignore
import {
  Column, Table, SortIndicator, TableHeaderProps, SortDirection,
} from 'react-virtualized';
// eslint-disable-next-line import/no-extraneous-dependencies
import {Currency} from '@tinkoff/invest-openapi-js-sdk';
import {SortDirectionType} from 'react-virtualized/dist/es/Table';
import Button from '@material-ui/core/Button';
import InvestApiService from '../../service/InvestApiService';
import {PositionColumn, PositionKey, PositionRow} from '../../@types';
import useGetData from '../../generic/hooks/useGetData';
import LoadingWrapper from '../../generic/components/LoadingWrapper';
import {CurrencyInfo} from '../../@types/server';
import {formatPrice} from '../../generic/utils';

const DEFAULT_COLUMNS: PositionColumn[] = [
  '#',
  'name',
  'instrumentType',
  'totalPrice',
  'totalBalance',
  'lastPrice',
  'averagePrice',
  // 'totalOperationsCost',
  'totalNet',
];

type PositionRowRendererProps<T> = {
  cellData?: T;
  rowData: PositionRow,
};

type TotalNetRendererProps = PositionRowRendererProps<PositionRow['totalNet']>;

function PriceRenderer({
  cellData,
  rowData,
}: PositionRowRendererProps<number>) {
  return <>{formatPrice(cellData as number, rowData.currency)}</>;
}
PriceRenderer.defaultProps = {
  cellData: 0,
};

function NetRenderer({
  cellData: totalNet,
  rowData,
}: TotalNetRendererProps) {
  if (totalNet === undefined) {
    return '';
  }

  return (
    <div className={totalNet < 0 ? 'Loss-net' : 'Profit-net'}>
      {`${formatPrice(totalNet, rowData.currency)} (${formatPrice(
        Math.sign(totalNet) * rowData.totalNetPercent,
      )}%)`}
    </div>
  );
}
NetRenderer.defaultProps = {
  cellData: 0,
};

type PositionTableProps = {
  height?: number,
  rowHeight?: number,
  headerHeight?: number,
  columnsToShow?: PositionColumn[],
  // eslint-disable-next-line react/require-default-props
  className?: string,
  title?: string,
  totalPortfolioCost?: number,
  totalPortfolioCostLoading?: boolean,
  onLoad: () => Promise<PositionRow[]>
};

PositionsTable.defaultProps = {
  height: 280,
  rowHeight: 70,
  headerHeight: 70,
  columnsToShow: DEFAULT_COLUMNS,
  totalPortfolioCost: 1,
  totalPortfolioCostLoading: false,
  title: '',
};

type ValueConverter = (cellData: any, rowData: PositionRow) => number | null;

const createStringComparator = (key: PositionKey) => (a: PositionRow, b: PositionRow) => {
  const val1 = (a[key] || '') as string;
  const val2 = (b[key] || '') as string;
  return val1.localeCompare(val2);
};
const createNumberComparator = (
  key: PositionKey,
  valueConverters: {[key: string]: ValueConverter} | undefined = {},
) => (a: PositionRow, b: PositionRow): number => {
  const getValue = (row: PositionRow, valueKey: PositionKey) => (
    valueConverters[key] ? valueConverters[key](row[valueKey], row) : row[valueKey] as number
  ) || 0;
  const val1 = getValue(a, key);
  const val2 = getValue(b, key);
  return Math.sign(val1 - val2);
};
const compareName = createStringComparator('name');
const compareType = createStringComparator('instrumentType');

function sortData(
  data: PositionRow[],
  key: PositionColumn,
  direction: SortDirectionType,
  valueConverters: {[key: string]: ValueConverter} | undefined = {},
): PositionRow[] {
  let result = [...data];
  switch (key) {
    case 'name':
      result = result.sort(compareName);
      break;
    case 'instrumentType':
      result = result.sort(compareType);
      break;
    case 'totalPrice':
    case 'totalNet':
      result = result.sort(createNumberComparator(key, valueConverters));
      break;
    default:
      break;
  }
  return direction === SortDirection.ASC ? result : result.reverse();
}

function PositionsTable({
  height,
  rowHeight,
  headerHeight,
  columnsToShow,
  className,
  title,
  totalPortfolioCost,
  totalPortfolioCostLoading,
  onLoad,
}: PositionTableProps) : JSX.Element {
  const [positions, loading, loadingError] = useGetData<PositionRow[]>(
    onLoad,
    [],
  );

  const currencies = useMemo(() => (
    Array.from(new Set(
      positions.map(({currency}) => currency).filter(Boolean),
    ))
  ), [positions]) as Currency[];
  const [pricesInfo, pricesLoading] = useGetData<CurrencyInfo[]>(
    useCallback(() => (
      InvestApiService.getCurrencyInfos(currencies)
    ), [currencies]),
    [],
  );
  const getPriceRub = useCallback((price: number, rowData: PositionRow) => {
    if (pricesLoading) {
      return null;
    }
    const {currency: instrumentCurrency} = rowData;
    const {lastPrice} = pricesInfo.find(({currency}) => currency === instrumentCurrency) || {};
    return lastPrice ? price * lastPrice : price;
  }, [pricesInfo, pricesLoading]);

  const portfolioPercentConverter = useCallback((cellData: number, rowData: PositionRow) => {
    const totalPriceRub = getPriceRub(cellData, rowData);
    if (totalPortfolioCostLoading || totalPriceRub === null) {
      return null;
    }
    return 100 * ((totalPriceRub / totalPortfolioCost!));
  }, [getPriceRub, totalPortfolioCost, totalPortfolioCostLoading]);

  const [currentSorting, setCurrentSorting] = useState<PositionColumn>('name');
  const [currentSortDirection, setSortDirection] = useState<SortDirectionType>(SortDirection.ASC);
  const onHeaderPress = useCallback((dataKey: PositionColumn) => {
    setCurrentSorting(dataKey);
    setSortDirection((state) => (
      state === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC
    ));
  }, []);
  const data = useMemo(() => (
    sortData(
      positions,
      currentSorting,
      currentSortDirection,
      {
        totalPrice: portfolioPercentConverter,
        totalNet: getPriceRub,
      },
    )
  ), [positions, currentSorting, currentSortDirection, portfolioPercentConverter, getPriceRub]);

  const rowGetter = useCallback(({index}: {index:number}) => data[index], [data]);

  const rubPriceRenderer = useCallback<(props: TotalNetRendererProps) => ReactNode>(
    ({rowData, cellData: totalNet}) => {
      if (totalNet === undefined) {
        return '';
      }
      const totalNetRub = getPriceRub(totalNet, rowData);
      if (totalNetRub === null) {
        return <>Loading</>;
      }

      return (
        <div className={totalNet < 0 ? 'Loss-net' : 'Profit-net'}>
          {formatPrice(totalNetRub, 'RUB')}
        </div>
      );
    }, [getPriceRub]);

  const renderColumn = useCallback((column: JSX.Element) => {
    if (columnsToShow && !columnsToShow.includes(column.props.dataKey)) {
      return null;
    }
    return column;
  }, [columnsToShow]);

  const headerRenderer = useCallback(({
    dataKey, sortBy, sortDirection, label, disableSort,
  }: TableHeaderProps) => (
    <div className="Header-button">
      {!disableSort ? (
        <Button
          size="medium"
          fullWidth
          onClick={!disableSort ? () => onHeaderPress(dataKey as PositionColumn) : undefined}
        >
          {label}
        </Button>
      ) : label}
      {sortBy === dataKey && !disableSort && <SortIndicator sortDirection={sortDirection} />}
    </div>
  ), [onHeaderPress]);

  return (
    <LoadingWrapper loading={loading} loadingError={!!loadingError}>
      <div className={className || 'Position-Table'}>
        {title}
        <Table
          width={1000}
          height={height!}
          headerHeight={headerHeight!}
          rowHeight={rowHeight!}
          rowCount={data.length}
          rowGetter={rowGetter}
          sortBy={currentSorting}
          headerClassName="Header-text"
          sortDirection={currentSortDirection}
        >
          {renderColumn(
            <Column
              width={50}
              label="#"
              dataKey="#"
              className="Index-column"
              cellRenderer={({rowIndex}) => rowIndex}
            />,
          )}
          {renderColumn(
            <Column
              width={380}
              label="Name"
              dataKey="name"
              headerRenderer={headerRenderer}
            />,
          )}
          {renderColumn(
            <Column
              width={180}
              label="Type"
              dataKey="instrumentType"
              headerRenderer={headerRenderer}
            />,
          )}
          {renderColumn(
            <Column
              width={150}
              label="%"
              dataKey="totalPrice"
              headerRenderer={headerRenderer}
              cellRenderer={({cellData, rowData}) => {
                const value = portfolioPercentConverter(cellData, rowData);
                if (value === null) {
                  return 'Loading';
                }
                return `${formatPrice(value)}%`;
              }}
            />,
          )}
          {renderColumn(
            <Column
              width={240}
              label="Total balance"
              dataKey="totalBalance"
              headerRenderer={headerRenderer}
              disableSort
              cellRenderer={({cellData, rowData}) => (
                rowData.instrumentType === 'Currency' ? cellData.toFixed(2) : cellData
              )}
            />,
          )}
          {renderColumn(
            <Column
              width={240}
              label="Current price"
              dataKey="lastPrice"
              headerRenderer={headerRenderer}
              disableSort
              cellRenderer={PriceRenderer}
            />,
          )}
          {renderColumn(
            <Column
              width={250}
              label="Average price"
              dataKey="averagePrice"
              disableSort
              headerRenderer={headerRenderer}
              cellRenderer={PriceRenderer}
            />,
          )}
          {renderColumn(
            <Column
              width={260}
              label="Oper Sum"
              dataKey="totalOperationsCost"
              headerRenderer={headerRenderer}
              cellRenderer={PriceRenderer}
            />,
          )}
          {renderColumn(
            <Column
              width={200}
              label="Net"
              dataKey="totalNet"
              headerRenderer={headerRenderer}
              cellRenderer={NetRenderer}
            />,
          )}
          {renderColumn(
            <Column
              width={200}
              label="Net RUB"
              dataKey="totalNet"
              headerRenderer={headerRenderer}
              cellRenderer={rubPriceRenderer}
            />,
          )}
        </Table>
      </div>
    </LoadingWrapper>
  );
}

export default PositionsTable;
