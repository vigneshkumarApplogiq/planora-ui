// Tasks and Boards Mock Data

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: string;
  project: string;
  sprint: string;
  labels: string[];
  dueDate: string;
  storyPoints: number;
  comments: number;
  attachments: number;
  createdAt?: string;
  updatedAt?: string;
}
