import React, {ChangeEventHandler} from 'react';

type DataItem = {
  value: string,
  text: string,
};

type Props = {
  isDataLoading: boolean,
  onSelectorChange: ChangeEventHandler<HTMLSelectElement>,
  data: DataItem[],
  selectedValue: string,
  title: string,
};

function AccountSelector({
  isDataLoading,
  onSelectorChange,
  data,
  selectedValue,
  title,
}: Props) : JSX.Element {
  return (
    <>
      {title}
      {isDataLoading ? (
        <p>Loading</p>
      ) : (
        <select
          className="Account-selector"
          onChange={onSelectorChange}
        >
          {data.map(({value, text}) => (
            <option
              key={value}
              value={value}
              selected={value === selectedValue}
            >
              {text}
            </option>
          ))}
        </select>
      )}
    </>
  );
}

export default AccountSelector;
