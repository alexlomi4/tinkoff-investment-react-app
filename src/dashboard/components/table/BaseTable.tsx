import React, {
  useCallback,
} from 'react';
// @ts-ignore
import {
  Column,
  SortIndicator,
  Table,
  TableCellRenderer,
  TableHeaderProps,
  SortDirectionType,
} from 'react-virtualized';
// eslint-disable-next-line import/no-extraneous-dependencies
import Button from '@material-ui/core/Button';
import {PositionColumn, PositionKey, PositionRow} from '../../../@types';
import {SortingCallback} from './useSorting';
import {
  BalanceRenderer, NetRenderer, PortfolioPercentRenderer, PriceRenderer,
} from './cells';

export type ColumnConfig = {
  key: PositionColumn,
  cellRenderer?: TableCellRenderer,
};

export interface BaseTableProps {
  height?: number,
  rowHeight?: number,
  headerHeight?: number,
  className?: string,
  visibleColumns?: PositionColumn[],
}

interface TableProps extends BaseTableProps {
  positions: PositionRow[],
  onSorting: SortingCallback,
  currentSortDirection: SortDirectionType,
  sortBy: PositionKey,
  columnsConfig?: ColumnConfig[],
}

function BaseTable({
  height = 280,
  rowHeight = 70,
  headerHeight = 70,
  columnsConfig = [],
  className,
  positions,
  onSorting,
  currentSortDirection,
  sortBy,
  visibleColumns = [],
}: TableProps) : JSX.Element {
  const rowGetter = useCallback(({index}: {index:number}) => positions[index], [positions]);

  const renderColumn = useCallback((column: JSX.Element) => {
    if ((visibleColumns.length && !visibleColumns.includes(column.props.dataKey))) {
      return null;
    }
    const config = (
      columnsConfig.find(({key}) => key === column.props.dataKey) || {}
    ) as ColumnConfig;
    return React.cloneElement(
      column,
      {
        cellRenderer: config.cellRenderer || column.props.cellRenderer,
      },
    );
  }, [columnsConfig, visibleColumns]);

  const headerRenderer = useCallback(({
    dataKey, sortBy: currentSorting, sortDirection, label, disableSort,
  }: TableHeaderProps) => (
    <div className="Header-button">
      {!disableSort ? (
        <Button
          size="medium"
          fullWidth
          onClick={!disableSort ? () => onSorting(dataKey as PositionKey) : undefined}
        >
          {label}
        </Button>
      ) : label}
      {(currentSorting === dataKey && !disableSort) && (
      <SortIndicator sortDirection={sortDirection} />
      )}
    </div>
  ), [onSorting]);

  return (
    <div className={className || 'Position-Table'}>
      <Table
        width={1000}
        height={height!}
        headerHeight={headerHeight!}
        rowHeight={rowHeight!}
        rowCount={positions.length}
        rowGetter={rowGetter}
        sortBy={sortBy}
        headerClassName="Header-text"
        sortDirection={currentSortDirection}
      >
        {renderColumn(
          <Column
            width={70}
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
            width={200}
            label="%"
            dataKey="portfolioPercent"
            headerRenderer={headerRenderer}
            cellRenderer={PortfolioPercentRenderer}
          />,
        )}
        {renderColumn(
          <Column
            width={240}
            label="Total balance"
            dataKey="totalBalance"
            headerRenderer={headerRenderer}
            disableSort
            cellRenderer={BalanceRenderer}
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
            width={240}
            label="Net"
            dataKey="totalNet"
            headerRenderer={headerRenderer}
            cellRenderer={NetRenderer}
          />,
        )}
        {renderColumn(
          <Column
            width={300}
            label="Net RUB"
            dataKey="totalNetRub"
            headerRenderer={headerRenderer}
            cellRenderer={NetRenderer}
          />,
        )}
        {renderColumn(
          <Column
            width={100}
            dataKey="toolbar"
          />,
        )}
      </Table>
    </div>
  );
}

export default BaseTable;
