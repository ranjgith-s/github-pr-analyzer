/* eslint-disable react/prop-types, react/display-name */
import React from 'react';

export const Box: React.FC<any> = ({
  as: Component = 'div',
  children,
  ...props
}) => {
  const Comp: any = Component;
  return <Comp {...props}>{children}</Comp>;
};

export const Text: React.FC<any> = ({
  as: Component = 'span',
  children,
  ...props
}) => {
  const Comp: any = Component;
  return <Comp {...props}>{children}</Comp>;
};

export const Avatar: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = (
  props
) => <img {...props} />;

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, ...props }) => <button {...props}>{children}</button>;

export const Breadcrumbs: React.FC<{ children?: React.ReactNode }> & {
  Item: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>>;
} = ({ children }) => <nav>{children}</nav>;
Breadcrumbs.Item = ({ to, href, children, ...props }: any) => (
  <a href={to || href} {...props}>
    {children}
  </a>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (
  props
) => <input {...props} />;

export const Heading: React.FC<any> = ({
  as: Component = 'h2',
  children,
  ...props
}) => {
  const Comp: any = Component;
  return <Comp {...props}>{children}</Comp>;
};

export const Badge: React.FC<any> = ({ children, ...props }) => (
  <span {...props}>{children}</span>
);

export const Spinner: React.FC = () => <span>Loading...</span>;

export const FormControl: React.FC<{ children?: React.ReactNode }> & {
  Label: React.FC<any>;
  Caption: React.FC<any>;
} = ({ children }) => <div>{children}</div>;
FormControl.Label = ({
  children,
  htmlFor,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label htmlFor={htmlFor} {...props}>
    {children}
  </label>
);
FormControl.Caption = ({ children }: { children?: React.ReactNode }) => (
  <span>{children}</span>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> & {
  Option: React.FC<React.OptionHTMLAttributes<HTMLOptionElement>>;
} = ({ children, ...props }) => <select {...props}>{children}</select>;
Select.Option = (props) => <option {...props}>{props.children}</option>;

export const Timeline: React.FC<{ children?: React.ReactNode }> & {
  Item: React.FC<{ children?: React.ReactNode }>;
  Badge: React.FC;
  Body: React.FC<{ children?: React.ReactNode }>;
} = ({ children }) => <ul>{children}</ul>;
Timeline.Item = ({ children }) => <li>{children}</li>;
Timeline.Badge = () => <span />;
Timeline.Body = ({ children }) => <div>{children}</div>;

export const TabNav: React.FC<{ children?: React.ReactNode }> & {
  Link: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>>;
} = ({ children }) => <div>{children}</div>;
TabNav.Link = (props) => <a {...props}>{props.children}</a>;

export const Table = {
  Pagination: (props: any) => <div {...props} />,
};

export const DataTable: React.FC<{
  columns?: any;
  data?: any;
  cellPadding?: any;
}> = ({ children }) => <table>{children}</table>;

export const createColumnHelper = () => ({
  column: (config: any) => config,
});

export const StateLabel: React.FC<{
  status?: string;
  children?: React.ReactNode;
}> = ({ children }) => <span>{children}</span>;

export const Tooltip: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => <span>{children}</span>;

export const Link: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>> = ({
  children,
  ...props
}) => <a {...props}>{children}</a>;
