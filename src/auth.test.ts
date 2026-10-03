import { describe, expect, it } from 'vitest';
import { DEFAULT_SIGN_IN_PATH, isSafeSignInUrl, signInUrl } from '@/auth';

describe('isSafeSignInUrl', () => {
  it.each(['/', '/signin', '/api/bookings?x=1', 'https://island-venues.infrastream.io/signin'])(
    'accepts %s',
    (url) => expect(isSafeSignInUrl(url)).toBe(true),
  );

  it.each([
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    'data:text/html,hi',
    'http://island-venues.infrastream.io',
    'https:///evil.example',
    'signin',
    '',
  ])('rejects %s', (url) => expect(isSafeSignInUrl(url)).toBe(false));
});

describe('signInUrl', () => {
  it('defaults to the protected api bounce path, not the open app page', () => {
    expect(signInUrl(undefined)).toBe('/api/bookings/sign-in');
    expect(DEFAULT_SIGN_IN_PATH).toBe('/api/bookings/sign-in');
  });

  it('uses a safe configured URL', () => {
    expect(signInUrl('/custom-sign-in')).toBe('/custom-sign-in');
  });

  it('ignores an unsafe configured URL', () => {
    expect(signInUrl('//evil.example')).toBe('/api/bookings/sign-in');
  });
});
