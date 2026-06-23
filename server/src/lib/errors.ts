export class AppError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function badRequest(message: string, code = 'BAD_REQUEST') {
  return new AppError(400, code, message);
}

export function unauthorized(message = 'Tizimga kirish talab qilinadi') {
  return new AppError(401, 'UNAUTHORIZED', message);
}

export function notFound(message = 'Topilmadi') {
  return new AppError(404, 'NOT_FOUND', message);
}

export function conflict(message: string) {
  return new AppError(409, 'CONFLICT', message);
}
