import { api } from './api';
import type { ClassRosterEntry, HardWordAggregate, TeacherClass } from '../types/api';

export function getTeacherClasses() {
  return api.get<{ classes: TeacherClass[] }>('/api/teacher/classes');
}

export function createTeacherClass(name: string) {
  return api.post<{ class: TeacherClass }>('/api/teacher/classes', { name });
}

export function getClassRoster(classId: number) {
  return api.get<{ roster: ClassRosterEntry[] }>(`/api/teacher/classes/${classId}/roster`);
}

export function getClassHardWords(classId: number) {
  return api.get<{ hardWords: HardWordAggregate[] }>(`/api/teacher/classes/${classId}/hard-words`);
}
