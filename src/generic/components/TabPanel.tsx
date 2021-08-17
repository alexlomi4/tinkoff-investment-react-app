import React, {PropsWithChildren} from 'react';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

type PanelProps = {
  value: number,
  index: number,
};

function TabPanel({
  value,
  index,
  children,
}: PropsWithChildren<PanelProps>) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`position-table-${index}`}
      aria-labelledby={`position-tab-${index}`}
    >
      {value === index && children}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `position-tab-${index}`,
    'aria-controls': `position-table-${index}`,
  };
}

export default function TabWrapper({
  children,
  label,
  tabLabels,
}: PropsWithChildren<{
  label: string,
  tabLabels: string[],
}>) {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };

  return (
    <>
      <Tabs value={value} onChange={handleChange} aria-label={label} classes={{}}>
        {/* eslint-disable react/jsx-props-no-spreading */}
        {React.Children.map(children, (child, index) => (
          <Tab label={tabLabels[index]} {...a11yProps(index)} />
        ))}
        {/* eslint-enable react/jsx-props-no-spreading */}
      </Tabs>
      {React.Children.map(children, (child, index) => (
        <TabPanel value={value} index={index}>
          {child}
        </TabPanel>
      ))}
    </>
  );
}
