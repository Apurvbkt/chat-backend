import { validationResult } from "express-validator";

import { ApiError } from "./errorMiddleware.js";

const validate = (req, _res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const firstError = result.array()[0];
    return next(new ApiError(400, firstError.msg));
  }

  return next();
};

export default validate;
