import { StatusCodes } from "http-status-codes";

export function notFoundHandler(req, res) {
  return res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    details: err.details || null,
  });
}
