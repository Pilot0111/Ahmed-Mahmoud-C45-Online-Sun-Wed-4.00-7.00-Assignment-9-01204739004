import { createClient } from "redis";
import { REDIS_URL } from "../../config/config.service.js";

export const redisClient = createClient({ url: REDIS_URL });

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("Redis connected successfully! :):):) 😘😘");
  } catch (error) {
    console.log( "Redis connection failed!",error);
  }
};
