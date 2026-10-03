import { isApiError } from '@/api';
import { strings } from '@/strings';

/**
 * Text to show for a failed call. The API's own message is used only for
 * validation and conflict errors, where it tells the visitor what to fix
 * (e.g. "venue already booked on 2026-12-12"); for everything else a fixed
 * message avoids leaking internals. React renders it as text, never HTML.
 */
export function errorMessage(error: unknown): string {
  if (!isApiError(error)) return strings.errors.server;
  switch (error.kind) {
    case 'unauthorized':
      return strings.auth.signInRequired;
    case 'forbidden':
      return strings.errors.forbidden;
    case 'not_found':
      return strings.errors.notFound;
    case 'conflict':
      return error.serverMessage ?? strings.errors.conflict;
    case 'invalid':
      return error.serverMessage ?? strings.errors.invalid;
    case 'network':
      return strings.errors.network;
    case 'bad_response':
      return strings.errors.badResponse;
    case 'server':
      return strings.errors.server;
  }
}

export function isUnauthorized(error: unknown): boolean {
  return isApiError(error) && error.kind === 'unauthorized';
}
