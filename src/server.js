import "dotenv/config";
import http from "http";
import mongoose from "mongoose";

import app from "./app.js";
import connectDB from "./config/db.js";
import { createSocketServer } from "./sockets/chatSocket.js";

const PORT = process.env.PORT || 5000;
let httpServer;

const boot = async () => {
  await connectDB();

  httpServer = http.createServer(app);
  const io = createSocketServer(httpServer);

  app.set("io", io);
  httpServer.on("error", (error) => {
    console.error("HTTP server failed:", error.message);
    process.exit(1);
  });

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || "development"})`);
  });
};

boot().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);

  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
  }

  await mongoose.connection.close();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
