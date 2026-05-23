import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError.js";

export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    return next(
      new ApiError(StatusCodes.BAD_REQUEST, "Validation failed", result.error.flatten())
    );
  }

  req.validated = result.data;
  return next();
};
