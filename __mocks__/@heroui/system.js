const React = require('react');

function passthrough({ children, ...props }) {
  return React.createElement('div', props, children);
}

module.exports = {
  __esModule: true,
  HeroUIProvider: passthrough,
};
