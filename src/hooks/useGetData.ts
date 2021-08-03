import {useCallback, useEffect, useState} from 'react';
import useLoadingFlag from './useLoadingFlag';

export default function useGetData<T>(
  fetchFunction: (...args: any[]) => Promise<any>,
  emptyValue: T,
): [T, boolean, object | null] {
  const [data, setData] = useState<T>(emptyValue);
  const [error, setError] = useState(null);
  const [fetchData, loading] = useLoadingFlag(
    useCallback(async (...args: any[]) => {
      try {
        setData(
          await fetchFunction(...args),
        );
      } catch (e) {
        setError(e);
      }
    }, [fetchFunction]),
    true,
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return [data, loading, error];
}
