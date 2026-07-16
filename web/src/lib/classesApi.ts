import { api } from './api';

export function joinClass(code: string) {
  return api.post<{ className: string }>('/api/classes/join', { code });
}
