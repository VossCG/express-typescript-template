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

export class ServiceUnavailableError extends ApiError {
  override cause: unknown;

  constructor(message = 'Service unavailable', options?: ErrorOptions) {
    super(503, 'SERVICE_UNAVAILABLE', message);
    this.cause = options?.cause;
  }
}
