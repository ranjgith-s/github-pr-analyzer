/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const React = require('react');

// List of custom props to filter out for DOM elements
const CUSTOM_PROPS = [
  'isCurrent',
  'endContent',
  'startContent',
  'onPress',
  'variant',
  'color',
  'size',
  'underline',
  'src',
  'alt',
  'className',
  'children',
  'isClearable',
  'isDisabled',
  'shadow',
  'isExternal',
  'minRows',
  'maxRows',
  'classNames',
  // Added to silence React DOM unknown prop warnings in tests
  'isSelected',
  'onValueChange',
  'codeString',
  'isIconOnly',
];

function filterProps(props) {
  const domProps = { ...props };
  CUSTOM_PROPS.forEach((key) => {
    if (
      key in domProps &&
      key !== 'className' &&
      key !== 'children' &&
      key !== 'data-testid'
    ) {
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
  const { isClearable, onValueChange, ...rest } = props; // strip isClearable/onValueChange
  // If consumer provided onValueChange (HeroUI convention), map to onChange for tests
  const mapped = {
    ...rest,
    onChange: (e) => {
      if (rest.onChange) {
        rest.onChange(e);
      }
      if (onValueChange) {
        onValueChange(e.target.value);
      }
    },
  };
  return React.createElement('input', filterProps(mapped));
}

function TextareaMock(props) {
  // Remove custom props and create textarea element
  const { minRows, maxRows, classNames, onValueChange, ...rest } = props;
  const mapped = {
    ...rest,
    onChange: (e) => {
      if (rest.onChange) {
        rest.onChange(e);
      }
      if (onValueChange) {
        onValueChange(e.target.value);
      }
    },
  };
  return React.createElement('textarea', filterProps(mapped));
}

function ButtonMock({
  children,
  onPress,
  onClick,
  isDisabled,
  color,
  isIconOnly, // filtered
  ...props
}) {
  // Map onPress to onClick for DOM, do not pass onPress/isIconOnly to DOM
  const handler = onPress || onClick;
  const domProps = {
    ...filterProps(props),
    onClick: handler,
    disabled: isDisabled,
    className: props.className,
  };
  // expose color for tests to assert success state changes
  if (color) {
    domProps['data-color'] = color;
  }
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
  // Ensure each header cell has a stable key to avoid React warnings in tests
  const headerChildren = React.Children.map(children, (child, idx) => {
    if (React.isValidElement(child) && child.key == null) {
      return React.cloneElement(child, { key: `col-${idx}` });
    }
    return child;
  });
  return React.createElement(
    'thead',
    null,
    React.createElement('tr', null, headerChildren)
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
                { key: `select-${item.id ?? idx}` },
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
        if (React.isValidElement(row)) {
          const existingChildren = React.Children.toArray(row.props.children);
          // Add keys to each existing cell if missing to prevent warnings
          const keyedCells = existingChildren.map((cell, cIdx) => {
            if (React.isValidElement(cell) && cell.key == null) {
              return React.cloneElement(cell, { key: `cell-${idx}-${cIdx}` });
            }
            return cell;
          });
          const newChildren = checkbox ? [checkbox, ...keyedCells] : keyedCells;
          const keyVal = row.key || item.id || idx;
          return React.cloneElement(row, { key: keyVal }, newChildren);
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
          onClick: () => {
            if (onChange) onChange(p);
          },
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
function SwitchMock({
  children,
  isSelected,
  onChange,
  onValueChange,
  ...props
}) {
  // Map isSelected to aria-checked and fire both onChange and onValueChange
  return React.createElement(
    'button',
    {
      ...filterProps(props),
      role: 'switch',
      'aria-checked': isSelected ? 'true' : 'false',
      onClick: (e) => {
        if (onChange) onChange(e);
        if (onValueChange) onValueChange(!isSelected);
      },
      'data-selected': isSelected ? 'true' : 'false',
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

function ChipMock({ children, onClose, ...props }) {
  return React.createElement(
    'span',
    {
      ...filterProps(props),
      'data-testid': 'chip',
      'data-slot': 'chip',
    },
    children,
    onClose &&
      React.createElement(
        'button',
        {
          onClick: onClose,
          'aria-label': 'Remove',
          style: { marginLeft: '4px' },
        },
        '×'
      )
  );
}

function AutocompleteMock({
  children,
  onSelectionChange,
  isDisabled,
  ...props
}) {
  // Add a state for the input value
  const [inputValue, setInputValue] = React.useState('');

  return React.createElement(
    'div',
    {
      ...filterProps(props),
      'data-testid': props['data-testid'] || 'autocomplete',
      placeholder: props.placeholder, // Keep placeholder on wrapper
    },
    React.createElement('input', {
      placeholder: props.placeholder,
      disabled: isDisabled,
      value: inputValue,
      onChange: (e) => {
        const value = e.target.value;
        setInputValue(value);
        // Only trigger selection change on Enter or when value is cleared
      },
      onKeyDown: (e) => {
        if (
          e.key === 'Enter' &&
          inputValue &&
          onSelectionChange &&
          !isDisabled
        ) {
          e.preventDefault();
          onSelectionChange(inputValue);
          setInputValue('');
        }
      },
    }),
    children
  );
}

function AutocompleteItemMock({ children, ...props }) {
  return React.createElement(
    'div',
    {
      ...filterProps(props),
      'data-testid': 'autocomplete-item',
    },
    children
  );
}

function DatePickerMock({ label, value, onChange, ...props }) {
  return React.createElement(
    'div',
    {
      ...filterProps(props),
      'data-testid': 'date-picker',
    },
    label && React.createElement('label', null, label),
    React.createElement('input', {
      type: 'date',
      value: value ? value.toISOString().split('T')[0] : '',
      onChange: (e) =>
        onChange && onChange(e.target.value ? new Date(e.target.value) : null),
    })
  );
}

function DividerMock(props) {
  return React.createElement('hr', filterProps(props));
}

function ModalMock({ children, isOpen, ...props }) {
  if (!isOpen) return null;
  return React.createElement(
    'div',
    {
      ...filterProps(props),
      'data-testid': 'modal',
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
      },
    },
    children
  );
}

function ModalContentMock({ children, ...props }) {
  return React.createElement(
    'div',
    {
      ...filterProps(props),
      'data-testid': 'modal-content',
      style: {
        background: 'white',
        margin: '50px auto',
        padding: '20px',
        width: '80%',
        maxWidth: '500px',
      },
    },
    children
  );
}

function ModalHeaderMock({ children, ...props }) {
  return React.createElement(
    'div',
    {
      ...filterProps(props),
      'data-testid': 'modal-header',
    },
    children
  );
}

function ModalBodyMock({ children, ...props }) {
  return React.createElement(
    'div',
    {
      ...filterProps(props),
      'data-testid': 'modal-body',
    },
    children
  );
}

function ModalFooterMock({ children, ...props }) {
  return React.createElement(
    'div',
    {
      ...filterProps(props),
      'data-testid': 'modal-footer',
    },
    children
  );
}

function SnippetMock({ children, codeString, ...props }) {
  // codeString is HeroUI prop; remove from DOM
  return React.createElement(
    'code',
    {
      ...filterProps(props),
      'data-testid': 'snippet',
      'data-code-string': codeString, // keep accessible for assertions if needed
    },
    children
  );
}

function ButtonGroupMock({ children, ...props }) {
  return React.createElement(
    'div',
    {
      ...filterProps(props),
      'data-testid': 'button-group',
      style: { display: 'flex', gap: '4px' },
    },
    children
  );
}

function PopoverMock({ children, ...props }) {
  return React.createElement(
    'div',
    {
      ...filterProps(props),
      'data-testid': 'popover',
    },
    children
  );
}

function PopoverTriggerMock({ children, ...props }) {
  return React.createElement(
    'div',
    {
      ...filterProps(props),
      'data-testid': 'popover-trigger',
    },
    children
  );
}

function PopoverContentMock({ children, ...props }) {
  return React.createElement(
    'div',
    {
      ...filterProps(props),
      'data-testid': 'popover-content',
    },
    children
  );
}

function ScrollShadowMock({ children, ...props }) {
  return React.createElement(
    'div',
    {
      ...filterProps(props),
      'data-testid': 'scroll-shadow',
    },
    children
  );
}

function KbdMock({ children, ...props }) {
  return React.createElement(
    'kbd',
    {
      ...filterProps(props),
      'data-testid': 'kbd',
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
  Textarea: TextareaMock,
  Chip: ChipMock,
  Autocomplete: AutocompleteMock,
  AutocompleteItem: AutocompleteItemMock,
  DatePicker: DatePickerMock,
  Divider: DividerMock,
  Modal: ModalMock,
  ModalContent: ModalContentMock,
  ModalHeader: ModalHeaderMock,
  ModalBody: ModalBodyMock,
  ModalFooter: ModalFooterMock,
  Snippet: SnippetMock,
  ButtonGroup: ButtonGroupMock,
  Popover: PopoverMock,
  PopoverTrigger: PopoverTriggerMock,
  PopoverContent: PopoverContentMock,
  ScrollShadow: ScrollShadowMock,
  Kbd: KbdMock,
};
