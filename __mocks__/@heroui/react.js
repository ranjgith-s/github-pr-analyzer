const React = require('react');

// List of custom props to filter out for DOM elements
const CUSTOM_PROPS = [
  'isCurrent',
  'endContent',
  'onPress',
  'variant',
  'color',
  'size',
  'underline',
  'src',
  'alt',
  'className',
  'children',
  'isClearable', // <-- add this to filter out isClearable
];

function filterProps(props) {
  const domProps = { ...props };
  CUSTOM_PROPS.forEach((key) => {
    if (key in domProps && key !== 'className' && key !== 'children') {
      delete domProps[key];
    }
  });
  return domProps;
}

function passthrough({ children, ...props }) {
  return React.createElement(
    'div',
    { ...filterProps(props), className: props.className },
    children
  );
}

function InputMock(props) {
  // Remove isClearable from props
  const { isClearable, ...rest } = props;
  return React.createElement('input', filterProps(rest));
}

function ButtonMock({ children, onPress, onClick, ...props }) {
  // Map onPress to onClick for DOM, do not pass onPress to DOM
  const handler = onPress || onClick;
  const domProps = {
    ...filterProps(props),
    onClick: handler,
    className: props.className,
  };
  return React.createElement('button', domProps, children);
}

function Spinner() {
  // Return a span with progressbar role for tests
  return React.createElement('span', { role: 'progressbar' }, 'Loading...');
}

function CardMock({ children, ...props }) {
  return React.createElement(
    'div',
    {
      ...filterProps(props),
      className: (props.className || '') + ' mock-card',
    },
    children
  );
}

function SelectMock({ children, onSelectionChange, selectedKeys, ...props }) {
  // Simulate a select dropdown as a <select> for testing
  return React.createElement(
    'select',
    {
      ...filterProps(props),
      value: selectedKeys && Array.isArray(selectedKeys) ? selectedKeys[0] : '',
      onChange: (e) =>
        onSelectionChange && onSelectionChange(new Set([e.target.value])),
      className: props.className,
    },
    React.Children.map(children, (child) => {
      if (!child) return null;
      // If fragment, flatten
      if (child.type === React.Fragment) {
        return React.Children.map(child.props.children, (c) =>
          React.cloneElement(c, { key: c.key })
        );
      }
      return child;
    })
  );
}

function SelectItemMock({ children, ...props }) {
  return React.createElement('option', filterProps(props), children);
}

function TableMock({
  children,
  bottomContent,
  selectionMode,
  selectedKeys,
  onSelectionChange,
}) {
  // Clone TableBody and inject selection props
  const enhancedChildren = React.Children.map(children, (child) => {
    if (child && child.type && child.type.name === 'TableBodyMock') {
      return React.cloneElement(child, {
        selectionMode,
        selectedKeys,
        onSelectionChange,
      });
    }
    return child;
  });
  return React.createElement(
    React.Fragment,
    null,
    React.createElement('table', null, enhancedChildren),
    bottomContent || null
  );
}
function TableHeaderMock({ children }) {
  // Wrap columns in a <tr> inside <thead>
  return React.createElement(
    'thead',
    null,
    React.createElement('tr', null, children)
  );
}
function TableBodyMock({
  children,
  items,
  emptyContent,
  selectedKeys,
  onSelectionChange,
}) {
  // If no items, render emptyContent
  if (!items || items.length === 0) {
    return React.createElement(
      'tbody',
      null,
      React.createElement(
        'tr',
        null,
        React.createElement('td', { colSpan: 100 }, emptyContent)
      )
    );
  }
  // If children is a function, call for each item
  if (typeof children === 'function') {
    return React.createElement(
      'tbody',
      null,
      items.map((item, idx) => {
        // Render a selection checkbox if selectedKeys/onSelectionChange are provided
        const isSelected =
          selectedKeys && selectedKeys.has && selectedKeys.has(item.id);
        const checkbox =
          selectedKeys && onSelectionChange
            ? React.createElement(
                'td',
                null,
                React.createElement('input', {
                  type: 'checkbox',
                  role: 'checkbox',
                  checked: !!isSelected,
                  onChange: () => onSelectionChange(new Set([item.id])),
                })
              )
            : null;
        const row = children(item, idx);
        // row is a <tr> element, so we need to clone and prepend the checkbox cell
        if (checkbox && React.isValidElement(row)) {
          return React.cloneElement(row, {}, [
            checkbox,
            ...React.Children.toArray(row.props.children),
          ]);
        }
        return row;
      })
    );
  }
  return React.createElement('tbody', null, children);
}
function TableColumnMock({ children }) {
  // Render column headers in all caps
  return React.createElement('th', null, String(children).toUpperCase());
}
function TableRowMock({ children, selectionMode, selected, onSelect, rowKey }) {
  // If selectionMode is set, render a checkbox
  const checkbox = selectionMode
    ? React.createElement(
        'td',
        null,
        React.createElement('input', {
          type: 'checkbox',
          role: 'checkbox',
          checked: !!selected,
          onChange: () => onSelect && onSelect(rowKey),
        })
      )
    : null;
  return React.createElement('tr', null, checkbox, children);
}

