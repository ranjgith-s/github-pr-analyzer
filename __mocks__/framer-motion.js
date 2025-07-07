// __mocks__/framer-motion.js
module.exports = {
  __esModule: true,
  ...Object.fromEntries(
    [
      'AnimatePresence',
      'motion',
      'useAnimation',
      'useCycle',
      'useInView',
      'useMotionValue',
      'useReducedMotion',
      'useSpring',
      'useTransform',
      'useViewportScroll',
      'm',
    ].map((k) => [k, (props) => (props && props.children) || null])
  ),
};
