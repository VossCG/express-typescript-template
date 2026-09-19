export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Invalid request', details?: unknown) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Access denied') {
    super(403, 'FORBIDDEN', message);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Resource already exists') {
    super(409, 'CONFLICT', message);
  }
}
