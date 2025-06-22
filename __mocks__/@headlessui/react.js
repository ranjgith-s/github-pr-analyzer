// __mocks__/@headlessui/react.js
const React = require('react');

function passthrough({ children, ...props }) {
  return React.createElement('div', props, children);
}

module.exports = {
  __esModule: true,
  Card: passthrough,
  CardHeader: passthrough,
  CardBody: passthrough,
  CardFooter: passthrough,
  HeroUIProvider: passthrough,
};
