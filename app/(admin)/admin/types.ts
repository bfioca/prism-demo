export interface UserStats {
  totalCount: number;
  activeToday: number;
  activeThisWeek: number;
}

export interface ChatStats {
  totalCount: number;
  todayCount: number;
  weekCount: number;
  averagePerUser: number;
}

export interface MessageStats {
  totalCount: number;
  todayCount: number;
  weekCount: number;
  averagePerUser: number;
}

export interface User {
  id: string;
  email: string;
  lastActive: string;
  messageCount: number;
}

export interface Message {
  id: string;
  chatId: string;
  role: string;
  content: unknown;
  createdAt: Date;
  prism_data?: unknown;
  userEmail?: string;
}
