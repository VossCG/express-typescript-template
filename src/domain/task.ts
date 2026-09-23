export interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
}

export interface NewTask {
  title: string;
  description: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  completed?: boolean;
}

export class TaskNotFoundError extends Error {
  constructor() {
    super('Task not found');
    this.name = 'TaskNotFoundError';
  }
}
