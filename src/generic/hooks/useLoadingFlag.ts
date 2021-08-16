import { useCallback, useState } from 'react';

export default (
  fetchFunction: (...args: any[]) => any,
  initialValue: boolean = false,
) : [(...args: any[]
  ) => void, boolean] => {
  const [loading, setLoading] = useState(initialValue);
  const fetchData = useCallback(async (...args) => {
    setLoading(true);
    try {
      const result = fetchFunction(...args);
      if (result instanceof Promise) {
        await result;
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

  return [fetchData, loading];
};
