class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  if (err.name === "CastError") {
    statusCode = 400;
    err.message = "Invalid resource id";
  }

  if (err.code === 11000) {
    statusCode = 409;
    err.message = "Duplicate field value";
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Something went wrong",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack
  });
};

export { ApiError, errorHandler, notFound };
