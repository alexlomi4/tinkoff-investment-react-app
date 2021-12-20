import {TableCellProps} from 'react-virtualized';
import React from 'react';
import {formatPrice} from '../../../generic/utils';

export function BalanceRenderer({cellData, rowData}: TableCellProps) {
  return rowData.instrumentType === 'Currency' ? cellData.toFixed(2) : cellData;
}

export function NetRenderer({
  cellData: totalNet,
  dataKey,
  rowData,
}: TableCellProps) {
  if (totalNet === undefined || totalNet === null) {
    return 'Loading';
  }

  const currency = dataKey === 'totalNetRub' ? 'RUB' : rowData.currency;

  return (
    <div className={totalNet < 0 ? 'Loss-net' : 'Profit-net'}>
      {`${formatPrice(totalNet, currency)} ${totalNet !== 0 ? `(${formatPrice(
        Math.sign(totalNet) * rowData.totalNetPercent,
      )}%)` : ''}`}
    </div>
  );
}
NetRenderer.defaultProps = {
  cellData: 0,
};

export function PortfolioPercentRenderer({cellData}: TableCellProps) {
  if (cellData === null) {
    return 'Loading';
  }
  return `${formatPrice(cellData)}%`;
}

export function PriceRenderer({
  cellData,
  rowData,
}: TableCellProps) {
  return <>{formatPrice(cellData || 0, rowData.currency)}</>;
}
PriceRenderer.defaultProps = {
  cellData: 0,
};
