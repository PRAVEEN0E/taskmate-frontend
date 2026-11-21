export interface Owner {
  id: string;
  name: string;
  email: string;
  username: string;
}
export interface Settings {
  timezone: string;
  currency: string;
  theme: 'dark' | 'light' | 'system';
  focusMinutes: number;
  shortBreak: number;
  longBreak: number;
  emailReminders: boolean;
  aiEnabled: boolean;
}
export interface Session {
  owner: Owner;
  csrfToken: string;
  settings: Settings;
}
export interface Dashboard {
  pending: number;
  completed: number;
  overdue: number;
  focusSeconds: number;
  monthExpense: string;
  currency: string;
  learningPaths: number;
  storageBytes: string;
  fileCount: number;
  unreadNotifications: number;
  timezone: string;
  generatedAt: string;
  todayTasks: { id: string; title: string; status: string; priority: string; dueAt: string }[];
  notes: { id: string; title: string; updatedAt: string }[];
  projects: { id: string; title: string; targetAt: string | null }[];
}
