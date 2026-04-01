import mongoose from "mongoose";
import { MONGODB_URI, MONGODB_URI_ONLINE, DB_NAME, NODE_ENV } from "../config/config.service.js";

const checkConnection = async () => {
  // In production, strictly use Atlas. In development, prefer local but fallback to Atlas if local is not set.
  const uri =
    NODE_ENV === "production"
      ? MONGODB_URI_ONLINE
      : MONGODB_URI || MONGODB_URI_ONLINE;

  if (!uri) {
    throw new Error("MongoDB Connection URI is missing in environment variables!");
  }

  await mongoose.connect(uri, {
    dbName: DB_NAME,
    serverSelectionTimeoutMS: 10000, // Give it a bit more time for server selection
    connectTimeoutMS: 10000, // Timeout for the initial socket connection
    family: 4, 
  });
  const maskedUri = uri.replace(/\/\/.*@/, "//****:****@");
  console.log(`[${NODE_ENV.toUpperCase()}] Database connected successfully to: ${maskedUri} 😘😘`);
};

export default checkConnection;
