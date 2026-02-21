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
export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
export const SALT_ROUNDS = process.env.SALT_ROUNDS;
export const PUBLIC_KEY = process.env.PUBLIC_KEY;
export const PRIVATE_KEY = process.env.PRIVATE_KEY;
