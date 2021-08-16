import React, {PropsWithChildren} from 'react';
import {LoadingWrapperProps} from '../../@types';

function LoadingWrapper({
  loading,
  loadingError,
  children,
}: PropsWithChildren<LoadingWrapperProps>) : JSX.Element {
  return (
    <>
      {loading && <p>Loading</p>}
      {!loading && loadingError && <>Unexpected error</>}
      {!loading && !loadingError && children}
    </>
  );
}

export default LoadingWrapper;
