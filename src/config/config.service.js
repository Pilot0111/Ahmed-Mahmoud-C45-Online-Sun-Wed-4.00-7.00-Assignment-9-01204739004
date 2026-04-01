import dotenv from "dotenv";
import { resolve } from "node:path";

export const NODE_ENV = process.env.NODE_ENV || "development";

let envPath = {
  production: resolve("./src/config/.env.production"),
  development: resolve("./src/config/.env.development"),
};

const result = dotenv.config({ path: envPath[NODE_ENV] || envPath.development });
if (result.error) {
  dotenv.config(); // Fallback to root .env if specific file fails
}

export const PORT = process.env.PORT || 3000;
export const MONGODB_URI = process.env.MONGODB_URI;
export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
export const PREFIX = process.env.PREFIX;

export const SALT_ROUNDS = process.env.SALT_ROUNDS;
export const PUBLIC_KEY = process.env.PUBLIC_KEY;
export const PRIVATE_KEY = process.env.PRIVATE_KEY;

export const REDIS_URL = process.env.REDIS_URL;

export const WHITELIST = process.env.WHITELIST?.split(",") || [];
export const DB_NAME = process.env.DB_NAME || "SarahaApp";

export const MONGODB_URI_ONLINE = process.env.MONGODB_URI_ONLINE; 
