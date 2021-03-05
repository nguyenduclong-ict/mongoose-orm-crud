export class RequestError extends Error {
  statusCode: number;
  data: any;

  constructor(statusCode: number, message?: string, data?: any) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}
