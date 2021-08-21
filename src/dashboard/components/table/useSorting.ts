import {SortDirectionType, SortDirection} from 'react-virtualized';
import {useCallback, useMemo, useState} from 'react';
import {PositionKey, PositionRow} from '../../../@types';

const createStringComparator = (key: PositionKey) => (a: PositionRow, b: PositionRow) => {
  const val1 = (a[key] || '') as string;
  const val2 = (b[key] || '') as string;
  return val1.localeCompare(val2);
};
const createNumberComparator = (
  key: PositionKey,
) => (a: PositionRow, b: PositionRow): number => {
  const getValue = (row: PositionRow, valueKey: PositionKey) => Number(row[valueKey]) || 0;
  const val1 = getValue(a, key);
  const val2 = getValue(b, key);
  return Math.sign(val1 - val2);
};

export function sortData(
  data: PositionRow[],
  key: PositionKey,
  direction: SortDirectionType,
): PositionRow[] {
  let result = [...data];
  switch (key) {
    case 'name':
    case 'instrumentType':
      result = result.sort(createStringComparator(key));
      break;
    case 'portfolioPercent':
      result = result.sort(createNumberComparator(key));
      break;
    case 'totalNet':
    case 'totalNetRub':
      result = result.sort(createNumberComparator('totalNetRub'));
      break;
    default:
      break;
  }
  return direction === SortDirection.ASC ? result : result.reverse();
}

export type SortingCallback = (dataKey: PositionKey) => void;

export default function useSorting<T extends PositionRow>(
  data: T[],
  initialSorting?: PositionKey | undefined,
  initialSortDirection?: SortDirectionType,
): [PositionRow[], PositionKey, SortDirectionType, SortingCallback] {
  const [currentSorting, setCurrentSorting] = useState<PositionKey>(
    initialSorting || 'totalNetRub',
  );
  const [currentSortDirection, setSortDirection] = useState<SortDirectionType>(
    initialSortDirection || SortDirection.ASC,
  );

  const sortedData = useMemo(() => (
    sortData(
      data,
      currentSorting,
      currentSortDirection,
    )
  ), [data, currentSorting, currentSortDirection]);

  const onSorting = useCallback<SortingCallback>((dataKey) => {
    setCurrentSorting(dataKey);
    setSortDirection((state) => (
      state === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC
    ));
  }, []);

  return [sortedData, currentSorting, currentSortDirection, onSorting];
}
