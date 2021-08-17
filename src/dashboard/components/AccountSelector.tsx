import React from 'react';
import {
  Select, MenuItem, InputLabel, FormControl, makeStyles,
} from '@material-ui/core';
import {SelectInputProps} from '@material-ui/core/Select/SelectInput';

type DataItem = {
  value: string,
  text: string,
};

type Props = {
  isDataLoading: boolean,
  onSelectorChange: SelectInputProps['onChange'],
  data: DataItem[],
  selectedValue: string,
  title: string,
};

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 200,
  },
  select: {
    marginTop: theme.spacing(4),
  },
}));

function AccountSelector({
  isDataLoading,
  onSelectorChange,
  data,
  selectedValue,
  title,
}: Props) : JSX.Element {
  const classes = useStyles();

  return (
    <>
      {isDataLoading ? (
        <p>Loading</p>
      ) : (
        <FormControl className={classes.formControl}>
          <InputLabel shrink id="account-select-label">{title}</InputLabel>
          <Select
            labelId="account-select-label"
            id="account-select"
            value={selectedValue}
            onChange={onSelectorChange}
            className={classes.select}
            displayEmpty
          >
            {data.map(({value, text}) => (
              <MenuItem
                value={value}
              >
                {text}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </>
  );
}

export default AccountSelector;
