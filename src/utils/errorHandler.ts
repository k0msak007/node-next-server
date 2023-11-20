import { CustomError } from "../../errors/customError";

export const ErrorHandler = (message?: string, statusCode?: number) => {
  const error = new CustomError(message, statusCode);

  return error;
};
