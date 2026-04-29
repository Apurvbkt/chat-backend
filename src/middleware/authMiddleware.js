import jwt from "jsonwebtoken";

import User from "../models/User.js";
import { ApiError } from "./errorMiddleware.js";

const protect = async (req, _res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return next(new ApiError(401, "Not authorized, token missing"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new ApiError(401, "User not found"));
    }

    req.user = user;
    return next();
  } catch (_error) {
    return next(new ApiError(401, "Invalid or expired token"));
  }
};

export default protect;
