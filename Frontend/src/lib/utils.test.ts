import { describe, it, expect } from 'vitest';
import { cn } from './utils';
import { getApiUrl } from './api';

describe('Frontend utility helpers', () => {
  it('cn combines class names properly', () => {
    const isHidden = false;
    const result = cn('base-class', isHidden && 'hidden', 'active-class');
    expect(result).toBe('base-class active-class');
  });

  it('getApiUrl returns valid api base url', () => {
    const url = getApiUrl();
    expect(url).toBeDefined();
    expect(url).toContain('/api');
  });
});

