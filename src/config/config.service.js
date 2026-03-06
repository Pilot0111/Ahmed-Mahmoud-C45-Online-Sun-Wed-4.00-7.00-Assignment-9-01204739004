import dotenv from "dotenv";
import { resolve } from "node:path";

const NODE_ENV = process.env.NODE_ENV;

let envPath = {
  production: resolve("./src/config/.env.production"),
  development: resolve("./src/config/.env.development"),
};
dotenv.config({ path: envPath[NODE_ENV] });

export const PORT = process.env.PORT || 3000;
export const MONGODB_URI = +process.env.MONGODB_URI;
export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
export const PREFIX = process.env.PREFIX;

export const SALT_ROUNDS = process.env.SALT_ROUNDS;
export const PUBLIC_KEY = process.env.PUBLIC_KEY;
export const PRIVATE_KEY = process.env.PRIVATE_KEY;
