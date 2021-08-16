import React, {ReactNode, useCallback, useMemo} from 'react';
// @ts-ignore
import {Column, Table} from 'react-virtualized';
// eslint-disable-next-line import/no-extraneous-dependencies
import {Currency} from '@tinkoff/invest-openapi-js-sdk';
import InvestApiService from '../../service/InvestApiService';
import {LoadingWrapperProps, PositionColumnKey, PositionRow} from '../../@types';
import useGetData from '../../generic/hooks/useGetData';
import LoadingWrapper from '../../generic/components/LoadingWrapper';
import {CurrencyInfo} from '../../@types/server';
import {formatPrice} from '../../generic/utils';

const DEFAULT_COLUMNS: PositionColumnKey[] = [
  'index',
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
  if (!totalNet) {
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

type PositionTableProps = LoadingWrapperProps & {
  positions: PositionRow[],
  height?: number,
  rowHeight?: number,
  headerHeight?: number,
  columnsToShow?: PositionColumnKey[],
  // eslint-disable-next-line react/require-default-props
  className?: string,
  title: string,
  totalPortfolioCost?: number,
  totalPortfolioCostLoading?: boolean,
};

PositionsTable.defaultProps = {
  height: 280,
  rowHeight: 70,
  headerHeight: 70,
  columnsToShow: DEFAULT_COLUMNS,
  totalPortfolioCost: 1,
  totalPortfolioCostLoading: false,
};

function PositionsTable({
  positions,
  height,
  rowHeight,
  headerHeight,
  columnsToShow,
  className,
  title,
  loading,
  loadingError,
  totalPortfolioCost,
  totalPortfolioCostLoading,
}: PositionTableProps) : JSX.Element {
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

  const rowGetter = useCallback(({index}: {index:number}) => positions[index], [positions]);

  const getPriceRub = useCallback((price: number, rowData: PositionRow) => {
    if (pricesLoading) {
      return null;
    }
    const {currency: instrumentCurrency} = rowData;
    const {lastPrice} = pricesInfo.find(({currency}) => currency === instrumentCurrency) || {};
    return lastPrice ? price * lastPrice : price;
  }, [pricesInfo, pricesLoading]);

  const rubPriceRenderer = useCallback<(props: TotalNetRendererProps) => ReactNode>(
    ({rowData, cellData: totalNet}) => {
      if (!totalNet) {
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

  return (
    <LoadingWrapper loading={loading} loadingError={loadingError}>
      <div className={className || 'Position-Table'}>
        {title}
        <Table
          width={1000}
          height={height!}
          headerHeight={headerHeight!}
          rowHeight={rowHeight!}
          rowCount={positions.length}
          rowGetter={rowGetter}
          headerClassName="Header-text"
        >
          {renderColumn(
            <Column width={50} label="#" dataKey="index" className="Index-column" />,
          )}
          {renderColumn(
            <Column width={380} label="Name" dataKey="name" />,
          )}
          {renderColumn(
            <Column width={180} label="Type" dataKey="instrumentType" />,
          )}
          {renderColumn(
            <Column
              width={150}
              label="%"
              dataKey="totalPrice"
              cellRenderer={({cellData, rowData}) => {
                const totalPriceRub = getPriceRub(cellData, rowData);
                if (totalPortfolioCostLoading || totalPriceRub === null) {
                  return 'Loading';
                }
                return `${formatPrice((100 * ((totalPriceRub / totalPortfolioCost!))))}%`;
              }}
            />,
          )}
          {renderColumn(
            <Column
              width={240}
              label="Total balance"
              dataKey="totalBalance"
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
              cellRenderer={PriceRenderer}
            />,
          )}
          {renderColumn(
            <Column
              width={250}
              label="Average price"
              dataKey="averagePrice"
              cellRenderer={PriceRenderer}
            />,
          )}
          {renderColumn(
            <Column
              width={260}
              label="Oper Sum"
              dataKey="totalOperationsCost"
              cellRenderer={PriceRenderer}
            />,
          )}
          {renderColumn(
            <Column
              width={200}
              label="Net"
              dataKey="totalNet"
              cellRenderer={NetRenderer}
            />,
          )}
          {renderColumn(
            <Column
              width={200}
              label="Net RUB"
              dataKey="totalNet"
              cellRenderer={rubPriceRenderer}
            />,
          )}
        </Table>
      </div>
    </LoadingWrapper>
  );
}

export default PositionsTable;
