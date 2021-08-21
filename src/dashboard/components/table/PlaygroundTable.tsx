import React, {
  ChangeEventHandler, FocusEventHandler,
  KeyboardEventHandler,
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import {TableCellProps, TableCellRenderer} from 'react-virtualized';
import {PositionTableProps} from './PositionsTable';
import BaseTable, {ColumnConfig} from './BaseTable';
import useGetData from '../../../generic/hooks/useGetData';
import {PositionKey, PositionRow} from '../../../@types';
import LoadingWrapper from '../../../generic/components/LoadingWrapper';
import useGetSorting from './useSorting';
import useGetDataWithPrices from './useGetDataWithPrices';
import {BalanceRenderer, PortfolioPercentRenderer, PriceRenderer} from './cells';

function roundValue(value: number | null): number {
  return Number((value || 0).toFixed(2));
}

function getNewRowData(
  row: PositionRow,
  changedValues?: ChangedValueMap,
  key?: PositionKey,
) {
  const {value, finished} = (
    key ? changedValues?.[key] : null
  ) || {};
  const numberValue = Number(value);
  const {
    totalBalance: oldBalance,
    portfolioPercent,
    lastPrice = 0,
    totalNet,
    averagePrice: oldAveragePrice,
    totalOperationsCost,
  } = row;
  let percent = portfolioPercent || 0;
  let average = oldAveragePrice;
  let balance = oldBalance;
  if (key === 'totalBalance') {
    balance = numberValue;
    average = lastPrice - totalNet / balance;
    percent = (percent * balance) / oldBalance;
  } else if (key === 'averagePrice') {
    balance = Math.ceil(totalNet / (lastPrice - numberValue));
    average = !finished ? numberValue : lastPrice - totalNet / balance;
    percent = (percent * balance) / oldBalance;
  } else if (key === 'portfolioPercent') {
    balance = Math.ceil((numberValue * oldBalance) / percent);
    const operationsDiff = -(balance - oldBalance) * lastPrice;
    average = lastPrice - (
      totalOperationsCost + operationsDiff + lastPrice * balance
    ) / balance;
    percent = !finished ? numberValue : (percent * balance) / oldBalance;
  }
  return {
    ...row,
    totalBalance: balance,
    averagePrice: roundValue(average),
    portfolioPercent: roundValue(percent),
  };
}

function reCalculateData(
  data: PositionRow[],
  newValues: ChangedRowData,
): PositionRow[] {
  const result = [...data].map((row) => getNewRowData(row));
  Object.keys(newValues).forEach((changedFigi) => {
    const rowIndex = result.findIndex(({figi}) => figi === changedFigi);
    if (rowIndex === -1) return;
    const changedValues = newValues[changedFigi];
    Object.keys(changedValues).forEach((key) => {
      const dataKey = key as PositionKey;

      switch (dataKey) {
        case 'totalBalance':
        case 'averagePrice':
        case 'portfolioPercent': {
          result[rowIndex] = getNewRowData(result[rowIndex], changedValues, dataKey);
          break;
        }
        default:
          break;
      }
    });
  });
  return result;
}

type ChangedValue = {
  value: PositionRow[PositionKey],
  finished: boolean,
};
type ChangedValueMap = {
  [key in PositionKey]?: ChangedValue;
};
type ChangedRowData = {
  [figi: string]: ChangedValueMap
};

type EditableCell = {[dataKey in PositionKey]: boolean};

function EditableCellRenderer({
  isEditable,
  onCellChange,
  onEditStateChange,
  isChanged,
  cellRenderer,
  ...tableProps
}: TableCellProps & {
  isEditable: boolean,
  isChanged: boolean,
  onEditStateChange: (rowIndex: number, dataKey: PositionKey, isEditable: boolean) => void,
  onCellChange: (newData: ChangedValueMap, figi: string) => void,
  cellRenderer?: TableCellRenderer,
}) {
  const {
    dataKey, rowIndex, cellData, rowData,
  } = tableProps;
  const key = dataKey as PositionKey;
  const setEditable = useCallback(() => {
    onEditStateChange(rowIndex, key, true);
  }, [key, onEditStateChange, rowIndex]);
  const setReadOnly = useCallback(() => {
    onEditStateChange(rowIndex, key, false);
  }, [key, onEditStateChange, rowIndex]);
  const updateChangedData = useCallback((newValue: string, finished: boolean) => {
    onCellChange({
      [key]: {
        value: newValue,
        finished,
      },
    }, rowData.figi);
    if (finished) {
      setReadOnly();
    }
  }, [key, onCellChange, rowData.figi, setReadOnly]);

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isEditable && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(0, inputRef.current.value.length);
    }
  }, [isEditable]);
  const onKeyDown = useCallback<KeyboardEventHandler<HTMLInputElement>>(
    ({currentTarget, which}) => {
      if (which === 13) {
        updateChangedData(currentTarget.value, true);
        setReadOnly();
      }
    }, [setReadOnly, updateChangedData],
  );
  const onBlur = useCallback<FocusEventHandler<HTMLInputElement>>(
    ({target}) => {
      updateChangedData(target.value, true);
      setReadOnly();
    }, [setReadOnly, updateChangedData],
  );
  const onChange = useCallback<ChangeEventHandler<HTMLInputElement>>(({target}) => {
    updateChangedData(target.value, false);
  }, [updateChangedData]);

  return !isEditable ? (
    <>
      {/* eslint-disable-next-line max-len */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
      <div
        style={{
          ...(isChanged && {backgroundColor: 'green'}),
          border: '1px dotted yellow',
        }}
        onClick={setEditable}
      >
        {cellRenderer ? cellRenderer(tableProps) : cellData}
      </div>
    </>
  ) : (
    <input
      ref={inputRef}
      type="text"
      value={cellData}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    />
  );
}

