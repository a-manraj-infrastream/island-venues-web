// The edge (IAP today, Identity Platform later) owns sign-in; the app only
// needs to send the visitor somewhere the edge will intercept.

/**
 * Accepts a same-origin absolute path or an https URL. Rejects protocol-relative
 * forms ("//host", "/\host": browsers treat a backslash like a slash) and every
 * other scheme (javascript:, data:, http:).
 */
export function isSafeSignInUrl(url: string): boolean {
  return /^\/(?![/\\])/.test(url) || /^https:\/\/[^/\\]/i.test(url);
}

/**
 * Default Sign in target. The app itself is served on an open path, so
 * reloading it would never make the edge start a sign-in. This api path sits
 * under the protected /api/bookings/ prefix: the edge signs the visitor in,
 * then the api answers 303 back to "/", now with the edge's session cookie.
 */
export const DEFAULT_SIGN_IN_PATH = '/api/bookings/sign-in';

export function signInUrl(configured: unknown = import.meta.env.VITE_SIGN_IN_URL): string {
  if (typeof configured === 'string' && isSafeSignInUrl(configured)) return configured;
  return DEFAULT_SIGN_IN_PATH;
}
