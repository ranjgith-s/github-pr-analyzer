import * as exported from '../index';

describe('QueryDisplay index exports', () => {
  it('exports expected members', () => {
    expect(exported).toHaveProperty('QueryDisplay');
    expect(exported).toHaveProperty('VisualFilterBuilder');
  });
});
