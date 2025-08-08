// Mock react-dom/client to avoid redefining non-configurable property errors
jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({ render: jest.fn() })),
}));

// Ensure root element exists prior to importing entrypoint

describe('main entrypoint', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    jest.resetModules();
  });

  it('creates root and renders App tree', async () => {
    // Dynamically import after ensuring DOM
    await import('../main');
    const ReactDOM = await import('react-dom/client');
    expect(ReactDOM.createRoot).toHaveBeenCalledTimes(1);
    const rootElem = (ReactDOM.createRoot as jest.Mock).mock.calls[0][0];
    expect(rootElem).toBeInstanceOf(HTMLElement);
  });
});
