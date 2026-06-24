import type { TFunction } from 'i18next';
import type { ApiError } from './api';

/** Maps a backend AppError's `code` to a localized message via the `errors.*`
 * keys in the active i18n resource. Falls back to the server's raw message
 * (currently Uzbek) for any code that doesn't have a translation entry yet,
 * so nothing ever renders blank. */
export function getErrorMessage(t: TFunction, err: ApiError): string {
  return t(`errors.${err.code}`, { defaultValue: err.message });
}