function TableCellMock({ children }) {
  return React.createElement('td', null, children);
}

function PaginationMock({ total, page, onChange, ...props }) {
  // Render a simple pagination for testing
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return React.createElement(
    'div',
    {
      ...filterProps(props),
      'data-testid': 'pagination',
      'aria-label': 'Pagination',
    },
    React.createElement('span', null, `Page ${page} of ${total}`),
    pages.map((p) =>
      React.createElement(
        'button',
        {
          key: p,
          onClick: () => onChange && onChange(p),
          disabled: p === page,
          style: { fontWeight: p === page ? 'bold' : 'normal', margin: 2 },
        },
        p
      )
    )
  );
}

// Add mocks for Dropdown, DropdownTrigger, DropdownMenu, DropdownItem
function DropdownMock({ children }) {
  return React.createElement('div', { 'data-testid': 'dropdown' }, children);
}
function DropdownTriggerMock({ children }) {
  return React.createElement(
    'div',
    { 'data-testid': 'dropdown-trigger' },
    children
  );
}
function DropdownMenuMock({ children }) {
  return React.createElement(
    'div',
    { 'data-testid': 'dropdown-menu' },
    children
  );
}
function DropdownItemMock({ children, ...props }) {
  return React.createElement(
    'div',
    { 'data-testid': 'dropdown-item', ...props },
    children
  );
}
function BadgeMock({ children, ...props }) {
  return React.createElement(
    'span',
    { ...filterProps(props), 'data-testid': 'badge' },
    children
  );
}
function SwitchMock({ children, ...props }) {
  return React.createElement(
    'button',
    {
      ...filterProps(props),
      role: 'switch',
      'aria-checked': props.isSelected ? 'true' : 'false',
      onClick: props.onChange,
    },
    children
  );
}

function LinkMock({ children, href, isExternal, ...props }) {
  return React.createElement(
    'a',
    {
      ...filterProps(props),
      href,
      target: isExternal ? '_blank' : undefined,
      rel: isExternal ? 'noopener noreferrer' : undefined,
    },
    children
  );
}

module.exports = {
  __esModule: true,
  Card: CardMock,
  CardHeader: passthrough,
  CardBody: passthrough,
  CardFooter: passthrough,
  Button: ButtonMock,
  Input: InputMock,
  Select: SelectMock,
  SelectItem: SelectItemMock,
  Avatar: passthrough,
  Breadcrumbs: passthrough,
  BreadcrumbItem: passthrough,
  Spinner,
  Table: TableMock,
  TableHeader: TableHeaderMock,
  TableBody: TableBodyMock,
  TableColumn: TableColumnMock,
  TableRow: TableRowMock,
  TableCell: TableCellMock,
  Pagination: PaginationMock,
  Dropdown: DropdownMock,
  DropdownTrigger: DropdownTriggerMock,
  DropdownMenu: DropdownMenuMock,
  DropdownItem: DropdownItemMock,
  Badge: BadgeMock,
  Switch: SwitchMock,
  Link: LinkMock,
};
