import { RequestError } from "@/helpers/error";

export const E = {
  NotFound: (message = "Not Found", data?: any) =>
    new RequestError(404, message, data),
  UnprocessableEntity: (message = "Unprocessable Entity", data?: any) =>
    new RequestError(422, message, data),
  Forbidden: (message = "Forbidden", data?: any) =>
    new RequestError(403, message, data),
  Unauthorized: (message = "Unauthorized", data?: any) =>
    new RequestError(401, message, data),
  BadRequest: (message = "Bad Request", data?: any) =>
    new RequestError(400, message, data),
  InternalServerError: (message = "Internal Server Error", data?: any) =>
    new RequestError(500, message, data),
  Error: (code: number, message?: string, data?: any) =>
    new RequestError(code, message, data),
};
