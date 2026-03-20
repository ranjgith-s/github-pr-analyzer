import { firstKey } from '../utils';

describe('firstKey', () => {
  it('returns empty string for falsy values', () => {
    expect(firstKey(null)).toBe('');
    expect(firstKey(undefined)).toBe('');
    expect(firstKey(false)).toBe('');
    expect(firstKey(0)).toBe('');
    expect(firstKey('')).toBe('');
  });

  it('returns the string itself if passed a string', () => {
    expect(firstKey('myKey')).toBe('myKey');
  });

  it('returns the first element if passed an array', () => {
    expect(firstKey(['key1', 'key2'])).toBe('key1');
    expect(firstKey([])).toBeUndefined();
  });

  it('returns the first element if passed a Set', () => {
    expect(firstKey(new Set(['setKey1', 'setKey2']))).toBe('setKey1');
    expect(firstKey(new Set())).toBeUndefined();
  });

  it('returns currentKey if passed an object with currentKey property', () => {
    expect(firstKey({ currentKey: 'objKey', otherProp: 'value' })).toBe('objKey');
  });

  it('returns empty string for other objects without currentKey', () => {
    expect(firstKey({ otherProp: 'value' })).toBe('');
    expect(firstKey({})).toBe('');
  });
});