/* eslint-disable react/default-props-match-prop-types */
PlaygroundTable.defaultProps = {
  totalPortfolioCostLoading: false,
  totalPortfolioCost: null,
};
/* eslint-enable react/default-props-match-prop-types */

function PlaygroundTable({
  onLoad,
  totalPortfolioCost,
  totalPortfolioCostLoading,
}: PositionTableProps) {
  const [positions, loading, loadingError] = useGetData<PositionRow[]>(
    onLoad,
    [],
  );
  const [dataWithPrices] = useGetDataWithPrices(
    positions,
    totalPortfolioCostLoading ? null : (totalPortfolioCost as number | null),
  );
  const [sortedData, currentSorting, currentSortDirection, onSorting] = useGetSorting<PositionRow>(
    dataWithPrices,
  );
  const [editableCells, setEditableCells] = useState<EditableCell[]>([]);
  const updateEditableCells = useCallback(
    (rowIndex: number, dataKey: PositionKey, isEditable: boolean) => {
      setEditableCells((cells) => {
        const result = [...cells];
        result[rowIndex] = result[rowIndex] || {};
        result[rowIndex][dataKey] = isEditable;
        return result;
      });
    }, [],
  );
  const [changedData, setChangedData] = useState<ChangedRowData>({} as ChangedRowData);
  const updateChangedData = useCallback((changedRowData, figi: string) => {
    setChangedData((rowData) => {
      const result = {...rowData};
      result[figi] = changedRowData;
      return result;
    });
  }, []);
  const playgroundData = useMemo(() => (
    reCalculateData(sortedData, changedData)
  ), [sortedData, changedData]);

  const isCellChanged = useCallback((
    cellData: any,
    rowIndex: number,
    dataKey: PositionKey,
  ) => Math.abs(
    Number(cellData) - Number(sortedData[rowIndex][dataKey]),
  ) >= 1e-2, [sortedData]);

  const renderEditableCell = useCallback((cellRenderer?: TableCellRenderer) => (
    props: TableCellProps,
  ) => {
    const {
      cellData,
      rowIndex,
      dataKey,
      rowData,
    } = props;

    if (rowData.instrumentType === 'Currency') {
      return cellRenderer ? cellRenderer(props) : cellData;
    }

    return (
      <EditableCellRenderer
          /* eslint-disable-next-line react/jsx-props-no-spreading */
        {...props}
          // TODO replace with figi
        isEditable={editableCells[rowIndex] && editableCells[rowIndex][dataKey as PositionKey]}
        isChanged={isCellChanged(cellData, rowIndex, dataKey as PositionKey)}
        onEditStateChange={updateEditableCells}
        onCellChange={updateChangedData}
        cellRenderer={cellRenderer}
      />
    );
  }, [editableCells, isCellChanged, updateChangedData, updateEditableCells]);

  const columnConfigs = useMemo<ColumnConfig[]>(() => [
    {key: '#'},
    {key: 'name'},
    {key: 'instrumentType'},
    {
      key: 'portfolioPercent',
      cellRenderer: renderEditableCell(PortfolioPercentRenderer),
    },
    {
      key: 'totalBalance',
      cellRenderer: renderEditableCell(BalanceRenderer),
    },
    {key: 'lastPrice'},
    {
      key: 'averagePrice',
      cellRenderer: renderEditableCell(PriceRenderer),
    },
    {key: 'totalNet'},
    {key: 'totalNetRub'},
    {
      key: 'toolbar',
      cellRenderer: ({rowIndex, rowData}: TableCellProps & {
        rowData: PositionRow,
      }) => {
        const changedValues = (changedData[rowData.figi] || {}) as ChangedValueMap;
        if (
          !Object.keys(changedValues).length
            || !Object.keys(changedValues).some((key) => {
              const dataKey = key as PositionKey;
              const {value} = changedValues[dataKey] || {};
              return isCellChanged(value, rowIndex, dataKey);
            })
        ) {
          return '';
        }
        return (
          <button
            type="button"
            onClick={() => updateChangedData({}, rowData.figi)}
          >
            x
          </button>
        );
      },
    },
  ], [changedData, isCellChanged, renderEditableCell, updateChangedData]);

  return (
    <LoadingWrapper loading={loading} loadingError={!!loadingError}>
      <BaseTable
        columnsConfig={columnConfigs}
        positions={playgroundData}
        onSorting={onSorting}
        currentSortDirection={currentSortDirection}
        sortBy={currentSorting}
      />
    </LoadingWrapper>
  );
}

export default PlaygroundTable;
