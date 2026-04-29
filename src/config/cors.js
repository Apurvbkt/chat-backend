const parseAllowedOrigins = () => {
  const raw = process.env.CLIENT_URL || "";
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const getAllowedOrigins = () => {
  const origins = parseAllowedOrigins();
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && !origins.length) {
    throw new Error("CLIENT_URL is required in production (comma-separated for multiple origins)");
  }

  if (!origins.length) {
    return ["http://localhost:5173"];
  }

  return origins;
};

const getExpressCorsOptions = () => {
  const allowedOrigins = getAllowedOrigins();

  return {
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS blocked: origin not allowed"));
    }
  };
};

const getSocketCorsOptions = () => {
  const allowedOrigins = getAllowedOrigins();
  return {
    origin: allowedOrigins,
    credentials: true
  };
};

export { getAllowedOrigins, getExpressCorsOptions, getSocketCorsOptions };
