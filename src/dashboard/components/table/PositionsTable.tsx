import React from 'react';
import {SortDirectionType} from 'react-virtualized';
import BaseTable, {BaseTableProps} from './BaseTable';
import {PositionKey, PositionRow} from '../../../@types';
import useGetData from '../../../generic/hooks/useGetData';
import useGetSorting from './useSorting';
import LoadingWrapper from '../../../generic/components/LoadingWrapper';
import useGetDataWithPrices from './useGetDataWithPrices';

export interface PositionTableProps extends BaseTableProps {
  onLoad: () => Promise<PositionRow[]>;
  totalPortfolioCost?: number,
  totalPortfolioCostLoading?: boolean,
  initialSortBy?: PositionKey,
  initialSortDirection?: SortDirectionType,
}

PositionsTable.defaultProps = {
  totalPortfolioCostLoading: false,
  totalPortfolioCost: null,
};

function PositionsTable({
  onLoad,
  totalPortfolioCost,
  totalPortfolioCostLoading,
  visibleColumns,
  initialSortBy,
  initialSortDirection,
}: PositionTableProps) {
  const [positions, loading, loadingError] = useGetData<PositionRow[]>(
    onLoad,
    [],
  );
  const [dataWithPrices] = useGetDataWithPrices(
    positions,
    totalPortfolioCostLoading ? null : (totalPortfolioCost as number | null),
  );
  const [
    sortedData,
    currentSorting,
    currentSortDirection,
    onSorting,
  ] = useGetSorting<PositionRow>(dataWithPrices, initialSortBy, initialSortDirection);

  return (
    <LoadingWrapper loading={loading} loadingError={!!loadingError}>
      <BaseTable
        positions={sortedData}
        onSorting={onSorting}
        currentSortDirection={currentSortDirection}
        sortBy={currentSorting}
        visibleColumns={visibleColumns}
      />
    </LoadingWrapper>
  );
}

export default PositionsTable;
