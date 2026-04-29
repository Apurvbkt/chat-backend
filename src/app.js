import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { getExpressCorsOptions } from "./config/cors.js";
import { apiLimiter, authLimiter } from "./middleware/rateLimiter.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors(getExpressCorsOptions()));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api", apiLimiter);

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", message: "Server running" });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
