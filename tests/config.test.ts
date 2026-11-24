import { describe, expect, it } from 'vitest';
import { isDemoRequested } from '../src/config';

describe('demo switch', () => {
  it('opens the demo only when ?demo is in the address', () => {
    expect(isDemoRequested('?demo')).toBe(true);
    expect(isDemoRequested('?demo=1')).toBe(true);
    expect(isDemoRequested('?x=1&demo')).toBe(true);
    expect(isDemoRequested('')).toBe(false);
    expect(isDemoRequested('?demonstration')).toBe(false);
  });
});
