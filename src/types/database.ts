/**
 * Shared types for database operations
 */

export interface DatabaseResult<T> {
  data: T | null;
  error: Error | null;
  count?: number | null;
}

export type DatabaseQuery<T> = (params?: unknown) => Promise<DatabaseResult<T>>;
export type DatabaseMutation<T> = (data: unknown) => Promise<DatabaseResult<T>>;
