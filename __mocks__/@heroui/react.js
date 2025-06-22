const React = require('react');

function passthrough({ children, ...props }) {
  return React.createElement('div', props, children);
}

function InputMock(props) {
  // Render a real <input> for label/query compatibility in tests
  return React.createElement('input', props);
}

function ButtonMock({ children, ...props }) {
  // Render a real <button> for accessibility and Testing Library queries
  return React.createElement('button', props, children);
}

module.exports = {
  __esModule: true,
  Card: passthrough,
  CardHeader: passthrough,
  CardBody: passthrough,
  CardFooter: passthrough,
  Button: ButtonMock,
  Input: InputMock,
};
