/* eslint-disable react/prop-types, react/display-name */
import React from 'react';

export const DataTable: React.FC<{
  columns?: any;
  data?: any;
  cellPadding?: any;
}> = ({ children }) => <table>{children}</table>;

export const Table = {
  Pagination: (props: any) => <div {...props} />,
};

export const createColumnHelper = () => ({
  column: (config: any) => config,
});
