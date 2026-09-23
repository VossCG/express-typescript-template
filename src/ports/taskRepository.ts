import type { NewTask, Task, UpdateTaskInput } from '../domain/task';

export interface TaskRepository {
  findAll(): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  create(input: NewTask): Promise<Task>;
  update(id: string, patch: UpdateTaskInput): Promise<Task | null>;
  delete(id: string): Promise<boolean>;
}
