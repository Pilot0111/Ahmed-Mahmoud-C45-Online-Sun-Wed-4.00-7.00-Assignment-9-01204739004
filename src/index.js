import dotenv from "dotenv";
dotenv.config({ path: "./src/config/.env.development" });

const { default: bootstrap } = await import("./app.contoller.js");
await bootstrap();