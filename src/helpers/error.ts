export class RequestError extends Error {
  statusCode: number;
  code: string;
  data: any;

  constructor(
    statusCode: number,
    message?: string,
    { data, code }: { data?: any; code?: string } = {} as any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.code = code;
  }
}

export const ERROR_CODES = {
  VALIDATOR_ERROR: "VALIDATOR_ERROR",
};

export const HandleRequestError = (
  error: any,
  req: any,
  res: any,
  next: any
) => {
  if (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message, error });
  }
};
