import { api } from './api';
import type { DailyQuest } from '../types/api';

export function getTodayQuests() {
  return api.get<{ quests: DailyQuest[] }>('/api/quests/today');
}
