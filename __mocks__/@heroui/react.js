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
  return React.createElement('div', { ...filterProps(props), className: props.className }, children);
}

function InputMock(props) {
  return React.createElement('input', filterProps(props));
}

function ButtonMock({ children, onPress, onClick, ...props }) {
  // Map onPress to onClick for DOM, do not pass onPress to DOM
  const handler = onPress || onClick;
  const domProps = { ...filterProps(props), onClick: handler, className: props.className };
  return React.createElement('button', domProps, children);
}

function Spinner() {
  // Only return a simple span for test, not a div with data-testid
  return React.createElement('span', null, 'Loading...');
}

function CardMock({ children, ...props }) {
  return React.createElement('div', { ...filterProps(props), className: (props.className || '') + ' mock-card' }, children);
}

module.exports = {
  __esModule: true,
  Card: CardMock,
  CardHeader: passthrough,
  CardBody: passthrough,
  CardFooter: passthrough,
  Button: ButtonMock,
  Input: InputMock,
  Avatar: passthrough,
  Breadcrumbs: passthrough,
  BreadcrumbItem: passthrough,
  Spinner,
};
